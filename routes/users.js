const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const authenticateToken = require('../middleware/auth');

// POST /api/users/onboarding
// 온보딩 완료 - User_Preferences INSERT (인증 필요)
router.post('/onboarding', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { gender, travel_frequency, travel_tags } = req.body;

    if (!gender || !travel_frequency || !travel_tags) {
      return res.status(400).json({ status: 'error', message: 'gender, travel_frequency, travel_tags는 필수입니다.' });
    }

    // 이미 온보딩된 경우 UPDATE, 아니면 INSERT
    await db.query(
      `INSERT INTO User_Preferences (user_id, gender, travel_frequency, travel_tags, is_onboarded)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (user_id)
       DO UPDATE SET gender = $2, travel_frequency = $3, travel_tags = $4, is_onboarded = TRUE`,
      [user_id, gender, travel_frequency, JSON.stringify(travel_tags)]
    );

    res.json({ status: 'success', message: '온보딩이 완료되었습니다.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me
// 내 정보 조회 (인증 필요)
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const { rows } = await db.query(
      `SELECT u.user_id, u.name, u.created_at,
              p.gender, p.travel_frequency, p.travel_tags,
              COALESCE(p.is_onboarded, FALSE) AS is_onboarded
       FROM Users u
       LEFT JOIN User_Preferences p ON u.user_id = p.user_id
       WHERE u.user_id = $1`,
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '유저를 찾을 수 없습니다.' });
    }

    const user = rows[0];

    res.json({
      status: 'success',
      data: {
        user_id: user.user_id,
        name: user.name,
        created_at: user.created_at,
        is_onboarded: user.is_onboarded,
        preferences: user.is_onboarded
          ? {
              gender: user.gender,
              travel_frequency: user.travel_frequency,
              travel_tags: user.travel_tags,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/preferences
// 온보딩 취향 수정 (인증 필요)
router.put('/preferences', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { gender, travel_frequency, travel_tags } = req.body;

    await db.query(
      `UPDATE User_Preferences
       SET gender = COALESCE($1, gender),
           travel_frequency = COALESCE($2, travel_frequency),
           travel_tags = COALESCE($3, travel_tags)
       WHERE user_id = $4`,
      [gender, travel_frequency, travel_tags ? JSON.stringify(travel_tags) : null, user_id]
    );

    res.json({ status: 'success', message: '취향 정보가 수정되었습니다.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
