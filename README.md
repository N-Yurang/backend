# TRIPLY Backend

TRIPLY 백엔드는 프론트엔드, Supabase PostgreSQL DB, AI 서버 사이에서 요청을 정리하고 저장하는 Express API 서버입니다.  
화면이 직접 DB나 AI 서버를 만지지 않도록 인증, 데이터 조회, 추천 결과 저장, 좋아요/코스 저장 같은 서버 책임을 한곳에 모읍니다.

## 백엔드의 역할

백엔드는 크게 네 가지 일을 합니다.

1. 사용자 계정과 JWT 인증을 처리합니다.
2. 여행지, 축제, 검색, 좋아요, 저장 코스 데이터를 DB에서 읽고 씁니다.
3. AI 추천 요청을 받아 AI 서버에 전달하고, 추천 결과를 `recommended_itineraries`에 저장합니다.
4. 프론트엔드가 바로 사용할 수 있는 JSON 응답 형태로 데이터를 정리합니다.

```text
Frontend
  -> Express Backend
      -> Supabase PostgreSQL
      -> AI Server
      -> Kakao Local API
```

프론트엔드는 원칙적으로 백엔드 API만 호출합니다. 특히 AI 추천은 프론트엔드가 AI 서버를 직접 호출하지 않고 `/api/v1/recommend`를 거쳐야 사용자 인증, 날짜 전달, 추천 결과 저장 흐름이 유지됩니다.

## 기술 구성

| 영역 | 사용 기술 |
| --- | --- |
| 서버 | Node.js, Express |
| DB 연결 | `pg`, Supabase PostgreSQL |
| 인증 | JWT, bcryptjs |
| 외부 API | Kakao Local API |
| AI 서버 연동 | Axios |
| 공통 설정 | dotenv, cors |

## 폴더 구조

```text
backend/
  app.js                  # Express 앱 진입점, 공통 미들웨어와 라우터 등록
  package.json            # 실행 스크립트와 의존성
  db/
    connection.js         # Supabase PostgreSQL Pool 설정
    images/               # /images 정적 경로로 제공되는 이미지 파일
    *.pdf                 # DB 스키마/운영 가이드 문서
  middleware/
    auth.js               # Authorization: Bearer <token> 검증
    errorHandler.js       # 마지막 공통 에러 처리기
  routes/
    auth.js               # 회원가입, 로그인, 로그아웃
    users.js              # 내 정보, 온보딩, 취향/가중치 수정
    places.js             # 장소 검색, 인기 여행지, 숨은 명소, 필터 조회
    search.js             # 장소/축제 통합 검색과 자동완성
    destinations.js       # 여행지 상세
    festivals.js          # 월별/날짜별 축제와 축제 상세
    itineraries.js        # AI 추천 경로 조회/삭제
    likes.js              # 장소/축제 좋아요
    courses.js            # 저장 코스 생성/조회/수정/삭제
    recommend.js          # AI 추천 중계 및 추천 결과 저장
```

## 서버 진입점

`app.js`는 백엔드의 조립 지점입니다.

- `express.json()`으로 JSON 요청 본문을 받습니다.
- `cors`에서 `http://localhost:3000`과 `FRONTEND_URL`을 허용합니다.
- `db/images` 폴더를 `/images` 경로로 정적 제공해 DB의 `image_url`과 연결합니다.
- `/api/auth`, `/api/users`, `/api/places` 같은 기능별 라우터를 등록합니다.
- 마지막에 공통 에러 핸들러를 붙이고 `PORT`로 서버를 실행합니다.

루트 경로 `/`는 헬스체크 용도입니다.

## 인증 흐름

로그인은 `POST /api/auth/login`에서 처리합니다. 비밀번호는 bcrypt로 비교하고, 성공하면 `JWT_SECRET`으로 서명한 JWT를 반환합니다.

인증이 필요한 API는 다음 헤더를 요구합니다.

