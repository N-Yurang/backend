const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const authenticateToken = require('../middleware/auth');

// GET /api/itineraries
// 내 추천 경로 전체 목록
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const { rows } = await db.query(
      `SELECT id, path_data, created_at
       FROM recommended_itineraries
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.json({ status: 'success', data: { itineraries: rows } });
  } catch (err) {
    next(err);
  }
});

// GET /api/itineraries/latest
// 가장 최근 추천 경로 (지도 탭 진입 시 사용)
router.get('/latest', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const { rows } = await db.query(
      `SELECT id, path_data, created_at
       FROM recommended_itineraries
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '저장된 추천 경로가 없습니다.' });
    }

    res.json({ status: 'success', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/itineraries/:id
// 특정 추천 경로 상세 조회
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;

    const { rows } = await db.query(
      `SELECT id, path_data, created_at
       FROM recommended_itineraries
       WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '경로를 찾을 수 없습니다.' });
    }

    res.json({ status: 'success', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/itineraries/:id
// 추천 경로 삭제
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;

    const { rowCount } = await db.query(
      `DELETE FROM recommended_itineraries WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ status: 'error', message: '경로를 찾을 수 없습니다.' });
    }

    res.json({ status: 'success', message: '경로가 삭제되었습니다.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
