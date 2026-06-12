-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: focus_cat
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cat_state`
--

DROP TABLE IF EXISTS `cat_state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cat_state` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `hunger` int DEFAULT '80',
  `happiness` int DEFAULT '100',
  `equipped_accessory` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bought_food` json DEFAULT NULL,
  `unlocked_accessories` json DEFAULT NULL,
  `today_minutes` int DEFAULT '0',
  `today_date` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `cat_state_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cat_state`
--

LOCK TABLES `cat_state` WRITE;
/*!40000 ALTER TABLE `cat_state` DISABLE KEYS */;
INSERT INTO `cat_state` VALUES (2,2,80,100,NULL,'{}','[]',0,''),(3,3,97,63,'a4','{\"f1\": 0, \"f2\": 0, \"f3\": 0}','[\"a1\", \"a1\", \"a2\", \"a3\", \"a4\"]',0,''),(4,5,80,100,NULL,'{}','[]',0,''),(5,6,0,71,NULL,'{}','[]',0,''),(6,7,0,0,NULL,'{}','[]',0,''),(7,8,0,0,'a4','{\"f1\": 0, \"f2\": 0, \"f3\": 0}','[\"a1\", \"a2\", \"a3\", \"a4\"]',0,'');
/*!40000 ALTER TABLE `cat_state` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `focus_sessions`
--

DROP TABLE IF EXISTS `focus_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `focus_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '专注任务',
  `duration` int NOT NULL DEFAULT '25',
  `mode` enum('countdown','countup','notimer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'countdown',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `focus_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `focus_sessions`
--

LOCK TABLES `focus_sessions` WRITE;
/*!40000 ALTER TABLE `focus_sessions` DISABLE KEYS */;
INSERT INTO `focus_sessions` VALUES (2,3,'111',25,'countdown','2026-06-05 06:59:23'),(3,5,'222',25,'countdown','2026-06-05 06:59:50'),(4,3,'222',25,'countdown','2026-06-05 10:32:02'),(5,3,'333',25,'countdown','2026-06-05 10:37:15'),(9,6,'专注任务',1,'countdown','2026-06-07 05:40:08'),(10,6,'2',25,'countup','2026-06-07 06:02:25'),(11,7,'专注任务',25,'countdown','2026-06-12 05:45:31'),(12,7,'专注任务',1,'countdown','2026-06-12 06:04:09'),(13,8,'1',1,'countdown','2026-06-12 06:27:32'),(14,8,'专注任务',1,'countup','2026-06-12 06:28:19');
/*!40000 ALTER TABLE `focus_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_likes`
--

DROP TABLE IF EXISTS `post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `post_id` (`post_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `post_likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
INSERT INTO `post_likes` VALUES (1,1,2),(6,3,8),(4,11,6),(5,13,6);
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` enum('square','help') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `bounty` int DEFAULT '0',
  `likes` int DEFAULT '0',
  `replies` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (1,2,'square','Test Post','Hello from API!','',0,1,0,'2026-05-29 08:40:33'),(2,3,'help','','111','',100,0,0,'2026-06-05 05:57:20'),(3,2,'square','🐱 我的小橘今天特别粘人','专注了两个小时后，小橘一直蹭我的腿，大概是奖励我吧～毛孩子真的能感受到你的努力。','',0,24,5,'2026-06-04 02:30:00'),(4,2,'square','分享一下我的书桌布置','左边是番茄钟，右边是猫咪的小窝，简直是最佳工作区。每天和小橘一起专注的感觉太棒了！','',0,18,3,'2026-06-03 07:20:00'),(5,2,'square','这个月打卡满21天了','坚持每天专注2小时，小橘的饱腹度终于不再掉到红线了哈哈哈。养猫真的能治拖延症。','',0,31,7,'2026-06-02 01:15:00'),(6,2,'square','猫咪睡着了还要陪着我','专注的时候小橘就在旁边睡觉，呼噜声简直是天然白噪音。','',0,42,8,'2026-06-01 14:00:00'),(7,3,'help','新手请教：猫咪挑食怎么办','家里猫咪最近开始挑食了，除了猫罐头什么都不吃。大家有什么好办法吗？','',0,8,12,'2026-06-04 06:00:00'),(8,3,'help','求推荐适合专注时听的歌单','最近在用Focus Cat计时，想知道大家都听什么音乐来保持专注？我自己比较喜欢纯钢琴。','',0,15,20,'2026-06-03 03:00:00'),(9,3,'help','猫咪半夜跑酷怎么破','每天晚上两点准时开始跑酷，我已经三天没睡好觉了…有没有办法调整它的作息？求支招！','',0,27,35,'2026-06-01 18:30:00'),(10,3,'help','大家一天能专注多少时间？','我觉得4个番茄钟就差不多到极限了，不知道大家都坚持多久？一起加油！','',0,19,28,'2026-06-01 08:45:00'),(11,3,'square','111','111','',0,1,0,'2026-06-05 10:38:45'),(12,3,'help','','222','',10,0,0,'2026-06-05 10:38:57'),(13,6,'square','222','222','',0,1,0,'2026-06-12 03:46:03'),(14,6,'square','333','333','',0,0,0,'2026-06-12 04:11:28'),(15,8,'square','5','5','',0,0,0,'2026-06-12 06:28:59');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `todos`
--

DROP TABLE IF EXISTS `todos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `todos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `completed` tinyint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `todos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `todos`
--

LOCK TABLES `todos` WRITE;
/*!40000 ALTER TABLE `todos` DISABLE KEYS */;
INSERT INTO `todos` VALUES (2,5,'222',0,'2026-06-05 06:59:41'),(4,3,'111',0,'2026-06-05 10:36:44'),(5,3,'',0,'2026-06-05 10:36:59'),(6,6,'',0,'2026-06-07 04:48:44'),(7,6,'',0,'2026-06-07 04:48:45'),(8,7,'1',1,'2026-06-12 05:37:19'),(9,7,'',0,'2026-06-12 05:37:26'),(11,8,'',0,'2026-06-12 06:25:48');
/*!40000 ALTER TABLE `todos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nickname` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `cat_account` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `bio` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `gender` enum('male','female','secret') COLLATE utf8mb4_unicode_ci DEFAULT 'secret',
  `birthday` date DEFAULT NULL,
  `region` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `occupation` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `school` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `coins` int DEFAULT '10000',
  `total_focus_minutes` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'testuser','$2a$10$NqNV2YT82CRkV6Y0sLxPmeZp482VJmRZvzWBktaEZhLP.HpP3Hh92','testuser','','','secret',NULL,'','','','',10000,0,'2026-05-29 08:36:39','2026-06-05 07:04:10'),(3,'111','$2a$10$vg6yTj4//oWizzmIfpZYU.URUIHYX9tY61mlPdgPrSsSgJmlhX0Pe','111','','','secret',NULL,'','','','',9380,100,'2026-06-05 05:34:50','2026-06-05 10:38:05'),(5,'222','$2a$10$La49sLMrOmLe.YkeliXb1.9AZTYnxL19BEnEWse87TNto1C4u.E0K','222','','','secret',NULL,'','','','',10000,25,'2026-06-05 06:06:04','2026-06-05 07:04:10'),(6,'333','$2a$10$LBzmX9qzMI9xKoRt5Ef1Kuuo9whLO79HsG.kr.6KY0fyHpJXZ.JzW','333','','','secret',NULL,'','','','',10011,53,'2026-06-05 10:40:01','2026-06-12 04:31:31'),(7,'444','$2a$10$QNJKl5Jk9l8u3.qxc7jHE.CC5ziSg7RfkGafpX/61RBFHZqjnHWNy','444','','','secret',NULL,'','','','',10001,26,'2026-06-12 05:35:42','2026-06-12 06:04:09'),(8,'5','$2a$10$5Y1hcaTguVGgoZ3rm2jIZOEnHkB87lfOXuhOcIyuqgJlQGoziVs5O','5','','','secret',NULL,'','','','',9511,2,'2026-06-12 06:22:57','2026-06-12 06:28:19');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'focus_cat'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-12 15:06:28
