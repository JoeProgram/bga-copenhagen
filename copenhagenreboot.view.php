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
 * copenhagenreboot.view.php
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

        // TELL THE INTERFACE WHETHER WE'RE SPECTATING OR NOT
        $this->tpl['SPECTATOR'] = "";
        if( $this->game->isSpectator()) $this->tpl['SPECTATOR'] = "copen_spectator";


        // PUT THE PLAYERS IN RELATIVE TURN ORDER, WITH CURRENT PLAYER FIRST
        //  We want the order of the opponent boards to match the order of the players listed in the UI
        //  which means it needs to be customized to each player/
        //  Taking the current player (the one requesting the page), we use getPlayerAfter
        //  to build a dictionary (associative array in PHP) where 0 is the current player
        //  1 is the player after them, 2 the player after them, and so on.
        //  We then use that when building the templates for the playerboards.
        global $g_user;
        $current_player_id = $g_user->get_id();

        // CREATE THE ARRAY OF PLAYERS
        //  It's going to be a little different if the current player is a spectator
        $relative_player_sequence = array();
        $starting_index = 0;
        $prev_player = $this->game->getNextPlayerTable()[0];

        if( !$this->game->isSpectator()){
            $relative_player_sequence[0] = $current_player_id;
            $starting_index = 1;
            $prev_player = $current_player_id;
        }
        
        for( $i = $starting_index; $i < $players_nbr; $i++ ) 
        {
            $relative_player_sequence[$i] = $this->game->getPlayerAfter($prev_player);
            $prev_player = $relative_player_sequence[$i];
        }

        // BUILD PLAYERBOARDS
        $this->page->begin_block( "copenhagenreboot_copenhagenreboot", "opponent_board_cell"); // Nested bock must be declared first
        $this->page->begin_block( "copenhagenreboot_copenhagenreboot", "opponent_playerboard");
        for($i = $starting_index; $i < $players_nbr; $i++ )
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

        $this->game->warn(" BUILDING PERSONAL BOARD     ");
        $this->game->warn(" IS SPECTATOR?" . $this->game->isSpectator());

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
        $this->page->begin_block( "copenhagenreboot_copenhagenreboot", "change_of_colors_option");
        for( $i = 0; $i < 4; $i++ ) $this->page->insert_block( "change_of_colors_option", []);


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
  

