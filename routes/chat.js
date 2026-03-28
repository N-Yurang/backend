const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db/connection');

// POST /api/chat
// AI 챗봇 질문 전송 → AI 서버 중계
router.post('/', async (req, res, next) => {
  try {
    const { user_id, session_id, user_message } = req.body;

    // DB에서 사용자 취향 조회
    const [rows] = await db.query('SELECT tags FROM users WHERE id = ?', [user_id]);
    const tags = rows.length > 0 ? JSON.parse(rows[0].tags) : [];

    // AI 서버로 전달
    let aiResponse;
    try {
      const aiResult = await axios.post(
        `${process.env.AI_SERVER_URL}/ai/recommend`,
        {
          user_id,
          preferences: { theme: tags },
          user_message,
          session_id,
        },
        { timeout: 10000 }
      );
      aiResponse = aiResult.data;
    } catch (aiError) {
      console.warn('AI 서버 응답 실패');
      return res.json({
        status: 'success',
        ai_reply: '죄송해요, 잠시 후 다시 시도해 주세요.',
        recommended_places: []
      });
    }

    // AI가 준 place_id로 DB에서 상세 정보 조회
    let places = [];
    if (aiResponse.recommendations?.length > 0) {
      const placeIds = aiResponse.recommendations.map(r => r.place_id);
      const placeholders = placeIds.map(() => '?').join(', ');
      const [placeRows] = await db.query(
        `SELECT * FROM places WHERE place_id IN (${placeholders})`, placeIds
      );
      places = placeRows;
    }

    res.json({
      status: 'success',
      ai_reply: aiResponse.ai_reply || '',
      recommended_places: places
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
