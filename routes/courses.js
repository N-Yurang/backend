const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const authenticateToken = require('../middleware/auth');

const toPositiveInteger = (value) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
};

const toNonNegativeIntegerOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;

  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue >= 0 ? numberValue : null;
};

const toDistanceKmOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;

  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/km/i, '').trim();
    const numberValue = Number(normalized);
    return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
  }

  return null;
};

const isUuid = (value) => (
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
);

const toPlainObject = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      return {};
    }
  }

  return {};
};

const getColumnSet = async (tableName) => {
  const { rows } = await db.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );

  return new Set(rows.map((row) => row.column_name));
};

const normalizeCoursePlaces = (body) => {
  const inputPlaces = Array.isArray(body.places) && body.places.length > 0
    ? body.places
    : body.itinerary;
  const inputType = inputPlaces === body.itinerary ? 'itinerary' : 'places';

  if (!Array.isArray(inputPlaces) || inputPlaces.length === 0) {
    return { error: 'A course needs at least one place or itinerary item.' };
  }

  const visitOrders = new Set();
  const normalizedPlaces = [];

  for (const place of inputPlaces) {
    const placeId = toPositiveInteger(place && place.place_id);
    const visitOrder = toPositiveInteger(place && (place.visit_order ?? place.order));

    if (!placeId || !visitOrder) {
      return { error: 'Each place needs a valid place_id and visit_order.' };
    }

    if (visitOrders.has(visitOrder)) {
      return { error: 'visit_order values must be unique.' };
    }

    const travelTimeToNext = toNonNegativeIntegerOrNull(place.travel_time_to_next);

    if (
      place.travel_time_to_next !== undefined &&
      place.travel_time_to_next !== null &&
      travelTimeToNext === null
    ) {
      return { error: 'travel_time_to_next must be a non-negative integer or null.' };
    }

    visitOrders.add(visitOrder);
    normalizedPlaces.push({
      place_id: placeId,
      visit_order: visitOrder,
      travel_time_to_next: travelTimeToNext,
      memo: typeof place.memo === 'string' ? place.memo.trim() || null : null,
    });
  }

  normalizedPlaces.sort((a, b) => a.visit_order - b.visit_order);
  return { places: normalizedPlaces, inputType };
};

const findMissingPlaceIds = async (placeIds) => {
  const uniquePlaceIds = [...new Set(placeIds)];
  const { rows } = await db.query(
    'SELECT place_id FROM places WHERE place_id = ANY($1::bigint[])',
    [uniquePlaceIds]
  );
  const found = new Set(rows.map((row) => Number(row.place_id)));
  return uniquePlaceIds.filter((placeId) => !found.has(placeId));
};

