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
  * copenhagenreboot.game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */


/*
 * Debugging Notes to Self:
 *  self::warn($message) is a way to print to the exception log.  Note that when you click "SQL logs", you then have to click over to "exception logs"
 *  json_encode($array) is what you want to print out and debug arrays - not implode().  It handles multiple level arrays, and shows you the keys and values.
 */

require_once( APP_GAMEMODULE_PATH.'module/table/table.game.php' );


class CopenhagenReboot extends Table
{
	function __construct( )
	{
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        self::initGameStateLabels( array(

            // GLOBAL VARIABLES 
            "cards_taken_this_turn" => 10,  // keep track of how many cards have been taken this turn.  10 is not the value to track - just an internal ID
            "mermaid_card_id" => 11,
            
            // VARIANTS
            //    "my_first_game_variant" => 100,
            //    "my_second_game_variant" => 101,
            //      ...
        ) );   

        $this->cards = self::getNew( "module.common.deck" );
        $this->cards->init( "card" );

	}
	
    protected function getGameName( )
    {
		// Used for translations and stuff. Please do not modify.
        return "copenhagenreboot";
    }	

    /*
        setupNewGame:
        
        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame( $players, $options = array() )
    {    
        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = self::getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES ";
        $values = array();
        foreach( $players as $player_id => $player )
        {
            $color = array_shift( $default_colors );
            $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."')";
        }
        $sql .= implode( $values, ',' );
        self::DbQuery( $sql );
        self::reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        self::reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // INITIALIZE GLOBAL VALUES
        self::setGameStateValue( 'cards_taken_this_turn', 0 );

        // INITIALIZE GAME STATISTICS
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        //self::initStat( 'table', 'table_teststat1', 0 );    // Init a table statistics
        //self::initStat( 'player', 'player_teststat1', 0 );  // Init a player statistics (for all players)


        // SETUP DECK
        $cards_per_color = 14;
        if( count($players) == 3 ) $cards_per_color = 12;

        $cards = array();
        $cards[] = array( 'type' => "mermaid", 'type_arg' => 0, 'nbr' => 1);
        foreach( $this->colors as $color )
        {    
            $cards[] = array( 'type' => $color, 'type_arg' => 0,  'nbr' => $cards_per_color);
        }

        $this->cards->createCards( $cards, 'deck' );

        // STORE MERMAID CARD ID
        $sql = "SELECT card_id FROM card WHERE card_type = 'mermaid';";  // remember SQL uses one equals sign, not two
        $database_result = self::getObjectFromDB( $sql );
        $mermaid_card_id = $database_result['card_id'];
        self::setGameStateValue( 'mermaid_card_id', $mermaid_card_id );

        // PREPARE CARDS
        $this->cards->moveCard($mermaid_card_id, "mermaid_pile");
        $this->cards->shuffle( 'deck' );

        if( count($players) == 2) $this->shuffleInMermaidCard();

        // LAYOUT HARBOR CARDS
        for( $i = 0; $i < $this->harbor_number; $i++)
        {
            $cards = $this->cards->pickCardForLocation('deck', 'harbor', $i);
        }

        // SET PLAYER STARTING HANDS
        $players = self::loadPlayersBasicInfos();

        foreach( $players as $player_id => $player )
        {
            $number_of_starting_cards = $this->getStartingCardsForPlayerNumber( $player["player_no"], count($players) );
            $cards = $this->cards->pickCards( $number_of_starting_cards, 'deck', $player_id ); 
        }  

        // CREATE POLYOMINOES
        $sql = "INSERT INTO polyomino(color, squares, copy) VALUES ";
        $values_format_sql = "('%s', %d, %d),";
        foreach($this->colors as $color)
        {
            for( $squares = 2; $squares <= 5; $squares ++)
            {
                for( $copy = 1; $copy <= 3; $copy ++)
                {
                    if( $copy > 1 && $squares == 5) continue; // only one 5 piece of each color
                    else if( count($players) == 2 && $copy == 3) continue; // only 2 pieces per polyomino for 2 player game
                     else if( count($players) == 3 && $copy == 3 && ($squares == 2 || $squares == 4)) continue; // removing certain pieces for 3 player game

                    $sql .= sprintf( $values_format_sql, $color, $squares, $copy);
                }
            }
        }
        $sql = substr($sql, 0, -1) . ";"; // remove the last comma, replace with a semicolon
        self::DbQuery( $sql );


       $index = 1;
        foreach( $players as $player_id => $player )
        {
            $sql = "UPDATE polyomino SET owner = " . $player_id . " WHERE id = " . $index;
            self::DbQuery( $sql );
            $index += 1;
        }  

        // Activate first player
        $this->activeNextPlayer();

        /************ End of the game initialization *****/
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas()
    {
        $result = array();
    
        $current_player_id = self::getCurrentPlayerId();    // !! We must only return informations visible by this player !!
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score FROM player ";
        $result['players'] = self::getCollectionFromDb( $sql );
        
        $result['hand'] = $this->cards->getCardsInLocation( 'hand', $current_player_id );
        $result['harbor'] = $this->cards->getCardsInLocation( 'harbor' );

        $mermaid_card_id = self::getGameStateValue( 'mermaid_card_id' );
        $result['mermaid_card'] = $this->cards->getCard( $mermaid_card_id )["location"];
        $result['cards_in_deck'] = $this->cards->countCardInLocation("deck");

        $sql = "SELECT * FROM polyomino;";
        $result['polyominoes'] = self::getCollectionFromDb( $sql );

        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see states.inc.php)
    */
    function getGameProgression()
    {
        // TODO: compute and return the game progression

        return 0;
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////    



    function getStartingCardsForPlayerNumber( $player_number, $player_count )
    {

        // NOTE: I think "2" is the first player - that 1 gets skipped over, and becomes the last player
        //   so first, let's remap it to something more intuitive
        $player_number -= 1;
        if( $player_number == 0 ) $player_number = $player_count;

        // RETURN HOW MANY CARDS THEY GET
        switch( $player_number )
        {
            case 1:
                return 2;
                break;
            case 2:
                return 3;
                break;
            case 3:
                return 3;
                break;
            case 4:
                return 4;
                break;
        }

        return 0;
    }

    // RETURN WHICH HARBORS ARE EMPTY
    //   this removes elements from an array, which works differently in PHP than other languages
    //   that's because a PHP array is more like a dictionary than a list
    //   so if you have a list of numbers, the PHP way to think of it is [0] => 0, [1] => 1, [2] = 2,
    //   and if you "unset" [1], the array is then [0] => 0, [2] => 2
    //   which makes it easy to remove elements, but then would also make it easy to have a gap in something you'd like to iterate over
    //   so you can use array_values() to reassign elements indexes from 0 to n-1.
    //   note that dictionary-like-arrays in PHP are ordered - which is also quite different from other languages.
    function getEmptyHarbors()
    {
        $empty_harbors = [];
        for( $i = 0; $i < $this->harbor_number; $i++) $empty_harbors[] = $i;

        $cards_in_harbor = $this->cards->getCardsInLocation( "harbor", null, "location_arg");
        foreach( $cards_in_harbor as $card )
        {
            unset($empty_harbors[ $card["location_arg"]]);
        }

        return array_values( $empty_harbors ); 
    }

    function getCardIdsAdjacentToEmptyHarbor()
    {
        $card_ids = [];
        $empty_harbors = $this->getEmptyHarbors(); 

        $empty_harbor = $empty_harbors[0]; // for now, assume 1 empty harbor

        if( $empty_harbor - 1 >= 0 )
        {
            $card_ids[] = array_key_first($this->cards->getCardsInLocation( "harbor", $empty_harbor - 1));
        }
        if( $empty_harbor + 1 < $this->harbor_number )
        {
            $card_ids[] = array_key_first($this->cards->getCardsInLocation( "harbor", $empty_harbor + 1));  
        } 

        return $card_ids;
    }

    function shuffleDiscardIntoDeck()
    {
        $this->cards->moveAllCardsInLocation( "discard", "deck");
        $this->cards->shuffle( "deck");
        $this->shuffleInMermaidCard();
    }

    function shuffleInMermaidCard()
    {
        // mix in the mermaid card with other cards
        $this->cards->pickCardsForLocation( 9, "deck", "mermaid_pile");
        $this->cards->shuffle("mermaid_pile");

        // move cards to bottom of draw pile
        $cards = $this->cards->getCardsInLocation("mermaid_pile");

        foreach( $cards as $card )
        {
            $this->cards->insertCardOnExtremePosition( $card["id"], "deck", false);
        }
    }



//////////////////////////////////////////////////////////////////////////////
//////////// Player actions
//////////// 

    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in copenhagenreboot.action.php)
    */

