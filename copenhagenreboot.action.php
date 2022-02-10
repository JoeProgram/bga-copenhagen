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
 * copenhagenreboot.action.php
 *
 * CopenhagenReboot main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *       
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/copenhagenreboot/copenhagenreboot/myAction.html", ...)
 *
 */
  
  
  class action_copenhagenreboot extends APP_GameAction
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
            $this->view = "copenhagenreboot_copenhagenreboot";
            self::trace( "Complete reinitialization of board game" );
      }
  	} 
  	
  	// TODO: define your action entry points there

    public function takeCard()
    {
        self::setAjaxMode();  

        $card_id = self::getArg( "card_id", AT_posint, true );
        $this->game->takeCard( $card_id );

        self::ajaxResponse(); 
    }

    public function takeAdjacentCard()
    {
        self::setAjaxMode();  

        $card_id = self::getArg( "card_id", AT_posint, true );
        $this->game->takeAdjacentCard( $card_id );

        self::ajaxResponse(); 
    }

    public function takeAdditionalCard()
    {
        self::setAjaxMode();  

        $card_id = self::getArg( "card_id", AT_posint, true );
        $this->game->takeAdditionalCard( $card_id );

        self::ajaxResponse(); 
    }

    public function discardDownToMaxHandSize()
    {
        self::setAjaxMode();  

        $card_id = self::getArg( "card_id", AT_posint, true );
        $this->game->discardDownToMaxHandSize( $card_id );

        self::ajaxResponse(); 
    }

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

    public function takeAbilityTile()
    {
        self::setAjaxMode();  

        $ability_name = self::getArg( "ability_name", AT_alphanum, true );
        $copy = $copy = self::getArg( "copy", AT_posint, true );

        $this->game->takeAbilityTile( $ability_name, $copy );

        self::ajaxResponse(); 
    }

    public function activateAbilityAnyCards()
    {
        self::setAjaxMode();  
        $this->game->activateAbilityAnyCards();
        self::ajaxResponse(); 
    }

    public function activateAbilityAdditionalCard()
    {
        self::setAjaxMode();  
        $this->game->activateAbilityAdditionalCard();
        self::ajaxResponse(); 
    }

    public function activateAbilityBothActions()
    {
        self::setAjaxMode();  
        $this->game->activateAbilityBothActions();
        self::ajaxResponse(); 
    }

    public function activateAbilityConstructionDiscount()
    {
        self::setAjaxMode();  
        $this->game->activateAbilityConstructionDiscount();
        self::ajaxResponse(); 
    }

    public function activateAbilityChangeOfColors()
    {
        self::setAjaxMode();  

        $from_color = self::getArg( "from_color", AT_enum, true, null, $this->game->colors );
        $to_color = self::getArg( "to_color", AT_enum, true, null, $this->game->colors );

        $this->game->activateAbilityChangeOfColors( $from_color, $to_color );

        self::ajaxResponse(); 
    }

    public function resetUsedAbilities()
    {
        self::setAjaxMode();  
        $this->game->resetUsedAbilities();
        self::ajaxResponse(); 
    }

    public function endTurn()
    {
        self::setAjaxMode();  
        $this->game->endTurn();
        self::ajaxResponse(); 
    }

  }
  