const insertCourse = async ({ userId, title, totalDuration, totalDistanceKm, places }) => {
  const client = await db.connect();

  try {
    const courseColumns = await getColumnSet('courses');
    const detailColumns = await getColumnSet('course_details');
    const canStoreTotalDistance = courseColumns.has('total_distance_km');
    const canStoreMemo = detailColumns.has('memo');

    await client.query('BEGIN');

    const courseInsertColumns = ['user_id', 'title', 'total_duration'];
    const courseInsertValues = [userId, title, totalDuration];
    const coursePlaceholders = ['$1', '$2', '$3'];

    if (canStoreTotalDistance) {
      courseInsertColumns.push('total_distance_km');
      courseInsertValues.push(totalDistanceKm);
      coursePlaceholders.push(`$${courseInsertValues.length}`);
    }

    const { rows: courseRows } = await client.query(
      `INSERT INTO courses (${courseInsertColumns.join(', ')})
       VALUES (${coursePlaceholders.join(', ')})
       RETURNING course_id, title, total_duration, ${canStoreTotalDistance ? 'total_distance_km' : 'NULL::double precision AS total_distance_km'}, created_at`,
      courseInsertValues
    );

    const course = courseRows[0];

    for (const place of places) {
      const detailColumnsToInsert = ['course_id', 'place_id', 'visit_order', 'travel_time_to_next'];
      const detailValues = [course.course_id, place.place_id, place.visit_order, place.travel_time_to_next];
      const detailPlaceholders = ['$1', '$2', '$3', '$4'];

      if (canStoreMemo) {
        detailColumnsToInsert.push('memo');
        detailValues.push(place.memo);
        detailPlaceholders.push(`$${detailValues.length}`);
      }

      await client.query(
        `INSERT INTO course_details (${detailColumnsToInsert.join(', ')})
         VALUES (${detailPlaceholders.join(', ')})`,
        detailValues
      );
    }

    await client.query('COMMIT');

    return {
      course,
      meta: {
        memo_persisted: canStoreMemo,
        total_distance_persisted: canStoreTotalDistance,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// GET /api/courses
// Returns the current user's saved courses.
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const courseColumns = await getColumnSet('courses');
    const totalDistanceSelect = courseColumns.has('total_distance_km')
      ? 'c.total_distance_km'
      : 'NULL::double precision AS total_distance_km';

    const { rows } = await db.query(
      `SELECT
         c.course_id,
         c.title,
         c.total_duration,
         ${totalDistanceSelect},
         c.created_at,
         COUNT(cd.detail_id)::int AS place_count,
         first_place.image_url AS thumbnail_url
       FROM courses c
       LEFT JOIN course_details cd ON cd.course_id = c.course_id
       LEFT JOIN LATERAL (
         SELECT cd2.place_id
         FROM course_details cd2
         WHERE cd2.course_id = c.course_id
         ORDER BY cd2.visit_order ASC
         LIMIT 1
       ) first_cd ON TRUE
       LEFT JOIN places first_place ON first_place.place_id = first_cd.place_id
       WHERE c.user_id = $1
       GROUP BY c.course_id, first_place.image_url
       ORDER BY c.created_at DESC`,
      [user_id]
    );

    res.json({ status: 'success', data: { courses: rows } });
  } catch (err) {
    next(err);
  }
});

// POST /api/courses/from-itinerary/:itinerary_id
// Saves a course from a recommended_itineraries row owned by the current user.
router.post('/from-itinerary/:itinerary_id', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { itinerary_id } = req.params;

    if (!isUuid(itinerary_id)) {
      return res.status(400).json({ status: 'error', message: 'itinerary_id must be a valid UUID.' });
    }

    const { rows } = await db.query(
      `SELECT id, path_data, created_at
       FROM recommended_itineraries
       WHERE id = $1 AND user_id = $2`,
      [itinerary_id, user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Recommended itinerary not found.' });
    }

    const pathData = toPlainObject(rows[0].path_data);
    const normalized = normalizeCoursePlaces({ itinerary: pathData.itinerary });

    if (normalized.error) {
      return res.status(400).json({ status: 'error', message: normalized.error });
    }

    const title = typeof req.body.title === 'string' && req.body.title.trim()
      ? req.body.title.trim()
      : pathData.course_title || 'AI 추천 코스';
    const totalDuration = toNonNegativeIntegerOrNull(req.body.total_duration ?? pathData.total_duration);
    const totalDistanceKm = toDistanceKmOrNull(
      req.body.total_distance_km ??
      req.body.total_distance ??
      pathData.total_distance_km ??
      pathData.total_distance
    );

    if (
      req.body.total_duration !== undefined &&
      req.body.total_duration !== null &&
      totalDuration === null
    ) {
      return res.status(400).json({ status: 'error', message: 'total_duration must be a non-negative integer or null.' });
    }

    const missingPlaceIds = await findMissingPlaceIds(normalized.places.map((place) => place.place_id));
    if (missingPlaceIds.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'The itinerary includes places that do not exist.',
        data: { invalid_place_ids: missingPlaceIds },
      });
    }

    const saved = await insertCourse({
      userId: user_id,
      title,
      totalDuration,
      totalDistanceKm,
      places: normalized.places,
    });

    res.status(201).json({
      status: 'success',
      message: 'Course saved from recommended itinerary.',
      data: {
        course: {
          course_id: saved.course.course_id,
          title: saved.course.title,
          total_duration: saved.course.total_duration,
          total_distance_km: saved.course.total_distance_km,
          place_count: normalized.places.length,
          created_at: saved.course.created_at,
        },
        meta: {
          recommended_itinerary_id: itinerary_id,
          input_type: 'recommended_itinerary',
          ...saved.meta,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/courses/:course_id
// Returns one saved course with ordered place details.
router.get('/:course_id', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const courseId = toPositiveInteger(req.params.course_id);

    if (!courseId) {
      return res.status(400).json({ status: 'error', message: 'course_id must be a positive integer.' });
    }

    const courseColumns = await getColumnSet('courses');
    const detailColumns = await getColumnSet('course_details');
    const totalDistanceSelect = courseColumns.has('total_distance_km')
      ? 'c.total_distance_km'
      : 'NULL::double precision AS total_distance_km';
    const memoSelect = detailColumns.has('memo')
      ? 'cd.memo'
      : 'NULL::text AS memo';

    const { rows } = await db.query(
      `SELECT
         c.course_id,
         c.title,
         c.total_duration,
         ${totalDistanceSelect},
         c.created_at,
         cd.detail_id,
         cd.visit_order,
         cd.travel_time_to_next,
         ${memoSelect},
         p.place_id,
         p.name,
         p.location,
         p.latitude,
         p.longitude,
         p.category,
         p.description,
         p.image_url,
         p.tags,
         p.trend_score,
         p.festival_score
       FROM courses c
       JOIN course_details cd ON cd.course_id = c.course_id
       JOIN places p ON p.place_id = cd.place_id
       WHERE c.course_id = $1 AND c.user_id = $2
       ORDER BY cd.visit_order ASC`,
      [courseId, user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Course not found.' });
    }

    const firstRow = rows[0];
    res.json({
      status: 'success',
      data: {
        course: {
          course_id: firstRow.course_id,
          title: firstRow.title,
          total_duration: firstRow.total_duration,
          total_distance_km: firstRow.total_distance_km,
          created_at: firstRow.created_at,
          places: rows.map((row) => ({
            detail_id: row.detail_id,
            place_id: row.place_id,
            visit_order: row.visit_order,
            travel_time_to_next: row.travel_time_to_next,
            memo: row.memo,
            name: row.name,
            location: row.location,
            latitude: row.latitude,
            longitude: row.longitude,
            category: row.category,
            description: row.description,
            image_url: row.image_url,
            tags: row.tags,
            trend_score: row.trend_score,
            festival_score: row.festival_score,
          })),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/courses
// Saves a course selected by the user.
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const totalDuration = toNonNegativeIntegerOrNull(req.body.total_duration);
    const totalDistanceKm = toDistanceKmOrNull(req.body.total_distance_km ?? req.body.total_distance);
    const normalized = normalizeCoursePlaces(req.body);

    if (!title) {
      return res.status(400).json({ status: 'error', message: 'title is required.' });
    }

    if (
      req.body.total_duration !== undefined &&
      req.body.total_duration !== null &&
      totalDuration === null
    ) {
      return res.status(400).json({ status: 'error', message: 'total_duration must be a non-negative integer or null.' });
    }

    if (
      (req.body.total_distance_km !== undefined || req.body.total_distance !== undefined) &&
      totalDistanceKm === null
    ) {
      return res.status(400).json({ status: 'error', message: 'total_distance_km must be a non-negative number or null.' });
    }

    if (normalized.error) {
      return res.status(400).json({ status: 'error', message: normalized.error });
    }

    const missingPlaceIds = await findMissingPlaceIds(normalized.places.map((place) => place.place_id));
    if (missingPlaceIds.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'The course includes places that do not exist.',
        data: { invalid_place_ids: missingPlaceIds },
      });
    }

    const saved = await insertCourse({
      userId: user_id,
      title,
      totalDuration,
      totalDistanceKm,
      places: normalized.places,
    });

    res.status(201).json({
      status: 'success',
      message: 'Course saved.',
      data: {
        course: {
          course_id: saved.course.course_id,
          title: saved.course.title,
          total_duration: saved.course.total_duration,
          total_distance_km: saved.course.total_distance_km,
          place_count: normalized.places.length,
          created_at: saved.course.created_at,
        },
        meta: {
          input_type: normalized.inputType,
          ...saved.meta,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
