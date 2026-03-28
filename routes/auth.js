const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// POST /api/auth/register
// 회원가입 + 온보딩 데이터 저장
router.post('/register', async (req, res, next) => {
  try {
    const { user_id, password, profile, preferences } = req.body;
    const { name, age, gender } = profile;
    const { travel_frequency, tags } = preferences;

    await db.query(
      'INSERT INTO users (id, password, name, age, gender, travel_frequency, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, password, name, age, gender, travel_frequency, JSON.stringify(tags)]
    );

    res.json({ status: 'success', message: '회원가입 완료!' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
// 로그인 → JWT 토큰 발급
router.post('/login', async (req, res, next) => {
  try {
    const { user_id, password } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM users WHERE id = ? AND password = ?',
      [user_id, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: '아이디 또는 비밀번호가 틀렸어요.' });
    }

    // TODO: JWT 토큰 발급 (추후 jsonwebtoken 패키지 사용)
    res.json({ status: 'success', token: 'JWT_TOKEN_HERE' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
// 로그아웃
router.post('/logout', async (req, res, next) => {
  try {
    res.json({ status: 'success', message: '로그아웃 완료!' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
