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

    if (!Array.isArray(chat_history) || chat_history.length === 0 || !travel_date) {
      return res.status(400).json({
        status: 'error',
        message: 'chat_history와 travel_date(YYYY-MM-DD)는 필수입니다.',
      });
    }

    const normalizedChatHistory = chat_history
      .filter(msg => msg && typeof msg.content === 'string' && msg.content.trim())
      .map(msg => ({
        role: typeof msg.role === 'string' ? msg.role : 'user',
        content: msg.content.trim(),
      }));

    if (normalizedChatHistory.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'chat_history에 유효한 메시지가 없습니다.',
      });
    }

    const aiChatHistory = [
      ...normalizedChatHistory,
      {
        role: 'system',
        content: `travel_date: ${travel_date}. 사용자의 여행 날짜입니다. 필요한 경우 start_date와 end_date를 이 날짜로 해석하세요.`,
      },
    ];

    const aiResult = await axios.post(
      `${process.env.AI_SERVER_URL}/ai/recommend`,
      { chat_history: aiChatHistory },
      { timeout: 45000 }
    );

    const aiData = aiResult.data || {};
    const itinerary = Array.isArray(aiData.itinerary) ? aiData.itinerary : [];
    const totalDistance = aiData.total_distance || '0km';
    const intent = aiData.intent_extracted || null;

    if (aiData.status === 'chat' || itinerary.length === 0) {
      return res.json({
        status: 'success',
        data: {
          reply: aiData.reply || '',
          itinerary,
          total_distance: totalDistance,
          intent,
          meta: {
            travel_date,
            ai_status: aiData.status || 'chat',
          },
        },
      });
    }

    if (intent && (intent.weight_media !== undefined || intent.weight_festival !== undefined)) {
      const weightMedia = Number.isFinite(Number(intent.weight_media))
        ? Number(intent.weight_media)
        : 0.5;
      const weightFestival = Number.isFinite(Number(intent.weight_festival))
        ? Number(intent.weight_festival)
        : 0.5;

      await db.query(
        `INSERT INTO user_preferences (user_id, weight_media, weight_festival)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id)
         DO UPDATE SET weight_media = $2, weight_festival = $3`,
        [user_id, weightMedia, weightFestival]
      );
    }

    const { rows: savedItineraries } = await db.query(
      `INSERT INTO recommended_itineraries (user_id, path_data)
       VALUES ($1, $2)
       RETURNING id`,
      [
        user_id,
        JSON.stringify({
          itinerary,
          travel_date,
          total_distance: totalDistance,
          intent,
        }),
      ]
    );
    const recommendedItineraryId = savedItineraries[0].id;

    res.json({
      status: 'success',
      data: {
        recommended_itinerary_id: recommendedItineraryId,
        reply: aiData.reply || '',
        itinerary,
        total_distance: totalDistance,
        intent,
        meta: {
          travel_date,
          ai_status: aiData.status || 'recommended',
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
