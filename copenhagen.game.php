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
  * copenhagen.game.php
  *
  * This is the main file for the game logic.
  *
  */


/*
 * Debugging Notes to Self:
 *  self::warn($message) is a way to print to the exception log.  Note that when you click "SQL logs", you then have to click over to "exception logs"
 *  json_encode($array) is what you want to print out and debug arrays - not implode().  It handles multiple level arrays, and shows you the keys and values.
 */

require_once( APP_GAMEMODULE_PATH.'module/table/table.game.php' );


class Copenhagen extends Table
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
            "mermaid_card_id" => 11,        // track the id of the mermaid card
            "total_drawable_cards" => 12,   // how many cards can possibly be drawn this game.  Used for progression purposes  
            "drawn_cards" => 13,            // keep track of total cards drawn this game, for progression purposes
            "coat_of_arms_earned" => 14,    // how many coat of arms the current player has earned.  Multiple can be earned at once, and coat of arms can combo into other coat of arms.
            "ability_activated_any_cards" => 15,                // does the player have this ability active?
            "ability_activated_additional_card" => 16,          // does the player have this ability active?
            "ability_activated_construction_discount" => 17,    // does the player have this ability active?
            "ability_activated_change_of_colors" => 18,         // does the player have this ability active?
            "ability_activated_both_actions" => 19,             // does the player have this ability active?
            "change_of_colors_from" => 20,  // Change of colors ability: what color of card is being changed?
            "change_of_colors_to" => 21,    // Change of colors ability: what color are the cards being changed into?
            
            // VARIANTS - not used
            //    "my_first_game_variant" => 100,
            //    "my_second_game_variant" => 101,
        ) );   

        $this->cards = self::getNew( "module.common.deck" );
        $this->cards->init( "card" );

	}
	
    protected function getGameName( )
    {
		// Used for translations and stuff. Please do not modify.
        return "copenhagen";
    }	

    /*
        setupNewGame:
        
        This method is called only once, when a new game is launched.
        This method sets up the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame( $players, $options = array() )
    {    
        
        // Set the colors of the players with HTML color code
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = self::getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
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
        self::setGameStateValue( 'change_of_colors_from', -1 );
        self::setGameStateValue( 'change_of_colors_to', -1 );

        // INITIALIZE GAME STATISTICS
        self::initStat( 'table', "turns", 0 );
        self::initStat( 'table', "how_game_ended", 0 );
        self::initStat( 'player', "coat_of_arms_earned", 0 );
        self::initStat( 'player', "ability_tiles_used", 0 );
        self::initStat( 'player', "squares_covered", 0 );
        self::initStat( 'player', "cards_drawn", 0 );
        self::initStat( 'player', "cards_discarded_too_many", 0 );
        self::initStat( 'player', "facade_tiles_placed", 0 );
        self::initStat( 'player', "brickwork_rows", 0 );
        self::initStat( 'player', "window_rows", 0 );
        self::initStat( 'player', "brickwork_columns", 0 );
        self::initStat( 'player', "window_columns", 0 );
        self::initStat( 'player', "empty_spaces", $this->board_squares );

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

        // PREPARE AND SHUFFLE DECK
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

                // CODE FOR TESTING- GIVE PLAYERS ABILITIES RIGHT AWAY
                //$keys = array_keys( $players);
                //$player_id = $keys[$i - 1];
                //$sql .= "($player_id, '$special_ability_name', $i),";                        
            }
        }



        // CREATE "ANY TILE" SPECIAL ABILITIES
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
    
        $sql = "SELECT player_id id, player_score score FROM player ";
        $result['players'] = self::getCollectionFromDb( $sql );
        
        $result['hand_sizes'] = array();
        foreach( $result['players'] as $player_id => $player )
        {
            $result['hand_sizes'][$player_id] = $this->cards->countCardInLocation( 'hand', $player_id );
        }

        $result['hand'] = $this->cards->getCardsInLocation( 'hand', $current_player_id ); // each player is only sent the exact cards of their specific hand
        $result['harbor'] = $this->cards->getCardsInLocation( 'harbor' );

        $mermaid_card_id = self::getGameStateValue( 'mermaid_card_id' );
        $result['mermaid_card'] = $this->cards->getCard( $mermaid_card_id )["location"];
        $result['cards_in_deck'] = $this->cards->countCardInLocation("deck");

        $result['playerboards'] = $this->getPlayerboards();

        $sql = "SELECT * FROM polyomino;";
        $result['polyominoes'] = self::getCollectionFromDb( $sql );

        $sql = "SELECT * FROM ability_tile;";
        $result['ability_tiles'] = self::getCollectionFromDb( $sql );


        //  ACTIVE PLAYER ONLY 
        $result['activated_abilities'] = array();
        if( self::getActivePlayerId() == $current_player_id)
        {
            if( self::getGameStateValue('ability_activated_any_cards') == 1 ) $result['activated_abilities'][] = "any_cards";
            if( self::getGameStateValue('ability_activated_additional_card') == 1 ) $result['activated_abilities'][] = "additional_card";
            if( self::getGameStateValue('ability_activated_construction_discount') == 1 ) $result['activated_abilities'][] = "construction_discount";
            if( self::getGameStateValue('ability_activated_both_actions') == 1 ) $result['activated_abilities'][] = "both_actions";

            if( self::getGameStateValue('ability_activated_change_of_colors') == 1 )
            {
                $result['activated_abilities'][] = "change_of_colors"; 
                $result['change_of_colors']['from_color'] = $this->colors[self::getGameStateValue('change_of_colors_from')];
                $result['change_of_colors']['to_color'] = $this->colors[self::getGameStateValue('change_of_colors_to')];
            } 

        }


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

    // DIFFERENT PLAYERS GET DIFFERENT CARDS DEPENDING ON THEIR STARTING POSITION AND TOTAL PLAYER COUNT
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

    // WHICH CARDS ARE ADJACENT TO THE HARBOR WHERE A PLAYER JUST TOOK A CARD?
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

    // WHICH OF THE TAKING CARDS STATES SHOULD WE GO TO?
    //  We have 3 different taking card states, since each has slightly different rules and text
    //  Multiple functions need to figure out which one to send the game to next
    function getNextTakeCardsState()
    {
        $player_id = self::getActivePlayerId();

        $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        $is_using_ability_additional_card = self::getGameStateValue( "ability_activated_additional_card" );
        $is_using_ability_both_actions = self::getGameStateValue( "ability_activated_both_actions" );

        $has_additional_card_ability_available = self::getObjectFromDB("SELECT id FROM ability_tile WHERE ability_name = 'additional_card' AND OWNER = $player_id AND used = 0") != null;
        $has_both_actions_ability_available = self::getObjectFromDB("SELECT id FROM ability_tile WHERE ability_name = 'both_actions' AND OWNER = $player_id AND used = 0") != null;

        if( $cards_taken_this_turn == 1 )
        {
            return "takeAdjacentCard";
        }
        else if( $is_using_ability_additional_card && $cards_taken_this_turn == 2)
        {
            return "takeAdditionalCard";
        }
        else if( $is_using_ability_both_actions && $cards_taken_this_turn >= 2 )
        {
            return "placePolyominoAfterTakingCards";
        }
        else if( ($has_additional_card_ability_available || $has_both_actions_ability_available) && $cards_taken_this_turn >= 2)
        {
            return "takeCardsLastCall";
        }
        else return "refillHarbor";        

    }

    // THE DISCARD IS SHUFFLED INTO THE DECK IF THE MERMAID CARD IS OUT, AND THE MERMAID CARD IS PLACED SOMEWHERE IN THE BOTTOM OF THE DECK
    function shuffleDiscardIntoDeck()
    {
        $this->cards->moveAllCardsInLocation( "discard", "deck");
        $this->cards->shuffle( "deck");
        $this->shuffleInMermaidCard();
        
        self::notifyAllPlayers( 
            "shuffleDiscardIntoDeck", 
            clienttranslate('The discard pile has been shuffled into the deck, with the game-ending card somewhere in the bottom 10 cards'),
            array()   
        );
        
    }

    // ADD THE MERMAID CARD TO THE SHUFFLED DECK.  DON'T RESHUFFLE AFTERWARDS
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

    // GET AN ARRAY OF ALL THE PLAYERBOARD DATA
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

    // GET DATA OF A SPECIFIC PLAYERBOARD
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

    // GET THE SHAPE DATA OF A POLYOMINO, WITH POSSIBLE FLIPS AND ROTATION 
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

    // ROTATE THE POLYOMINO SHAPE DATA
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

    // FLIP THE POLYOMINO SHAPE DATA
    function flipPolyominoShape( $polyominoShape )
    {
        for( $i = 0; $i < count($polyominoShape); $i++)
        {

            $polyominoShape[$i] = array( 
                "x" => -$polyominoShape[$i]["x"], 
                "y" => $polyominoShape[$i]["y"],
                "fill" => $polyominoShape[$i]["fill"],
            );  
        } 

        return $this->setNewShapeOrigin( $polyominoShape ); 
    }

    // SET THE ORIGIN OF THE SHAPE DATA AFTER FLIPPING OR ROTATING
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

    // FIND THE LOWER LEFT CORNER OF THE BOUNDING BOX OF A GROUP OF GRID CELLS
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

            $results[] = array(
                "x" => $grid_cell["x"] + $x,
                "y" => $grid_cell["y"] + $y,
                "fill" => $grid_cell["fill"],
            );
        }

        return $results;
    }

    // CHECK IF POLYOMINO IS SUPPORTED, OR IF ITS HOVERING
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

    // CHECK IF SHAPE IS ADJACENT TO A PARTICULAR COLOR ON A PARTICULAR PLAYERBOARD
    function isAdjacentToSameColor( $grid_cells, $playerboard, $color )
    {
        for( $i = 0; $i < count($grid_cells); $i++)
        {
            if( $this->isCellAdjacentToSameColor( $grid_cells[$i], $playerboard, $color )) return true;
        }
        return false;
    }

    // CHECK IF A SINGLE CELL IS ADJACENT TO A PARTICULAR COLOR ON A PARTICULAR PLAYERBOARD
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

    // RETURN HOW MANY POINTS THE PLAYER EARNED FROM A PARTICULAR ROW
    function getRowPoints( $y, $playerboard)
    {
        $windows_only = true;

        for( $x = 0; $x < $this->board_width; $x++ )
        {
            if( $playerboard[$x][$y]["fill"] == NULL ) return 0;
            else if( $playerboard[$x][$y]["fill"] == "brickwork") $windows_only = false;
        }

        $points = $windows_only ? 2 : 1;
        return $points;
    }

    // RETURN IF A ROW IS COMPLETE
    function isRowComplete( $y, $playerboard )
    {
        for( $x = 0; $x < $this->board_width; $x++ ) if( $playerboard[$x][$y]["fill"] == NULL ) return false;
        return true;
    }

    // RETURN HOW MANY POINTS THE PLAYER GOT FOR A PARTICULAR COLUMN
    function getColumnPoints( $x, $playerboard)
    {

        $windows_only = true;

        for( $y = 0; $y < $this->board_height; $y++ )
        {
            if( $playerboard[$x][$y]["fill"] == NULL ) return 0;
            else if( $playerboard[$x][$y]["fill"] == "brickwork") $windows_only = false;
        }

        $points = $windows_only ? 4 : 2;
        return $points;
    }

    // DETERMINE TIE BREAKER - FILLED SQUARES ON BOARD
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

    // GET A CARD FROM THE HARBOR, DOUBLE CHECK THAT IT'S VALID
    function getValidatedHarborCard( $card_id )
    {
        // MAKE SURE CARD EXISTS
        $card = $this->cards->getCard( $card_id );
        if($card == NULL ) throw new feException( self::_("That card does not exist")); 

        // MAKE SURE CARD IS IN HARBOR
        if( $card['location'] != 'harbor') throw new feException( self::_("That card is not in the harbor"));

        return $card;
    }

    // GIVE A CARD TO A PLAYER'S HAND
    function givePlayerCard( $player_id, $card_id)
    {
        $this->cards->moveCard( $card_id, "hand", $player_id );

        $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        self::setGameStateValue( 'cards_taken_this_turn', $cards_taken_this_turn + 1 );

        $drawn_cards = self::getGameStateValue( "drawn_cards" );
        self::setGameStateValue( 'drawn_cards', $drawn_cards + 1 );  

        self::incStat( 1, "cards_drawn", $player_id );
    }

    // GET ALL THE CARDS OF A PARTICULAR COLOR IN A PLAYER'S HAND
    // INCLUDING CARDS THAT HAVE BEEN CHANGED TO THAT COLOR
    function getCardsOfColorInHand( $color )
    {

        $cards = $this->cards->getCardsInLocation("hand", self::getActivePlayerId());

        // SPECIAL ABILITY - CHANGE OF COLORS
        if( self::getGameStateValue("ability_activated_change_of_colors") == 1 )
        {
            $from_color = $this->colors[ self::getGameStateValue("change_of_colors_from") ];
            $to_color = $this->colors[ self::getGameStateValue("change_of_colors_to") ];

            // PHP NOTE:
            //  The default foreach is going to pass by value - so you can't modify on the go
            //  Putting the & in front of the $card here switches it to pass by reference - so modifications will work
            foreach( $cards as $card_id => &$card) if( $card["type"] == $from_color ) $card["type"] = $to_color;
        }

        // PHP NOTE: CLOSURES
        //  anonymous functions don't get access to the enclosing functions variables by default.
        //  you pass them along with the "use" keyword, as below.
        return array_filter( $cards, function($x) use ($color) { return $x['type'] == $color; });
    }

    // TELL THE CLIENT:  A PLAYER TOOK A CARD
    function notifyPlayersOfTakenCard( $card_id, $color, $player_id, $player_name)
    {
        self::notifyAllPlayers( 
            "takeCard", 
            clienttranslate('${player_name} takes a ${color_translated} card'),
            array(
                "i18n" => array( "color_translated" ), // need to call out which parameters will be translated.  Also have do wrap those parameters in clienttranslate() at some point.
                "card_id" => $card_id,
                "player_id" => $player_id,
                "player_name" => $player_name,
                "color" => $color,
                "color_translated" => $this->colors_translated[$color],
                "hand_size" => $this->cards->countCardInLocation( 'hand', $player_id ),
            )   
        );
    }

    // DOUBLE CHECK THAT A PLAYER CAN USE AN ABILITY
    function validateActivatedAbility( $ability_name, $player_id)
    {

        $ability_tile = self::getObjectFromDB( "SELECT * FROM ability_tile WHERE ability_name = '$ability_name' AND owner = $player_id AND used = 0;");
        if( $ability_tile == null ) throw new feException( self::_("You can't activate that special ability"));

        $activated = self::getGameStateValue( "ability_activated_" . $ability_name );
        if( $activated == 1 ) throw new feException( self::_("You've already activated that special ability"));
    }

    // TELL THE CLIENT: PLAYER ACTIVATED AN ABILITY
    function notifyPlayerOfActivatedAbility( $ability_name, $player_id, $player_name)
    {

        $ability_log_name = $this->ability_log_names[$ability_name];

        self::notifyPlayer( 
            $player_id,
            "activateAbility", 
            clienttranslate('${player_name} activates the ${ability_log_name} ability'),
            array(
                "player_name" => $player_name,
                "ability_log_name" => $ability_log_name,

                "player_id" => $player_id,
                "ability_name" => $ability_name,
            )   
        );
    }

    // TELL THE CLIENT: PLAYER USED AN ABILITY
    function notifyPlayersOfUsedAbilities( $used_abilities, $player_id, $player_name)
    {
        foreach( $used_abilities as $used_ability)
        {
            self::notifyAllPlayers(
                "usedAbility",
                clienttranslate('${player_name} uses ${log_ability_tile}'),
                array(
                    "player_id" => $player_id,
                    "player_name" => $player_name,
                    "log_ability_tile" => $used_ability,
                    "used_ability" => $used_ability,
                )
            );
        }
    }

    // CAN THE PLAYER TAKE AT LEAST 1 OF THE 3 COAT OF ARMS ACTIONS?
    function hasValidCoatOfArmsActionToTake()
    {
        $player_id = self::getActivePlayerId();

        // IF THERE ARE WHITE TILES TO TAKE
        $unowned_white_tiles = self::getObjectListFromDB( "SELECT id FROM polyomino WHERE color = 'white' AND owner IS NULL" );
        if( count($unowned_white_tiles) > 0 ) return true;

        // IF THERE ARE ABILITIES THEY DON'T OWN
        $owned_ability_tiles = self::getObjectListFromDB( "SELECT id, used FROM ability_tile WHERE owner = $player_id " );
        if(count($owned_ability_tiles) < 5) return true;

        // IF THEY HAVE USED ABILITIES
        for( $i = 0; $i < count($owned_ability_tiles); $i++)
        {
            if( $owned_ability_tiles[$i]["used"] == 1 ) return true;
        }

        return false;
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Player actions
//////////// 

    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in copenhagen.action.php)
    */

    // THE PLAYER TAKES THE FIRST CARD IN A TURN, WITHOUT ANY MODIFIERS
    function takeCard( $card_id )
    {
        self::checkAction( 'takeCard' );

        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();

        // VALIDATION

        // CAN'T HAVE TAKEN ANY CARDS THIS TURN
        $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        if ($cards_taken_this_turn != 0 ) throw new feException( self::_("You've already taken your first card this turn"));

        $card = $this->getValidatedHarborCard( $card_id );

        // UPDATE DATA
        $this->givePlayerCard( $player_id, $card_id);
        $this->notifyPlayersOfTakenCard( $card_id, $card["type"], $player_id, $player_name );

        $this->gamestate->nextState( "checkHandSize");
    }

    // THE PLAYER TAKES THE SECOND CARD IN A TURN, USUALLY WITH THE ADJACENCY RESTRICTION, UNLESS THERE'S A SPECIAL ABILITY 
    function takeAdjacentCard( $card_id  )
    {
        self::checkAction( 'takeCard' );

        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();

        // VALIDATION
        $card = $this->getValidatedHarborCard( $card_id );

        // MUST HAVE TAKEN 1 CARD ALREADY
        $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        if ($cards_taken_this_turn != 1 ) throw new feException( self::_("You're trying to take your second card before your first"));

        // MAKE SURE WE ONLY HAVE 1 EMPTY HARBOR
        $empty_harbors = $this->getEmptyHarbors();
        if( count($empty_harbors) > 1 ) throw new feException( self::_("You have more than one empty harbor"));

        // TODO- MAKE SURE CARD IS BESIDE EMPTY HARBOR SLOT
        $is_using_ability_any_cards = self::getGameStateValue("ability_activated_any_cards");
        $adjacent_card_ids = $this->getCardIdsAdjacentToEmptyHarbor(); 
        if( !$is_using_ability_any_cards )
        {
            if( !in_array( $card_id, $adjacent_card_ids)) throw new feException( self::_("You have to take an adjacent card"));
        }

        // UPDATE DATA
        $this->givePlayerCard( $player_id, $card_id);


        // USE UP ANY USED ABILITIES
        //  NOTE: We give the player a grace rule
        //  If they have selected the any cards ability, but are taking two adjacent cards
        //  we don't use up that ability
        if( $is_using_ability_any_cards && !in_array( $card_id, $adjacent_card_ids) )
        {
            self::DbQuery("UPDATE ability_tile SET used = 1 WHERE ability_name = 'any_cards' AND owner = $player_id");
            $this->notifyPlayersOfUsedAbilities( ['any_cards'], $player_id, $player_name );
            self::incStat( 1, "ability_tiles_used", $player_id );
        } 

        $this->notifyPlayersOfTakenCard( $card_id, $card["type"], $player_id, $player_name );

        $this->gamestate->nextState( "checkHandSize");
    }

    // THE PLAYER IS TAKING A CARD WITH THE "ADDITIONAL CARD" ABILITY, MEANING THEY CAN TAKE FROM ANYWHERE
    function takeAdditionalCard( $card_id  )
    {
        self::checkAction( 'takeCard' );

        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();

        // VALIDATION
        $card = $this->getValidatedHarborCard( $card_id );

        // MUST HAVE TAKEN 2 CARDS ALREADY
        $cards_taken_this_turn = self::getGameStateValue( "cards_taken_this_turn" );
        if ($cards_taken_this_turn != 2 ) throw new feException( self::_("You're trying to take your third card before your second"));

        // MUST BE USING ADDITIONAL CARD ABILITY
        if( self::getGameStateValue("ability_activated_additional_card") == 0 ) throw new feException( self::_("You must be using the Additional Card ability to take a third card"));
        

        // UPDATE DATA
        $this->givePlayerCard( $player_id, $card_id);


        // USE UP ANY USED ABILITIES
        self::DbQuery("UPDATE ability_tile SET used = 1 WHERE ability_name = 'additional_card' AND owner = $player_id"); 
        $this->notifyPlayersOfUsedAbilities( ["additional_card"], $player_id, $player_name );
        self::incStat( 1, "ability_tiles_used", $player_id );   

        
        $this->notifyPlayersOfTakenCard( $card_id, $card["type"], $player_id, $player_name );

        $this->gamestate->nextState( "checkHandSize");
    }

    // THE PLAYER IS DISCARDING DOWN 
    function discardDownToMaxHandSize( $card_id )
    {

        self::checkAction( 'discard' ); 

        $player_id = self::getActivePlayerId();
        $card = $this->cards->getCard( $card_id ); 

        if($card == NULL ) throw new feException( self::_("That card does not exist."));

        // MAKE SURE CARD IS IN PLAYER'S HAND
        if( $card['location'] != 'hand' && $card['location_arg'] == $player_id) throw new feException( self::_("That card is not in your hand"));

        // MAKE SURE WE'RE ACTUALLY OVER THE HAND LIMIT
        $cardsInHand = $this->cards->countCardInLocation( "hand", $player_id);
        if( $cardsInHand <= $this->max_hand_size ) throw new feException( self::_("You are not over the hand limit size"));

        // DISCARD THE CARD
        $this->cards->moveCard( $card_id, "discard");
        self::incStat(1, "cards_discarded_too_many", $player_id );

        // NOTIFY
        //   Cards are discarded face up, so it's okay to notify all players of the specific card discarded
        self::notifyAllPlayers( 
            "discardDownToMaxHandSize", 
            clienttranslate('${player_name} discards a ${color_translated} card'),
            array(
                "i18n" => array( "color_translated"),
                "player_id" => $player_id,
                "player_name" => self::getActivePlayerName(),
                "card_id" => $card_id,
                "color" => $card["type"],
                "color_translated" => $this->colors_translated[ $card["type"]],
                "hand_size" => $this->cards->countCardInLocation( 'hand', $player_id ),
            )   
        );
        
        
        $this->gamestate->nextState( $this->getNextTakeCardsState() );

    }

    // THE PLAYER IS PLACING A POLYOMINO ON THEIR BOARD
    function placePolyomino( $color, $squares, $copy, $x, $y, $flip, $rotation, $discards )
    {

        self::checkAction( 'placePolyomino' );

        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();

        // BASIC INPUT VALIDATION
        if( !in_array($color, $this->polyomino_colors, true)) throw new feException( self::_("The provided color isn't valid"));
        if( $squares < 1 || $squares > 5 ) throw new feException( self::_("The provided shape isn't valid"));
        if( $copy < 1 || $copy > 12 ) throw new feException( self::_("The provided copy name isn't valid"));
        if( $x < 0 || $x >= $this->board_width ) throw new feException( self::_("The provided position isn't valid"));
        if( $y < 0 || $y >= $this->board_height ) throw new feException( self::_("The provided position isn't valid"));
        if( $flip != 0 && $flip != 180 ) throw new feException( self::_("The provided flip isn't valid"));
        if( $rotation != 0 && $rotation != 90 && $rotation != 180 && $rotation != 270) throw new feException( self::_("The provided rotation isn't valid"));

        // GET THE POLYOMINO
        $sql = "SELECT * FROM polyomino WHERE color = '$color' AND squares = $squares AND copy = $copy;"; 
        $polyomino = self::getObjectFromDB( $sql );

        // CHECK THAT IT EXISTS
        if( $polyomino == NULL ) throw new feException( self::_("This facade tile does not exist"));

        // CHECK THAT POLYOMINO IS UNOWNED
        if( $polyomino["owner"] != NULL ) throw new feException( self::_("This facade tile is already owned"));

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
                throw new feException( self::_("That placement would put the facade tile off your board"));
            }
        }

        // CHECK THAT POLYOMINO IS ON EMPTY SPACE
        foreach( $grid_cells as $grid_cell ) 
        {
            if( $playerboard[$grid_cell["x"]][$grid_cell["y"]]["fill"] != NULL )
            {
                throw new feException( self::_("That placement would overlap one of your other facade tiles"));
            }
        }

        // CHECK THAT POLYOMINO IS GROUNDED
        if( !$this->isGroundedPosition($grid_cells, $playerboard)) throw new feException( self::_("The polyomino must sit on the bottom of the facade, or on another facade tile"));

        // CHECK PLAYER CAN AFFORD POLYOMINO
        $is_adjacent_to_same_color = false;
        if( $color == "white")
        {
            if($this->gamestate->state()["name"] != "coatOfArms") throw new feException( self::_("You can only play special facade tiles from a coat of arms action"));
        }
        else
        {
            $cost = $squares;
            if( $this->isAdjacentToSameColor($grid_cells, $playerboard, $color))
            {
                $is_adjacent_to_same_color = true;
                $cost -= 1;
            }
            if( self::getGameStateValue("ability_activated_construction_discount") == 1 ) $cost -= 1;

            $valid_cards = $this->getCardsOfColorInHand( $color );
            if( count($valid_cards) < $cost )  throw new feException( self::_("You don't have enough cards to place that facade tile in that spot"));

            // (OPTIONAL) CHECK DISCARDS ARE VALID
            $manual_discard_count = count($discards); 
            if( $manual_discard_count > 0)
            {
                // MAKE SURE THE DISCARDS MATCH THE COST
                if( $manual_discard_count != $cost )  throw new feException( self::_("You are trying to discard the wrong number of cards"));

                // MAKE SURE EACH NUMBER IS UNIQUE - NO DUPLICATES
                if( $manual_discard_count != count(array_unique( $discards )))  throw new feException( self::_("You can't discard the same card twice"));

                // MAKE SURE EACH DISCARDED CARD IS VALID
                foreach( $discards as $discard ) if( !array_key_exists( $discard, $valid_cards)) throw new feException( self::_("You are trying to discard an invalid card to play that facade tile"));
            }
        }



        // PLACE POLYOMINO
        //  Up till now, we've been using the "origin" of the polyomino
        //  But for placement display, we switch to the min bounds point
        $min_grid_cell = $this->getMinGridCell( $grid_cells );
        $min_grid_cell_x = $min_grid_cell["x"];
        $min_grid_cell_y = $min_grid_cell["y"];


        $sql = "UPDATE polyomino SET owner = $player_id, x = $min_grid_cell_x, y = $min_grid_cell_y, flip = $flip, rotation = $rotation WHERE color = '$color' AND squares = $squares AND copy = $copy";
        self::DbQuery(  $sql );
        self::incStat( 1, "facade_tiles_placed", $player_id );

        // UPDATE BOARD CELLS
        foreach( $grid_cells as $grid_cell ) 
        {
            $fill = $grid_cell["fill"];
            $sql = "UPDATE board_cell SET color = '$color', fill = '$fill' WHERE owner = $player_id AND x = $grid_cell[x] AND y = $grid_cell[y] ;";
            self::DbQuery(  $sql );
        }
        
        // UPDATE STATISTICS FOR GRID CELLS
        $grid_cell_count = count($grid_cells);
        self::incStat( $grid_cell_count, "squares_covered", $player_id );
        
        $squares_covered = self::getStat("squares_covered", $player_id );
        $empty_squares = $this->board_squares - $squares_covered;
        self::setStat( $empty_squares, "empty_spaces", $player_id );

        // GET NEW, UPDATED COPY OF PLAYERBOARD
        $playerboard = $this->getPlayerboard( $player_id );

        // COAT OF ARMS
        $coat_of_arms_ids = [];
        $coat_of_arms_earned = self::getGameStateValue( 'coat_of_arms_earned' );

        // ADD COAT OF ARMS FOR EACH COVERED COAT OF ARMS CELL 
        foreach( $grid_cells as $grid_cell)
        {
            $x = $grid_cell["x"];
            $y = $grid_cell["y"];
            if( in_array( "$x-$y", $this->coat_of_arms_board_cells ))
            { 
                $coat_of_arms_ids[] = array_search("$x-$y",  $this->coat_of_arms_board_cells ) + 1;
                $coat_of_arms_earned += 1;
                self::incStat( 1, "coat_of_arms_earned", $player_id );
            }
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
                $coat_of_arms_ids[] = array_search($row, $this->coat_of_arms_board_rows) + 1 + count($this->coat_of_arms_board_cells );
                $coat_of_arms_earned += 1;
                self::incStat( 1, "coat_of_arms_earned", $player_id );
            }
        } 

        // REMOVE COAT OF ARMS POINT IF PLACING WHITE TILE
        if( $color == "white" ) $coat_of_arms_earned -= 1;
        
        self::setGameStateValue( 'coat_of_arms_earned', $coat_of_arms_earned );

        // DISCARD CARDS
        $discard_ids = array();
        if( $color != "white")
        {
            // IF PLAYER HAS SPECIFIED DISCARDS, USE THOSE
            if( count($discards) > 0 )
            {
                $discard_ids = $discards;
            }
            // OTHERWISE, PICK FOR THEM
            else
            {
                $discard_ids = array_keys( $valid_cards );
                $discard_ids = array_slice($discard_ids, 0, $cost);    
            }
            
            $this->cards->moveCards( $discard_ids, "discard");
        }
        $discarded_card_count = count($discard_ids);

        // DIFFERENT MESSAGES FOR NORMAL AND WHITE TILES
        $notify_player_message = clienttranslate('${player_name} discards ${discarded_card_count} card(s) and places ${log_polyomino}');
        if( $is_adjacent_to_same_color ) $notify_player_message =  clienttranslate( '${player_name} discards ${discarded_card_count} card(s) and places ${log_polyomino} They discarded 1 less card because it\'s touching a tile of the same color.'); // NOTE: I would love not to repeat the text here, but couldn't figure out how to get it to translate otherwise.
        
        if( $color == "white") $notify_player_message = clienttranslate('${player_name} places ${log_polyomino}');
        
        // USE UP ANY ACTIVATED ABILITIES
        if( self::getGameStateValue("ability_activated_construction_discount") == 1)
        {
            self::DbQuery("UPDATE ability_tile SET used = 1 WHERE ability_name = 'construction_discount' AND owner = $player_id"); 
            $this->notifyPlayersOfUsedAbilities( ["construction_discount"], $player_id, $player_name);
            self::incStat( 1, "ability_tiles_used", $player_id );
        }

        if( self::getGameStateValue("ability_activated_change_of_colors") == 1)
        {
            self::DbQuery("UPDATE ability_tile SET used = 1 WHERE ability_name = 'change_of_colors' AND owner = $player_id"); 
            $this->notifyPlayersOfUsedAbilities( ["change_of_colors"], $player_id, $player_name);
            self::incStat( 1, "ability_tiles_used", $player_id );
        }

        // NOTIFY CLIENTS
        self::notifyAllPlayers( 
            "placePolyomino", 
            $notify_player_message,
            array(
                "player_name" => $player_name,
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
                "coat_of_arms_ids" => $coat_of_arms_ids,
                "hand_size" => $this->cards->countCardInLocation( 'hand', $player_id ),
            )   
        );


        $this->gamestate->nextState( "calculateScore" );

    }

    // THE PLAYER IS TAKING AN ABILITY TILE
    function takeAbilityTile( $ability_name, $copy)
    {
        
        self::checkAction( 'takeAbilityTile' );

        $player_id = self::getActivePlayerId();

        // MAKE SURE IT EXISTS
        $sql = "SELECT owner FROM ability_tile WHERE ability_name = '$ability_name' AND copy = $copy;";  
        $ability_tile = self::getObjectFromDB( $sql );
        if( $ability_tile == null ) throw new feException( self::_("That ability tile doesn't exist"));

        // MAKE SURE ITS UNOWNED
        if( $ability_tile["owner"] != null ) throw new feException( self::_("That ability tile has already been taken by a player"));

        // MAKE SURE YOU DON'T ALREADY HAVE ONE
        $sql = "SELECT id FROM ability_tile WHERE ability_name = '$ability_name' AND owner = $player_id;";
        $already_owned_tile = self::getObjectFromDB( $sql );
        if( $already_owned_tile != null ) throw new feException( self::_("You already own a special ability tile with that ability"));

        $sql = "UPDATE ability_tile SET owner = $player_id WHERE ability_name = '$ability_name' AND copy = $copy;";
        self::DbQuery( $sql );

        self::notifyAllPlayers( 
            "takeAbilityTile", 
            clienttranslate('${player_name} takes an ability tile'),
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
        else $this->gamestate->nextState( "calculateScore" );

    }

    // THE PLAYER IS REFRESHING THEIR USED ABILITIES
    function resetUsedAbilities()
    {

        self::checkAction( 'resetUsedAbilities' );

        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();

        self::DbQuery("UPDATE ability_tile SET used = 0 WHERE owner = $player_id");

        self::notifyAllPlayers( 
            "resetUsedAbilities", 
            clienttranslate('${player_name} flips over their used ability tiles'),
            array(
                "player_name" => $player_name,
                "player_id" => $player_id,
            )   
        );

        // RESET FLAGS THAT MARK ABILITIES AS ACTIVE
        self::setGameStateValue( 'ability_activated_any_cards', 0 );
        self::setGameStateValue( 'ability_activated_additional_card', 0 );
        self::setGameStateValue( 'ability_activated_construction_discount', 0 );
        self::setGameStateValue( 'ability_activated_change_of_colors', 0 );
        self::setGameStateValue( 'ability_activated_both_actions', 0 );
        
        // COAT OF ARMS
        $coat_of_arms_earned = self::getGameStateValue( 'coat_of_arms_earned' );
        $coat_of_arms_earned -= 1;
        self::setGameStateValue( 'coat_of_arms_earned', $coat_of_arms_earned );

        if( $coat_of_arms_earned > 0 ) $this->gamestate->nextState( "coatOfArms" );
        else $this->gamestate->nextState( "calculateScore" );
    }


    // THE PLAYER TURNED ON THE ABILITY "ANY CARDS"
    function activateAbilityAnyCards()
    {

        self::checkAction( 'activateAbilityAnyCards' );

        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();

        // VALIDATION
        $this->validateActivatedAbility( "any_cards", $player_id);

        // UPDATE DATA
        self::setGameStateValue( 'ability_activated_any_cards', 1 );

        // NOTIFICATION
        $this->notifyPlayerOfActivatedAbility("any_cards", $player_id, $player_name);
    }

    // THE PLAYER TURNED ON THE ABILITY "ADDITIONAL CARD"
    function activateAbilityAdditionalCard()
    {

        self::checkAction( 'activateAbilityAdditionalCard' );

        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();

        // VALIDATION
        $this->validateActivatedAbility( "additional_card", $player_id);

        // UPDATE DATA
        self::setGameStateValue( 'ability_activated_additional_card', 1 );

        // NOTIFICATION
        $this->notifyPlayerOfActivatedAbility("additional_card", $player_id, $player_name);

        // SPECIAL - if we're in last call, change state to use the ability right away
        if( $this->getStateName() == "takeCardsLastCall") $this->gamestate->nextState( "takeAdditionalCard" );

    }

    // THE PLAYER TURNED ON THE ABILITY "BOTH ACTIONS"
    function activateAbilityBothActions()
    {

        self::checkAction( 'activateAbilityBothActions' );

        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();

        // VALIDATION
        $this->validateActivatedAbility( "both_actions", $player_id);

        // UPDATE DATA
        self::setGameStateValue( 'ability_activated_both_actions', 1 );

        // NOTIFICATION
        $this->notifyPlayerOfActivatedAbility("both_actions", $player_id, $player_name);

        // SPECIAL - if we're in last call, change state to use the ability right away
        if( $this->getStateName() == "takeCardsLastCall") $this->gamestate->nextState( "placePolyominoAfterTakingCards" );

    }

    // THE PLAYER TURNED ON THE ABILITY "CONSTRUCTION DISCOUNT"
    function activateAbilityConstructionDiscount()
    {

        self::checkAction( 'activateAbilityConstructionDiscount' );

        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();

        // VALIDATION
        $this->validateActivatedAbility( "construction_discount", $player_id);

        // UPDATE DATA
        self::setGameStateValue( 'ability_activated_construction_discount', 1 );

        // NOTIFICATION
        $this->notifyPlayerOfActivatedAbility( "construction_discount", $player_id, $player_name);
        
    }

    // THE PLAYER TURNED ON THE ABILITY "CHANGE OF COLORS"
    function activateAbilityChangeOfColors($from_color, $to_color)
    {

        self::checkAction( 'activateAbilityChangeOfColors' );

        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();

        // VALIDATION
        $this->validateActivatedAbility( "change_of_colors", $player_id);

        // UPDATE DATA
        self::setGameStateValue( 'ability_activated_change_of_colors', 1 );

        // HAVE SERVER SAVE COLORS
        //   have to save them as integers
        self::setGameStateValue( 'change_of_colors_from', array_search( $from_color, $this->colors) );
        self::setGameStateValue( 'change_of_colors_to', array_search( $to_color, $this->colors) );

        // NOTIFICATION
       $ability_log_name = $this->ability_log_names['change_of_colors'];
        self::notifyPlayer( 
            $player_id, 
            "activateAbilityChangeOfColors", 
            clienttranslate('${player_name} is using the ${ability_log_name} ability to change ${from_color_translated} cards to ${to_color_translated}'),
            array(
                "i18n" => array( "from_color_translated","to_color_translated" ),
                "player_name" => $player_name,
                "ability_log_name" => $ability_log_name,
                "from_color" => $from_color,
                "to_color" => $to_color,
                "from_color_translated" => $this->colors_translated[$from_color],
                "to_color_translated" => $this->colors_translated[$to_color],
                "player_id" => $player_id,
                "ability_name" => 'change_of_colors',
            )   
        );
        
    }

    // THE PLAYER REQUESTED TO UNDO THEIR TURN
    function undo()
    {
        self::checkAction("undo");
        $this->undoRestorePoint();
        $this->gamestate->reloadState();
    }

    // THE PLAYER CONFIRMED THEIR TURN WAS AT AN END
    function endTurn()
    {
        self::checkAction( 'endTurn' );
        $this->gamestate->nextState( "refillHarbor" );
    }
    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        These methods define "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */

    // TELL THE CLIENT WHAT CARDS ARE ADJACENT, AND VALID TO TAKE
    function argTakeAdjacentCard()
    {
        return array(
            "adjacent_card_ids" => $this->getCardIdsAdjacentToEmptyHarbor(),
            "ability_activated_any_cards" => self::getGameStateValue("ability_activated_any_cards"),
        );
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    // EACH TIME ITS A NEW PLAYER'S TURN
    function stNextPlayer()
    {

        $player_id = self::activeNextPlayer(); // this sets the turn to the next player

        $this->giveExtraTime($player_id);

        // RESET ALL VALUES USED JUST WITHIN A TURN
        self::setGameStateValue( 'cards_taken_this_turn', 0 );
        self::setGameStateValue( 'coat_of_arms_earned', 0 );
        self::setGameStateValue( 'ability_activated_any_cards', 0 );
        self::setGameStateValue( 'ability_activated_additional_card', 0 );
        self::setGameStateValue( 'ability_activated_construction_discount', 0 );
        self::setGameStateValue( 'ability_activated_change_of_colors', 0 );
        self::setGameStateValue( 'ability_activated_both_actions', 0 );
        self::setGameStateValue( 'change_of_colors_from', -1 );
        self::setGameStateValue( 'change_of_colors_to', -1 );

        self::incStat( 1, "turns");

        $this->undoSavepoint();

        $this->gamestate->nextState("playerTurn");
    }

    // CHECK THAT THE PLAYER DIDN'T EXCEED THE MAX HAND SIZE
    function stCheckHandSize()
    {
        $player_id = self::getActivePlayerId();

        $cards_in_hand = $this->cards->countCardInLocation( "hand", $player_id);

        // PLAYER HAS TOO MANY CARDS
        if( $cards_in_hand > $this->max_hand_size )
        {
            $this->gamestate->nextState("discardDownToMaxHandSize");
            return;  
        } 

        // PLAYER DOESN'T HAVE TOO MANY CARDS

        $state_name = $this->getNextTakeCardsState();
        $this->gamestate->nextState( $state_name );        
    }

    // USE UP THE SPECIAL ABILITY TILE
    //   even though this is a player action, we can use an "st" action to 
    //   prepare the data for the player's turn - in this case using up the special action tile.
    function stPlacePolyominoAfterTakingCards()
    {
        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();

        $used_abilities = ["both_actions"];
        self::DbQuery("UPDATE ability_tile SET used = 1 WHERE ability_name = 'both_actions' AND owner = $player_id"); 
        $this->notifyPlayersOfUsedAbilities( $used_abilities, $player_id, $player_name );
        self::incStat( 1, "ability_tiles_used", $player_id );
    }


    // REFILL THE HARBOR WITH NEW CARDS
    function stRefillHarbor()
    {

        $cards = [];
        $mermaid_card_id = self::getGameStateValue( "mermaid_card_id" );

        for( $i = 0; $i < $this->harbor_number; $i ++)
        {
            if( $this->cards->countCardInLocation("harbor", $i) == 0 )
            {

                // prepare deck
                if( $this->cards->countCardInLocation("deck") == 0 ) $this->shuffleDiscardIntoDeck();
                $card = $this->cards->pickCardForLocation('deck', 'harbor', $i);
                $cards[] = $card;

                // IF WE'VE DRAWN THE MERMAID CARD, STOP DRAWING CARDS
                if( $card['id'] == $mermaid_card_id ) break;
            }            
        }

        // NOTIFY CLIENTS
        
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

            self::setStat( 2, "how_game_ended" );

            $this->gamestate->nextState("endGame"); 
        } 
        else
        {
            $this->gamestate->nextState("nextPlayer");
        } 
    }

    // CALCULATE THE SCORE OF THE ACTIVE PLAYER
    function stCalculateScore()
    {
        $player_id = self::getActivePlayerId();
        $player_name = self::getActivePlayerName();
        
        $player = self::getObjectFromDB( "SELECT * FROM player WHERE player_id=$player_id");
        $previous_points = $player['player_score'];

        $points = 0;

        $playerboard = $this->getPlayerboard( $player_id );

        
        // ROW AND COLUMN STATS
        $brickwork_column_points = 0;
        $window_column_points = 0;
        $brickwork_row_points = 0;
        $window_row_points = 0;
        
        // COUNT UP COMPLETED ROWS AND COLUMNS
        for( $x = 0; $x < $this->board_width; $x++)
        {
            $column_points = $this->getColumnPoints($x, $playerboard);
            
            if( $column_points == $this->window_column_value) $window_column_points += $column_points;
            else $brickwork_column_points += $column_points;
            
            $points += $column_points;
        }
        for( $y = 0; $y < $this->board_height; $y++)
        {
            $row_points = ( $this->getRowPoints($y, $playerboard));
            
            if( $row_points == $this->window_row_value) $window_row_points += $row_points;
            else $brickwork_row_points += $row_points;
            
            $points += $row_points;
        }

        // UPDATE DATABASE AND NOTIFY, IF NEEDED
        if( $points != $previous_points )
        {

            $point_difference = $points - $previous_points;

            self::DbQuery( "UPDATE player SET player_score=$points WHERE player_id=$player_id;" );

            self::notifyAllPlayers( 
                "updateScore", 
                clienttranslate('${player_name} earns ${point_difference} point(s)'),
                array(
                    "score" => $points,
                    "player_id" => $player_id,

                    "player_name" => $player_name,
                    "point_difference" => $point_difference,
                )   
            );
            
            // UPDATE ROW AND COLUMN STATISTICS
            self::setStat( $brickwork_column_points, "brickwork_columns", $player_id);
            self::setStat( $window_column_points, "window_columns", $player_id);
            self::setStat( $brickwork_row_points, "brickwork_rows", $player_id);
            self::setStat( $window_row_points, "window_rows", $player_id);
            
        }

        // CHECK IF THEY CROSSED THE ENDGAME SCORE THRESHOLD
        if( $points >= $this->end_of_game_points )
        {
            self::setStat( 1, "how_game_ended" );
            $this->gamestate->nextState("endGame"); 
        }
        else if( self::getGameStateValue( 'coat_of_arms_earned' ) > 0 )
        { 
            $this->gamestate->nextState("coatOfArms"); 
        }
        else
        {
             $this->gamestate->nextState("refillHarbor");
        }
    }

    // PLAYER IS GOING TO CLAIM A COAT OF ARMS BONUS
    function stCoatOfArms()
    {

        // MAKE SURE THE PLAYER HAS A VALID MOVE
        //  in rare circumstances, the player may not be able to do any of the 3 coat of arm actions
        //  in that case, we just skip it
        if( ! $this->hasValidCoatOfArmsActionToTake())
        {

            $player_id = self::getActivePlayerId();
            $player_name = self::getActivePlayerName();

            self::notifyAllPlayers( 
                "skippingCoatOfArms", 
                clienttranslate('Skipping ${player_name}\'s coat of arms action, as they can\'t do any of the 3 actions.'  ), 
                array(
                    "player_id" => $player_id,
                    "player_name" => $player_name,
                )   
            );

            $this->gamestate->nextState("refillHarbor");
        }
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
    	
        if ($state['type'] === "activeplayer"){

            $this->gamestate->nextState( "zombiePass" );
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
