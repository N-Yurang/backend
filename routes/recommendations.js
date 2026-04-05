const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db/connection');

// GET /api/recommendations/personalized?user_id=202210127
// 사용자 취향 맞춤 추천
router.get('/personalized', async (req, res, next) => {
  try {
    const { user_id } = req.query;

    // DB에서 사용자 취향 조회
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '유저를 찾을 수 없어요.' });
    }

    const tags = JSON.parse(rows[0].tags);

    // AI 서버로 추천 요청
    let aiResponse;
    try {
      const aiResult = await axios.post(
        `${process.env.AI_SERVER_URL}/ai/recommend`,
        {
          user_id,
          preferences: { theme: tags },
          recent_log_place_ids: []
        },
        { timeout: 10000 }
      );
      aiResponse = aiResult.data;
    } catch (aiError) {
      console.warn('AI 서버 응답 실패, 기본값 반환');
      return res.json({ status: 'success', data: { user_id, recommended_places: [] } });
    }

    // AI가 준 place_id로 DB에서 상세 정보 조회
    const placeIds = aiResponse.recommendations.map(r => r.place_id);
    const placeholders = placeIds.map((_, i) => `$${i + 1}`).join(', ');
    const { rows: places } = await db.query(
      `SELECT * FROM places WHERE place_id IN (${placeholders})`, placeIds
    );

    res.json({ status: 'success', data: { user_id, recommended_places: places } });
  } catch (err) {
    next(err);
  }
});

// GET /api/recommendations/hidden-gems?user_id=202210127
// 숨은 명소 추천
router.get('/hidden-gems', async (req, res, next) => {
  try {
    const { user_id } = req.query;

    const { rows: places } = await db.query(
      "SELECT * FROM places WHERE category = 'HIDDEN' ORDER BY RANDOM() LIMIT 10"
    );

    res.json({ status: 'success', data: { recommended_places: places } });
  } catch (err) {
    next(err);
  }
});

// POST /api/recommendations/keyword
// 키워드 기반 AI 추천
router.post('/keyword', async (req, res, next) => {
  try {
    const { user_id, keyword } = req.body;

    // DB에서 사용자 취향 조회
    const { rows } = await db.query('SELECT tags FROM users WHERE id = $1', [user_id]);
    const tags = rows.length > 0 ? JSON.parse(rows[0].tags) : [];

    // AI 서버로 키워드 + 취향 전달
    let aiResponse;
    try {
      const aiResult = await axios.post(
        `${process.env.AI_SERVER_URL}/ai/recommend`,
        { user_id, preferences: { theme: tags }, keyword },
        { timeout: 10000 }
      );
      aiResponse = aiResult.data;
    } catch (aiError) {
      console.warn('AI 서버 응답 실패');
      return res.json({ status: 'success', data: { recommended_places: [] } });
    }

    const placeIds = aiResponse.recommendations.map(r => r.place_id);
    const placeholders = placeIds.map((_, i) => `$${i + 1}`).join(', ');
    const { rows: places } = await db.query(
      `SELECT * FROM places WHERE place_id IN (${placeholders})`, placeIds
    );

    res.json({ status: 'success', data: { recommended_places: places } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
