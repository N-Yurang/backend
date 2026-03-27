CREATE DATABASE  IF NOT EXISTS `triply_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `triply_db`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: triply_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `course_details`
--

DROP TABLE IF EXISTS `course_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_details` (
  `detail_id` int NOT NULL AUTO_INCREMENT,
  `course_id` int DEFAULT NULL,
  `place_id` int DEFAULT NULL,
  `visit_order` int NOT NULL,
  `travel_time_to_next` int DEFAULT NULL,
  PRIMARY KEY (`detail_id`),
  KEY `course_id` (`course_id`),
  KEY `place_id` (`place_id`),
  CONSTRAINT `course_details_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  CONSTRAINT `course_details_ibfk_2` FOREIGN KEY (`place_id`) REFERENCES `places` (`place_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_details`
--

LOCK TABLES `course_details` WRITE;
/*!40000 ALTER TABLE `course_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `course_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `course_id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(45) DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `total_duration` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`course_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `festivals`
--

DROP TABLE IF EXISTS `festivals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `festivals` (
  `festival_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`festival_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `festivals`
--

LOCK TABLES `festivals` WRITE;
/*!40000 ALTER TABLE `festivals` DISABLE KEYS */;
INSERT INTO `festivals` VALUES (1,'광양 매화축제','2026-03-06','2026-03-15','전남 광양시 다압면','/assets/images/festivals/gwangyang_maehwa.jpg'),(2,'구례 산수유꽃축제','2026-03-14','2026-03-22','전남 구례군 산동면','/assets/images/festivals/gurye_sansuyu.jpg'),(3,'진해 군항제','2026-03-25','2026-04-03','경남 창원시 진해구 일원','/assets/images/festivals/jinhae_cherryblossom.jpg'),(4,'서천 동백꽃 주꾸미 축제','2026-03-20','2026-04-05','충남 서천군 마량리','/assets/images/festivals/seocheon_dongbaek.jpg'),(5,'양산 원동매화축제','2026-03-07','2026-03-15','경남 양산시 원동면','/assets/images/festivals/yangsan_maehwa.jpg'),(6,'영등포 여의도 봄꽃축제','2026-04-02','2026-04-09','서울 영등포구 여의서로','/assets/images/festivals/yeouido_spring.jpg'),(7,'경주 벚꽃축제','2026-04-01','2026-04-05','경북 경주시 보문관광단지','/assets/images/festivals/gyeongju_cherryblossom.jpg'),(8,'태안 세계튤립꽃박람회','2026-04-10','2026-05-05','충남 태안군 안면도','/assets/images/festivals/taean_tulip.jpg'),(9,'신안 튤립축제','2026-04-08','2026-04-19','전남 신안군 임자도','/assets/images/festivals/sinan_tulip.jpg'),(10,'고려산 진달래축제','2026-04-11','2026-04-26','인천 강화군 고려산','/assets/images/festivals/ganghwa_azalea.jpg'),(11,'담양 대나무축제','2026-05-01','2026-05-05','전남 담양군 죽녹원','/assets/images/festivals/damyang_bamboo.jpg'),(12,'곡성 세계장미축제','2026-05-16','2026-05-25','전남 곡성군 섬진강 기차마을','/assets/images/festivals/gokseong_rose.jpg'),(13,'합천 황매산철쭉제','2026-05-02','2026-05-17','경남 합천군 황매산 군립공원','/assets/images/festivals/hapcheon_royalazalea.jpg'),(14,'서울 장미축제','2026-05-15','2026-05-31','서울 중랑구 중랑장미공원','/assets/images/festivals/seoul_rose.jpg'),(15,'보성 다향대축제','2026-05-03','2026-05-07','전남 보성군 한국차문화공원','/assets/images/festivals/boseong_tea.jpg');
/*!40000 ALTER TABLE `festivals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media_trends`
--

DROP TABLE IF EXISTS `media_trends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media_trends` (
  `trend_id` int NOT NULL AUTO_INCREMENT,
  `place_id` int DEFAULT NULL,
  `media_source` varchar(100) DEFAULT NULL,
  `keyword` varchar(50) DEFAULT NULL,
  `trend_score` int DEFAULT '0',
  PRIMARY KEY (`trend_id`),
  KEY `place_id` (`place_id`),
  CONSTRAINT `media_trends_ibfk_1` FOREIGN KEY (`place_id`) REFERENCES `places` (`place_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media_trends`
--

LOCK TABLES `media_trends` WRITE;
/*!40000 ALTER TABLE `media_trends` DISABLE KEYS */;
INSERT INTO `media_trends` VALUES (1,1,'영화 [왕과 사는 남자]','영월여행',95),(2,2,'예능 [나 혼자 힐링]','고흥낭만',88);
/*!40000 ALTER TABLE `media_trends` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `places`
--

DROP TABLE IF EXISTS `places`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `places` (
  `place_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `category` varchar(20) NOT NULL,
  `description` text,
  `image_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`place_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `places`
--

LOCK TABLES `places` WRITE;
/*!40000 ALTER TABLE `places` DISABLE KEYS */;
INSERT INTO `places` VALUES (1,'한반도 지형',37.21855600,128.34444400,'NATURE','삼면이 바다로 둘러싸인 한반도의 모습을 그대로 축소해 놓은 듯한 신기한 지형으로, 전망대에서 보는 풍경이 압권입니다.','/assets/images/places/yeongwol_hanbando.jpg'),(2,'별마로천문대',37.20252100,128.48754100,'TREND','봉래산 정상에 위치해 영월 시내 야경과 쏟아지는 별을 동시에 감상할 수 있는 감성 여행지입니다.','/assets/images/places/yeongwol_star.jpg'),(3,'젊은달와이파크',37.15286900,128.34407800,'TREND','강렬한 붉은색 파빌리온이 돋보이는 현대미술관으로, SNS에서 가장 핫한 포토존입니다.','/assets/images/places/yeongwol_ypark.jpg'),(4,'청령포',37.17512200,128.45501800,'HISTORY','단종의 유배지로, 삼면이 깊은 강물에 둘러싸여 있고 울창한 송림이 슬프고도 아름다운 분위기를 자아냅니다.','/assets/images/places/yeongwol_cheongnyeongpo.jpg'),(5,'요선암 돌개구멍',37.29176300,128.25892500,'HIDDEN','오랜 세월 강물에 깎여 만들어진 독특한 화강암반 지형으로, 신비로운 자연의 조각품을 볼 수 있는 숨겨진 명소입니다.','/assets/images/places/yeongwol_yoseonam.jpg'),(6,'나로우주센터 우주과학관',34.43162700,127.53303600,'TREND','한국 우주개발의 심장부로, 로켓 발사대 모형과 다양한 우주 과학 체험을 할 수 있는 특별한 장소입니다.','/assets/images/places/goheung_space.jpg'),(7,'쑥섬 (애도)',34.46465400,127.46513400,'NATURE','아름다운 해상 꽃정원과 난대림이 어우러진 비밀의 섬으로, 봄부터 가을까지 꽃구경하기 좋습니다.','/assets/images/places/goheung_ssukseom.jpg'),(8,'남열해돋이해수욕장',34.54271800,127.49122300,'NATURE','고운 모래사장과 함께 서핑의 성지로 떠오르고 있으며, 이름처럼 일출이 매우 아름답습니다.','/assets/images/places/goheung_namyeol.jpg'),(9,'연홍도',34.48421000,127.06948000,'HIDDEN','지붕 없는 미술관이라 불리는 작은 섬으로, 마을 골목마다 예쁜 벽화와 조형물이 가득합니다.','/assets/images/places/goheung_yeonhong.jpg'),(10,'팔영산',34.62888900,127.42611100,'NATURE','8개의 암봉으로 이루어진 고흥의 명산으로, 정상에 오르면 다도해의 절경이 한눈에 펼쳐집니다.','/assets/images/places/goheung_paryeong.jpg'),(11,'궁남지',36.27503300,126.91114500,'HISTORY','우리나라 최초의 인공 정원으로, 버드나무와 연못 한가운데 있는 포룡정의 조화가 한 폭의 그림 같습니다.','/assets/images/places/buyeo_gungnamji.jpg'),(12,'낙화암 (부소산성)',36.29141700,126.91427200,'HISTORY','백제 의자왕 때 궁녀들이 백마강으로 몸을 던졌다는 슬픈 전설을 간직한 바위로, 탁 트인 강 풍경이 일품입니다.','/assets/images/places/buyeo_nakhwaam.jpg'),(13,'백제문화단지',36.31422700,126.88371200,'TREND','백제의 왕궁인 사비궁을 완벽하게 재현해 놓은 곳으로, 화려한 야간 개장과 미디어아트로 젊은 층에게 인기입니다.','/assets/images/places/buyeo_baekje.jpg'),(14,'사랑나무 (성흥산성)',36.19530400,126.89736100,'TREND','수령 400년이 넘은 거대한 느티나무로, 가지가 하트 모양을 닮아 연인들의 필수 인생샷 명소로 꼽힙니다.','/assets/images/places/buyeo_lovetree.jpg'),(15,'무량사',36.35339200,126.65345700,'HIDDEN','만수산 자락에 자리한 천년 고찰로, 고즈넉하고 조용한 산사 특유의 분위기를 느끼며 힐링하기 좋습니다.','/assets/images/places/buyeo_muryangsa.jpg');
/*!40000 ALTER TABLE `places` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_logs`
--

DROP TABLE IF EXISTS `user_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(45) DEFAULT NULL,
  `place_id` int DEFAULT NULL,
  `action_type` varchar(20) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `user_id` (`user_id`),
  KEY `place_id` (`place_id`),
  CONSTRAINT `user_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `user_logs_ibfk_2` FOREIGN KEY (`place_id`) REFERENCES `places` (`place_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_logs`
--

LOCK TABLES `user_logs` WRITE;
/*!40000 ALTER TABLE `user_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` varchar(45) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nickname` varchar(45) NOT NULL,
  `preferences` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('traveler_01','hashed_pw_123','여행자','{\"age\": 24, \"gender\": \"female\", \"taste_tags\": [\"#자연친화\", \"#경치\", \"#휴식\"], \"travel_frequency\": \"monthly\"}','2026-03-27 14:55:24');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-27 15:27:05
