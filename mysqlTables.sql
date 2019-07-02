 

--
-- Table structure for table `AddressTxo`
--

DROP TABLE IF EXISTS `AddressTxo`;
 
CREATE TABLE `AddressTxo` (
  `address` varchar(45) NOT NULL,
  `txo` varchar(64) NOT NULL,
  `idx` int(11) NOT NULL,
  PRIMARY KEY (`address`,`txo`,`idx`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
 
--
-- Table structure for table `Meta`
--

DROP TABLE IF EXISTS `Meta`;
 
CREATE TABLE `Meta` (
  `name` text,
  `data` json DEFAULT NULL,
  UNIQUE KEY `idx_Meta_name` (`name`(120))
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
 

--
-- Table structure for table `RawBlock`
--

DROP TABLE IF EXISTS `RawBlock`;
 
CREATE TABLE `RawBlock` (
  `height` int(11) NOT NULL,
  `data` json NOT NULL,
  `hash` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`height`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
 

--
-- Table structure for table `RawTo`
--

DROP TABLE IF EXISTS `RawTo`;
 
CREATE TABLE `RawTo` (
  `hash` varchar(64) NOT NULL,
  `data` json NOT NULL,
  `spent` tinyint(1) NOT NULL DEFAULT '0',
  `idx` int(11) NOT NULL,
  `units` bigint(20) NOT NULL DEFAULT '0',
  `hasoptreturn` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`hash`,`idx`),
  UNIQUE KEY `idx_RawTo_hash_deleted` (`hash`,`spent`,`idx`),
  KEY `idx_RawTo_deleted` (`spent`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
 

--
-- Table structure for table `RawTx`
--

DROP TABLE IF EXISTS `RawTx`;
 
CREATE TABLE `RawTx` (
  `hash` varchar(64) NOT NULL,
  `data` json NOT NULL,
  `height` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
 
