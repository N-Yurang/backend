DROP DATABASE IF EXISTS triply_db;
CREATE DATABASE triply_db;
USE triply_db;


CREATE TABLE Users (
    user_id VARCHAR(45) NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(45) NOT NULL,
    preferences JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);

CREATE TABLE Places (
    place_id INT AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    category VARCHAR(20) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    tags JSON,
    PRIMARY KEY (place_id)
);

CREATE TABLE Media_Trends (
    trend_id INT AUTO_INCREMENT,
    place_id INT,
    media_source VARCHAR(100),
    keyword VARCHAR(50),
    trend_score INT DEFAULT 0,
    PRIMARY KEY (trend_id),
    FOREIGN KEY (place_id) REFERENCES Places(place_id) ON DELETE CASCADE
);

CREATE TABLE User_Logs (
    log_id INT AUTO_INCREMENT,
    user_id VARCHAR(45),
    place_id INT,
    action_type VARCHAR(20) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (place_id) REFERENCES Places(place_id)
);

CREATE TABLE Courses (
    course_id INT AUTO_INCREMENT,
    user_id VARCHAR(45),
    title VARCHAR(100) NOT NULL,
    total_duration INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (course_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Course_Details (
    detail_id INT AUTO_INCREMENT,
    course_id INT,
    place_id INT,
    visit_order INT NOT NULL,
    travel_time_to_next INT,
    PRIMARY KEY (detail_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES Places(place_id)
);

CREATE TABLE Festivals (
    festival_id INT AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(100),
    description TEXT,
    image_url VARCHAR(255),
    PRIMARY KEY (festival_id)
);



-- 1) Users 임시 데이터
INSERT INTO Users (user_id, password, nickname, preferences)
VALUES ('traveler_01', 'hashed_pw_123', '여행자', '{"age": 24, "gender": "female", "travel_frequency": "monthly", "taste_tags": ["#자연친화", "#경치", "#휴식"]}');


-- 2) Places 임시 데이터 (TREND)
INSERT INTO Places (name, location, latitude, longitude, category, description, image_url, tags)
VALUES
('별마로천문대', '강원 영월', 37.20252100, 128.48754100, 'TREND', '봉래산 정상에 위치해 영월 시내 야경과 쏟아지는 별을 동시에 감상할 수 있는 감성 여행지입니다.', '/images/place_yeongwol_star.png', '["감성적인", "낭만적인", "커플", "야경명소", "사진맛집"]'),
('백제문화단지', '충남 부여', 36.31422700, 126.88371200, 'TREND', '백제의 왕궁인 사비궁을 완벽하게 재현해 놓은 곳으로, 화려한 야간 개장과 미디어아트로 젊은 층에게 인기입니다.', '/images/place_buyeo_baekje.png', '["활기찬", "웅장한", "아이와함께", "역사탐방", "야경명소"]'),
('남열해돋이해수욕장', '전남 고흥', 34.54271800, 127.49122300, 'TREND', '고운 모래사장과 함께 서핑의 성지로 떠오르고 있으며, 이름처럼 일출이 매우 아름답습니다.', '/images/place_goheung_namyeol.png', '["활기찬", "낭만적인", "친구와", "바다뷰", "사진맛집"]'),
('젊은달와이파크', '강원 영월', 37.15286900, 128.34407800, 'TREND', '강렬한 붉은색 파빌리온이 돋보이는 현대미술관으로, SNS에서 가장 핫한 포토존입니다.', '/images/place_yeongwol_ypark.png', '["활기찬", "감성적인", "친구와", "사진맛집", "이색체험"]'),

-- 2-2) Places 임시 데이터 (HIDDEN)
('청령포', '강원 영월', 37.17512200, 128.45501800, 'HIDDEN', '단종의 유배지로, 삼면이 깊은 강물에 둘러싸여 있고 울창한 송림이 슬프고도 아름다운 분위기를 자아냅니다.', '/images/place_yeongwol_cheongnyeongpo.png', '["고즈넉한", "조용한", "혼자", "역사탐방", "걷기좋은"]'),
('요선암 돌개구멍', '강원 영월', 37.29176300, 128.25892500, 'HIDDEN', '오랜 세월 강물에 깎여 만들어진 독특한 화강암반 지형으로, 신비로운 자연의 조각품을 볼 수 있는 숨겨진 명소입니다.', '/images/place_yeongwol_yoseonam.png', '["신비로운", "조용한", "아이와함께", "자연경관", "사진맛집"]'),
('쑥섬 (애도)', '전남 고흥', 34.46465400, 127.46513400, 'HIDDEN', '아름다운 해상 꽃정원과 난대림이 어우러진 비밀의 섬으로, 봄부터 가을까지 꽃구경하기 좋습니다.', '/images/place_goheung_ssukseom.png', '["감성적인", "조용한", "부모님과", "바다뷰", "자연경관"]'),
('연홍도', '전남 고흥', 34.48421000, 127.06948000, 'HIDDEN', '지붕 없는 미술관이라 불리는 작은 섬으로, 마을 골목마다 예쁜 벽화와 조형물이 가득합니다.', '/images/place_goheung_yeonhong.png', '["감성적인", "고즈넉한", "혼자", "사진맛집", "걷기좋은"]'),
('낙화암 (부소산성)', '충남 부여', 36.29141700, 126.91427200, 'HIDDEN', '백제 의자왕 때 궁녀들이 백마강으로 몸을 던졌다는 슬픈 전설을 간직한 바위로, 탁 트인 강 풍경이 일품입니다.', '/images/place_buyeo_nakhwaam.png', '["고즈넉한", "웅장한", "부모님과", "역사탐방", "자연경관"]'),
('무량사', '충남 부여', 36.35339200, 126.65345700, 'HIDDEN', '만수산 자락에 자리한 천년 고찰로, 고즈넉하고 조용한 산사 특유의 분위기를 느끼며 힐링하기 좋습니다.', '/images/place_buyeo_muryangsa.png', '["조용한", "고즈넉한", "혼자", "역사탐방", "걷기좋은"]'),
('모운동 벽화마을', '강원 영월', 37.16523300, 128.58312200, 'HIDDEN', '과거 탄광촌의 번영을 누렸던 마을이 구름이 모이는 아름다운 동화 마을로 재탄생했습니다.', '/images/place_yeongwol_moundong.png', '["감성적인", "조용한", "친구와", "걷기좋은", "사진맛집"]'),
('나로도 편백숲', '전남 고흥', 34.44512300, 127.48123400, 'HIDDEN', '수십 년 된 편백나무가 빽빽하게 숲을 이루고 있어 피톤치드를 마시며 조용히 산책하기 좋은 비밀의 숲입니다.', '/images/place_goheung_cypress.png', '["조용한", "신비로운", "부모님과", "자연경관", "걷기좋은"]'),
('반교리 돌담길', '충남 부여', 36.21345600, 126.75432100, 'HIDDEN', '문화재로 지정된 정겨운 옛 흙돌담길을 따라 걸으며 시골 마을의 한적한 정취를 느낄 수 있습니다.', '/images/place_buyeo_bangyo.png', '["고즈넉한", "감성적인", "커플", "걷기좋은", "사진맛집"]'),
('고흥 우주발사전망대 해안길', '전남 고흥', 34.54567800, 127.49876500, 'HIDDEN', '전망대 아래로 이어지는 다랭이논과 몽돌해변이 어우러진 해안 산책로로, 노을 지는 풍경이 압권입니다.', '/images/place_goheung_observatory_walk.png', '["웅장한", "낭만적인", "커플", "바다뷰", "노을맛집"]');


