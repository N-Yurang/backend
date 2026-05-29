const express = require('express');
const router = express.Router();
const db = require('../db/connection');

const DEFAULT_SUGGEST_LIMIT = 5;
const MIN_SUGGEST_QUERY_LENGTH = 1;

function normalizeQuery(value) {
  return String(value || '').trim().slice(0, 80);
}

function normalizeSearchKeyword(value) {
  return normalizeQuery(value).replace(/\s+/g, '');
}

function getSpacelessSql(column) {
  return `regexp_replace(COALESCE(${column}, ''), '[[:space:]]+', '', 'g')`;
}

function parsePositiveInt(value, fallback, max = 10) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function toPlaceItem(place) {
  return {
    type: 'place',
    place_id: place.place_id,
    name: place.name,
    location: place.location,
    description: place.description,
    image_url: place.image_url,
    latitude: place.latitude,
    longitude: place.longitude,
    category: place.category,
    tags: place.tags,
    href: `/place/${place.place_id}`,
    match_rank: Number(place.match_rank || 0),
  };
}

function toFestivalItem(festival) {
  return {
    type: 'festival',
    festival_id: festival.festival_id,
    name: festival.name,
    location: festival.location,
    description: festival.description,
    image_url: festival.image_url,
    latitude: festival.latitude,
    longitude: festival.longitude,
    start_date: festival.start_date,
    end_date: festival.end_date,
    date_text: formatFestivalDate(festival.start_date, festival.end_date),
    tags: null,
    href: null,
    match_rank: Number(festival.match_rank || 0),
  };
}

function formatFestivalDate(startDate, endDate) {
  if (!startDate && !endDate) return null;
  const start = startDate ? String(startDate).slice(0, 10) : '';
  const end = endDate ? String(endDate).slice(0, 10) : '';
  if (start && end && start !== end) return `${start}~${end}`;
  return start || end;
}

function sortSearchItems(a, b) {
  if (b.match_rank !== a.match_rank) return b.match_rank - a.match_rank;
  return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
}

function stripInternalRank(item) {
  const { match_rank, ...publicItem } = item;
  return publicItem;
}

async function searchPlaces(keyword, { limit } = {}) {
  const prefix = `${keyword}%`;
  const contains = `%${keyword}%`;
  const params = [keyword, prefix, contains];
  const limitClause = Number.isInteger(limit) ? `LIMIT $${params.push(limit)}` : '';

  const { rows } = await db.query(
    `SELECT p.place_id, p.name, p.location, p.latitude, p.longitude, p.category,
            p.description, p.image_url, p.tags,
            CASE
              WHEN lower(search_text.name) = lower($1) THEN 100
              WHEN search_text.name ILIKE $2 THEN 90
              WHEN search_text.name ILIKE $3 THEN 80
              WHEN search_text.location ILIKE $3 THEN 65
              WHEN search_text.description ILIKE $3 THEN 50
              WHEN search_text.tags ILIKE $3 THEN 35
              ELSE 0
            END AS match_rank
     FROM places p
     CROSS JOIN LATERAL (
       SELECT ${getSpacelessSql('p.name')} AS name,
              ${getSpacelessSql('p.location')} AS location,
              ${getSpacelessSql('p.description')} AS description,
              ${getSpacelessSql('p.tags::text')} AS tags
     ) search_text
     WHERE search_text.name ILIKE $3
        OR search_text.location ILIKE $3
        OR search_text.tags ILIKE $3
        OR search_text.description ILIKE $3
     ORDER BY match_rank DESC, p.name ASC
     ${limitClause}`,
    params
  );

  return rows;
}

async function searchFestivals(keyword, { limit } = {}) {
  const prefix = `${keyword}%`;
  const contains = `%${keyword}%`;
  const params = [keyword, prefix, contains];
  const limitClause = Number.isInteger(limit) ? `LIMIT $${params.push(limit)}` : '';

  const { rows } = await db.query(
    `SELECT f.*,
            CASE
              WHEN lower(search_text.name) = lower($1) THEN 100
              WHEN search_text.name ILIKE $2 THEN 90
              WHEN search_text.name ILIKE $3 THEN 80
              WHEN search_text.location ILIKE $3 THEN 65
              WHEN search_text.description ILIKE $3 THEN 50
              ELSE 0
            END AS match_rank
     FROM festivals f
     CROSS JOIN LATERAL (
       SELECT ${getSpacelessSql('f.name')} AS name,
              ${getSpacelessSql('f.location')} AS location,
              ${getSpacelessSql('f.description')} AS description
     ) search_text
     WHERE search_text.name ILIKE $3
        OR search_text.location ILIKE $3
        OR search_text.description ILIKE $3
     ORDER BY match_rank DESC, f.name ASC
     ${limitClause}`,
    params
  );

  return rows;
}

// GET /api/search/suggest?q=query&limit=5
router.get('/suggest', async (req, res, next) => {
  try {
    const query = normalizeQuery(req.query.q);
    const keyword = normalizeSearchKeyword(query);
    const limit = parsePositiveInt(req.query.limit, DEFAULT_SUGGEST_LIMIT, 10);

    if (keyword.length < MIN_SUGGEST_QUERY_LENGTH) {
      return res.json({ status: 'success', data: { query, items: [] } });
    }

    const [places, festivals] = await Promise.all([
      searchPlaces(keyword, { limit }),
      searchFestivals(keyword, { limit }),
    ]);

    const items = [
      ...places.map(toPlaceItem),
      ...festivals.map(toFestivalItem),
    ].sort(sortSearchItems).slice(0, limit).map(stripInternalRank);

    res.json({ status: 'success', data: { query, items } });
  } catch (err) {
    next(err);
  }
});

// GET /api/search?q=query
router.get('/', async (req, res, next) => {
  try {
    const query = normalizeQuery(req.query.q);
    const keyword = normalizeSearchKeyword(query);

    if (!keyword) {
      return res.json({
        status: 'success',
        data: {
          query,
          items: [],
        },
      });
    }

    const [places, festivals] = await Promise.all([
      searchPlaces(keyword),
      searchFestivals(keyword),
    ]);

    res.json({
      status: 'success',
      data: {
        query,
        items: [
          ...places.map(toPlaceItem),
          ...festivals.map(toFestivalItem),
        ].sort(sortSearchItems).map(stripInternalRank),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
