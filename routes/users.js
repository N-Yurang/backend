const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/users/:user_id
// 사용자 정보 조회 (마이페이지)
router.get('/:user_id', async (req, res, next) => {
  try {
    const { user_id } = req.params;

    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [user_id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '유저를 찾을 수 없어요.' });
    }

    const user = rows[0];

    res.json({
      status: 'success',
      data: {
        user_id: user.id,
        profile: {
          name: user.name,
          age: user.age,
          gender: user.gender,
        },
        preferences: {
          travel_frequency: user.travel_frequency,
          tags: JSON.parse(user.tags),
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:user_id/preferences
// 여행 취향 태그 수정
router.put('/:user_id/preferences', async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const { updated_tags } = req.body;

    await db.query(
      'UPDATE users SET tags = $1 WHERE id = $2',
      [JSON.stringify(updated_tags), user_id]
    );

    res.json({ status: 'success', message: '취향 수정 완료!' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