    /*
    
    Example:

    function playCard( $card_id )
    {
        // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
        self::checkAction( 'playCard' ); 
        
        $player_id = self::getActivePlayerId();
        
        // Add your game logic to play a card there 
        ...
        
        // Notify all players about the card played
        self::notifyAllPlayers( "cardPlayed", clienttranslate( '${player_name} plays ${card_name}' ), array(
            'player_id' => $player_id,
            'player_name' => self::getActivePlayerName(),
            'card_name' => $card_name,
            'card_id' => $card_id
        ) );
          
    }
    
    */

    function takeCard( $card_id )
    {
        self::checkAction( 'takeCard' );

        $player_id = self::getActivePlayerId();

        // CAN'T HAVE TAKEN ANY CARDS THIS TURN
        $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        if ($cards_taken_this_turn != 0 ) throw new feException( self::_("You've already taken your first card this turn."));

        // MAKE SURE CARD IS IN HARBOR
        $card = $this->cards->getCard( $card_id ); 
        self::warn( "Attempt to take card " . $card_id . " which is in location " . $card["location"]);
        if( $card['location'] != 'harbor') throw new feException( self::_("That card is not in the harbor."));

        $this->cards->moveCard( $card_id, "hand", $player_id );

        $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        self::setGameStateValue( 'cards_taken_this_turn', $cards_taken_this_turn + 1 );

        self::notifyAllPlayers( 
            "takeCard", 
            clienttranslate('${player_name} takes a ${color} card.'),
            array(
                "card_id" => $card_id,
                "player_id" => $player_id,
                "player_name" => self::getActivePlayerName(),
                "color" => $card["type"]
            )   
        );

        $this->gamestate->nextState( "takeCard");
    }

