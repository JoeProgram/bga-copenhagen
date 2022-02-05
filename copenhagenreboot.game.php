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
            "cards_taken_this_turn" => 10,  // keep track of how many cards have been taken this turn. 
            "mermaid_card_id" => 11,
            "total_drawable_cards" => 12,
            "drawn_cards" => 13,            // keep track of total cards drawn this game, for progression purposes
            "coat_of_arms_earned" => 14,
            
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
        self::setGameStateValue( 'drawn_cards', 0 );
        self::setGameStateValue( 'coat_of_arms_earned', 0 );

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

        // CARD COUNTING FOR PROGRESSION SYSTEM - PART 1
        $total_playable_cards = $cards_per_color * count($this->colors);
        if( count($players) > 2 ) $total_playable_cards *= 2;
        $drawable_cards = $total_playable_cards - $this->harbor_number;


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
            $drawable_cards -= $number_of_starting_cards;
        }  

        // CARD COUNTING FOR PROGRESSION SYSTEM - PART 2
        self::setGameStateValue( 'total_drawable_cards', $drawable_cards );

        // CREATE PLAYERBOARDS
        $sql = "INSERT INTO board_cell(owner, x, y) VALUES ";
        foreach( $players as $player_id => $player )
        {
            for( $x = 0; $x < $this->board_width; $x++)
            {
                for( $y = 0; $y < $this->board_height; $y++)
                {
                    $sql .= "($player_id, $x, $y),";
                }
            }
        }  
        $sql = substr($sql, 0, -1) . ";"; // remove the last comma, replace with a semicolon
        self::DbQuery( $sql );

        // CREATE POLYOMINOES
        $sql = "INSERT INTO polyomino(color, squares, copy) VALUES ";
        $values_format_sql = "('%s', %d, %d),";

        // CREATE NORMAL COLOR POLYOMINOES
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

        // CREATE SPECIAL WHITE POLYOMINOES
        for( $i = 1; $i <= $this->white_polyomino_copies; $i++)
        {
            $sql .= "('white', 1, $i),";
        }
        $sql = substr($sql, 0, -1) . ";"; // remove the last comma, replace with a semicolon
        self::DbQuery( $sql );
        
        // CREATE SPECIAL ABILITY TILES
        $sql = "INSERT INTO ability_tile(owner, ability_name, copy) VALUES ";
        foreach($this->special_ability_pile_names as $special_ability_name)
        {
            for( $i = 1; $i <= count($players); $i++)
            {
                $sql .= "(NULL, '$special_ability_name', $i),";
            }
        }

        // CREATE ANY TILE SPECIAL ABILITIES
        //   Each player starts with one
        $index = 1;
        foreach( $players as $player_id => $player )
        {
            $sql .= "($player_id, 'any_cards', $index),";
            $index ++;
        }

        $sql = substr($sql, 0, -1) . ";"; // remove the last comma, replace with a semicolon
        self::DbQuery( $sql );


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
        
        $result['hand_sizes'] = array();
        foreach( $result['players'] as $player_id => $player )
        {
            $result['hand_sizes'][$player_id] = $this->cards->countCardInLocation( 'hand', $player_id );
        }

        $result['hand'] = $this->cards->getCardsInLocation( 'hand', $current_player_id );
        $result['harbor'] = $this->cards->getCardsInLocation( 'harbor' );

        $mermaid_card_id = self::getGameStateValue( 'mermaid_card_id' );
        $result['mermaid_card'] = $this->cards->getCard( $mermaid_card_id )["location"];
        $result['cards_in_deck'] = $this->cards->countCardInLocation("deck");

        $result['playerboards'] = $this->getPlayerboards();

        $sql = "SELECT * FROM polyomino;";
        $result['polyominoes'] = self::getCollectionFromDb( $sql );

        $sql = "SELECT * FROM ability_tile;";
        $result['ability_tiles'] = self::getCollectionFromDb( $sql );

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

        $drawn_cards = self::getGameStateValue( "drawn_cards" );
        $total_drawable_cards = self::getGameStateValue( "total_drawable_cards" );

        return ($drawn_cards * 100.0)/ $total_drawable_cards;
        
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////    

    function getStateName() {
        $state = $this->gamestate->state();
        return $state['name'];
    }

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

    function getPlayerboards()
    {
        $players = self::loadPlayersBasicInfos();

        $playerboards = array();
        foreach( $players as $player_id => $player )
        {
            $playerboards[$player_id] = $this->getPlayerboard( $player_id);
        } 

        return $playerboards;
    }

    function getPlayerboard( $player_id )
    {
        $sql = "SELECT * from board_cell WHERE owner = " . $player_id . " ORDER BY x, y";
        $rows = self::getObjectListFromDB( $sql );

        // turn rows into 2d array
        $playerboard = array();
        foreach( $rows as $row )
        {
            if( !array_key_exists($row["x"], $playerboard) ) $playerboard["x"] = array();
            $playerboard[$row["x"]][$row["y"]] = $row;
        }

        return $playerboard;
    }

    function getTransformedShape( $color, $squares, $flip, $rotation )
    {
        // NOTE: In PHP, array assignment creates a copy of the array, so it's not going to corrupt the original
        $shape = $this->polyomino_shapes["$color-$squares"];

        while( $rotation > 0)
        {
            $shape = $this->rotatePolyominoShape( $shape );
            $rotation -= 90;
        }
        if( $flip == 180) $shape = $this->flipPolyominoShape( $shape );

        return $shape;
    }

    function rotatePolyominoShape( $polyominoShape )
    {
        for( $i = 0; $i < count($polyominoShape); $i++)
        {

            $polyominoShape[$i] = array( 
                "x" => $polyominoShape[$i]["y"], 
                "y" => -$polyominoShape[$i]["x"],
                "fill" => $polyominoShape[$i]["fill"],
            );  
        } 

        return $this->setNewShapeOrigin( $polyominoShape ); 
    }

    function flipPolyominoShape( $polyominoShape )
    {
        for( $i = 0; $i < count($polyominoShape); $i++)
        {

            self::warn("flipPolyominoShape");
            self::warn( json_encode($polyominoShape[$i]));

            $polyominoShape[$i] = array( 
                "x" => -$polyominoShape[$i]["x"], 
                "y" => $polyominoShape[$i]["y"],
                "fill" => $polyominoShape[$i]["fill"],
            );  
        } 

        return $this->setNewShapeOrigin( $polyominoShape ); 
    }

    function setNewShapeOrigin( $polyominoShape )
    {
        $newOrigin = $polyominoShape[0];

        // find the lowest, left-most square
        for( $i = 1; $i < count($polyominoShape); $i++)
        {
            if( 
                $polyominoShape[$i]["y"] < $newOrigin["y"] 
                || ($polyominoShape[$i]["y"] == $newOrigin["y"] && $polyominoShape[$i]["x"] < $newOrigin["x"])
            )
            {
                $newOrigin = $polyominoShape[$i];
            }
        }

        // offset the other cells by so the lowest, left-most square is the origin
        for( $i = 0; $i < count($polyominoShape); $i++) 
        {
            $polyominoShape[$i] = array( 
                "x" => $polyominoShape[$i]["x"] - $newOrigin["x"], 
                "y" => $polyominoShape[$i]["y"] - $newOrigin["y"],
                "fill" => $polyominoShape[$i]["fill"]
            );
        }

        return $polyominoShape;
    }

    function getMinGridCell( $grid_cells )
    {

        $min_grid_cell = $grid_cells[0];

        foreach( $grid_cells as $grid_cell )
        {
            if( $grid_cell["x"] < $min_grid_cell["x"]) $min_grid_cell["x"] = $grid_cell["x"];
            if( $grid_cell["y"] < $min_grid_cell["y"]) $min_grid_cell["y"] = $grid_cell["y"];
        }

        return $min_grid_cell;
    }

    // Apply the shape - which has local coordinates
    // To "boardspace" - and get the list of coordinates the polyomino will be placed on
    function getGridCellsForPolyominoAtCoordinates( $shape, $x, $y )
    {

        $results = array();

        foreach($shape as $grid_cell )
        {

            self::warn("getGridCellsForPolyominoAtCoordinates");
            self::warn( json_encode($shape));

            $results[] = array(
                "x" => $grid_cell["x"] + $x,
                "y" => $grid_cell["y"] + $y,
                "fill" => $grid_cell["fill"],
            );
        }

        return $results;
    }

    function isGroundedPosition( $grid_cells, $playerboard )
    {
        for( $i = 0; $i < count($grid_cells); $i++)
        {
            if( $grid_cells[$i]["y"] == 0 ) return true;

            $cell_below = $playerboard[$grid_cells[$i]["x"]][$grid_cells[$i]["y"] - 1];

            if( $cell_below["fill"] != NULL ) return true;
        }

        return false;
    }

    function isAdjacentToSameColor( $grid_cells, $playerboard, $color )
    {
        for( $i = 0; $i < count($grid_cells); $i++)
        {
            if( $this->isCellAdjacentToSameColor( $grid_cells[$i], $playerboard, $color )) return true;
        }
        return false;
    }

    function isCellAdjacentToSameColor( $grid_cell, $playerboard, $color )
    {
        foreach( $this->adjacent_offsets as $offset)
        {
            $x = $grid_cell["x"] + $offset["x"];
            $y = $grid_cell["y"] + $offset["y"];

            // make sure the cell is valid before checking
            if( $x < 0 || $x >= $this->board_width || $y < 0 || $y >= $this->board_height) continue;

            if( $playerboard[$x][$y]["color"] == $color ) return true;
        }

        return false;
    }

    function getRowPoints( $y, $playerboard)
    {
        $windows_only = true;

        for( $x = 0; $x < $this->board_width; $x++ )
        {
            if( $playerboard[$x][$y]["fill"] == NULL ) return 0;
            else if( $playerboard[$x][$y]["fill"] == "brickwork") $windows_only = false;
        }

        return $windows_only ? 2 : 1;
    }

    function isRowComplete( $y, $playerboard )
    {
        for( $x = 0; $x < $this->board_width; $x++ ) if( $playerboard[$x][$y]["fill"] == NULL ) return false;
        return true;
    }

    function getColumnPoints( $x, $playerboard)
    {

        $windows_only = true;

        for( $y = 0; $y < $this->board_height; $y++ )
        {
            if( $playerboard[$x][$y]["fill"] == NULL ) return 0;
            else if( $playerboard[$x][$y]["fill"] == "brickwork") $windows_only = false;
        }

        return $windows_only ? 4 : 2;
    }

    function calculateTieBreaker()
    {
        $players = self::loadPlayersBasicInfos();

        foreach( $players as $player_id => $player)
        {

            // SQL NOTE - you can't test equality with NULL in SQL with an equals sign.  You have to use "IS NULL" instead of "= NULL", but the equals won't throw an error.
            $empty_cells = self::getObjectListFromDB( "SELECT id FROM board_cell WHERE owner ='$player_id' AND fill IS NULL;");
            $empty_cells_count = -count($empty_cells);
            $this->DbQuery("UPDATE player SET player_score_aux='$empty_cells_count' WHERE player_id='$player_id'");
        }
    }

    // SEE IF ABILITY IS IN LIST
    function checkAbilityIsPossible( $ability_name, $possible_abilities )
    {
        foreach( $possible_abilities as $possible_ability) if( $possible_ability["ability_name"] == $ability_name) return true;
        return false;
    }

    function getValidatedHarborCard( $card_id )
    {
        // MAKE SURE CARD EXISTS
        $card = $this->cards->getCard( $card_id );
        if($card == NULL ) throw new feException( self::_("That card does not exist.")); 

        // MAKE SURE CARD IS IN HARBOR
        if( $card['location'] != 'harbor') throw new feException( self::_("That card is not in the harbor."));

        return $card;
    }

    function givePlayerCard( $player_id, $card_id)
    {
        $this->cards->moveCard( $card_id, "hand", $player_id );

        $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        self::setGameStateValue( 'cards_taken_this_turn', $cards_taken_this_turn + 1 );

        $drawn_cards = self::getGameStateValue( "drawn_cards" );
        self::setGameStateValue( 'drawn_cards', $drawn_cards + 1 );  
    }

    function notifyPlayersOfUsedAbilities( $used_abilities, $player_id, $player_name)
    {
        foreach( $used_abilities as $used_ability)
        {
            self::notifyAllPlayers(
                "usedAbility",
                clienttranslate('${player_name} used ${log_ability_tile}'),
                array(
                    "player_id" => $player_id,
                    "player_name" => $player_name,
                    "log_ability_tile" => $used_ability,
                    "used_ability" => $used_ability,
                )
            );
        }
    }

    function notifyPlayersOfTakenCard( $card_id, $color, $player_id, $player_name)
    {
        self::notifyAllPlayers( 
            "takeCard", 
            clienttranslate('${player_name} takes a ${color} card.'),
            array(
                "card_id" => $card_id,
                "player_id" => $player_id,
                "player_name" => $player_name,
                "color" => $color,
                "hand_size" => $this->cards->countCardInLocation( 'hand', $player_id ),
            )   
        );
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Player actions
//////////// 

    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in copenhagenreboot.action.php)
    */

    function takeCard( $card_id )
    {
        self::checkAction( 'takeCard' );

        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();

        // VALIDATION

        // CAN'T HAVE TAKEN ANY CARDS THIS TURN
        $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        if ($cards_taken_this_turn != 0 ) throw new feException( self::_("You've already taken your first card this turn."));

        $card = $this->getValidatedHarborCard( $card_id );

        // UPDATE DATA
        $this->givePlayerCard( $player_id, $card_id);
        $this->notifyPlayersOfTakenCard( $card_id, $card["type"], $player_id, $player_name );

        $this->gamestate->nextState( "checkHandSize");
    }

    function takeAdjacentCard( $card_id, $is_using_ability_any_cards )
    {
        self::checkAction( 'takeCard' );

        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();

        // VALIDATION
        $card = $this->getValidatedHarborCard( $card_id );

        // MAKE SURE WE ONLY HAVE 1 EMPTY HARBOR
        $empty_harbors = $this->getEmptyHarbors();
        if( count($empty_harbors) > 1 ) throw new feException( self::_("You have more than one empty harbor."));

        // TODO- MAKE SURE CARD IS BESIDE EMPTY HARBOR SLOT

        // IF WE'RE USING A SPECIAL ABILITY, MAKE SURE WE HAVE IT
        //$any_cards_ability_tile = null;
        //if( $is_using_ability_any_cards )
        //{
        //    $any_cards_ability_tile = self::getObjectFromDB( "SELECT * FROM ability_tile WHERE ability_name = 'any_cards' AND owner = $player_id AND used = 0;");
        //    if( $any_cards_ability_tile == null ) throw new feException( self::_("You're trying to use the 'Any cards' ability when you can't."));
        //}

        // MUST HAVE TAKEN 1 CARD ALREADY
        //$cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        //if ($cards_taken_this_turn != 1 ) throw new feException( self::_("You're trying to take your second card before your first."));


        // UPDATE DATA
        $this->givePlayerCard( $player_id, $card_id);


        // USE UP ANY USED ABILITIES
        $used_abilities = [];
        if( $is_using_ability_any_cards )
        {
            self::DbQuery("UPDATE ability_tile SET used = 1 WHERE ability_name = 'any_cards' AND owner = $player_id");
            $used_abilities[] = "any_cards";
        } 
        if( count($used_abilities) > 0) $this->notifyPlayersOfUsedAbilities( $used_abilities, $player_id, $player_name );

        $this->notifyPlayersOfTakenCard( $card_id, $card["type"], $player_id, $player_name );

        $this->gamestate->nextState( "checkHandSize");
    }

    function discardDownToMaxHandSize( $card_id )
    {

        self::checkAction( 'discard' ); 

        $player_id = self::getActivePlayerId();
        $card = $this->cards->getCard( $card_id ); 

        if($card == NULL ) throw new feException( self::_("That card does not exist."));

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
                "color" => $card["type"],
                "hand_size" => $this->cards->countCardInLocation( 'hand', $player_id ),
            )   
        );
        
        // NEXT PHASE
        $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        if( $cards_taken_this_turn == 1 ) $this->gamestate->nextState( "discardedAndTakeAnother");
        else $this->gamestate->nextState( "discardedAndDone");

    }

    function placePolyomino( $color, $squares, $copy, $x, $y, $flip, $rotation )
    {

        self::checkAction( 'placePolyomino' );

        $player_id = self::getActivePlayerId();

        // BASIC INPUT VALIDATION
        if( !in_array($color, $this->polyomino_colors, true)) throw new feException( self::_("The provided color isn't valid."));
        if( $squares < 1 || $squares > 5 ) throw new feException( self::_("The provided shape isn't valid."));
        if( $copy < 1 || $copy > 12 ) throw new feException( self::_("The provided copy name isn't valid."));
        if( $x < 0 || $x >= $this->board_width ) throw new feException( self::_("The provided position isn't valid."));
        if( $y < 0 || $y >= $this->board_height ) throw new feException( self::_("The provided position isn't valid."));
        if( $flip != 0 && $flip != 180 ) throw new feException( self::_("The provided flip isn't valid."));
        if( $rotation != 0 && $rotation != 90 && $rotation != 180 && $rotation != 270) throw new feException( self::_("The provided rotation isn't valid."));

        // GET THE POLYOMINO
        $sql = "SELECT * FROM polyomino WHERE color = '$color' AND squares = $squares AND copy = $copy;"; 
        $polyomino = self::getObjectFromDB( $sql );

        // CHECK THAT IT EXISTS
        if( $polyomino == NULL ) throw new feException( self::_("This facade tile does not exist."));

        // CHECK THAT POLYOMINO IS UNOWNED
        if( $polyomino["owner"] != NULL ) throw new feException( self::_("This facade tile is already owned."));

        $transformed_shape = $this->getTransformedShape( $color, $squares, $flip, $rotation);

        $playerboard = $this->getPlayerboard( $player_id );
        $grid_cells = $this->getGridCellsForPolyominoAtCoordinates( $transformed_shape, $x, $y );


        // CHECK THAT POLYOMINO PLACEMENT IS FULLY ON BOARD
        foreach( $grid_cells as $grid_cell ) 
        {
            if( 
                $grid_cell["x"] < 0 
                || $grid_cell["x"] >= $this->board_width 
                ||  $grid_cell["y"] < 0 
                || $grid_cell["y"] >= $this->board_height
            )
            {
                throw new feException( self::_("That placement would put the facade tile off your board."));
            }
        }

        // CHECK THAT POLYOMINO IS ON EMPTY SPACE
        foreach( $grid_cells as $grid_cell ) 
        {
            if( $playerboard[$grid_cell["x"]][$grid_cell["y"]]["fill"] != NULL )
            {
                throw new feException( self::_("That placement would overlap one of your other facade tiles."));
            }
        }

        // CHECK THAT POLYOMINO IS GROUNDED
        if( !$this->isGroundedPosition($grid_cells, $playerboard)) throw new feException( self::_("The polyomino must sit on the bottom of the facade, or on another facade tile."));

        // CHECK PLAYER CAN AFFORD POLYOMINO

        if( $color == "white")
        {
            if($this->gamestate->state()["name"] != "coatOfArms") throw new feException( self::_("You can only play special facade tiles from a coat of arms action"));
        }
        else
        {
            $cost = $squares;
            if( $this->isAdjacentToSameColor($grid_cells, $playerboard, $color)) $cost -= 1;

            $valid_cards = self::getCollectionFromDb("SELECT card_id FROM card WHERE card_type = '$color' AND card_location = 'hand' AND card_location_arg = $player_id");
            if( count($valid_cards) < $cost )  throw new feException( self::_("You don't have enough cards to place that facade tile in that spot."));
        }



        // PLACE POLYOMINO
        //  Up till now, we've been using the "origin" of the polyomino
        //  But for placement display, we switch to the min bounds point
        $min_grid_cell = $this->getMinGridCell( $grid_cells );
        $min_grid_cell_x = $min_grid_cell["x"];
        $min_grid_cell_y = $min_grid_cell["y"];


        $sql = "UPDATE polyomino SET owner = $player_id, x = $min_grid_cell_x, y = $min_grid_cell_y, flip = $flip, rotation = $rotation WHERE color = '$color' AND squares = $squares AND copy = $copy";
        self::DbQuery(  $sql );

        // UPDATE BOARD CELLS
        foreach( $grid_cells as $grid_cell ) 
        {
            $fill = $grid_cell["fill"];
            $sql = "UPDATE board_cell SET color = '$color', fill = '$fill' WHERE owner = $player_id AND x = $grid_cell[x] AND y = $grid_cell[y] ;";
            self::DbQuery(  $sql );
        }


        // GET NEW, UPDATED COPY OF PLAYERBOARD
        $playerboard = $this->getPlayerboard( $player_id );

        // COAT OF ARMS
        $coat_of_arms_earned = self::getGameStateValue( 'coat_of_arms_earned' );

        // ADD COAT OF ARMS FOR EACH COVERED COAT OF ARMS CELL 
        foreach( $grid_cells as $grid_cell)
        {
            $x = $grid_cell["x"];
            $y = $grid_cell["y"];
            if( in_array( "$x-$y", $this->coat_of_arms_board_cells )) $coat_of_arms_earned += 1;
        }

        // ADD COAT OF ARMS FOR EACH COMPLETED COAT OF ARMS ROW
        $rows = array();
        foreach( $grid_cells as $grid_cell) if( !in_array( $grid_cell["y"],$rows)) $rows[] = $grid_cell["y"];
        foreach( $rows as $row )
        {
            if( 
                in_array( $row, $this->coat_of_arms_board_rows )
                && $this->isRowComplete($row, $playerboard)
            ) 
            {
                $coat_of_arms_earned += 1;
            }
            
        } 

        // REMOVE COAT OF ARMS POINT IF PLACING WHITE TILE
        if( $color == "white" ) $coat_of_arms_earned -= 1;
        
        self::setGameStateValue( 'coat_of_arms_earned', $coat_of_arms_earned );

        // DISCARD CARDS
        $discard_ids = array();
        if( $color != "white")
        {
            $discard_ids = array_keys( $valid_cards );
            $discard_ids = array_slice($discard_ids, 0, $cost);
            
            $this->cards->moveCards( $discard_ids, "discard");
        }
        $discarded_card_count = count($discard_ids);

        // DIFFERENT MESSAGES FOR NORMAL AND WHITE TILES
        $notifyPlayerMessage = clienttranslate('${player_name} discarded ${discarded_card_count} cards and placed ${log_polyomino}.');
        if( $discarded_card_count == 1) $notifyPlayerMessage = clienttranslate('${player_name} discarded ${discarded_card_count} card and placed ${log_polyomino}.');
        else if( $color == "white") $notifyPlayerMessage = clienttranslate('${player_name} placed ${log_polyomino}.');
        

        // NOTIFY CLIENTS
        self::notifyAllPlayers( 
            "placePolyomino", 
            $notifyPlayerMessage,
            array(
                "player_name" => self::getActivePlayerName(),
                "discarded_card_count" => $discarded_card_count, 
                "log_polyomino" => "$color-$squares",

                "player_id" => $player_id,
                "polyomino" => array(
                    "owner" => $player_id,
                    "color" => $color,
                    "squares" => $squares,
                    "copy" => $copy,
                    "x" => $min_grid_cell_x,
                    "y" => $min_grid_cell_y,
                    "flip" => $flip,
                    "rotation" => $rotation,
                ),
                "playerboard" => $playerboard, // get refreshed playerboard after update
                "discards" => $discard_ids,
                "hand_size" => $this->cards->countCardInLocation( 'hand', $player_id ),
            )   
        );


        if( $coat_of_arms_earned > 0 ) $this->gamestate->nextState( "coatOfArms" );
        else $this->gamestate->nextState( "placePolyomino" );

    }

    function takeAbilityTile( $ability_name, $copy)
    {
        
        self::checkAction( 'takeAbilityTile' );

        $player_id = self::getActivePlayerId();

        // MAKE SURE IT EXISTS
        $sql = "SELECT owner FROM ability_tile WHERE ability_name = '$ability_name' AND copy = $copy;";  
        $ability_tile = self::getObjectFromDB( $sql );
        if( $ability_tile == null ) throw new feException( self::_("That ability tile doesn't exist."));

        // MAKE SURE ITS UNOWNED
        if( $ability_tile["owner"] != null ) throw new feException( self::_("That ability tile has already been taken by a player."));

        // MAKE SURE YOU DON'T ALREADY HAVE ONE
        $sql = "SELECT id FROM ability_tile WHERE ability_name = '$ability_name' AND owner = $player_id;";
        $already_owned_tile = self::getObjectFromDB( $sql );
        if( $already_owned_tile != null ) throw new feException( self::_("You already own a special ability tile with that ability."));

        $sql = "UPDATE ability_tile SET owner = $player_id WHERE ability_name = '$ability_name' AND copy = $copy;";
        self::DbQuery( $sql );

        self::notifyAllPlayers( 
            "takeAbilityTile", 
            "Player took an ability tile",
            array(
                "player_name" => self::getActivePlayerName(),
                "player_id" => $player_id,
                "ability_name" => $ability_name,
                "copy" => $copy,
            )   
        );


        // COAT OF ARMS
        $coat_of_arms_earned = self::getGameStateValue( 'coat_of_arms_earned' );
        $coat_of_arms_earned -= 1;
        self::setGameStateValue( 'coat_of_arms_earned', $coat_of_arms_earned );

        if( $coat_of_arms_earned > 0 ) $this->gamestate->nextState( "coatOfArms" );
        else $this->gamestate->nextState( "nextPlayer" );

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

        $this->giveExtraTime($player_id);

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

        if( $this->cards->getCard($mermaid_card_id)["location"] == "harbor")
        {
            // END GAME IF WE DRAW THE MERMAID CARD
            $this->calculateTieBreaker();
            $this->gamestate->nextState("endGame"); 
        } 
        else $this->gamestate->nextState("nextPlayer");
    }

    function stCalculateScore()
    {
        $points = 0;

        $player_id = self::getActivePlayerId();

        $playerboard = $this->getPlayerboard( $player_id );

        for( $x = 0; $x < $this->board_width; $x++) $points += ( $this->getColumnPoints($x, $playerboard));
        for( $y = 0; $y < $this->board_width; $y++) $points += ( $this->getRowPoints($y, $playerboard));

        self::DbQuery( "UPDATE player SET player_score=$points WHERE player_id=$player_id;" );

        self::notifyAllPlayers( 
            "updateScore", 
            "",
            array(
                "score" => $points,
                "player_id" => $player_id,
            )   
        );

        if( $points < $this->end_of_game_points ) $this->gamestate->nextState("nextPlayer");
        else $this->gamestate->nextState("endGame"); 
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
