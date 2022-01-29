

-- ------
-- BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
-- CopenhagenReboot implementation : © <Your name here> <Your email address here>
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----

-- dbmodel.sql

-- This is the file where you are describing the database schema of your game
-- Basically, you just have to export from PhpMyAdmin your table structure and copy/paste
-- this export here.
-- Note that the database itself and the standard tables ("global", "stats", "gamelog" and "player") are
-- already created and must not be created here

CREATE TABLE IF NOT EXISTS `card` (
  `card_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `card_type` varchar(16) NOT NULL,
  `card_type_arg` int(11) NOT NULL,
  `card_location` varchar(16) NOT NULL,
  `card_location_arg` int(11) NOT NULL,
  PRIMARY KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS `polyomino` (
  `id` tinyint(4) unsigned NOT NULL AUTO_INCREMENT,
  `color` varchar(6) NOT NULL,
  `squares` tinyint(4) unsigned NOT NULL,
  `copy` tinyint(4) unsigned NOT NULL,
  `owner` int(11) DEFAULT NULL,
  `rotation` smallint(4) DEFAULT 0,
  `flip` smallint(4) DEFAULT 0,
  `x` tinyint(2) unsigned DEFAULT 0,
  `y` tinyint(2) unsigned DEFAULT 0,

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;


CREATE TABLE IF NOT EXISTS `board_cell` (
  `id` tinyint(4) unsigned NOT NULL AUTO_INCREMENT,
  `owner` int(11) NOT NULL,
  `x` tinyint(2) unsigned NOT NULL,
  `y` tinyint(2) unsigned NOT NULL,
  `color` varchar(6) DEFAULT NULL,
  `fill` varchar(6) DEFAULT NULL,

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ; 