     function takeAdjacentCard( $card_id )
    {
        self::checkAction( 'takeCard' );

        $player_id = self::getActivePlayerId();

        // MUST HAVE TAKEN 1 CARD ALREADY
        $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        if ($cards_taken_this_turn != 1 ) throw new feException( self::_("You're trying to take your second card before your first."));

        // MAKE SURE CARD IS IN HARBOR
        $card = $this->cards->getCard( $card_id ); 
        if( $card['location'] != 'harbor') throw new feException( self::_("That card is not in the harbor."));

        // MAKE SURE WE ONLY HAVE 1 EMPTY HARBOR
        $empty_harbors = $this->getEmptyHarbors();
        if( count($empty_harbors) > 1 ) throw new feException( self::_("You have more than one empty harbor."));

        // MAKE SURE TAKEN CARD IS ADJACENT TO PREVIOUSLY TAKEN CARD
        $is_adjacent = $empty_harbors[0] + 1 == $card["location_arg"] || $empty_harbors[0] - 1 == $card["location_arg"];
        if( ! $is_adjacent) throw new feException( self::_("You're trying to take a card that's not adjacent to the first taken card."));

        $this->cards->moveCard( $card_id, "hand", $player_id );

        $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        self::setGameStateValue( 'cards_taken_this_turn', $cards_taken_this_turn + 1 );

        self::notifyAllPlayers( 
            "takeCard", 
            clienttranslate('${player_name} takes a ${color} card.'),
            array(
                "card_id" => $card_id,
                "player_id" => $player_id,
                "player_name" => self::getActivePlayerName(),
                "color" => $card["type"]
            )   
        );

        $this->gamestate->nextState( "takeCard");
    }

