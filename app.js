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
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ── 라우터 연결 ────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/places', require('./routes/places'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/festivals', require('./routes/festivals'));
app.use('/api/itineraries',  require('./routes/itineraries'));
app.use('/api/likes', require('./routes/likes'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/v1/recommend', require('./routes/recommend'));
//app.use('/api/plans',       require('./routes/plans'));

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
