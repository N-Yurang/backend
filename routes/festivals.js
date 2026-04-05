const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/festivals?month=3
router.get('/', async (req, res, next) => {
  try {
    const month = req.query.month || new Date().getMonth() + 1;

    const { rows: festivals } = await db.query(
      `SELECT * FROM festivals 
       WHERE EXTRACT(MONTH FROM start_date) = $1 OR EXTRACT(MONTH FROM end_date) = $2
       ORDER BY start_date ASC`,
      [month, month]
    );

    res.json({ status: 'success', data: { festivals } });
  } catch (err) {
    next(err);
  }
});

// GET /api/festivals/:festival_id
// 축제 상세 정보
router.get('/:festival_id', async (req, res, next) => {
  try {
    const { festival_id } = req.params;

    const { rows } = await db.query('SELECT * FROM festivals WHERE id = $1', [festival_id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '축제를 찾을 수 없어요.' });
    }

    res.json({ status: 'success', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