-- 3) Festivals 임시 데이터
INSERT INTO Festivals (name, start_date, end_date, location, description, image_url)
VALUES
('광양 매화축제', '2026-03-06', '2026-03-15', '전남 광양시 다압면', '섬진강변을 따라 하얗게 만개한 매화꽃이 장관을 이루는 전국 최대 규모의 봄꽃 축제입니다.', '/images/festival_gwangyang_maehwa.png'),
('구례 산수유꽃축제', '2026-03-14', '2026-03-22', '전남 구례군 산동면', '지리산 자락을 노랗게 물들이는 산수유꽃을 배경으로 다양한 봄맞이 체험 프로그램이 열립니다.', '/images/festival_gurye_sansuyu.png'),
('진해 군항제', '2026-03-25', '2026-04-03', '경남 창원시 진해구 일원', '여좌천 로망스다리와 경화역의 벚꽃 터널이 환상적인 대한민국 대표 벚꽃 축제입니다.', '/images/festival_jinhae_cherryblossom.png'),
('서천 동백꽃 주꾸미 축제', '2026-03-20', '2026-04-05', '충남 서천군 마량리', '붉은 동백꽃 구경과 함께 제철을 맞아 알이 꽉 찬 주꾸미 요리를 맛볼 수 있는 미식 축제입니다.', '/images/festival_seocheon_dongbaek.png'),
('영등포 여의도 봄꽃축제', '2026-04-02', '2026-04-09', '서울 영등포구 여의서로', '한강을 배경으로 흐드러지게 핀 왕벚나무가 만들어내는 도심 속 봄의 향연입니다.', '/images/festival_yeouido_spring.png'),
('경주 벚꽃축제', '2026-04-01', '2026-04-05', '경북 경주시 보문관광단지', '천년 고도의 문화유산과 화사한 벚꽃이 어우러져 한 폭의 동양화 같은 풍경을 선사합니다.', '/images/festival_gyeongju_cherryblossom.png'),
('태안 세계튤립꽃박람회', '2026-04-10', '2026-05-05', '충남 태안군 안면도', '수백만 송이의 화려한 튤립이 이국적인 풍경을 자아내는 세계 5대 튤립 축제 중 하나입니다.', '/images/festival_taean_tulip.png'),
('고려산 진달래축제', '2026-04-11', '2026-04-26', '인천 강화군 고려산', '산 중턱부터 정상까지 진분홍빛으로 물든 진달래 군락지가 등산객들의 탄성을 자아냅니다.', '/images/festival_ganghwa_azalea.png'),
('담양 대나무축제', '2026-05-01', '2026-05-05', '전남 담양군 죽녹원', '푸른 대나무 숲에서 맑은 공기를 마시며 다양한 대나무 공예와 전통문화를 체험할 수 있습니다.', '/images/festival_damyang_bamboo.png'),
('곡성 세계장미축제', '2026-05-16', '2026-05-25', '전남 곡성군 섬진강 기차마을', '증기기관차가 다니는 기차마을에서 수천 종의 세계 명품 장미들이 내뿜는 매혹적인 향기를 즐겨보세요.', '/images/festival_gokseong_rose.png');

-- 4) Media_Trends 임시 데이터
INSERT INTO Media_Trends (place_id, media_source, keyword, trend_score)
VALUES 
(1, '영화 [왕과 사는 남자]', '영월여행', 95),
(2, '예능 [나 혼자 힐링]', '고흥낭만', 88);