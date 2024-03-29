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
 * states.inc.php
 *
 * CopenhagenReboot game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
   in a very easy way from this configuration file.

   Please check the BGA Studio presentation about game state to understand this, and associated documentation.

   Summary:

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
   _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
   _ manager: special type for initial and final state

   Arguments of game states:
   _ name: the name of the GameState, in order you can recognize it on your own code.
   _ description: the description of the current game state is always displayed in the action status bar on
                  the top of the game. Most of the time this is useless for game state with "game" type.
   _ descriptionmyturn: the description of the current game state when it's your turn.
   _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
   _ action: name of the method to call when this game state become the current game state. Usually, the
             action method is prefixed by "st" (ex: "stMyGameStateName").
   _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
                      method on both client side (Javacript: this.checkAction) and server side (PHP: self::checkAction).
   _ transitions: the transitions are the possible paths to go from a game state to another. You must name
                  transitions in order to use transition names in "nextState" PHP method, and use IDs to
                  specify the next game state for each transition.
   _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
           client side to be used on "onEnteringState" or to set arguments in the gamestate description.
   _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
                            method).
*/

//    !! It is not a good idea to modify this file when a game is running !!

 
$machinestates = array(

    // The initial state. Please do not modify.
    1 => array(
        "name" => "gameSetup",
        "description" => "",
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => array( "" => 2 )
    ),
    
    // Note: ID=2 => your first state
    // NEXT UNUSED STATE: 13

    2 => array(
        "name" => "nextPlayer",
        "description" => '',
        "type" => "game",
        "action" => "stNextPlayer",
        "updateGameProgression" => true,   
        "transitions" => array( "playerTurn" => 3 )
    ),
    
    3 => array(
        "name" => "playerTurn",
        "description" => clienttranslate('${actplayer} must take a card or place a facade tile'),
        "descriptionmyturn" => clienttranslate('${you} must take a card or place a facade tile'),
        "type" => "activeplayer",
        "possibleactions" => array( 
            "takeCard", 
            "placePolyomino", 
            "activateAbilityAnyCards", 
            "activateAbilityAdditionalCard", 
            "activateAbilityBothActions", 
            "activateAbilityConstructionDiscount",
            "activateAbilityChangeOfColors",
            "undo",
        ),
        "transitions" => array(  "checkHandSize" => 4, "calculateScore" => 7, "coatOfArms" => 8, "zombiePass" => 50 )
    ), 

    5 => array(
        "name" => "takeAdjacentCard",
        "args" => "argTakeAdjacentCard",
        "description" => clienttranslate('${actplayer} must take another card'),
        "descriptionmyturn" => clienttranslate('${you} must take another card next to the one you just took'),
        "type" => "activeplayer",
        "possibleactions" => array( "takeCard", "activateAbilityAnyCards", "activateAbilityAdditionalCard", "activateAbilityBothActions", "undo" ),
        "transitions" => array(  "checkHandSize" => 4, "zombiePass" => 50 )
    ), 

    9 => array(
        "name" => "takeAdditionalCard",
        "description" => clienttranslate('${actplayer} must take another card'),
        "descriptionmyturn" => clienttranslate('${you} must take another card'),
        "type" => "activeplayer",
        "possibleactions" => array( "takeCard", "activateAbilityBothActions", "undo"),
        "transitions" => array(  "checkHandSize" => 4, "zombiePass" => 50 )
    ), 

    10 => array(
        "name" => "takeCardsLastCall",
        "description" => clienttranslate('${actplayer} may use special ability tiles'),
        "descriptionmyturn" => clienttranslate('${you} may use special ability tiles'),
        "type" => "activeplayer",
        "possibleactions" => array( "activateAbilityAdditionalCard", "activateAbilityBothActions", "endTurn", "undo" ),
        "transitions" => array(  "takeAdditionalCard" => 9, "placePolyominoAfterTakingCards" => 11,  "refillHarbor" => 50, "zombiePass" => 50 )
    ), 

    11 => array(
        "name" => "placePolyominoAfterTakingCards",
        "action" => "stPlacePolyominoAfterTakingCards",
        "description" => clienttranslate('${actplayer} may place a facade tile'),
        "descriptionmyturn" => clienttranslate('${you} may place a facade tile'),
        "type" => "activeplayer",
        "possibleactions" => array( "placePolyomino", "endTurn", "activateAbilityConstructionDiscount", "activateAbilityChangeOfColors", "undo"),
        "transitions" => array(  "calculateScore" => 7, "refillHarbor" => 50, "zombiePass" => 50 )
    ), 
    
    4 => array(
        "name" => "checkHandSize",
        "description" => "",
        "type" => "game",
        "action" => "stCheckHandSize",
        "transitions" => array( 
            "takeAdjacentCard" => 5,
            "takeAdditionalCard" => 9,
            "discardDownToMaxHandSize" => 6,
            "takeCardsLastCall" => 10,
            "placePolyominoAfterTakingCards" => 11,
            "refillHarbor" => 50
         ),
    ), 

    6 => array(
        "name" => "discardDownToMaxHandSize",
        "description" => clienttranslate('${actplayer} must discard a card'),
        "descriptionmyturn" => clienttranslate('${you} must discard a card. You can only have 7 cards in hand.'),
        "type" => "activeplayer",
        "possibleactions" => array( 
            "discard", "undo",
         ),
        "transitions" => array(  
            "takeAdjacentCard" => 5,
            "takeAdditionalCard" => 9,
            "discardDownToMaxHandSize" => 6,
            "takeCardsLastCall" => 10,
            "placePolyominoAfterTakingCards" => 11,
            "refillHarbor" => 50,
            "zombiePass" => 50,
        )
    ), 

    7 => array(
        "name" => "calculateScore",
        "description" => "",
        "type" => "game",
        "action" => "stCalculateScore",
        "transitions" => array(  "coatOfArms" => 8, "refillHarbor" => 50, "endGame" => 99 )
    ), 

    8 => array(
        "name" => "coatOfArms",
        "action" => "stCoatOfArms",
        "description" => clienttranslate('${actplayer} must take an ability tile ${title_ability_tile}, place a special facade tile ${title_special_facade_tile}, or flip over ALL their used ability tiles ${title_ability_tile_used}'),
        "descriptionmyturn" => clienttranslate('${you} must take an ability tile ${title_ability_tile}, place a special facade tile ${title_special_facade_tile}, or flip over ALL your used ability tiles ${title_ability_tile_used}'),
        "type" => "activeplayer",
        "possibleactions" => array( "placePolyomino", "takeAbilityTile", "resetUsedAbilities", "undo" ),
        "transitions" => array( "coatOfArms" => 8, "calculateScore" => 7, "refillHarbor" => 50, "zombiePass" => 50 ),
    ), 

    50 => array(
        "name" => "refillHarbor",
        "description" => "",
        "type" => "game",
        "action" => "stRefillHarbor",
        "transitions" => array(  "nextPlayer" => 2, "endGame" => 99 )
    ), 

  
   
    // Final state.
    // Please do not modify (and do not overload action/args methods).
    99 => array(
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd"
    )

);