```http
Authorization: Bearer <token>
```

`middleware/auth.js`는 토큰을 검증한 뒤 `req.user.user_id`를 채웁니다. 이후 라우터는 URL의 사용자 ID를 신뢰하지 않고 토큰에서 나온 `user_id` 기준으로 자기 데이터만 조회하거나 수정합니다.

인증이 필요한 주요 라우터는 `users`, `recommend`, `itineraries`, `likes`, `courses`입니다.

## 데이터와 DB

DB 연결은 `db/connection.js`의 `pg.Pool` 하나로 관리합니다.

필수 환경 변수는 다음과 같습니다.

```env
SUPABASE_DB_URL=postgresql://...
JWT_SECRET=...
AI_SERVER_URL=http://localhost:8000
KAKAO_API_KEY=...
FRONTEND_URL=http://localhost:3000
PORT=5001
```

주요 테이블 책임은 다음처럼 나뉩니다.

| 테이블 | 용도 |
| --- | --- |
| `Users` | 계정, 암호 해시, 이름 |
| `User_Preferences` / `user_preferences` | 온보딩 정보, 여행 취향, AI 가중치 |
| `places` | 여행지/명소 기본 정보 |
| `festivals` | 축제 기본 정보와 기간 |
| `media_trends` | 미디어 트렌드 기반 장소 점수 |
| `recommended_itineraries` | AI 추천 경로 저장 |
| `user_likes` | 장소/축제 좋아요 |
| `courses`, `course_details` | 사용자가 저장한 코스와 방문 순서 |

코스 API는 DB 마이그레이션 상태 차이를 어느 정도 흡수합니다. 예를 들어 `total_distance_km`, `memo` 컬럼이 있는지 확인한 뒤 저장 가능 여부를 응답의 `meta`에 포함합니다.

## 주요 API

기본 주소는 로컬 기준 `http://localhost:5001`입니다.

### Auth

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/api/auth/register` | 회원가입 |
| `POST` | `/api/auth/login` | 로그인, JWT 발급, 온보딩 여부 반환 |
| `POST` | `/api/auth/logout` | 클라이언트 토큰 삭제용 로그아웃 응답 |

### Users

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/api/users/onboarding` | 성별, 여행 빈도, 여행 태그 저장 |
| `GET` | `/api/users/me` | 내 계정과 취향 정보 조회 |
| `PUT` | `/api/users/preferences` | 온보딩 취향 수정 |
| `PATCH` | `/api/users/weights` | AI 추천용 미디어/축제 가중치 수정 |

### Places, Festivals, Search

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/api/places/search?keyword=...` | Kakao Local API 키워드 검색 |
| `GET` | `/api/places/trends` | 트렌드 점수 상위 장소 |
| `GET` | `/api/places/hidden` | 숨은 명소 랜덤 조회 |
| `GET` | `/api/places/filter` | 지역, 키워드, 카테고리 필터 |
| `GET` | `/api/destinations/:place_id` | 장소 상세 |
| `GET` | `/api/festivals?month=3` | 월별 축제 |
| `GET` | `/api/festivals/by-date?date=YYYY-MM-DD` | 특정 날짜에 열리는 축제 |
| `GET` | `/api/festivals/:festival_id` | 축제 상세 |
| `GET` | `/api/search?q=...` | 장소/축제 통합 검색 |
| `GET` | `/api/search/suggest?q=...` | 검색 자동완성 |

### Likes

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/api/likes` | 내가 좋아요한 장소/축제 전체 목록 |
| `GET` | `/api/likes/ids` | 좋아요한 장소/축제 ID 목록 |
| `GET` | `/api/likes/place-ids` | 좋아요한 장소 ID만 조회 |
| `GET` | `/api/likes/festival-ids` | 좋아요한 축제 ID만 조회 |
| `POST` | `/api/likes/:place_id` | 장소 좋아요 |
| `DELETE` | `/api/likes/:place_id` | 장소 좋아요 취소 |
| `POST` | `/api/likes/festivals/:festival_id` | 축제 좋아요 |
| `DELETE` | `/api/likes/festivals/:festival_id` | 축제 좋아요 취소 |

