const express = require('express');
const router = express.Router();
const db = require('../db/connection');

const DEFAULT_SUGGEST_LIMIT = 5;

function normalizeQuery(value) {
  return String(value || '').trim().slice(0, 80);
}

function parsePositiveInt(value, fallback, max = 10) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function toPlaceItem(place) {
  return {
    type: 'place',
    id: place.place_id,
    place_id: place.place_id,
    title: place.name,
    name: place.name,
    subtitle: place.location,
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
    id: festival.festival_id,
    festival_id: festival.festival_id,
    title: festival.name,
    name: festival.name,
    subtitle: festival.location,
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
  return String(a.title || '').localeCompare(String(b.title || ''), 'ko');
}

function stripInternalRank(item) {
  const { match_rank, ...publicItem } = item;
  return publicItem;
}

async function searchPlaces(query, { limit } = {}) {
  const prefix = `${query}%`;
  const contains = `%${query}%`;
  const params = [query, prefix, contains];
  const limitClause = Number.isInteger(limit) ? `LIMIT $${params.push(limit)}` : '';

  const { rows } = await db.query(
    `SELECT place_id, name, location, latitude, longitude, category,
            description, image_url, tags,
            CASE
              WHEN lower(COALESCE(name, '')) = lower($1) THEN 100
              WHEN COALESCE(name, '') ILIKE $2 THEN 90
              WHEN COALESCE(name, '') ILIKE $3 THEN 80
              WHEN COALESCE(location, '') ILIKE $3 THEN 65
              WHEN COALESCE(description, '') ILIKE $3 THEN 50
              WHEN COALESCE(tags::text, '') ILIKE $3 THEN 35
              ELSE 0
            END AS match_rank
     FROM places
     WHERE COALESCE(name, '') ILIKE $3
        OR COALESCE(location, '') ILIKE $3
        OR COALESCE(tags::text, '') ILIKE $3
        OR COALESCE(description, '') ILIKE $3
     ORDER BY match_rank DESC, name ASC
     ${limitClause}`,
    params
  );

  return rows;
}

async function searchFestivals(query, { limit } = {}) {
  const prefix = `${query}%`;
  const contains = `%${query}%`;
  const params = [query, prefix, contains];
  const limitClause = Number.isInteger(limit) ? `LIMIT $${params.push(limit)}` : '';

  const { rows } = await db.query(
    `SELECT *,
            CASE
              WHEN lower(COALESCE(name, '')) = lower($1) THEN 100
              WHEN COALESCE(name, '') ILIKE $2 THEN 90
              WHEN COALESCE(name, '') ILIKE $3 THEN 80
              WHEN COALESCE(location, '') ILIKE $3 THEN 65
              WHEN COALESCE(description, '') ILIKE $3 THEN 50
              ELSE 0
            END AS match_rank
     FROM festivals
     WHERE COALESCE(name, '') ILIKE $3
        OR COALESCE(location, '') ILIKE $3
        OR COALESCE(description, '') ILIKE $3
     ORDER BY match_rank DESC, name ASC
     ${limitClause}`,
    params
  );

  return rows;
}

// GET /api/search/suggest?q=query&limit=5
router.get('/suggest', async (req, res, next) => {
  try {
    const query = normalizeQuery(req.query.q);
    const limit = parsePositiveInt(req.query.limit, DEFAULT_SUGGEST_LIMIT, 10);

    if (query.length < 2) {
      return res.json({ status: 'success', data: { query, items: [] } });
    }

    const [places, festivals] = await Promise.all([
      searchPlaces(query, { limit }),
      searchFestivals(query, { limit }),
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

    if (!query) {
      return res.json({
        status: 'success',
        data: {
          query,
          items: [],
        },
      });
    }

    const [places, festivals] = await Promise.all([
      searchPlaces(query),
      searchFestivals(query),
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
