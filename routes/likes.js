const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const authenticateToken = require('../middleware/auth');

const parsePositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// GET /api/likes/place-ids
// Returns only liked place ids for initializing heart buttons.
router.get('/place-ids', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const { rows } = await db.query(
      `SELECT place_id
       FROM user_likes
       WHERE user_id = $1
         AND place_id IS NOT NULL
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.json({
      status: 'success',
      data: {
        liked_place_ids: rows.map((row) => Number(row.place_id)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/likes/festival-ids
// Returns only liked festival ids for initializing heart buttons.
router.get('/festival-ids', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const { rows } = await db.query(
      `SELECT festival_id
       FROM user_likes
       WHERE user_id = $1
         AND festival_id IS NOT NULL
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.json({
      status: 'success',
      data: {
        liked_festival_ids: rows.map((row) => Number(row.festival_id)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/likes/ids
// Returns liked place and festival ids together.
router.get('/ids', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const { rows } = await db.query(
      `SELECT place_id, festival_id
       FROM user_likes
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.json({
      status: 'success',
      data: {
        liked_place_ids: rows
          .filter((row) => row.place_id !== null)
          .map((row) => Number(row.place_id)),
        liked_festival_ids: rows
          .filter((row) => row.festival_id !== null)
          .map((row) => Number(row.festival_id)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/likes
// Returns full place and festival records liked by the current user.
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const { rows: places } = await db.query(
      `SELECT
         ul.like_id,
         ul.created_at AS liked_at,
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
       FROM user_likes ul
       JOIN places p ON p.place_id = ul.place_id
       WHERE ul.user_id = $1
         AND ul.place_id IS NOT NULL
       ORDER BY ul.created_at DESC`,
      [user_id]
    );

    const { rows: festivals } = await db.query(
      `SELECT
         ul.like_id,
         ul.created_at AS liked_at,
         f.festival_id,
         f.name,
         f.location,
         f.latitude,
         f.longitude,
         f.description,
         f.image_url,
         f.start_date,
         f.end_date
       FROM user_likes ul
       JOIN festivals f ON f.festival_id = ul.festival_id
       WHERE ul.user_id = $1
         AND ul.festival_id IS NOT NULL
       ORDER BY ul.created_at DESC`,
      [user_id]
    );

    const items = [
      ...places.map((place) => ({
        ...place,
        id: `place-${place.place_id}`,
        type: 'place',
        target_id: place.place_id,
      })),
      ...festivals.map((festival) => ({
        ...festival,
        id: `festival-${festival.festival_id}`,
        type: 'festival',
        target_id: festival.festival_id,
      })),
    ].sort((a, b) => new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime());

    res.json({ status: 'success', data: { items, places, festivals } });
  } catch (err) {
    next(err);
  }
});

// POST /api/likes/festivals/:festival_id
// Adds a festival like. Duplicate likes are treated as success.
router.post('/festivals/:festival_id', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const festivalId = parsePositiveInteger(req.params.festival_id);

    if (!festivalId) {
      return res.status(400).json({ status: 'error', message: 'festival_id must be a positive integer.' });
    }

    const { rows: festivals } = await db.query(
      'SELECT festival_id FROM festivals WHERE festival_id = $1',
      [festivalId]
    );

    if (festivals.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Festival not found.' });
    }

    const { rows } = await db.query(
      `INSERT INTO user_likes (user_id, festival_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, festival_id) DO UPDATE
       SET created_at = user_likes.created_at
       RETURNING like_id, user_id, festival_id, created_at`,
      [user_id, festivalId]
    );

    res.status(201).json({
      status: 'success',
      data: {
        liked: true,
        like: rows[0],
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/likes/festivals/:festival_id
// Removes a festival like. Missing likes are treated as success.
router.delete('/festivals/:festival_id', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const festivalId = parsePositiveInteger(req.params.festival_id);

    if (!festivalId) {
      return res.status(400).json({ status: 'error', message: 'festival_id must be a positive integer.' });
    }

    await db.query(
      `DELETE FROM user_likes
       WHERE user_id = $1 AND festival_id = $2`,
      [user_id, festivalId]
    );

    res.json({
      status: 'success',
      data: {
        festival_id: festivalId,
        liked: false,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/likes/:place_id
// Adds a like. Duplicate likes are treated as success.
router.post('/:place_id', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const placeId = parsePositiveInteger(req.params.place_id);

    if (!placeId) {
      return res.status(400).json({ status: 'error', message: 'place_id must be a positive integer.' });
    }

    const { rows: places } = await db.query(
      'SELECT place_id FROM places WHERE place_id = $1',
      [placeId]
    );

    if (places.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Place not found.' });
    }

    const { rows } = await db.query(
      `INSERT INTO user_likes (user_id, place_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, place_id) DO UPDATE
       SET created_at = user_likes.created_at
       RETURNING like_id, user_id, place_id, created_at`,
      [user_id, placeId]
    );

    res.status(201).json({
      status: 'success',
      data: {
        liked: true,
        like: rows[0],
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/likes/:place_id
// Removes a like. Missing likes are treated as success.
router.delete('/:place_id', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const placeId = parsePositiveInteger(req.params.place_id);

    if (!placeId) {
      return res.status(400).json({ status: 'error', message: 'place_id must be a positive integer.' });
    }

    await db.query(
      `DELETE FROM user_likes
       WHERE user_id = $1 AND place_id = $2`,
      [user_id, placeId]
    );

    res.json({
      status: 'success',
      data: {
        place_id: placeId,
        liked: false,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
