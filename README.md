# TRIPLY 백엔드 서버

> AI 기반 개인 맞춤형 여행 플레이리스트 자동 생성 플랫폼 **TRIPLY**의 백엔드 서버입니다.

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| 서버 프레임워크 | Node.js + Express |
| 데이터베이스 | MySQL |
| AI 서버 통신 | Axios |
| 외부 지도 API | - |
| 기타 | dotenv, cors, nodemon |

---

## 프로젝트 구조

```
backend/
├── app.js                  # 서버 진입점 (포트, 미들웨어, 라우터 등록)
├── .env                    # 환경변수
├── .env.example
├── .gitignore
├── package.json
│
├── routes/                 # API 경로별 파일
│   ├── auth.js             # 회원가입 / 로그인
│   ├── users.js            # 사용자 정보 조회 / 취향 수정
│   ├── places.js           # 장소 검색 / 트렌드 / 숨은명소
│   ├── destinations.js     # 여행지 상세 정보
│   ├── festivals.js        # 이달의 축제
│   ├── recommendations.js  # AI 추천
│   ├── chat.js             # AI 챗봇
│   └── playlists.js        # 플레이리스트 관리
│
├── db/
│   └── connection.js       # MySQL 연결 설정
│
└── middleware/
    ├── errorHandler.js     # 에러 처리
    └── auth.js             # JWT 인증 체크
```

---

## 시작하기

### 1. 레포 클론

```bash
git clone https://github.com/basic-capstone3team/backend.git
cd backend
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경변수 설정

루트에 `.env` 파일을 생성하고 아래 내용을 작성

```env
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=DB비밀번호
DB_NAME=triply
AI_SERVER_URL=http://localhost:8000
```

### 4. 서버 실행

```bash
# 개발 환경
npm run dev

# 배포 환경
npm start
```

터미널에 아래 메시지가 뜨면 성공

```
✅ 서버 실행 중: http://localhost:4000
```

### 5. 로컬 개발 시 실행 순서

```bash
# 터미널 1 - AI 서버 (포트 8000)
cd ai && python main.py

# 터미널 2 - 백엔드 (포트 4000)
cd backend && npm run dev

# 터미널 3 - 프론트엔드 (포트 3000)
cd frontend && npm run dev
```

---

## API 목록

> 기본 주소: `http://localhost:4000`

### 인증

| 메서드 | 경로 | 기능 |
|--------|------|------|
| POST | `/api/auth/register` | 회원가입 + 온보딩 데이터 저장 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |

### 사용자

| 메서드 | 경로 | 기능 |
|--------|------|------|
| GET | `/api/users/:user_id` | 사용자 정보 조회 |
| PUT | `/api/users/:user_id/preferences` | 여행 취향 태그 수정 |

### 장소

| 메서드 | 경로 | 기능 |
|--------|------|------|
| GET | `/api/places/search?keyword=영월` | 키워드 장소 검색 |
| GET | `/api/places/trends` | 미디어 트렌드 여행지 목록 |
| GET | `/api/places/hidden` | 숨은 명소 목록 |
| GET | `/api/destinations/:place_id` | 여행지 상세 정보 |

### 축제

| 메서드 | 경로 | 기능 |
|--------|------|------|
| GET | `/api/festivals?month=3` | 이달의 축제 목록 |
| GET | `/api/festivals/:festival_id` | 축제 상세 정보 |

### 추천

| 메서드 | 경로 | 기능 |
|--------|------|------|
| GET | `/api/recommendations/personalized` | 사용자 취향 맞춤 추천 |
| GET | `/api/recommendations/hidden-gems` | 숨은 명소 추천 |
| POST | `/api/recommendations/keyword` | 키워드 기반 AI 추천 |

### AI 챗봇

| 메서드 | 경로 | 기능 |
|--------|------|------|
| POST | `/api/chat` | AI 챗봇 질문 → AI 서버 중계 후 응답 |

### 플레이리스트

| 메서드 | 경로 | 기능 |
|--------|------|------|
| POST | `/api/playlists` | 새 플레이리스트 생성 |
| GET | `/api/playlists/:playlist_id` | 플레이리스트 조회 |
| POST | `/api/playlists/:playlist_id/places` | 장소 추가 |
| DELETE | `/api/playlists/:playlist_id/places/:place_id` | 장소 삭제 |
| POST | `/api/playlists/:playlist_id/ai-recommend` | AI 추천 요청 |
| POST | `/api/playlists/:playlist_id/optimize-route` | 경로 최적화 요청 |