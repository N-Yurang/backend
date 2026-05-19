const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const authenticateToken = require('../middleware/auth');

const parsePlaceId = (value) => {
  const placeId = Number(value);
  return Number.isInteger(placeId) && placeId > 0 ? placeId : null;
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

// GET /api/likes
// Returns full place records liked by the current user.
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const { rows } = await db.query(
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
       ORDER BY ul.created_at DESC`,
      [user_id]
    );

    res.json({ status: 'success', data: { places: rows } });
  } catch (err) {
    next(err);
  }
});

// POST /api/likes/:place_id
// Adds a like. Duplicate likes are treated as success.
router.post('/:place_id', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const placeId = parsePlaceId(req.params.place_id);

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
    const placeId = parsePlaceId(req.params.place_id);

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