### AI Recommendations and Itineraries

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/api/v1/recommend` | AI 서버에 추천 요청을 중계하고 결과 저장 |
| `GET` | `/api/itineraries` | 내 추천 경로 전체 조회 |
| `GET` | `/api/itineraries/latest` | 내 최신 추천 경로 조회 |
| `GET` | `/api/itineraries/:id` | 추천 경로 상세 조회 |
| `DELETE` | `/api/itineraries/:id` | 추천 경로 삭제 |

`POST /api/v1/recommend` 요청 본문은 다음 형태를 기대합니다.

```json
{
  "chat_history": [
    { "role": "user", "content": "고흥 여행 추천해줘" }
  ],
  "travel_date": "2026-05-10"
}
```

백엔드는 `travel_date`를 시스템 메시지로 추가해 AI 서버의 `/ai/recommend`로 전달합니다. AI가 아직 질문이 더 필요하다고 판단하면 `ai_status: "chat"` 상태로 응답하고, 추천 경로가 만들어지면 `recommended_itineraries`에 저장한 뒤 `recommended_itinerary_id`를 반환합니다.

### Courses

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/api/courses` | 내가 저장한 코스 목록 |
| `POST` | `/api/courses` | 사용자가 선택한 장소 목록으로 코스 저장 |
| `POST` | `/api/courses/from-itinerary/:itinerary_id` | AI 추천 경로를 저장 코스로 전환 |
| `GET` | `/api/courses/:course_id` | 저장 코스 상세 |
| `PATCH` | `/api/courses/:course_id/details/:detail_id/memo` | 코스 내 장소 메모 수정 |
| `DELETE` | `/api/courses/:course_id` | 저장 코스 삭제 |

코스 저장은 `courses`와 `course_details`를 트랜잭션으로 함께 씁니다. 장소 ID가 실제 `places`에 없는 경우 저장하지 않고 400을 반환합니다.

## AI 추천 처리 흐름

```text
1. Frontend -> POST /api/v1/recommend
2. Backend -> JWT 검증
3. Backend -> chat_history 정리, travel_date 추가
4. Backend -> AI_SERVER_URL/ai/recommend 호출
5. AI Server -> 추가 질문 또는 추천 경로 반환
6. Backend -> 추천 경로가 있으면 recommended_itineraries에 저장
7. Backend -> Frontend가 표시하기 쉬운 JSON으로 응답
```

이 흐름 때문에 추천 기능에서 백엔드는 단순 프록시가 아닙니다. 인증된 사용자와 추천 결과를 연결하고, 이후 마이페이지/지도/코스 저장에서 재사용할 수 있게 DB에 남기는 책임을 가집니다.

## 응답 형식

대부분의 성공 응답은 아래 형태를 따릅니다.

```json
{
  "status": "success",
  "data": {}
}
```

검증 실패, 인증 실패, 리소스 없음은 각 라우터에서 `400`, `401`, `404` 등을 직접 반환합니다. 라우터에서 잡히지 않은 예외는 `middleware/errorHandler.js`에서 `500`으로 처리됩니다.

## 실행 참고

이 README의 목적은 구조 설명이지만, 로컬 실행에 필요한 최소 명령은 아래와 같습니다.

```bash
npm install
npm run dev
```

운영 방식으로 실행할 때는 다음 스크립트를 사용합니다.

```bash
npm start
```

로컬에서 전체 기능을 보려면 프론트엔드, 백엔드, AI 서버가 함께 떠 있어야 합니다.

```text
frontend: http://localhost:3000
backend : http://localhost:5001
ai      : http://localhost:8000
```