    function discardDownToMaxHandSize( $card_id )
    {

        self::checkAction( 'discardedAndDone' ); // I think I only need to check one of the actions for this particular case

        $player_id = self::getActivePlayerId();
        $card = $this->cards->getCard( $card_id ); 

        // MAKE SURE CARD IS IN PLAYER'S HAND
        if( $card['location'] != 'hand' && $card['location_arg'] == $player_id) throw new feException( self::_("That card is not in your hand."));

        // MAKE SURE WE'RE ACTUALLY OVER THE HAND LIMIT
        $cardsInHand = $this->cards->countCardInLocation( "hand", $player_id);
        if( $cardsInHand <= $this->max_hand_size ) throw new feException( self::_("You are not over the hand limit size."));

        // DISCARD THE CARD
        $this->cards->moveCard( $card_id, "discard");

        // TELL THE CLIENTS
        //   Cards are discarded face up, so it's okay to notify all players of the specific card discarded
        self::notifyAllPlayers( 
            "discardDownToMaxHandSize", 
            clienttranslate('${player_name} discards a ${color} card.'),
            array(
                "player_id" => $player_id,
                "player_name" => self::getActivePlayerName(),
                "card_id" => $card_id,
                "color" => $card["type"]
            )   
        );
        
        // NEXT PHASE
        $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        if( $cards_taken_this_turn == 1 ) $this->gamestate->nextState( "discardedAndTakeAnother");
        else $this->gamestate->nextState( "discardedAndDone");

    }

    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */

    function argTakeAdjacentCard()
    {
        return array(
            "adjacent_card_ids" => $this->getCardIdsAdjacentToEmptyHarbor(),
        );
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stNextPlayer()
    {

        $player_id = self::activeNextPlayer(); // this sets the turn to the next player

        // NEXT PLAYER'S TURN
        self::setGameStateValue( 'cards_taken_this_turn', 0 );

        $this->gamestate->nextState("playerTurn");
    }

    function stCheckHandSize()
    {
        $player_id = self::getActivePlayerId();

        $cards_in_hand = $this->cards->countCardInLocation( "hand", $player_id);
        if( $cards_in_hand > $this->max_hand_size ) $this->gamestate->nextState("discardDownToMaxHandSize");
        else
        {
            // PLAYER DOESN'T HAVE TOO MANY CARDS
            $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
            if( $cards_taken_this_turn == 1 ) $this->gamestate->nextState("takeAdjacentCard");
            else $this->gamestate->nextState("refillHarbor");
        }
        
        
    }



    function stRefillHarbor()
    {

        $cards = [];

        for( $i = 0; $i < $this->harbor_number; $i ++)
        {
            if( $this->cards->countCardInLocation("harbor", $i) == 0 )
            {

                // prepare deck
                if( $this->cards->countCardInLocation("deck") == 0 ) $this->shuffleDiscardIntoDeck();
                $cards[] = $this->cards->pickCardForLocation('deck', 'harbor', $i);
            }            
        }

        // NOTIFY CLIENTS
        $mermaid_card_id = self::getGameStateValue( "mermaid_card_id" );
        $mermaid_card = $this->cards->getCard( $mermaid_card_id );

        self::notifyAllPlayers( 
            "refillHarbor", 
            "",
            array(
                "harbor" => $cards,
                "cards_in_deck" => $this->cards->countCardInLocation("deck"),
                "mermaid_card" => $mermaid_card["location"]
            )   
        );

        if( $this->cards->getCard($mermaid_card_id)["location"] == "harbor") $this->gamestate->nextState("endGame"); // end game if we draw mermaid card
        else $this->gamestate->nextState("nextPlayer");
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Zombie
////////////

    /*
        zombieTurn:
        
        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).
        
        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message. 
    */

    function zombieTurn( $state, $active_player )
    {
    	$statename = $state['name'];
    	
        if ($state['type'] === "activeplayer") {
            switch ($statename) {
                default:
                    $this->gamestate->nextState( "zombiePass" );
                	break;
            }

            return;
        }

        if ($state['type'] === "multipleactiveplayer") {
            // Make sure player is in a non blocking status for role turn
            $this->gamestate->setPlayerNonMultiactive( $active_player, '' );
            
            return;
        }

        throw new feException( "Zombie mode not supported at this game state: ".$statename );
    }
    
///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:
        
        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.
    
    */
    
    function upgradeTableDb( $from_version )
    {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
        
        // Example:
//        if( $from_version <= 1404301345 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            self::applyDbUpgradeToAllDB( $sql );
//        }
//        if( $from_version <= 1405061421 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            self::applyDbUpgradeToAllDB( $sql );
//        }
//        // Please add your future database scheme changes here
//
//


    }    
}
