<?php

/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * Copenhagen implementation : © <Joe France> <josephfrance@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * stats.inc.php
 *
 * CopenhagenReboot game statistics description
 *
 */

/*
    In this file, you are describing game statistics, that will be displayed at the end of the
    game.
    
    !! After modifying this file, you must use "Reload  statistics configuration" in BGA Studio backoffice
    ("Control Panel" / "Manage Game" / "Your Game")
    
    There are 2 types of statistics:
    _ table statistics, that are not associated to a specific player (ie: 1 value for each game).
    _ player statistics, that are associated to each players (ie: 1 value for each player in the game).

    Statistics types can be "int" for integer, "float" for floating point values, and "bool" for boolean
    
    Once you defined your statistics there, you can start using "initStat", "setStat" and "incStat" method
    in your game logic, using statistics names defined below.
    
    !! It is not a good idea to modify this file when a game is running !!

    If your game is already public on BGA, please read the following before any change:
    http://en.doc.boardgamearena.com/Post-release_phase#Changes_that_breaks_the_games_in_progress
    
    Notes:
    * Statistic index is the reference used in setStat/incStat/initStat PHP method
    * Statistic index must contains alphanumerical characters and no space. Example: 'turn_played'
    * Statistics IDs must be >=10
    * Two table statistics can't share the same ID, two player statistics can't share the same ID
    * A table statistic can have the same ID than a player statistics
    * Statistics ID is the reference used by BGA website. If you change the ID, you lost all historical statistic data. Do NOT re-use an ID of a deleted statistic
    * Statistic name is the English description of the statistic as shown to players
    
*/

$stats_type = array(

    // NEXT ID: 18

    // Statistics global to table
    "table" => array(

        "turns" => array("id"=> 17,
            "name" => totranslate("Number of turns"),
            "type" => "int" ),
        "how_game_ended" => array("id"=> 11,
            "name" => totranslate("How did the game end?"),
            "type" => "int" ),

    ),
    
    // Statistics existing for each player
    "player" => array(

        "cards_drawn" => array("id"=> 14,
            "name" => totranslate("Cards drawn"),
            "type" => "int" ),
        "cards_discarded_too_many" => array("id"=> 15,
            "name" => totranslate("Cards discarded from having too many in your hand"),
            "type" => "int" ),
        "facade_tiles_placed" => array("id"=> 16,
            "name" => totranslate("Facade tiles placed"),
            "type" => "int" ),
        "squares_covered" => array("id"=> 13,
            "name" => totranslate("Squares covered"),
            "type" => "int" ),
        "coat_of_arms_earned" => array("id"=> 10,
            "name" => totranslate("Coat of arms earned"),
            "type" => "int" ),
        "ability_tiles_used" => array("id"=> 12,
            "name" => totranslate("Ability tiles used"),
            "type" => "int" ),
        "brickwork_rows" => array("id"=> 18,
            "name" => totranslate("Points from rows with brickwork"),
            "type" => "int" ),
        "window_rows" => array("id"=> 19,
            "name" => totranslate("Points from rows with all windows"),
            "type" => "int" ),
        "brickwork_columns" => array("id"=> 20,
            "name" => totranslate("Points from columns with brickwork"),
            "type" => "int" ),
        "window_columns" => array("id"=> 21,
            "name" => totranslate("Points from columns with all windows"),
            "type" => "int" ),
        "empty_spaces" => array("id"=> 22,
            "name" => totranslate("Empty spaces"),
            "type" => "int" ),


    ),


    "value_labels" => array(
        11 => array( 
            1 => totranslate("By points"),
            2 => totranslate("By End of Game card"),
        ),

    ),

);
