<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * Copenhagen implementation : © <Joe France> <josephfrance@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 * 
 * copenhagen.action.php
 *
 * Copenhagen main action entry point
 *
 *
 * This file describs all the methods that can be called from the
 * user interface logic (javascript).
 *       
 *
 */
  
  
  class action_copenhagen extends APP_GameAction
  { 

    // Constructor: please do not modify
   	public function __default()
  	{
  	    if( self::isArg( 'notifwindow') )
  	    {
            $this->view = "common_notifwindow";
  	        $this->viewArgs['table'] = self::getArg( "table", AT_posint, true );
  	    }
  	    else
  	    {
            $this->view = "copenhagen_copenhagen";
            self::trace( "Complete reinitialization of board game" );
      }
  	} 
  	
    // PLAYER REQUESTS TO TAKE A CARD - 1st of the turn
    public function takeCard()
    {
        self::setAjaxMode();  

        $card_id = self::getArg( "card_id", AT_posint, true );
        $this->game->takeCard( $card_id );

        self::ajaxResponse(); 
    }

    // PLAYER REQUESTS TO TAKE A CARD - 2nd of the turn
    public function takeAdjacentCard()
    {
        self::setAjaxMode();  

        $card_id = self::getArg( "card_id", AT_posint, true );
        $this->game->takeAdjacentCard( $card_id );

        self::ajaxResponse(); 
    }

    // PLAYER REQUESTS TO TAKE A CARD - USING ADDITIONAL CARD ABILITY
    public function takeAdditionalCard()
    {
        self::setAjaxMode();  

        $card_id = self::getArg( "card_id", AT_posint, true );
        $this->game->takeAdditionalCard( $card_id );

        self::ajaxResponse(); 
    }

    // PLAYER REQUESTS TO DISCARD A CARD
    public function discardDownToMaxHandSize()
    {
        self::setAjaxMode();  

        $card_id = self::getArg( "card_id", AT_posint, true );
        $this->game->discardDownToMaxHandSize( $card_id );

        self::ajaxResponse(); 
    }

    // PLAYER REQUESTS TO PLACE A POLYOMINO
    public function placePolyomino()
    {
        self::setAjaxMode();  

        $color = self::getArg( "color", AT_alphanum, true );
        $squares = self::getArg( "squares", AT_posint, true );
        $copy = self::getArg( "copy", AT_posint, true );
        $x = self::getArg( "x", AT_posint, true );
        $y = self::getArg( "y", AT_posint, true );
        $flip = self::getArg( "flip", AT_posint, true );
        $rotation = self::getArg( "rotation", AT_posint, true );
        $discards = self::getArg( "discards", AT_numberlist, false, "" );

        // transform discards into array
        if( $discards == "") $discards = array();
        else $discards = explode( ",", $discards);

        $this->game->placePolyomino( $color, $squares, $copy, $x, $y, $flip, $rotation, $discards );

        self::ajaxResponse(); 
    }

    // PLAYER REQUESTS TO TAKE AN ABILITY TILE
    public function takeAbilityTile()
    {
        self::setAjaxMode();  

        $ability_name = self::getArg( "ability_name", AT_alphanum, true );
        $copy = $copy = self::getArg( "copy", AT_posint, true );

        $this->game->takeAbilityTile( $ability_name, $copy );

        self::ajaxResponse(); 
    }

    // PLAYER REQUESTS TO ACTIVATE THE "ANY CARDS" ABILITY
    public function activateAbilityAnyCards()
    {
        self::setAjaxMode();  
        $this->game->activateAbilityAnyCards();
        self::ajaxResponse(); 
    }

    // PLAYER REQUESTS TO ACTIVATE THE "ADDITIONAL CARD" ABILITY
    public function activateAbilityAdditionalCard()
    {
        self::setAjaxMode();  
        $this->game->activateAbilityAdditionalCard();
        self::ajaxResponse(); 
    }

    // PLAYER REQUESTS TO ACTIVATE THE "BOTH ACTIONS" ABILITY
    public function activateAbilityBothActions()
    {
        self::setAjaxMode();  
        $this->game->activateAbilityBothActions();
        self::ajaxResponse(); 
    }

    // PLAYER REQUESTS TO ACTIVATE THE "CONSTRUCTION DISCOUNT" ABILITY
    public function activateAbilityConstructionDiscount()
    {
        self::setAjaxMode();  
        $this->game->activateAbilityConstructionDiscount();
        self::ajaxResponse(); 
    }

    // PLAYER REQUESTS TO ACTIVATE THE "CHANGE OF COLORS" ABILITY
    public function activateAbilityChangeOfColors()
    {
        self::setAjaxMode();  

        $from_color = self::getArg( "from_color", AT_enum, true, null, $this->game->colors );
        $to_color = self::getArg( "to_color", AT_enum, true, null, $this->game->colors );

        $this->game->activateAbilityChangeOfColors( $from_color, $to_color );

        self::ajaxResponse(); 
    }

    // PLAYER REQUESTS TO RESET THEIR USED ABILITIES
    public function resetUsedAbilities()
    {
        self::setAjaxMode();  
        $this->game->resetUsedAbilities();
        self::ajaxResponse(); 
    }

    // PLAYER REQUESTS TO UNDO THEIR TURN
    public function undo()
    {
        self::setAjaxMode();  
        $this->game->undo();
        self::ajaxResponse(); 
    }

    // PLAYER CONFIRMS THEIR TURN IS OVER
    public function endTurn()
    {
        self::setAjaxMode();  
        $this->game->endTurn();
        self::ajaxResponse(); 
    }

  }
  

