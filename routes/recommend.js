const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db/connection');
const authenticateToken = require('../middleware/auth');

// POST /api/v1/recommend
// body: { chat_history, travel_date }
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { chat_history, travel_date } = req.body;

    if (!chat_history || !travel_date) {
      return res.status(400).json({
        status: 'error',
        message: 'chat_history와 travel_date(YYYY-MM-DD)는 필수입니다.',
      });
    }

    // ── STEP 1: AI 인텐트 추출 ───────────────────────────────────────────
    const intentResult = await axios.post(
      `${process.env.AI_SERVER_URL}/ai/intent`,
      { chat_history },
      { timeout: 10000 }
    );
    const { region, weight_media, weight_festival, keyword_filter } = intentResult.data;

    // ── STEP 2: AI가 추출한 가중치 저장 ──────────────────────────────────
    await db.query(
      `INSERT INTO user_preferences (user_id, weight_media, weight_festival)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET weight_media = $2, weight_festival = $3`,
      [user_id, weight_media, weight_festival]
    );

    // ── STEP 3: DB 전처리 ─────────────────────────────────────────────────
    const params = [`%${region}%`];
    let keywordClause = '';
    if (keyword_filter && keyword_filter.length > 0) {
      const keywordConditions = keyword_filter
        .map((_, i) => `(name ILIKE $${params.length + i + 1} OR description ILIKE $${params.length + i + 1})`)
        .join(' OR ');
      keyword_filter.forEach(kw => params.push(`%${kw}%`));
      keywordClause = `AND (${keywordConditions})`;
    }

    const { rows: places } = await db.query(
      `SELECT place_id, name, location, latitude, longitude, category,
              description, image_url, tags, trend_score, festival_score
       FROM places
       WHERE location ILIKE $1 ${keywordClause}`,
      params
    );

    if (places.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `${region} 지역에 등록된 장소가 없습니다.`,
      });
    }

    const { rows: festivals } = await db.query(
      `SELECT festival_id, name, latitude, longitude
       FROM festivals
       WHERE start_date <= $1 AND end_date >= $1`,
      [travel_date]
    );

    // ── STEP 4: AI GA 호출 ────────────────────────────────────────────────
    const gaResult = await axios.post(
      `${process.env.AI_SERVER_URL}/ai/ga`,
      { places, festivals, weight_media, weight_festival },
      { timeout: 15000 }
    );
    let { itinerary, total_distance } = gaResult.data;

    // ── STEP 5: place_id 리스트에 장소 상세 정보 합치기 ──────────────────
    if (itinerary.length > 0 && itinerary[0].lat === undefined) {
      const placeIds = itinerary.map(r => r.place_id);
      const placeholders = placeIds.map((_, i) => `$${i + 1}`).join(', ');
      const { rows: placeDetails } = await db.query(
        `SELECT place_id, name, latitude, longitude, category, image_url, tags
         FROM places WHERE place_id IN (${placeholders})`,
        placeIds
      );
      const placeMap = Object.fromEntries(placeDetails.map(p => [String(p.place_id), p]));

      itinerary = itinerary.map(item => {
        const detail = placeMap[String(item.place_id)] || {};
        return {
          order:     item.order,
          place_id:  item.place_id,
          name:      detail.name,
          lat:       Number(detail.latitude),
          lng:       Number(detail.longitude),
          category:  detail.category,
          image_url: detail.image_url,
          tags:      detail.tags,
        };
      });
    }

    // ── STEP 6: 저장 + 응답 ───────────────────────────────────────────────
    await db.query(
      `INSERT INTO recommended_itineraries (user_id, path_data)
       VALUES ($1, $2)`,
      [user_id, JSON.stringify({ itinerary, travel_date, total_distance })]
    );

    res.json({
      status: 'success',
      data: {
        itinerary,
        total_distance,
        meta: {
          travel_date,
          active_festivals: festivals.map(f => f.name),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
