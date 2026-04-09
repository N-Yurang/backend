const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// ── 미들웨어 설정 ──────────────────────────────
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'db/images')));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // 프론트 주소, 환경변수에 vercel 주소 추가해주세요
  credentials: true,
}));

// ── 라우터 연결 ────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/places', require('./routes/places'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/festivals', require('./routes/festivals'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/playlists', require('./routes/playlists'));
//app.use('/api/plans',           require('./routes/plans'));

// ── 기본 헬스체크 ──────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'TRIPLY 백엔드 서버 정상 동작 중!' });
});

// ── 에러 핸들러 ──────────
app.use(require('./middleware/errorHandler'));

// ── 서버 시작 ──────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});