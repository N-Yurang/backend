const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/destinations/:place_id
// 여행지 상세 정보
router.get('/:place_id', async (req, res, next) => {
  try {
    const { place_id } = req.params;

    const [rows] = await db.query('SELECT * FROM places WHERE place_id = ?', [place_id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '여행지를 찾을 수 없어요.' });
    }

    res.json({ status: 'success', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
