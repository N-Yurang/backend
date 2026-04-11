const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');

// POST /api/auth/register
// 회원가입 - Users 테이블에만 INSERT (온보딩은 별도)
router.post('/register', async (req, res, next) => {
  try {
    const { user_id, password, name } = req.body;

    if (!user_id || !password || !name) {
      return res.status(400).json({ status: 'error', message: 'user_id, password, name은 필수입니다.' });
    }

    // 중복 아이디 체크
    const { rows: existing } = await db.query(
      'SELECT user_id FROM Users WHERE user_id = $1',
      [user_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ status: 'error', message: '이미 사용 중인 아이디입니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO Users (user_id, password, name) VALUES ($1, $2, $3)',
      [user_id, hashedPassword, name]
    );

    res.status(201).json({ status: 'success', message: '회원가입이 완료되었습니다.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
// 로그인 - JWT 발급 + 온보딩 여부 반환
router.post('/login', async (req, res, next) => {
  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({ status: 'error', message: 'user_id와 password는 필수입니다.' });
    }

    // Users LEFT JOIN User_Preferences → 온보딩 여부 함께 조회
    const { rows } = await db.query(
      `SELECT u.user_id, u.password, u.name,
              COALESCE(p.is_onboarded, FALSE) AS is_onboarded
       FROM Users u
       LEFT JOIN User_Preferences p ON u.user_id = p.user_id
       WHERE u.user_id = $1`,
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: '아이디 또는 비밀번호가 틀렸습니다.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: '아이디 또는 비밀번호가 틀렸습니다.' });
    }

    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      status: 'success',
      data: {
        token,
        user_id: user.user_id,
        name: user.name,
        is_onboarded: user.is_onboarded,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
// 로그아웃 (JWT stateless - 클라이언트에서 토큰 삭제)
router.post('/logout', (req, res) => {
  res.json({ status: 'success', message: '로그아웃 되었습니다.' });
});

module.exports = router;
