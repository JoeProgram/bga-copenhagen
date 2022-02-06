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
 * copenhagenreboot.view.php
 *
 * This is your "view" file.
 *
 * The method "build_page" below is called each time the game interface is displayed to a player, ie:
 * _ when the game starts
 * _ when a player refreshes the game page (F5)
 *
 * "build_page" method allows you to dynamically modify the HTML generated for the game interface. In
 * particular, you can set here the values of variables elements defined in copenhagenreboot_copenhagenreboot.tpl (elements
 * like {MY_VARIABLE_ELEMENT}), and insert HTML block elements (also defined in your HTML template file)
 *
 * Note: if the HTML of your game interface is always the same, you don't have to place anything here.
 *
 */
  
  require_once( APP_BASE_PATH."view/common/game.view.php" );
  

  class view_copenhagenreboot_copenhagenreboot extends game_view
  {

    function getGameName() {
        return "copenhagenreboot";
    }     

    

  	function build_page( $viewArgs )
  	{		
  	    // Get players & players number
        $players = $this->game->loadPlayersBasicInfos();
        $players_nbr = count( $players );

        /*********** Place your code below:  ************/

        // PUT THE PLAYERS IN RELATIVE TURN ORDER, WITH CURRENT PLAYER FIRST
        //  We want the order of the opponent boards to match the order of the players listed in the UI
        //  which means it needs to be customized to each player/
        //  Taking the current player (the one requesting the page), we use getPlayerAfter
        //  to build a dictionary (associative array in PHP) where 0 is the current player
        //  1 is the player after them, 2 the player after them, and so on.
        //  We then use that when building the templates for the playerboards.
        global $g_user;
        $current_player_id = $g_user->get_id();
        $relative_player_sequence = array();
        $relative_player_sequence[0] = $current_player_id;
        $prev_player = $current_player_id;
        for( $i = 1; $i < $players_nbr; $i++ ) 
        {
            $relative_player_sequence[$i] = $this->game->getPlayerAfter($prev_player);
            $prev_player = $relative_player_sequence[$i];
        }

        // BUILD PLAYERBOARDS
        $this->page->begin_block( "copenhagenreboot_copenhagenreboot", "opponent_board_cell"); // Nested bock must be declared first
        $this->page->begin_block( "copenhagenreboot_copenhagenreboot", "opponent_playerboard");
        for($i = 1; $i < $players_nbr; $i++ )
        {

            $player_id = $relative_player_sequence[$i];
            $player = $players[$player_id];

            // RESET THE BOARD CELLS FROM PREVIOUS CALL, THEN BUILD THEM OUT FOR NEW PLAYER
            $this->page->reset_subblocks( 'opponent_board_cell');
            for( $x = 0; $x < $this->game->board_width; $x++ )
            {
                for( $y = 0; $y < $this->game->board_height ; $y++)
                {
                    $this->page->insert_block( "opponent_board_cell", array(
                        'PLAYER' => $player_id,
                        'X' => $x,
                        'Y' => $y,
                    ));
                }
            }

            $this->page->insert_block( "opponent_playerboard", array(
                'ID' => $player_id,
                'COLOR' => $player["player_color"],
            ));
        }

        // DROP NAME ID
        $this->page->begin_block( "copenhagenreboot_copenhagenreboot", "owned");
        $this->page->insert_block( "owned", array(
            'ID' => $current_player_id,
        ));

        // DROP NAME ID - ABILITY AREA
        $this->page->begin_block( "copenhagenreboot_copenhagenreboot", "owned_ability_tile_area");
        $this->page->insert_block( "owned_ability_tile_area", array(
            'ID' => $current_player_id,
        ));

        // BUILDS CELLS OF PLAYERBOARD
        $this->page->begin_block( "copenhagenreboot_copenhagenreboot", "board_cell");

        for( $x = 0; $x < $this->game->board_width; $x++ )
        {
            for( $y = 0; $y < $this->game->board_height ; $y++)
            {
                $this->page->insert_block( "board_cell", array(
                    'X' => $x,
                    'Y' => $y,
                ));
            }
        }

        // BUILDS COLOR CHANGE OPTIONS
        $this->page->begin_block( "copenhagenreboot_copenhagenreboot", "change_of_color_option");
        for( $i = 0; $i < 4; $i++ ) $this->page->insert_block( "change_of_color_option", []);


        /*
        
        // Examples: set the value of some element defined in your tpl file like this: {MY_VARIABLE_ELEMENT}

        // Display a specific number / string
        $this->tpl['MY_VARIABLE_ELEMENT'] = $number_to_display;

        // Display a string to be translated in all languages: 
        $this->tpl['MY_VARIABLE_ELEMENT'] = self::_("A string to be translated");

        // Display some HTML content of your own:
        $this->tpl['MY_VARIABLE_ELEMENT'] = self::raw( $some_html_code );
        
        */


        /*********** Do not change anything below this line  ************/
  	}
  }
  

