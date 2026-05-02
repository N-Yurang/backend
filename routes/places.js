const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db/connection');

// GET /api/places/search?keyword=영월
// 키워드로 장소 검색 (카카오 API 실시간 호출)
router.get('/search', async (req, res, next) => {
  try {
    const { keyword } = req.query;

    const kakaoResult = await axios.get(
      'https://dapi.kakao.com/v2/local/search/keyword.json',
      {
        params: { query: keyword },
        headers: { Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}` }
      }
    );

    const places = kakaoResult.data.documents.map(place => ({
      kakao_id: place.id,
      name: place.place_name,
      category: place.category_name,
      address: place.address_name,
      lat: place.y,
      lng: place.x,
    }));

    res.json({ status: 'success', data: { places } });
  } catch (err) {
    next(err);
  }
});

// GET /api/places/trends
// 미디어 트렌드 여행지 목록
router.get('/trends', async (req, res, next) => {
  try {
    const { rows: places } = await db.query(
      `SELECT p.*, mt.media_source, mt.keyword, mt.trend_score
       FROM media_trends mt
       JOIN places p ON p.place_id = mt.place_id
       ORDER BY mt.trend_score DESC
       LIMIT 10`
    );

    res.json({ status: 'success', data: { places } });
  } catch (err) {
    next(err);
  }
});

// GET /api/places/hidden
// 숨은 명소 목록
router.get('/hidden', async (req, res, next) => {
  try {
    const { rows: places } = await db.query(
      `SELECT * FROM places WHERE category = 'HIDDEN' ORDER BY RANDOM() LIMIT 10`
    );

    res.json({ status: 'success', data: { places } });
  } catch (err) {
    next(err);
  }
});

// GET /api/places/filter?region=제주&keyword=바다&category=TREND
// 지역 + 키워드 + 카테고리 필터링 (AI 전처리)
router.get('/filter', async (req, res, next) => {
  try {
    const { region, keyword, category } = req.query;

    const conditions = [];
    const params = [];

    if (region) {
      params.push(`%${region}%`);
      conditions.push(`location ILIKE $${params.length}`);
    }
    if (keyword) {
      params.push(`%${keyword}%`);
      conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }
    if (category) {
      params.push(category.toUpperCase());
      conditions.push(`category = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: places } = await db.query(
      `SELECT place_id, name, location, latitude, longitude, category,
              description, image_url, tags, trend_score, festival_score
       FROM places
       ${where}
       ORDER BY trend_score DESC NULLS LAST`,
      params
    );

    res.json({ status: 'success', data: { places } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
