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
    const [places] = await db.query(
      `SELECT p.place_id, p.name, p.location, p.image_url, p.description, p.tags,
              mt.media_source, mt.keyword, mt.trend_score
       FROM Places p
       JOIN Media_Trends mt ON p.place_id = mt.place_id
       ORDER BY mt.trend_score DESC LIMIT 10`
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
    const [places] = await db.query(
      "SELECT * FROM places WHERE category = 'HIDDEN' ORDER BY RAND() LIMIT 10"
    );

    res.json({ status: 'success', data: { places } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
