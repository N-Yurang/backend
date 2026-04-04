const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db/connection');

// POST /api/playlists
// 새 플레이리스트 생성
router.post('/', async (req, res, next) => {
  try {
    const { user_id, title } = req.body;

    const { rows } = await db.query(
      'INSERT INTO playlists (user_id, title) VALUES ($1, $2) RETURNING id',
      [user_id, title]
    );

    res.json({
      status: 'success',
      data: { playlist_id: rows[0].id, title }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/playlists/:playlist_id
// 플레이리스트 조회
router.get('/:playlist_id', async (req, res, next) => {
  try {
    const { playlist_id } = req.params;

    const { rows } = await db.query('SELECT * FROM playlists WHERE id = $1', [playlist_id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '플레이리스트를 찾을 수 없어요.' });
    }

    // 플레이리스트에 속한 장소 목록 조회
    const { rows: places } = await db.query(
      `SELECT p.* FROM places p
       JOIN playlist_places pp ON p.place_id = pp.place_id
       WHERE pp.playlist_id = $1`,
      [playlist_id]
    );

    res.json({
      status: 'success',
      data: { ...rows[0], places }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/playlists/:playlist_id/places
// 플레이리스트에 장소 추가 (카카오 → DB 저장)
router.post('/:playlist_id/places', async (req, res, next) => {
  try {
    const { playlist_id } = req.params;
    const { kakao_id, name, category, lat, lng } = req.body;

    // 이미 DB에 있는 장소인지 확인
    let { rows } = await db.query('SELECT * FROM places WHERE kakao_id = $1', [kakao_id]);
    let place_id;

    if (rows.length === 0) {
      // 없으면 DB에 새로 저장
      const { rows: inserted } = await db.query(
        'INSERT INTO places (kakao_id, name, category, lat, lng) VALUES ($1, $2, $3, $4, $5) RETURNING place_id',
        [kakao_id, name, category, lat, lng]
      );
      place_id = inserted[0].place_id;
    } else {
      // 있으면 기존 ID 사용
      place_id = rows[0].place_id;
    }

    // 플레이리스트에 연결
    await db.query(
      'INSERT INTO playlist_places (playlist_id, place_id) VALUES ($1, $2)',
      [playlist_id, place_id]
    );

    res.json({ status: 'success', message: '장소가 추가되었어요!' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/playlists/:playlist_id/places/:place_id
// 플레이리스트에서 장소 삭제
router.delete('/:playlist_id/places/:place_id', async (req, res, next) => {
  try {
    const { playlist_id, place_id } = req.params;

    await db.query(
      'DELETE FROM playlist_places WHERE playlist_id = $1 AND place_id = $2',
      [playlist_id, place_id]
    );

    res.json({ status: 'success', message: '장소가 삭제되었어요!' });
  } catch (err) {
    next(err);
  }
});

// POST /api/playlists/:playlist_id/ai-recommend
// AI 추천 요청
router.post('/:playlist_id/ai-recommend', async (req, res, next) => {
  try {
    const { playlist_id } = req.params;
    const { user_id } = req.body;

    // 사용자 취향 조회
    const { rows } = await db.query('SELECT tags FROM users WHERE id = $1', [user_id]);
    const tags = rows.length > 0 ? JSON.parse(rows[0].tags) : [];

    // AI 서버로 추천 요청
    let aiResponse;
    try {
      const aiResult = await axios.post(
        `${process.env.AI_SERVER_URL}/ai/recommend`,
        { user_id, preferences: { theme: tags }, recent_log_place_ids: [] },
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

// POST /api/playlists/:playlist_id/optimize-route
// 경로 최적화 요청
router.post('/:playlist_id/optimize-route', async (req, res, next) => {
  try {
    const { playlist_id } = req.params;
    const { start_time, transportation } = req.body;

    // 플레이리스트 장소 목록 조회
    const { rows: places } = await db.query(
      `SELECT p.place_id, p.name, p.lat, p.lng FROM places p
       JOIN playlist_places pp ON p.place_id = pp.place_id
       WHERE pp.playlist_id = $1`,
      [playlist_id]
    );

    const lat_lng_list = places.map(p => ({
      place_id: p.place_id, lat: p.lat, lng: p.lng
    }));

    // AI 서버로 최적 동선 계산 요청
    const aiResult = await axios.post(
      `${process.env.AI_SERVER_URL}/ai/route-optimize`,
      { place_ids: places.map(p => p.place_id), lat_lng_list, start_time },
      { timeout: 10000 }
    );

    res.json({ status: 'success', data: aiResult.data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
