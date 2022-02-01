<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * CopenhagenReboot implementation : © <Your name here> <Your email address here>
 * 
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * material.inc.php
 *
 * CopenhagenReboot game material description
 *
 * Here, you can describe the material of your game with PHP variables.
 *   
 * This file is loaded in your game logic class constructor, ie these variables
 * are available everywhere in your game logic code.
 *
 */

// CONSTANT GLOBALS
$this->harbor_number = 7;
$this->max_hand_size = 7;

$this->board_height = 9;
$this->board_width = 5;

$this->end_of_game_points = 12;

$this->colors = array("red", "yellow", "green", "blue", "purple");


$this->polyomino_shapes = array(
    "purple-2" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 1, "y" => 0, "fill" => "window"), ),
    "purple-3" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 1, "y" => 0, "fill" => "window"), array( "x" => 2, "y" => 0, "fill" => "window")),
    "purple-4" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 1, "y" => 0, "fill" => "window"), array( "x" => 2, "y" => 0, "fill" => "window"),array("x" => 3, "y" => 0, "fill" => "window")),
    "purple-5" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 1, "y" => 0, "fill" => "window"), array( "x" => 2, "y" => 0, "fill" => "window"),array("x" => 3, "y" => 0, "fill" => "window"),array( "x" =>4,"y" =>0, "fill" => "window")),

    "green-2" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 1, "y" => 0, "fill" => "window")),
    "green-3" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 1, "y" => 0, "fill" => "window"), array( "x" => 2, "y" => 0, "fill" => "window")),
    "green-4" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => -1, "y" => 1, "fill" => "window"), array( "x" => 0, "y" => 1, "fill" => "window"),array("x" => 1, "y" => 1, "fill" => "window")),
    "green-5" => array( array( "x" => 0, "y" => 0, "fill" => "window"), array( "x" => -1, "y" => 1,  "fill" => "brickwork"), array( "x" => 0, "y" => 1, "fill" => "window"),array("x" => 1, "y" => 1, "fill" => "window"),array( "x" =>0,"y" =>2, "fill" => "window")),

    "red-2" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 1, "y" => 0, "fill" => "window")),
    "red-3" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 0, "y" => 1, "fill" => "window"), array( "x" => 1, "y" => 1, "fill" => "window")),
    "red-4" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 1, "y" => 0, "fill" => "window"), array( "x" => 0, "y" => 1, "fill" => "window"),array("x" => 1, "y" => 1, "fill" => "window")),
    "red-5" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 1, "y" => 0, "fill" => "window"), array( "x" => 2, "y" => 0, "fill" => "window"),array("x" => 1, "y" => 1, "fill" => "window"),array( "x" =>2,"y" =>1, "fill" => "window")),

    "blue-2" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 1, "y" => 0, "fill" => "window")),
    "blue-3" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 0, "y" => 1, "fill" => "window"), array( "x" => 1, "y" => 1, "fill" => "window")),
    "blue-4" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 1, "y" => 0, "fill" => "window"), array( "x" => 2, "y" => 0, "fill" => "window"),array("x" => 2, "y" => 1, "fill" => "window")),
    "blue-5" => array( array( "x" => 0, "y" => 0, "fill" => "window"), array( "x" => -2, "y" => 1, "fill" => "brickwork"), array( "x" => -1, "y" => 1, "fill" => "window"),array("x" => 0, "y" => 1, "fill" => "window"),array( "x" =>0,"y" =>2, "fill" => "window")),

    "yellow-2" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 1, "y" => 0, "fill" => "window")),
    "yellow-3" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => 0, "y" => 1, "fill" => "window"), array( "x" => 1, "y" => 1, "fill" => "window")),
    "yellow-4" => array( array( "x" => 0, "y" => 0, "fill" => "window"), array( "x" => 1, "y" => 0, "fill" => "window"), array( "x" => 1, "y" => 1, "fill" => "brickwork"),array("x" => 2, "y" => 1, "fill" => "window")),
    "yellow-5" => array( array( "x" => 0, "y" => 0, "fill" => "brickwork"), array( "x" => -2, "y" => 1, "fill" => "window"), array( "x" => -1, "y" => 1, "fill" => "window"),array("x" => 0, "y" => 1, "fill" => "window"),array( "x" =>-2,"y" =>2, "fill" => "window")),

    "white-1" => array( array( "x" => 0, "y" => 0, "fill" => "window")),
);

$this->adjacent_offsets = array(
    array( "x" => 1, "y" => 0),
    array( "x" => 0, "y" => -1),
    array( "x" => -1, "y" => 0),
    array( "x" => 0, "y" => 1),
);


