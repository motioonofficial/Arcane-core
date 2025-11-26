-- Arcane-TS - Users Table
-- Minimum required structure for login

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(25) NOT NULL,
  `password` varchar(255) NOT NULL DEFAULT '',
  `mail` varchar(100) NOT NULL DEFAULT '',
  `auth_ticket` varchar(255) DEFAULT NULL,
  `rank` int(2) NOT NULL DEFAULT 1,
  `credits` int(11) NOT NULL DEFAULT 5000,
  `pixels` int(11) NOT NULL DEFAULT 1000,
  `points` int(11) NOT NULL DEFAULT 0,
  `online` enum('0','1') NOT NULL DEFAULT '0',
  `motto` varchar(127) NOT NULL DEFAULT '',
  `look` varchar(255) NOT NULL DEFAULT 'hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.fa-1201.ca-1804-64',
  `gender` enum('M','F') NOT NULL DEFAULT 'M',
  `account_created` int(11) NOT NULL DEFAULT 0,
  `last_login` int(11) NOT NULL DEFAULT 0,
  `last_online` int(11) NOT NULL DEFAULT 0,
  `ip_register` varchar(45) NOT NULL DEFAULT '',
  `ip_current` varchar(45) NOT NULL DEFAULT '',
  `machine_id` varchar(255) DEFAULT NULL,
  `home_room` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `auth_ticket` (`auth_ticket`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Test user (password: test, SSO: test-sso-ticket)
INSERT INTO `users` (`id`, `username`, `password`, `mail`, `auth_ticket`, `rank`, `credits`, `pixels`, `points`, `online`, `motto`, `look`, `gender`, `account_created`) VALUES
(1, 'test', '', 'test@test.com', 'test-sso-ticket', 7, 50000, 10000, 5000, '0', 'Hello World!', 'hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.fa-1201.ca-1804-64', 'M', UNIX_TIMESTAMP());
