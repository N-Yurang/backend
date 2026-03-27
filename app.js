const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// ── 미들웨어 설정 ──────────────────────────────
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000', // 프론트 주소
  credentials: true,
}));

// ── 라우터 연결 ────────────────────────────────

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