
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * Copenhagen implementation : © <Joe France> <josephfrance@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * copenhagen.js
 *
 * Copenhagen user interface script
 * 
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */


define([
    "dojo",
    //"dojox.fx.ext-dojo.complex",
    "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter"
],
function (dojo, declare) {
    return declare("bgagame.copenhagen", ebg.core.gamegui, {
        constructor: function(){
            // console.log('copenhagen constructor');
              
            // Here, you can init the global variables of your user interface
            // Example:
            // this.myGlobalValue = 0;

            this.boardWidth = 5;
            this.boardHeight = 9;
            this.playerboard = [];

            this.cellMeasurement = 34;
            this.cardWidth = 66;
            this.cardSplayDistance = 24;
            this.cardsRemainingWarningThreshold = 14;
            this.maxHandSize = 7;
            this.maxHandSizeDiscardHandlers = []; // keep track of the events we attach to cards to allow the player to discard - since we'll want to disconnect them afterwards

            this.stateName = "";

            this.cardColorOrder = ["copen_red_card", "copen_yellow_card", "copen_green_card", "copen_blue_card", "copen_purple_card"];
            this.adjacentOffsets = [{x:1,y:0}, {x:0,y:-1}, {x:-1,y:0}, {x:0,y:1}];

            this.whitePolyominosPerStack = 3;
            this.mermaidCardWarningThreshold = 10;
            this.mermaidCardWarningAnimation = null;

            // keys in the log that we do custom pre-processing on
            this.preprocess_string_keys = [
                'log_polyomino', 
                'log_ability_tile',
            ]; 

            this.polyominoShapes = {
                "purple-2":[{x:0,y:0},{x:1,y:0}],
                "purple-3":[{x:0,y:0},{x:1,y:0},{x:2,y:0}],
                "purple-4":[{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}],
                "purple-5":[{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0},{x:4,y:0}],

                "green-2":[{x:0,y:0},{x:1,y:0}],
                "green-3":[{x:0,y:0},{x:1,y:0},{x:2,y:0}],
                "green-4":[{x:0,y:0},{x:-1,y:1},{x:0,y:1},{x:1,y:1}],
                "green-5":[{x:0,y:0},{x:-1,y:1},{x:0,y:1},{x:1,y:1},{x:0,y:2}],

                "red-2":[{x:0,y:0},{x:1,y:0}],
                "red-3":[{x:0,y:0},{x:0,y:1},{x:1,y:1}],
                "red-4":[{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}],
                "red-5":[{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:1,y:1},{x:2,y:1}],

                "blue-2":[{x:0,y:0},{x:1,y:0}],
                "blue-3":[{x:0,y:0},{x:0,y:1},{x:1,y:1}],
                "blue-4":[{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:2,y:1}],
                "blue-5":[{x:0,y:0},{x:-2,y:1},{x:-1,y:1},{x:0,y:1},{x:0,y:2}],

                "yellow-2":[{x:0,y:0},{x:1,y:0}],
                "yellow-3":[{x:0,y:0},{x:0,y:1},{x:1,y:1}],
                "yellow-4":[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:2,y:1}],
                "yellow-5":[{x:0,y:0},{x:-2,y:1},{x:-1,y:1},{x:0,y:1},{x:-2,y:2}],

                "white-1":[{x:0,y:0}],
            };

            this.selectedPolyomino = null;
            this.selectPolyominoEventHandlerName = "onSelectPolyomino";

            this.dragClient = {x:0, y:0 };
            this.dragPositionLastFrame = {x:0, y:0};


            this.abilityEventHandlers = {
                "any_cards":"onActivateAbilityAnyCards",
                "additional_card":"onActivateAbilityAdditionalCard",
                "construction_discount":"onActivateAbilityConstructionDiscount",
                "change_of_colors":"onActivateAbilityChangeOfColors",
                "both_actions":"onActivateAbilityBothActions",
            };

            this.hasConstructionDiscounted = false;
            this.changeOfColorsCardHandlers = []; // keep track of the click handles attached to the hand of cards (doing it this way since cards in hand change all the time)
            this.changeColorsFromTo = null;
            this.cardsToDiscard = [];
            this.cellToPlacePolyomino = null;
            this.discardHandlers = []; // keep track of click handles attached to cards in hand when choosing which cards to discard

            this.discardAnimationTime = 500;
            this.animationTimeBetweenRefillHaborCards = 100;

        },
        
        /*
            setup:
            
            This method must set up the game user interface according to current game situation specified
            in parameters.
            
            The method is called each time the game interface is displayed to a player, ie:
            _ when the game starts
            _ when a player refreshes the game page (F5)
            
            "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
        */
        
        setup: function( gamedatas )
        {
            //console.log( "Starting game setup" );

            // DEBUG - see all game data in console
            // console.log( gamedatas);

            // INITALIZE VALUES
            //  since we're now supporting undo - these need to be initialized here
            this.maxHandSizeDiscardHandlers = [];
            this.stateName = "";
            this.selectedPolyomino = null;
            this.hasConstructionDiscounted = false;
            this.dragClient = {x:0, y:0 };
            this.dragPositionLastFrame = {x:0, y:0};
            this.changeOfColorsCardHandlers = []; 
            this.changeColorsFromTo = null;
            this.cardsToDiscard = [];
            this.cellToPlacePolyomino = null;
            this.discardHandlers = [];

            // MERMAID CARD
            this.addTooltip("small_mermaid_card", _('Once the deck is empty, it will be reshuffled with this game-ending card somewhere in the bottom 10 cards'),'');
            this.addTooltip("small_mermaid_card_slot", _('The game-ending card is shuffled somewhere in the bottom 10 cards of the deck'),'');
            if( gamedatas.mermaid_card == "deck") dojo.destroy("small_mermaid_card");

            // DECK
            //  needs to come after mermaid card, since it checks the state of it
            this.updateDeckDisplay(gamedatas.cards_in_deck);

            // HARBOR CARDS
            for( var card_id in gamedatas.harbor )
            {
                this.makeHarborCard( gamedatas.harbor[card_id] );
            }

            // UI PLAYERBOARDS
            //   the bga boxes containing the score - not the buildings
            for( var player_id in gamedatas.players )
            {
                var player = gamedatas.players[player_id];
                         
                // Setting up players boards if needed
                var player_score_div = dojo.query(`#player_board_${player_id} .player_score`)[0];  // doesn't use copen_wrapper - part of bga UI
                dojo.place( this.format_block(
                    'jstpl_player_board', 
                    {hand_size: gamedatas.hand_sizes[player_id], player_id: player_id}
                ), player_score_div, "after" );
            }

            // PLAYERBOARD DATA OBJECT
            this.playerboard = gamedatas.playerboards[this.player_id];

            // PLAYER BOARDS 
            for( var player_id in gamedatas.players )
            {
                var player = gamedatas.players[player_id];
                if( player_id == this.player_id)
                {
                    dojo.addClass(`player_${player_id}_playerboard`,`copen_playerboard_color_${player.color}`);
                }
            }

            // CARDS IN HAND
            for( var cardId in gamedatas.hand )
            {
                var cardData = gamedatas.hand[cardId];

                var cardHtml = this.format_block('jstpl_card',{   // make the html in memory
                    id: cardId,
                    color: cardData.type,                   // set the color
                }); 
                var card = dojo.place( cardHtml, "hand");       // temporarily place it just under the "hand" node.  Our position function expects a node, not just an html string 
                dojo.place( card, "cards_in_hand", this.findPositionForNewCardInHand( card ));
                this.placeOnObject( card, "hand_bottom_card_target" );
            }
            this.splayCardsInHand();


            // POLYOMINOES
            for( var polyominoId in gamedatas.polyominoes)
            {
                var polyomino = gamedatas.polyominoes[ polyominoId ];

                var polyominoHtml = this.format_block('jstpl_polyomino',{   
                    color: polyomino.color,   
                    squares: polyomino.squares,
                    copy: polyomino.copy,  
                    flip: polyomino.flip,
                    rotation: polyomino.rotation,              
                }); 

                var polyominoNode = null;
                if( polyomino.owner == null )
                {
                    polyominoNode = dojo.place( polyominoHtml, this.getStackIdFromPolyominoId( `${polyomino.color}-${polyomino.squares}_${polyomino.copy}`));
                }
                else
                {
                    dojo.place( polyominoHtml, `player_${polyomino.owner}_playerboard`);
                    polyominoNode = this.placePolyomino( polyomino ); 
                }

            }

            // ABILITY TILES
            for( var abilityTileId in gamedatas.ability_tiles)
            {
                var abilityTile = gamedatas.ability_tiles[ abilityTileId ];

                var abilityTileHtml = this.format_block('jstpl_ability_tile',{   
                    ability_name: abilityTile.ability_name,   
                    copy: abilityTile.copy,            
                }); 

                var abilityTileNode = null;
                if( abilityTile.owner == null )  abilityTileNode = dojo.place( abilityTileHtml, `ability_tile_stack_${abilityTile.ability_name}` );
                else abilityTileNode = dojo.place( abilityTileHtml, `copen_ability_slot_${abilityTile.ability_name}_${abilityTile.owner}` );

                if( abilityTile.used == 1 ) dojo.addClass(abilityTileNode, "copen_used_ability");
            }

            // ACITVATED ABILITIES
            //  show which abilities are activated
            //  individual states will handle any special triggered client-side behavior
            for( var abilityNameId in gamedatas.activated_abilities)
            {
                var abilityName = gamedatas.activated_abilities[ abilityNameId ];

                var query = dojo.query(`#copen_wrapper #copen_ability_slot_${abilityName}_${this.player_id} .copen_ability_tile:not(.copen_used_ability)`);
                if( query.length > 0 ) dojo.addClass( query[0], "copen_activated");

                // SPECIAL BEHAVIOR FOR CONSTRUCTION DISCOUNT
                if( abilityName == "construction_discount")
                {
                    this.hasConstructionDiscounted = true;
                    this.determineUsablePolyominoes();
                }

                if( abilityName == "change_of_colors")
                {
                    this.triggerChangeOfColorsAbility( this.gamedatas.change_of_colors.from_color, this.gamedatas.change_of_colors.to_color);
                }

            }


            // TOOLTIPS
            this.updateSpecialAbilityTooltips();
            this.updatePolyominoStackTooltips();
            
            this.determineTopPolyominoInEveryStack();

            // CONNECT INTERACTIVE ELEMENTS

            // new system
            dojo.query("#copen_wrapper").connect( 'ondragover', this, 'onDragOver');
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'onclick', this, this.selectPolyominoEventHandlerName); 
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'ondragstart', this, "onDragStartPolyomino"); 
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'ontouchstart', this, "onTouchStartPolyomino"); 
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'ondrag', this, "onDragPolyomino"); 
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'ontouchmove', this, "onTouchMovePolyomino"); 
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'ondragend', this, "onDragEndPolyomino"); 
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'ontouchend', this, "onTouchEndPolyomino"); 
            dojo.query("#copen_wrapper #owned_player_area .copen_board_cell").connect( 'onclick', this, 'onPositionPolyomino');
            dojo.query("#copen_wrapper #owned_player_area .copen_board_cell").connect( 'onmouseover', this, 'onPreviewPlacePolyomino');
            dojo.query("#copen_wrapper #owned_player_area .copen_board_cells").connect( 'onmouseout', this, 'onClearPreviewPolyomino');            
            
            dojo.query("#copen_wrapper #polyomino_rotate_button").connect( 'onclick', this, 'onRotatePolyomino');
            dojo.query("#copen_wrapper #polyomino_flip_button").connect( 'onclick', this, 'onFlipPolyomino');
            dojo.query("#copen_wrapper .copen_change_of_colors_option").connect('onclick', this, 'onSelectChangeOfColorsOption' );
          
            dojo.query("#copen_wrapper .copen_ability_tile_stack .copen_ability_tile:last-child").connect( 'onclick', this, 'onTakeAbilityTile');

            dojo.query("#copen_wrapper #owned_player_area .copen_any_cards").connect( 'onclick', this, 'onActivateAbilityAnyCards');
            dojo.query("#copen_wrapper #owned_player_area .copen_additional_card").connect( 'onclick', this, 'onActivateAbilityAdditionalCard');
            dojo.query("#copen_wrapper #owned_player_area .copen_both_actions").connect( 'onclick', this, 'onActivateAbilityBothActions');
            dojo.query("#copen_wrapper #owned_player_area .copen_construction_discount").connect( 'onclick', this, 'onActivateAbilityConstructionDiscount');
            var query = dojo.query("#copen_wrapper #owned_player_area .copen_change_of_colors").connect( 'onclick', this, 'onActivateAbilityChangeOfColors');

            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();

            //console.log( "Ending game setup" );

        },    

        ///////////////////////////////////////////////////
        //// Game & client states
        
        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  You can use this method to perform some user interface changes at this moment.
        //
        onEnteringState: function( stateName, args )
        {
            //DEBUG
            //console.log( 'Entering state: '+stateName );
            //console.log( args );
            
            this.stateName = stateName;


            switch( stateName )
            {

                case 'playerTurn':
                    this.onEnteringPlayerTurn( args );
                    break;

                case 'discardDownToMaxHandSize':
                    this.onEnteringStateDiscardDownToMaxHandSize( args );
                    break;

                case 'takeAdjacentCard':
                    this.onEnteringTakeAdjacentCard( args );
                    break;

                case 'takeAdditionalCard':
                    this.onEnteringTakeAdditionalCard( args );
                    break;

                case 'takeCardsLastCall':
                    this.onEnteringTakeCardsLastCall( args );
                    break;

                case 'placePolyominoAfterTakingCards':
                    this.onEnteringPlacePolyominoAfterTakingCards( args );
                    break;

                case 'coatOfArms':
                    this.onEnteringCoatOfArms( args );
                    break;

                case 'refillHarbor':
                    this.onEnteringRefillHarbor( args );
                    break;
           
                case 'dummmy':
                    break;
            }
        },

        onEnteringPlayerTurn( args )
        {

            if( args.active_player != this.player_id ) return;

            // HANDLE CARDS
            if( args.active_player == this.player_id ) 
            {
                dojo.query("#copen_wrapper #harbor_cards .copen_card").addClass("copen_usable");
            }

            // HANDLE POLYOMINOES
            this.determineUsablePolyominoes();

            // MARK WHICH OWNED ABILITIES ARE USABLE
            this.setAbilityAsUsable( "any_cards");
            this.setAbilityAsUsable( "additional_card");
            this.setAbilityAsUsable( "both_actions");
            this.setAbilityAsUsable( "construction_discount");
            
            if( this.getNumberOfCardsInHand() > 0) this.setAbilityAsUsable( "change_of_colors");
            else this.setAbilityAsUnusable( "change_of_colors");

        },

        onLeavingPlayerTurn()
        {
            dojo.query("#copen_wrapper .copen_card.copen_usable").removeClass("copen_usable");
            dojo.query("#copen_wrapper .copen_polyomino.copen_usable").removeClass("copen_usable");
            dojo.query("#copen_wrapper .copen_polyomino.copen_unusable").removeClass("copen_unusable");
        },

        onEnteringStateDiscardDownToMaxHandSize( args )
        {

            if( args.active_player != this.player_id ) return;


            dojo.addClass("hand","copen_over_max_hand_size");

            var cardsInHandNode = dojo.query("#copen_wrapper #cards_in_hand")[0]; 
            var cardsInHand = this.getChildElementNodes( cardsInHandNode );

            for( var i = 0; i < cardsInHand.length; i++ )
            {
                // have to connect this a little differently, since we want to remove thse handlers later
                var discardHandler = dojo.connect( cardsInHand[i], "onclick", this, "onDiscardCardOverMaxHandSize");
                this.maxHandSizeDiscardHandlers.push( discardHandler ); 
            }

        },

        onLeavingStateDiscardDownToMaxHandSize()
        {

            if( this.maxHandSizeDiscardHandlers.length > 0 )
            {
                dojo.removeClass("hand","copen_over_max_hand_size");
                dojo.forEach( this.maxHandSizeDiscardHandlers, dojo.disconnect);
            }
        },

        onEnteringTakeAdjacentCard( args )
        {
            if( args.active_player == this.player_id )
            {

                // MARK WHICH CARDS ARE USABLE
                dojo.query("#copen_wrapper #harbor_cards .copen_card").addClass("copen_unusable");
                for( var i = 0; i < args.args.adjacent_card_ids.length; i++)
                {
                    dojo.query(`#copen_wrapper #card_${args.args.adjacent_card_ids[i]}`).removeClass("copen_unusable").addClass("copen_usable");
                }

                // MARK WHICH OWNED ABILITIES ARE USABLE
                this.setAbilityAsUsable( "any_cards");
                this.setAbilityAsUsable( "additional_card");
                this.setAbilityAsUsable( "both_actions");

                // TRIGGER BEHAVIOR OF ANY PREPARED ABILITIES
                if( args.args.ability_activated_any_cards == 1) this.triggerAnyCardsAbility();
            }
        },

        onLeavingTakeAdjacentCard()
        {
            dojo.query("#copen_wrapper .copen_card.copen_usable").removeClass("copen_usable");
            dojo.query("#copen_wrapper .copen_card.copen_unusable").removeClass("copen_unusable");

        },

        onEnteringTakeAdditionalCard( args )
        {
            if( args.active_player == this.player_id )
            {
                dojo.query("#copen_wrapper #harbor_cards .copen_card").addClass("copen_usable");


                this.setAbilityAsUsable( "both_actions");
            }
        },

        onLeavingTakeAdditionalCard()
        {
            dojo.query("#copen_wrapper .copen_card.copen_usable").removeClass("copen_usable");
            dojo.query("#copen_wrapper .copen_card.copen_unusable").removeClass("copen_unusable");

        },   

        onEnteringTakeCardsLastCall( args )
        {
            if( args.active_player == this.player_id )
            {
                this.setAbilityAsUsable( "additional_card");
                this.setAbilityAsUsable( "both_actions");                
            }
        },

        onLeavingTakeCardsLastCall()
        {

        },      

        onEnteringPlacePolyominoAfterTakingCards( args )
        {
            if( args.active_player == this.player_id )
            {
                // HANDLE POLYOMINOES
                this.determineUsablePolyominoes();

                this.setAbilityAsUsable( "construction_discount");

                if( this.getNumberOfCardsInHand() > 0) this.setAbilityAsUsable( "change_of_colors");
                else this.setAbilityAsUnusable( "change_of_colors");
            }
        },

        onLeavingPlacePolyominoAfterTakingCards()
        {
            dojo.query("#copen_wrapper .copen_polyomino.copen_usable").removeClass("copen_usable");
            dojo.query("#copen_wrapper .copen_polyomino.copen_unusable").removeClass("copen_unusable");
        },    

        onEnteringCoatOfArms( args )
        {

            if( args.active_player != this.player_id ) return;

            dojo.query("#copen_wrapper .copen_white_polyomino.copen_top_of_stack").addClass( "copen_usable");
            dojo.query("#copen_wrapper #owned_player_area .copen_used_ability").addClass("copen_usable");
            this.determineWhichAbilityTilesAreTakeable();



        },

        onLeavingCoatOfArms()
        {
            dojo.query("#copen_wrapper .copen_polyomino.copen_usable").removeClass("copen_usable");
            dojo.query("#copen_wrapper .copen_polyomino.copen_unusable").removeClass("copen_unusable");
            dojo.query("#copen_wrapper #owned_player_area .copen_used_ability").removeClass("copen_usable");
        },

        // ALSO RESETS VARIABLES - PREP FOR NEXT TURN
        //  we always enter refill Harbor, so we use it to do some client side cleanup
        onEnteringRefillHarbor( args )
        {
            this.hasConstructionDiscounted = false; // reset between turns

            // DEACTIVATE UNUSED ABILITIES
            //  sometimes a player might activate an ability, but not actually use it
            //  make sure to turn it off on the client side
            dojo.query("#copen_wrapper .copen_activated").removeClass("copen_activated");

            // CLEANUP CHANGE OF COLORS
            this.clearChangeOfColorsAbility();


        },

        // onLeavingState: this method is called each time we are leaving a game state.
        //                 You can use this method to perform some user interface changes at this moment.
        //
        onLeavingState: function( stateName )
        {
            //console.log( 'Leaving state: '+stateName );
            
            switch( stateName )
            {
            
                case 'playerTurn':
                    this.onLeavingPlayerTurn();
                     break;

                case 'discardDownToMaxHandSize':
                    this.onLeavingStateDiscardDownToMaxHandSize();
                    break;

                case 'takeAdjacentCard':
                    this.onLeavingTakeAdjacentCard();
                    break;

                case 'takeAdditionalCard':
                    this.onLeavingTakeAdditionalCard();
                    break;      

                case 'takeCardsLastCall':
                    this.onLeavingTakeCardsLastCall();
                    break;        

                case 'placePolyominoAfterTakingCards':
                    this.onLeavingPlacePolyominoAfterTakingCards();
                    break;       

                case 'coatOfArms':
                    this.onLeavingCoatOfArms();
                    break;
               
                case 'dummmy':
                    break;
            }               

            // TURN OFF USABLE ABILITIES AT THE END OF ANY STATE
            //   each state is response for turning the proper ones back on
            dojo.query("#copen_wrapper .copen_ability_tile.copen_usable").removeClass("copen_usable");
            dojo.query("#copen_wrapper .copen_ability_tile.copen_unusable").removeClass("copen_unusable");
        }, 



        // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
        //                        action status bar (ie: the HTML links in the status bar).
        //        
        onUpdateActionButtons: function( stateName, args )
        {
            //console.log( 'onUpdateActionButtons: '+stateName );
                      
            if( this.isCurrentPlayerActive() )
            {            

                this.addActionButton( 'undo', _("Undo Turn"), "onUndo", null, false, "gray" );

                switch( stateName )
                {

                case 'playerTurn':
                    this.createPositionPolyominoButtons();

                    // TURN OFF THE UNDO BUTTON IF THERE'S NOTHING TO UNDO
                    //  Special case - if the player clicked an activated ability, then refreshed the page, they should be able to undo
                    if( this.gamedatas.activated_abilities.length == 0 )
                    {
                        dojo.style("undo","display","none"); // hide undo when there's nothing to undo
                    }
                    break;

                case 'takeCardsLastCall':
                    this.addActionButton( 'end_turn', _("End Turn"), "onEndTurn", null, false, "red");
                    break;

                case 'placePolyominoAfterTakingCards':
                    this.addActionButton( 'end_turn', _("End Turn"), "onEndTurn", null, false, "red");

                    this.createPositionPolyominoButtons();
                    break;

                case 'coatOfArms':
                    this.createPositionPolyominoButtons();
                    break;


                }
            }
        },        

        ///////////////////////////////////////////////////
        //// Utility methods
        
        /*
        
            Here, you can defines some utility methods that you can use everywhere in your javascript
            script.
        
        */

        // When you get HTML children, you also get text nodes - which in this use case is usually some useless blank space
        //   this helper function returns just the element nodes
        getChildElementNodes: function( node )
        {
            var childElementNodes = [];
            for( var i = 0; i < node.childNodes.length; i++ )
            {
                if(  node.childNodes[i].nodeType == Node.ELEMENT_NODE) childElementNodes.push(  node.childNodes[i]);
            } 
            return childElementNodes;
        },

        updateDeckDisplay: function( numberCardsInDeck )
        {
            // TOOLTIPS
            if( this.isSmallMermaidCardVisible() )  this.addTooltip( "deck", `${numberCardsInDeck} ` + _("cards in the deck. When this runs out of cards, it will be reshuffled once."), "");
            else if( numberCardsInDeck > 10 )  this.addTooltip( "deck", `${numberCardsInDeck} ` + _("cards in the deck. The game-ending card is somewhere in the bottom 10 cards."), "");
            else this.addTooltip( "deck", `${numberCardsInDeck} ` + _("cards in the deck. The game could end immediately if the game-ending card is drawn."), "");

            // NUMBER DISPLAY
            dojo.query("#copen_wrapper #deck #cards_remaining")[0].innerText = numberCardsInDeck;
            if( !this.isSmallMermaidCardVisible() && numberCardsInDeck <= this.mermaidCardWarningThreshold && this.mermaidCardWarningAnimation == null ) this.playDeckWarningAnimation();
        },

        playDeckWarningAnimation: function()
        {

            dojo.style("cards_remaining", "opacity", 1);

            this.mermaidCardWarningAnimation = this.deckWarningAnimationIn();
        },

        // DECK WARNING ANIMATION IN MULTIPLE PARTS
        //   I need them to chain and loop - this is the best I've figured out so far
        deckWarningAnimationIn: function()
        {


            var game = this;
            dojo.animateProperty({
                node: "cards_remaining",
                duration: 1000,                
                properties: {
                    color: { start: "white", end: "#fccd3e" },
                    x: {start: 1, end: 1.25},
                },
                onAnimate: function (values) {
                    dojo.style("cards_remaining", "transform", `scale(${values.x.replace("px","")})`);
                },
                onEnd: function(){game.deckWarningAnimationOut()},
            }).play();

        },

        deckWarningAnimationOut: function()
        {
            var game = this;
            dojo.animateProperty({
                node: "cards_remaining",
                duration: 1000,
                properties: {
                    color: { start: "#fccd3e", end: "white" } ,
                    x: {start: 1.25, end: 1},
                },
                onAnimate: function (values) {
                    dojo.style("cards_remaining", "transform", `scale(${values.x.replace("px","")})`);
                },
                onEnd: function(){game.deckWarningAnimationIn()},
            }).play(); 
        },

        isSmallMermaidCardVisible: function()
        {

            var query = dojo.query("#copen_wrapper #small_mermaid_card");

            return query.length != 0 ;
        },

        playShuffleDeckAnimation: function( numberOfCards )
        {
            var numberOfCardsMinusOne = numberOfCards - 1;

            dojo.style("deck","display","none");

            var game = this;
            setTimeout( function(){

                for( let i = 0; i < 10; i++ )
                {
                    setTimeout( function(){

                        var node = dojo.place( game.format_block('jstpl_deck_shuffle_card',{"id": i}), 'deck_cards', "first" );
                        dojo.style( node.id, "opacity", 0 );

                        dojo.animateProperty({
                            node: node,
                            properties: {
                                opacity: 1,
                                duration: 500,
                            },
                            onEnd: function(){

                                if( i == 0 )
                                {
                                    dojo.style("deck", "display", "block");

                                    
                                    var animation = dojo.animateProperty({
                                        node: "deck",
                                        duration: 1000,
                                        properties: 
                                        {
                                            count: {start: 0, end: numberOfCardsMinusOne },

                                        },
                                        onAnimate: function (values) {
                                            dojo.byId("cards_remaining").innerText = parseInt(values.count.replace("px",""));
                                        },
                                        onEnd: function() {

                                            game.slideToObjectAndDestroy("small_mermaid_card", "deck_cards", 500, 0 );
                                            dojo.style("small_mermaid_card", "z-index", 0);
                                            setTimeout( function(){
                                                game.updateDeckDisplay( numberOfCards );  
                                            }, 500);

                                        }
                                    }).play();
                                }
                            }
                        }).play();

                        game.placeOnObjectPos( node.id, "deck_cards", 0, -60 );
                        game.slideToObjectAndDestroy( node.id, "deck_cards", 500, 0 );
                        dojo.style( node.id, "z-index", 0 );
                    }, i * 100);
                }
            }, 750);

        },

        // REAPPLY TOOLTIPS TO SPECIAL ABILITIES
        //  since we re-parent special ability tokens - that means nodes get destroyed and recreated
        //  which means we need to hook up the tooltips to the new nodes
        updateSpecialAbilityTooltips: function()
        {
            this.addTooltipHtmlToClass('copen_any_cards', _("Any cards: The cards you take don't have to be next to each other"), "");
            this.addTooltipHtmlToClass('copen_additional_card', _("Additional card: You can take a third card from anywhere."), "");
            this.addTooltipHtmlToClass('copen_construction_discount', _("Construction Discount: Discard 1 less card when you place a facade tile"), "");
            this.addTooltipHtmlToClass('copen_change_of_colors', _("Change of colors: Treat ALL cards of one color in your hand as a different color"), "");
            this.addTooltipHtmlToClass('copen_both_actions', _("Both actions: You can take cards and place a facade tile this turn"), "");
        },

        updatePolyominoStackTooltips: function()
        {

            var stackQuery = dojo.query('.copen_stack');
            var totalWhitePolyominoesRemaining = 0;

            for( var i = 0; i < stackQuery.length; i++)
            {
                var color = stackQuery[i].id.split('-')[0];
                var tilesInStack = stackQuery[i].children.length;

                if( color != "white")
                {
                    this.addTooltipHtml(stackQuery[i].id,_(`${tilesInStack} ${color} facade tile(s)`),'');
                    this.tooltips[stackQuery[i].id].showDelay = 500;
                }
                else
                {
                    totalWhitePolyominoesRemaining += tilesInStack;
                }
            }

            // SPECIAL COUNT FOR WHITE
            //  It's probably a little more useful just to count all the tiles, rather than each individual stack
            for( var i = 1; i <= 4; i++)
            {
                var stackId = `white-1_stack_${i}`;
                this.addTooltipHtml(stackId,_(`${totalWhitePolyominoesRemaining} ${color} facade tile(s)`),'');
                this.tooltips[stackId].showDelay = 500;
            }

        },

        // IMMEDIATELY CLOSE TOOLTIPS
        //  tooltips and dragging don't play together well
        hideTooltip() { 
            var node = dojo.byId("dijit__MasterTooltip_0");
            if( node )
            {
                dojo.addClass( node ,"copen_hidden");  
            } 
        },

        makeHarborCard: function( cardData )
        {
                var cardHtml = this.format_block('jstpl_card',{   // make the html in memory
                    id: cardData.id,
                    color: cardData.type,                   // set the color
                }); 

                var card = dojo.place( cardHtml, `harbor_position_${cardData.location_arg}`);
                this.placeOnObject( card, "deck" ); // we use some visual illusion here.  The card starts on its final parent, but we snap it to the deck, then animate its slide back to its actual parent
                this.slideToObject( card, `harbor_position_${cardData.location_arg}`, 500  ).play();
                dojo.connect(card, "onclick", this, "onTakeHarborCard");
        },

        getColorNameOfCard: function( node )
        {

            for( var i = 0; i < this.cardColorOrder.length; i++ )
            {
                if( dojo.hasClass(node, this.cardColorOrder[i])) return this.cardColorOrder[i];
            }

        },

        // we want to keep cards organized by color in hand
        //   we'll do that when we add the card to the hand
        findPositionForNewCardInHand: function( card )
        {
            var cardsInHandNode = dojo.query("#copen_wrapper #cards_in_hand")[0]; 
            var cardsInHand = this.getChildElementNodes( cardsInHandNode );

            var position = 0;

            for( var i = 0; i < this.cardColorOrder.length; i++)
            {
                var color = this.cardColorOrder[i];

                if( dojo.hasClass( card, color)) return position;
                position += dojo.query(`#copen_wrapper #cards_in_hand .${color}`).length; // the copen_ prefix is already in the variable here 
            }

            return -1; // something went wrong - the card didn't have a color class
        },

        getNumberOfCardsInHand: function()
        {
            return dojo.query("#copen_wrapper #cards_in_hand .copen_card").length;
        },

        splayCardsInHand: function()
        {
            var cardsInHandNode = dojo.query("#copen_wrapper #cards_in_hand")[0]; 
            var cardsInHand = this.getChildElementNodes( cardsInHandNode );

            if( cardsInHand == 0 ) return; // do nothing if we don't have any cards in hand

            var lastCard = cardsInHand[ cardsInHand.length - 1];
            var lastCardTop = dojo.position( lastCard ).y;
            this.placeOnObject(lastCard, "hand_bottom_card_target");

            for( var i = 0; i < cardsInHand.length; i++)
            {
                this.placeOnObjectPos( cardsInHand[i], "hand_bottom_card_target", 0, -this.cardSplayDistance * (cardsInHand.length - 1 - i) );
            }

        },

        countColoredCardsInHand: function( color )
        {
            return this.getNodeListOfColoredCardsInHand( color ).length;
        },

        getNodeListOfColoredCardsInHand: function( color )
        {
            // NOTE - have to go down to the copen_new_color layer to make sure this card hasn't had its color changed
            // but then we actually return the parents, since its the .copen_cards we'll be operating on.
            var baseCards = dojo.query(`#copen_wrapper #cards_in_hand .copen_card.copen_${color}_card .copen_new_color.copen_hidden`);
            var changedColorCards = dojo.query(`#copen_wrapper #cards_in_hand .copen_card .copen_new_color.copen_${color}_card`);
            var baseCards = baseCards.concat( changedColorCards );

            return baseCards.map( function(node){
                return node.parentNode;
            });
        },


        hasMixOfBaseCardsAndChangedColorCards: function( color )
        {
            var baseCards = dojo.query(`#copen_wrapper #cards_in_hand .copen_card.copen_${color}_card .copen_new_color.copen_hidden`);
            var changedColorCards = dojo.query(`#copen_wrapper #cards_in_hand .copen_card .copen_new_color.copen_${color}_card`);
            
            return baseCards.length > 0 && changedColorCards.length > 0;
        },        

        hasTooManyCardsInHand: function()
        {
            return dojo.query("#copen_wrapper #cards_in_hand .copen_card").length > this.maxHandSize;
        },

        animateDiscard: function( card )
        {
            dojo.setStyle( card, "opacity" , 0);
            dojo.setStyle( card, "left" , "-50px");
            dojo.setStyle( card, "transform" , "rotateZ( -60deg)");

            var game = this;
            setTimeout( function(){
                dojo.destroy( card );
                game.splayCardsInHand();
            }, 500);
        },

        determineTopPolyominoInEveryStack: function()
        {

            var game = this;
            dojo.query("#copen_wrapper .copen_stack").forEach( function( stackNode ){
                game.determineTopPolyominoInStack( stackNode.id );
            });
        },

        getStackIdFromPolyominoId: function( polyominoId )
        {
            var color = this.getPolyominoColorFromId( polyominoId );

            // SPECIAL RULES FOR WHITE TILES
            if( color == "white")
            {
                var stack_number = this.getStackNumberFromWhitePolyominoId( polyominoId );
                return `${color}-1_stack_${stack_number}`;
            }

            // HANDLE ALL OTHER TILES
            else
            {
                var squares = this.getPolyominoSquaresFromId( polyominoId );
                return `${color}-${squares}_stack`;
            }
        },

        // WHITE POLYOMINOS HAVE SPECIAL STACK RULES
        //   white tiles didn't look good in one giant stack
        //   so we're letting them live in multiple stacks so that it looks nice
        getStackNumberFromWhitePolyominoId: function( polyominoId )
        {
            var copy = parseInt(this.getPolyominoCopyFromId( polyominoId ));
            return Math.ceil((copy * 1.0) / this.whitePolyominosPerStack);
        },

        determineTopPolyominoInStack: function( stackId )
        {
            var query = dojo.query( `#copen_wrapper #${stackId} > *:last-child` );
            if( query.length == 0 ) return null; // no more polyominoes in this stack

            var topOfStackNode = query[0];
            dojo.addClass( topOfStackNode, "copen_top_of_stack");
            return topOfStackNode;
        },

        determineUsablePolyominoes: function()
        {

            var game = this;

            dojo.query("#copen_wrapper .copen_polyomino.copen_top_of_stack").forEach(function(polyomino)
            {
                // clear previously let classes
                dojo.removeClass(polyomino, "copen_usable");
                dojo.removeClass(polyomino, "copen_unusable");

                // gather the information
                var color = game.getPolyominoColorFromId( polyomino.id );
                var squares = game.getPolyominoSquaresFromId( polyomino.id );
                var cardsOfColor = game.countColoredCardsInHand( color );

                var cost = squares;
                if( color != "white" && game.hasPolyominoOfColorOnBoard( color ) ) cost -= 1; // reduce cost by 1 if there's any matching polyominoes on board
                if( game.hasConstructionDiscounted ) cost -= 1;

                // see if player can afford polyomino
                if( cardsOfColor >= cost ) dojo.addClass( polyomino, "copen_usable");
                else dojo.addClass(polyomino, "copen_unusable");
            });
        },

        createPositionPolyominoButtons: function()
        {
            this.addActionButton( 'cancel_polyomino_placement', _("Cancel"), "onCancelPolyominoPlacement", null, false, "red");
            this.addActionButton( 'confirm_polyomino_placement', _("Confirm"), "onConfirmPolyominoPlacement", null, false, "blue");
            dojo.style("cancel_polyomino_placement","display","none");
            dojo.style("confirm_polyomino_placement","display","none");
        },

        showPositionPolyominoButtons: function()
        {
            dojo.style("cancel_polyomino_placement","display","inline");
            dojo.style("confirm_polyomino_placement","display","inline");

            // IF PRESENT, HIDE END TURN BUTTON WHILE POLYOMINO IS BEING PLACED
            //  if the player is doing "both actions" - there's a chance they won't be able to play any polyominos
            //  so we need an 'end turn' button
            //  but I found myself tempted to press it as a "submit" button - even though it's red
            //  so let's hide it while a polyomino is up, so the player has to cancel it before ending their turn
            var query = dojo.query("#end_turn");
            if( query.length > 0 ) dojo.style(query[0], "display", "none");
        },

        hidePositionPolyominoButtons: function()
        {
            dojo.style("cancel_polyomino_placement","display","none");
            dojo.style("confirm_polyomino_placement","display","none");

            var query = dojo.query("#end_turn");
            if( query.length > 0 ) dojo.style(query[0], "display", "inline-block");
        },

        hasPolyominoOfColorOnBoard: function( color )
        {

            for( var x = 0; x < this.boardWidth; x++)
            {
                for( var y = 0; y < this.boardHeight; y++)
                {
                    if(this.playerboard[x][y].color == color ) return true;
                }
            }

            return false;
        },

        getPolyominoColorFromId: function( polyominoId )
        {
            return polyominoId.split('-')[0];
        },

        getPolyominoSquaresFromId: function( polyominoId )
        {
            return polyominoId.split('-')[1].split('_')[0];
        },

        getPolyominoCopyFromId: function( polyominoId )
        {
            return polyominoId.split('_')[1];
        },

        getCoordinatesFromId: function( id )
        {
            var coordinates = id.split('_');
            return {
                x:parseInt(coordinates[2]),
                y:parseInt(coordinates[3]),
            };
        },

        isCellEmpty: function( gridCell )
        {
            return this.playerboard[gridCell.x][gridCell.y].fill == null;
        },

        areCellsEmpty: function( gridCells )
        {

            for( var i = 0; i < gridCells.length; i++)
            {
                if( !this.isCellEmpty( gridCells[i]) )
                {
                    return false;
                }
            }
            return true;
        },

        isGroundedPosition: function( gridCells )
        {
            for( var i = 0; i < gridCells.length; i++)
            {
                if( gridCells[i].y == 0 ) return true;

                var coordBelow = {x:gridCells[i].x, y:gridCells[i].y - 1};
                if( !this.isCellEmpty(coordBelow)) return true;
            }

            return false;
        },

        isAdjacentToSameColor: function( gridCells, color )
        {
            for( var i = 0; i < gridCells.length; i++ )
            {
                if( this.isCellAdjacentToSameColor( gridCells[i], color )) return true;
            }
            return false;
        },


        getCostOfShapeAtPosition( gridCells, color )
        {
            var cost = gridCells.length;
            if( this.isAdjacentToSameColor( gridCells, color) ) cost -= 1;
            if( this.hasConstructionDiscounted ) cost -= 1;
            return cost;
        },

        isCellAdjacentToSameColor: function( gridCells, color )
        {
            for( var i = 0; i < this.adjacentOffsets.length ; i++)
            {

                var x = gridCells.x + this.adjacentOffsets[i].x;
                var y = gridCells.y + this.adjacentOffsets[i].y;

                // make sure its a valid square
                if( x < 0 || x >= this.boardWidth || y < 0 || y >= this.boardHeight) continue;

                if( this.playerboard[x][y].color == color ) return true;
            }

            return false;
        },

        isValidPlacementPosition: function( gridCells )
        {

            // CHECK EASY CONDITIONS FIRST
            if( !this.areCellsEmpty( gridCells ) || !this.isGroundedPosition( gridCells )) return false; 

            // CHECK IF WE CAN AFFORD IT
            var color = this.getPolyominoColorFromId( this.selectedPolyomino.id);

            // SPECIAL RULES FOR WHITE POLYOMINOES
            if( color == "white")  return this.stateName == "coatOfArms";
            
            // STANDARD RULES FOR OTHER COLORS
            var cardsOfColor = this.countColoredCardsInHand( color );
            var cost = this.getCostOfShapeAtPosition( gridCells, color);
            return cardsOfColor >= cost;
        },

        styleSelectedPolyominoBasedOnValidity( validity, gridCells )
        {

            this.removeTooltip( this.selectedPolyomino.id);

            if( validity )
            {
                dojo.removeClass( this.selectedPolyomino.id, "copen_invalid_placement");  
                dojo.removeClass( "confirm_polyomino_placement", "copen_button_disabled");
            } 
            else
            {
                dojo.addClass( this.selectedPolyomino.id, "copen_invalid_placement");
                dojo.addClass( "confirm_polyomino_placement", "copen_button_disabled");
                var hasOverlap = this.showOverlap( gridCells );


                // LEAVE A HELPFUL TOOLTIP
                // tooltips are going currently preventing dragging
                if( hasOverlap )
                {
                    this.addTooltipHtml( this.selectedPolyomino.id, _("This facade tile can't be placed here. It can't overlap other facade tiles."), '');
                }
                else if( !this.isGroundedPosition( gridCells ) )
                {
                    this.addTooltipHtml( this.selectedPolyomino.id, _("This facade tile can't be placed here. It needs to be supported - sitting on the lowest row or sitting on another facade tile."), '');
                }
                else  // Since there's only 3 reasons you can't place a tile, we assume its this last one if it's not the other two
                {
                    this.addTooltipHtml( this.selectedPolyomino.id, _("This facade tile can't be placed here. Since you have one less card than you need, you have to place this facade tile so it touches one of the same color."), '');
                }

                // SLOW DOWN HOW FAST THIS TOOLTIP COMES UP
                //  I found the default speed was too fast,
                //  and passing the parameter into addTooltipHtml didn't work
                this.tooltips[ this.selectedPolyomino.id ].showDelay = 1000;
            } 
        },

        showOverlap: function( gridCells )
        {

            var hasOverlap = false;

            for( var i = 0; i < gridCells.length; i++)
            {
                if( !this.isCellEmpty( gridCells[i] ))
                {
                    dojo.style(this.selectedPolyomino.overlaps[i],"display","block");
                    hasOverlap = true;
                }
            }

            return hasOverlap;
        },

        hideOverlap: function()
        {
            dojo.query("#copen_wrapper .copen_overlap").style("display","none");
        },

        removeOverlap: function()
        {
            dojo.query("#copen_wrapper .copen_overlap").forEach( dojo.destroy );
        },

        getDifferenceBetweenCostAndCards: function( gridCells )
        {
            var color = this.getPolyominoColorFromId( this.selectedPolyomino.id);
            var cardsOfColor = this.countColoredCardsInHand( color );
            var cost = this.getCostOfShapeAtPosition( gridCells, color);
            return cardsOfColor - cost;
        },

        // There's a few different systems we're using to identify polyomino placement
        //   THE CLICKED BOARD CELL - this is the square the user clicked on
        //   THE POLYOMINO ORIGIN - this is the lowest, left-most square of the shape.  May not be the actual square the user clicked on.
        //   THE BOUNDS MIN - this is the x of the left-most square, and the y of the bottom-most square.  May not be an actual square on the polyomino
        //
        //   This function adjusts to clicked board cell to the polyomino origin, since the bounds of the playerboard might scootch the polyomino left, right, or down 
        getAdjustedCoordinates: function( polyominoShape, coordinates )
        {

            var x = coordinates.x;
            var y = coordinates.y;

            var boardWidth = this.boardWidth;
            var boardHeight = this.boardHeight;

            // ADJUST PLACEMENT TO BE ON BOARD
            var bounds = this.getPolyominoBounds( polyominoShape );
            
            if( coordinates.x + bounds.min.x < 0 ) x = -bounds.min.x; //scootch it to the right
            else if(coordinates.x + bounds.max.x >= boardWidth) x = boardWidth - 1 - bounds.max.x; // scootch it to the left

            if( coordinates.y + bounds.max.y >= boardHeight) y = boardHeight - 1 - bounds.max.y; // scootch it down

            return {x:x, y:y};
        },

        getGridCellsForPolyominoAtCoordinates: function( polyominoShape, coordinates )
        {

            results = [];

            polyominoShape.forEach( function( polyCoord, index)
            {

                var newCoord = {
                    x: coordinates.x + polyCoord.x,
                    y: coordinates.y + polyCoord.y,
                };

                results.push(newCoord);
 
            });

            return results;
        },

        // RETURN THE X, Y OF THE LEFT-MOST, BOTTOM-MOST GRID CELL OF THE POLYOMINO'S BOUNDARY
        //   note that this grid cell might not actually contain a polyomino square
        getMinGridCell: function( gridCells )
        {
            // FIND THE GRID CELL AT MINX, MINY BOUNDARY
            var minX = gridCells[0].x;
            var minY = gridCells[0].y;
            for( var i = 1; i < gridCells.length; i++)
            {
                if( gridCells[i].x < minX) minX = gridCells[i].x;
                if( gridCells[i].y < minY) minY = gridCells[i].y;
            }

            return {x:minX, y:minY};
        },

        // returns the polyomino's rectangular bounds
        getPolyominoBounds: function( polyominoShape )
        {
            var bounds = {
                min: {x:0,y:0},
                max: {x:0,y:0},
            };

            polyominoShape.forEach( function( polyCoord, index)
            {
                if( polyCoord.x < bounds.min.x ) bounds.min.x = polyCoord.x;
                if( polyCoord.y < bounds.min.y ) bounds.min.y = polyCoord.y;
                if( polyCoord.x > bounds.max.x ) bounds.max.x = polyCoord.x;
                if( polyCoord.y > bounds.max.y ) bounds.max.y = polyCoord.y;
            });

            return bounds;

        },

        clearPreview: function()
        {
            dojo.query("#copen_wrapper .copen_preview").removeClass("copen_invalid").removeClass("copen_preview");
            dojo.query("#copen_wrapper #polyomino_preview").style("display","none");
        },

        // ATTACH THE POLYOMINO TO THE PLACEMENT LAYER - DESTROYING THE OLD ONE
        //   hooks up the new one with the events it needs
        putPolyominoOnPlacementLayer: function()
        {
            this.attachToNewParent( this.selectedPolyomino.id, "polyomino_placement");

            this.connectDraggingEventsToPolyomino( dojo.query(`#copen_wrapper #${this.selectedPolyomino.id}`)[0] );

            dojo.query(`#copen_wrapper #${this.selectedPolyomino.id}`).connect("onmousemove", this, "onPolyominoMouseMovePassThrough");
            dojo.query(`#copen_wrapper #${this.selectedPolyomino.id}`).connect("onmouseout", this, "onPolyominoMouseOutPassThrough");
            dojo.query(`#copen_wrapper #${this.selectedPolyomino.id}`).connect("onclick", this, "onPolyominoClickPassThrough");    

        },

        connectDraggingEventsToPolyomino: function( polyominoNode )
        {
            dojo.connect( polyominoNode, "ondragstart", this, "onDragStartPolyomino");
            dojo.connect( polyominoNode, "ontouchstart", this, "onTouchStartPolyomino"); 
            dojo.connect( polyominoNode, "ondrag", this, "onDragPolyomino");
            dojo.connect( polyominoNode, "ontouchmove", this, "onTouchMovePolyomino");
            dojo.connect( polyominoNode, "ondragend", this, "onDragEndPolyomino");
            dojo.connect( polyominoNode, "ontouchend", this, "onTouchEndPolyomino");
        },

        // THE ZOOM MESSES WITH EVENT'S CLIENTX AND CLIENTY
        //  when the user is on a mobile device, or shrinks their browser
        //  bga throws in a "zoom" css modifier
        //  this messes with the clientX and clientY data
        //  but you can get accurate numbers by just dividing out zoom again
        adjustPositionBasedOnZoom: function( x, y )
        {
            var zoom = dojo.getStyle("page-content","zoom");
            if( zoom == undefined ) zoom = 1; // not getting zoom on firefox

            return {x: x/zoom, y:y/zoom};
        },

        fadeInPolyominoPlacementUI: function()
        {

            dojo.style("shadow_box", "opacity","0"); 
            
            // set elements behind the shadow box
            dojo.query("#copen_wrapper #harbors").addClass("copen_behind_shadow_box");
            dojo.query("#copen_wrapper #deck_cards").addClass("copen_behind_shadow_box");
            dojo.query("#copen_wrapper #harbor_cards").addClass("copen_behind_shadow_box");
            dojo.query("#copen_wrapper #polyominoes").addClass("copen_behind_shadow_box");  
            dojo.query("#copen_wrapper #opponent_playerboards").addClass("copen_behind_shadow_box");  
            dojo.query("#copen_wrapper #ability_tile_stacks").addClass("copen_behind_shadow_box");  

            dojo.query("#copen_wrapper #polyomino_placement").style("display","block");
            dojo.query("#copen_wrapper #polyomino_placement_buttons").style("display","block"); // sometimes we turn this off seperately from its parent - so make sure it's back on too


            dojo.animateProperty({
                node: "shadow_box",
                duration: 500,
                properties: 
                {
                    opacity: {start: 0, end: 0.5},
                }
            }).play();

        },

        // GIVEN COORDINATES OF THE HTML PAGE, GET THE CELL UNDER THOSE COORDINATES
        getCellNodeAtPageCoordinate: function( coordinate )
        {
            var boardCellsNode = dojo.query(`#copen_wrapper #player_${this.player_id}_playerboard .copen_board_cells`)[0];
            var position = dojo.position( boardCellsNode, true );

            // MAKE SURE COORDINATE IS WITHIN GRID CELLS NODE, OTHERWISE ITS INVALID
            if( 
                coordinate.x < position.x 
                || coordinate.x > position.x + position.w
                || coordinate.y < position.y
                || coordinate.y > position.y + position.h
            )
            {
                return null;
            }

            var x = Math.floor((coordinate.x - position.x) / this.cellMeasurement);
            var y = this.boardHeight - Math.floor((coordinate.y - position.y) / this.cellMeasurement) - 1; // have to do -1 or get an off-by-one error (1 -> 9) instead of (0 -> 8)

            return dojo.query(`#copen_wrapper #player_${this.player_id}_playerboard .copen_board_cell_${x}_${y}`)[0];
        },

        showSelectDiscardUI: function( color, cost )
        {

            // MAKE SURE WE'RE COMING IN WITH CLEAN DATA STRUCTURE
            this.discardHandlers = [];

            // HIDE ADDITIONAL ELEMENTS
            dojo.query("#copen_wrapper #polyomino_placement_buttons").style("display","none");
            dojo.query(`#copen_wrapper #owned_player_area`).addClass("copen_behind_shadow_box");  

            // FIRST, TAG ALL CARDS IN HAND AS UNUSABLE
            dojo.query("#copen_wrapper #cards_in_hand .copen_card").addClass("copen_unusable");

            // NEXT, GET SET CORRECT CARDS TO BE USABLE
            var query = this.getNodeListOfColoredCardsInHand( color );
            
            for( var i = 0; i < query.length; i++ )
            {
                // CONNECT HANDLERS IN A WAY TO REMOVE THEM LATER
                var handler = dojo.connect( query[i], "onclick", this, "onSelectCardToDiscard");
                this.discardHandlers.push( handler ); 

                // SHOW THEM AS USABLE
                dojo.removeClass( query[i], "copen_unusable");
                dojo.addClass( query[i], "copen_usable");
            }

            // DISPLAY INSTRUCTIONS TO USER
            this.gamedatas.gamestate.descriptionmyturn = _(`Select ${cost} card(s) to discard`);
            this.updatePageTitle();

            // DISPLAY UNDO BUTTON
            dojo.style("undo","display","inline");

        },

        selectPolyomino: function( node )
        {
            this.selectedPolyomino = {};
            this.selectedPolyomino.id = event.currentTarget.id;
            this.selectedPolyomino.name = this.selectedPolyomino["id"].split("_")[0];
            this.selectedPolyomino.shape = this.getCopyOfShape(this.selectedPolyomino["name"]);
            this.selectedPolyomino.rotation = 0;
            this.selectedPolyomino.flip = 0;
            this.selectedPolyomino.originalPosition = dojo.getMarginBox( event.currentTarget); // getMarginBox includes 'l' and 't' - the values for "left" and "top"
            this.selectedPolyomino.overlaps = [];

            // prepare polyomino preview for use
            var polyomino = dojo.query(`#copen_wrapper #${this.selectedPolyomino["id"]}`)[0];

            var imageNode = dojo.query(`#${polyomino.id} .copen_polyomino_image`)[0];
            var previewImageNode = dojo.query("#polyomino_preview .copen_polyomino_image")[0];
            dojo.style(previewImageNode,"background-position", dojo.getStyle(imageNode, "background-position"));


            dojo.style("polyomino_preview","width", dojo.getStyle(polyomino, "width") + "px");
            dojo.style("polyomino_preview","height", dojo.getStyle(polyomino, "height") + "px");
            dojo.style("polyomino_preview","transform",""); // reset the transform from whatever it was before
            dojo.style("polyomino_preview","display","none"); // not ready to show yet - turn off

            // create squares we'll use to show overlap   
            var bounds = this.getPolyominoBounds( this.selectedPolyomino.shape );
            var shape_height = bounds.max.y + 1;

            for( var i = 0; i < this.selectedPolyomino.shape.length ; i++ )
            {

                var overlap = dojo.place( this.format_block('jstpl_overlap',{
                    id: `overlap_${i}`,
                }), this.selectedPolyomino.id);

                // transform from shape coordinates into HTML space
                var x = this.selectedPolyomino.shape[i].x;
                var y = this.selectedPolyomino.shape[i].y;

                x = x - bounds.min.x;
                y = shape_height - y - 1;

                x *= this.cellMeasurement;
                y *= this.cellMeasurement;

                dojo.style( overlap, "left", x + "px");
                dojo.style( overlap, "top", y + "px");

                this.selectedPolyomino.overlaps.push( overlap.id );

            }

        },

        fadeOutPolyominoPlacementUI: function()
        {
            dojo.query("#copen_wrapper .copen_behind_shadow_box").removeClass("copen_behind_shadow_box");

            dojo.query("#copen_wrapper #polyomino_placement").style("display","none");

            dojo.animateProperty({
                node: "shadow_box",
                duration: 500,
                properties: 
                {
                    opacity: {start: 0.5, end: 0},
                }
            }).play(); 
        },

        // SEND REQUEST TO SERVER TO TRY AND PLACE POLYOMINO
        //  or, in special circumstances, ask the player which cards they would like to discard first
        requestPlacePolyomino: function()
        {
            var color = this.getPolyominoColorFromId( this.selectedPolyomino.id );

            var coordinates = this.getCoordinatesFromId( this.cellToPlacePolyomino );
            var adjustedCoordinates = this.getAdjustedCoordinates( this.selectedPolyomino["shape"], coordinates);
            var gridCells = this.getGridCellsForPolyominoAtCoordinates( this.selectedPolyomino["shape"] , adjustedCoordinates );
            
            // CLIENT VALIDATION - CHECK FOR A VALID POSITION
            var validity = this.isValidPlacementPosition( gridCells );
            if( !validity ) return; // can't place polyomino if space isn't valid

            // SPECIAL CASE - CHOOSING DISCARD CARDS
            //  usually, the player doesn't need to pick which cards to discard
            //  but if they've used change of color, and have more cards than needed - they might care which ones are spent
            //  if that's the case, redirect them to choose which cards to discard
            if( this.changeColorsFromTo != null)
            {
                var cardsOfColor = this.countColoredCardsInHand( color );
                var cost = this.getCostOfShapeAtPosition( gridCells, color);

                // SEE IF WE CAN AUTOMATE DISCARDING
                //  It's a better experience for the player if they don't have to pick discards when there isn't a real choice
                //  there's two clear times for that:
                //  1. With the color change, they have the exact number of cards needed in hand
                //  2. They only have base cards or color changed cards
                if( cardsOfColor - cost > 0 && this.hasMixOfBaseCardsAndChangedColorCards(color))
                {
                    if( this.cardsToDiscard.length == 0 )
                    {
                        this.showSelectDiscardUI( color, cost );
                        return;
                    }
                    else if( this.cardsToDiscard.length < cost )
                    {
                        return;
                    }
                }
            }

            // SEND SERVER REQUEST
            this.ajaxcall( "/copenhagen/copenhagen/placePolyomino.html",
            {
                lock: true, 
                color: this.getPolyominoColorFromId( this.selectedPolyomino.id) ,
                squares: this.getPolyominoSquaresFromId( this.selectedPolyomino.id),
                copy:this.getPolyominoCopyFromId( this.selectedPolyomino.id),
                x:adjustedCoordinates.x,
                y:adjustedCoordinates.y,
                flip:this.selectedPolyomino["flip"],
                rotation:this.selectedPolyomino["rotation"],
                discards:this.cardsToDiscard.join(","),
            }, this, function( result ){} ); 

            // IF WE USED THE DISCARD UI, CLEAN UP THE HANDLERS NOW THAT WE'RE DONE WITH IT
            dojo.forEach( this.discardHandlers, dojo.disconnect);
        },

        positionPolyomino: function( coordinates )
        {

            // SET NODE WE'RE POSITIONING POLYOMINO AT
            this.cellToPlacePolyomino = dojo.query(`#copen_wrapper #player_${this.player_id}_playerboard .copen_board_cell_${coordinates.x}_${coordinates.y}`)[0].id;

            // CLEAR UP ANY OVERLAP FROM LAST POSITION
            this.hideOverlap();

            var color = this.getPolyominoColorFromId( this.selectedPolyomino.id );
            var adjustedCoordinates = this.getAdjustedCoordinates( this.selectedPolyomino["shape"], coordinates);
            var gridCells = this.getGridCellsForPolyominoAtCoordinates( this.selectedPolyomino["shape"] , adjustedCoordinates );

            // CLIENT VALIDATION - CHECK FOR A VALID POSITION
            var validity = this.isValidPlacementPosition( gridCells );
            this.styleSelectedPolyominoBasedOnValidity( validity, gridCells );

            // DETERMINE HTML PLACEMENT FOR POLYOMINO
            var polyominoNode = dojo.query(`#copen_wrapper #${this.selectedPolyomino.id}`)[0];
            var htmlPlacement = this.determineHtmlPlacementForPolyominoAtCells( polyominoNode, gridCells );

            var minGridCell = this.getMinGridCell( gridCells );
            var minGridCellNode = dojo.query(`#copen_wrapper #player_${this.player_id}_playerboard .copen_board_cell_${minGridCell.x}_${minGridCell.y}`)[0];


            var animation = this.slideToObjectPos( this.selectedPolyomino.id, minGridCellNode.id, htmlPlacement.htmlX, htmlPlacement.htmlY, 250 );
            animation.play();

        },

        // UPDATE THE POLYOMINO'S STYLE WITHOUT AFFECTING IT'S POSITION
        //  like when the polyomino is selected, and then the construction discount is applied
        updateSelectedPolyominoStyle: function()
        {
            this.hideOverlap();

            var coordinates = this.getCoordinatesFromId( this.cellToPlacePolyomino );
            var adjustedCoordinates = this.getAdjustedCoordinates( this.selectedPolyomino["shape"], coordinates);
            var gridCells = this.getGridCellsForPolyominoAtCoordinates( this.selectedPolyomino["shape"] , adjustedCoordinates );

            // CLIENT VALIDATION - CHECK FOR A VALID POSITION
            var validity = this.isValidPlacementPosition( gridCells );
            this.styleSelectedPolyominoBasedOnValidity( validity, gridCells );
        },

        dropPolyominoOnBoard: function()
        {

            try{

                // FIRST, SCOOT POLYOMINO TO BE FULLY ON BOARD (IF NEEDED)
                var boardCellsNode = dojo.query(`#copen_wrapper #player_${this.player_id}_playerboard .copen_board_cells`)[0];
                var polyominoNode = dojo.query(`#${this.selectedPolyomino.id}`)[0];

                boardCellsNodePosition = dojo.position( boardCellsNode, true );
                polyominoNodePosition = dojo.position( polyominoNode, true);

                // SCOOT LEFT OR RIGHT
                if( polyominoNodePosition.x < boardCellsNodePosition.x )
                {
                    var distance = boardCellsNodePosition.x - polyominoNodePosition.x;
                    this.adjustPositionHorizontally( polyominoNode, distance );
                }
                else if( polyominoNodePosition.x + polyominoNodePosition.w > boardCellsNodePosition.x + boardCellsNodePosition.w)
                {
                    var distance = (boardCellsNodePosition.x + boardCellsNodePosition.w) - (polyominoNodePosition.x + polyominoNodePosition.w);
                    this.adjustPositionHorizontally( polyominoNode, distance );
                }

                // SCOOT UP OR DOWN
                if( polyominoNodePosition.y < boardCellsNodePosition.y )
                {
                    var distance = boardCellsNodePosition.y - polyominoNodePosition.y;
                    this.adjustPositionHorizontally( polyominoNode, distance );
                }
                else if( polyominoNodePosition.y + polyominoNodePosition.h > boardCellsNodePosition.y + boardCellsNodePosition.h)
                {
                    var distance = (boardCellsNodePosition.y + boardCellsNodePosition.h) - (polyominoNodePosition.y + polyominoNodePosition.h);
                    this.adjustPositionHorizontally( polyominoNode, distance );
                }

                // FIND CELL CLOSEST TO THE POLYOMINO'S MIN HTML COORDINATE
                polyominoNodePosition = dojo.position( polyominoNode, true); // refresh the position after any scooting
                
                var originCell = dojo.query(`#copen_wrapper #player_${this.player_id}_playerboard .copen_board_cell_0_0`)[0];

                // LOOP THROUGH ALL COLUMNS TO SEE WHICH IS CLOSEST
                var minXIndex = 0;
                var minXDistance = Math.abs(polyominoNodePosition.x - dojo.position(originCell, true).x);

                for( var x = 1; x < this.boardWidth; x++)
                {
                    var cell = dojo.query(`#copen_wrapper #player_${this.player_id}_playerboard .copen_board_cell_${x}_0`)[0];
                    var distance = Math.abs(polyominoNodePosition.x - dojo.position(cell, true).x);

                    if( distance < minXDistance )
                    {
                        minXIndex = x;
                        minXDistance = distance;
                    }
                }

                // LOOP THROUGH ALL ROWS TO SEE WHICH IS CLOSEST
                var minYIndex = 0;
                var minYDistance = Math.abs( this.getYBottom(polyominoNode) - this.getYBottom(originCell) );

                for( var y = 1; y < this.boardHeight; y++)
                {
                    var cell = dojo.query(`#copen_wrapper #player_${this.player_id}_playerboard .copen_board_cell_0_${y}`)[0];
                    var distance = Math.abs( this.getYBottom(polyominoNode) - this.getYBottom(cell) );

                    if( distance < minYDistance )
                    {
                        minYIndex = y;
                        minYDistance = distance;
                    }
                }

                // ADJUST TO THE ORIGIN
                //  We have two placement systems:  the bottom corner of the html block
                //  and the bottom-left corner of the shape.
                //  We need to offset by the bottom-left corner of the shape
                var bounds = this.getPolyominoBounds( this.selectedPolyomino.shape );
                minXIndex -= bounds.min.x; 

                // WE'VE IDENTIFIED THE CELL TO POSITION THE POLYOMINO AT
                this.positionPolyomino( {x:minXIndex, y:minYIndex});


            } catch (error) {
                // bubble up errors that might not be shown, since this can be run in dojo animation's onEnd, which seems to silence errors
                console.error(error);
            }

        },

        adjustPositionHorizontally( node, amount )
        {
            if( amount == 0) return;

            var currentLeft = dojo.getStyle( node, "left");
            var newLeft = currentLeft + amount;
            dojo.style( node, "left", newLeft + "px");

        },

        adjustPositionVertically( node, amount )
        {
            if( amount == 0) return;

            var currentTop = dojo.getStyle( node, "top");
            var newTop = currentTop + amount;
            dojo.style( node, "top", newTop + "px");

        },


        // RETURNS BOTTOM Y POSITION OF NODE
        // I'm used to thinking as going up the screen as positive and down as negative, with origins at the bottom left corner.
        // But it's reversed in HTML.
        getYBottom: function( node )
        {
            var position = dojo.position( node, true );
            return position.y + position.h;
        },

        placePolyomino: function( polyominoData )
        {

            this.removeOverlap();

            var polyominoNodeId = `${polyominoData.color}-${polyominoData.squares}_${polyominoData.copy}`;
            var polyominoNode = dojo.query(`#copen_wrapper #${polyominoNodeId}`)[0];
            dojo.removeClass(polyominoNode, "copen_top_of_stack");
            dojo.style( polyominoNode, "z-index", 1);

            var boardCellNode = dojo.query(`#copen_wrapper #player_${polyominoData.owner}_playerboard .copen_board_cell_${polyominoData.x}_${polyominoData.y}`)[0];

            // DETERMINE HTML PLACEMENT FOR POLYOMINO
            var htmlPlacement = this.determineHtmlPlacementForPolyominoAtCell( polyominoNode, boardCellNode );

            this.attachToNewParent( polyominoNodeId, `player_${polyominoData.owner}_playerboard`);
            this.slideToObjectPos( polyominoNodeId, boardCellNode, htmlPlacement.htmlX, htmlPlacement.htmlY, 500 ).play();

            return dojo.byId( polyominoNodeId ); // since we attachToNewParent, that destroys the old node - so let's be kind and return the new
        },

        // get a copy of the shape,
        // since we'll be editng it with rotates and flips
        // and we don't want to mess with the orginal
        getCopyOfShape: function( polyominoName )
        {
            var originalShape = this.polyominoShapes[polyominoName];

            var copy = [];
            for( var i = 0; i < originalShape.length; i++ )
            {
                copy.push({x:originalShape[i].x,y:originalShape[i].y});
            } 
            return copy;
        },

        rotatePolyominoShape: function( polyominoShape )
        {
            for( var i = 0; i < polyominoShape.length; i++)
            {
                polyominoShape[i] = { x:polyominoShape[i].y, y:-polyominoShape[i].x};  
            } 

            return this.setNewShapeOrigin( polyominoShape ); 
        },

        flipPolyominoShape: function( polyominoShape )
        {
            for( var i = 0; i < polyominoShape.length; i++)
            {
                polyominoShape[i] = { x:-polyominoShape[i].x, y:polyominoShape[i].y};  
            } 

            return this.setNewShapeOrigin( polyominoShape ); 
        },

        // When we're rotating and flipping the shape,
        //   we create a new "shape" data list, and reorder it so the bottom-left square is the origin 
        setNewShapeOrigin: function( polyominoShape )
        {
            newOrigin = polyominoShape[0];

            // find the lowest, left-most square
            for( var i = 1; i < polyominoShape.length; i++)
            {
                if( 
                    polyominoShape[i].y < newOrigin.y 
                    || (polyominoShape[i].y == newOrigin.y && polyominoShape[i].x < newOrigin.x)
                )
                {
                    newOrigin = polyominoShape[i];
                }
            }

            // offset the other cells by so the lowest, left-most square is the origin
            for( var i = 0; i < polyominoShape.length; i++) 
            {
                polyominoShape[i] = { x:polyominoShape[i].x - newOrigin.x, y:polyominoShape[i].y - newOrigin.y};
            }

            return polyominoShape;
        },

        // Figure out what the css top and left coordinates should be for the polyomino if placed at the list of grid cells
        //   Passing polyomino is important - since sometimes we're positioning the selected polyomino, and sometimes the polyomino preview
        //   and the polyomino preview can't use the selected polyomino's properties while it's doing a rotation or flip animation
        determineHtmlPlacementForPolyominoAtCells: function( polyominoNode, gridCells )
        {
            // FIND THE GRID CELL AT MINX, MINY BOUNDARY
            var minGridCell = this.getMinGridCell( gridCells );

            var minCellNode = dojo.query(`#copen_wrapper #owned_player_area #board_cell_${minGridCell.x}_${minGridCell.y}`)[0];
            var minCellNodePosition = dojo.position(minCellNode);

            // POSITION POLYOMINO AT THAT GRID CELL
            var htmlX = 0;
            var htmlY = minCellNodePosition.h - dojo.position(polyominoNode).h;

            return {htmlX:htmlX, htmlY:htmlY, minCellNode:minCellNode};
        },

        determineHtmlPlacementForPolyominoAtCell: function( polyominoNode, boardCellNode )
        {

            // FIND THE GRID CELL AT MINX, MINY BOUNDARY
            var boardCellPosition = dojo.position(boardCellNode);

            // POSITION POLYOMINO AT THAT GRID CELL
            var htmlY = boardCellPosition.h - dojo.position(polyominoNode).h;

            return {htmlX:0, htmlY:htmlY };
        },

        animateCoatOfArms: function( coatOfArmsId, playerId )
        {
            var nodeName = `copen_coat_of_arms_${coatOfArmsId}_${playerId}`;

            dojo.style( nodeName, "z-index", 20);

            var animation = dojo.animateProperty({
                node: nodeName,
                duration: 500,
                properties: 
                {
                    opacity: {start: 0, end: 1},
                    propertyTransform: {start: 0.5, end: 1.25 }
                },
                onAnimate: function (values) {
                    dojo.style(nodeName, 'transform', `scale( ${ values.propertyTransform.replace("px","")} )`);
                },
            });

            dojo.connect( animation, "onEnd", function()
            {
                dojo.animateProperty({
                    node: nodeName,
                    duration: 500,
                    delay: 100,
                    properties: 
                    {
                        opacity: {start: 1, end: 0},
                    },
                    onEnd: function(){
                      dojo.style( nodeName, "z-index", 1);  
                    }
                }).play();
            });

            animation.play();
        },

        determineWhichAbilityTilesAreTakeable: function()
        {
            var game = this;
            dojo.query("#copen_wrapper .copen_ability_tile_stack .copen_ability_tile:last-child").forEach(function( abilityTile){
                var abilityName = abilityTile.id.split('-')[0];

                if( !game.ownsAbility(abilityName) ) dojo.addClass( abilityTile, "copen_usable" );
                else dojo.addClass( abilityTile, "copen_unusable" );
            });
        },

        ownsAbility: function( abilityName )
        {
            return dojo.query(`#copen_wrapper #owned_player_area .copen_${abilityName}`).length > 0;
        },

        setAbilityAsUsable: function (abilityName)
        {
            dojo.query(`#copen_wrapper #owned_player_area .copen_${abilityName}:not(.copen_used_ability)`).addClass("copen_usable");
        },

        setAbilityAsUnusable: function (abilityName)
        {
            dojo.query(`#copen_wrapper #owned_player_area .copen_${abilityName}:not(.copen_used_ability)`).addClass("copen_unusable");
        },

        deactivateUsedAbility: function( usedAbility, playerId)
        {
            dojo.query(`#copen_wrapper #copen_ability_slot_${usedAbility}_${playerId} .copen_${usedAbility}`)
                .removeClass("copen_activated")
                .removeClass("copen_usable")
                .addClass("copen_used_ability");
        },

        triggerAnyCardsAbility: function()
        {
            // SHOW ALL CARDS SELECTABLE
            dojo.query("#copen_wrapper #harbor_cards .copen_card.copen_unusable").removeClass("copen_unusable").addClass("copen_usable");

            // CHANGE THE INSTRUCTION TITLE TEXT
            this.gamedatas.gamestate.descriptionmyturn = _("You must take another card");
            this.updatePageTitle();
        },

        triggerChangeOfColorsAbility: function( fromColor, toColor)
        {

            this.changeColorsFromTo = {};
            this.changeColorsFromTo[fromColor] = toColor;

            dojo.query(`#copen_wrapper #cards_in_hand .copen_${fromColor}_card .copen_new_color`)
                .removeClass('copen_hidden')
                .addClass(`copen_${toColor}_card`);

            this.determineUsablePolyominoes();
        },

        clearChangeOfColorsAbility: function()
        {
            for( var i = 0; i < this.cardColorOrder; i++ )
            {
                dojo.query(`#copen_wrapper #cards_in_hand .copen_new_color`).removeClass( this.cardColorOrder[i]);
            }
            dojo.query(`#copen_wrapper #cards_in_hand .copen_new_color`).addClass("copen_hidden");

            this.changeColorsFromTo = null;
            this.cardsToDiscard = [];
            this.cellToPlacePolyomino = null;
        },

        fadeInHand: function()
        {

            dojo.style("shadow_box", "opacity","0"); 
            
            // set elements behind the shadow box
            dojo.query("#copen_wrapper #harbors").addClass("copen_behind_shadow_box");
            dojo.query("#copen_wrapper #deck_cards").addClass("copen_behind_shadow_box");
            dojo.query("#copen_wrapper #harbor_cards").addClass("copen_behind_shadow_box");
            dojo.query("#copen_wrapper #polyominoes").addClass("copen_behind_shadow_box");  
            dojo.query("#copen_wrapper #opponent_playerboards").addClass("copen_behind_shadow_box");  
            dojo.query(`#copen_wrapper #owned_player_area`).addClass("copen_behind_shadow_box"); 
            dojo.query("#copen_wrapper #ability_tile_stacks").addClass("copen_behind_shadow_box"); 

            dojo.animateProperty({
                node: "shadow_box",
                duration: 500,
                properties: 
                {
                    opacity: {start: 0, end: 0.5},
                }
            }).play();

        },

        showChangeOfColorsUI: function( selectedCard, baseColorName )
        {

            dojo.query("#copen_wrapper #change_of_colors_ui .copen_card").addClass(baseColorName);

            var queryIndex = 0;
            var cardColorOptionQuery = dojo.query("#copen_wrapper .copen_change_of_colors_option");
            for( var i = 0; i < this.cardColorOrder.length; i++ )
            {
                if( this.cardColorOrder[i] == baseColorName) continue; //skip the base color card.  i.e. - we won't show an option to change "green" into "green"
            
                var query = dojo.query(".copen_new_color", cardColorOptionQuery[queryIndex]).addClass(this.cardColorOrder[i]);

                queryIndex += 1;
            }

            dojo.style("change_of_colors_ui","display","block");
            this.placeOnObject( "change_of_colors_ui", selectedCard );
            dojo.style("change_of_colors_ui","left", "75px");

        },

        fadeOutChangeOfColorsUI: function()
        {
            dojo.query("#copen_wrapper .copen_behind_shadow_box").removeClass("copen_behind_shadow_box");

            dojo.query("#copen_wrapper .copen_change_of_colors_option .copen_red_card").removeClass("copen_red_card");
            dojo.query("#copen_wrapper .copen_change_of_colors_option .copen_yellow_card").removeClass("copen_yellow_card");
            dojo.query("#copen_wrapper .copen_change_of_colors_option .copen_green_card").removeClass("copen_green_card");
            dojo.query("#copen_wrapper .copen_change_of_colors_option .copen_blue_card").removeClass("copen_blue_card");
            dojo.query("#copen_wrapper .copen_change_of_colors_option .copen_purple_card").removeClass("copen_purple_card");

            dojo.query("#copen_wrapper #change_of_colors_ui").style("display","none");

            dojo.animateProperty({
                node: "shadow_box",
                duration: 500,
                properties: 
                {
                    opacity: {start: 0.5, end: 0},
                }
            }).play(); 
        },

        ///////////////////////////////////////////////////
        //// Player's action
        
        /*
        
            Here, you are defining methods to handle player's action (ex: results of mouse click on 
            game objects).
            
            Most of the time, these methods:
            _ check the action is possible at this game state.
            _ make a call to the game server
        
        */

        onTakeHarborCard: function( event )
        {

            dojo.stopEvent( event );



            // CLIENT-SIDE VALIDATION
            if( this.hasTooManyCardsInHand()) return; // doesn't work if your hand already has too many cards

            if( dojo.hasClass(event.currentTarget.id, "copen_unusable")) return; // doesn't work if the card isn't usable

            // SEND SERVER REQUEST
            if( this.checkAction('takeCard'))
            {
                var endPoint = "";
                if( this.stateName == "playerTurn") endPoint = "/copenhagen/copenhagen/takeCard.html";
                else if( this.stateName == "takeAdjacentCard") endPoint = "/copenhagen/copenhagen/takeAdjacentCard.html";
                else if( this.stateName == "takeAdditionalCard") endPoint = "/copenhagen/copenhagen/takeAdditionalCard.html";

                this.ajaxcall( endPoint,
                {
                    lock: true, 
                    card_id:event.currentTarget.id.split("_")[1],
                }, this, function( result ){} ); 
            }
 
        },

        onDiscardCardOverMaxHandSize: function( event )
        {
            dojo.stopEvent( event );

            // SEND SERVER REQUEST
            if( this.checkAction('discard'))
            {

                this.ajaxcall( "/copenhagen/copenhagen/discardDownToMaxHandSize.html",
                {
                    lock: true, 
                    card_id:event.currentTarget.id.split("_")[1],
                }, this, function( result ){} ); 
            }
        },

        onSelectPolyomino: function( event )
        {

            if( !dojo.hasClass(event.currentTarget, "copen_usable")) return; // make sure we can afford this polyomino before selecting it
            if( !this.checkAction('placePolyomino')) return;

            this.selectPolyomino( event.currentTarget);

            this.fadeInPolyominoPlacementUI(); // have to fade in the shadow box first - or the display:none css style won't allow the polyomino to slide to the target correctly

            this.putPolyominoOnPlacementLayer();            
            this.positionPolyomino( {x:0, y:0});

            this.showPositionPolyominoButtons();



        },

        onDragOver: function( event )
        {
            
            // MAKES CURSOR DIFFERENT
            //  If you don't include this, the cursor ends up looking like a "no" - a circle with a line through it
            dojo.stopEvent( event ); 
            event.dataTransfer.dropEffect = "move"; // I would love to use the "grabbing" hand - but I'm not sure how to keep it up - if that's even possible

            var adjustedClientXY = this.adjustPositionBasedOnZoom( event.clientX, event.clientY);
            this.dragClient = { x: adjustedClientXY.x, y: adjustedClientXY.y };
        },

        onDragStartPolyomino: function( event )
        {

            var target = event.currentTarget ?? event.customTarget;

            // disable the normal ghosting image by moving its position outside the window
            //  ignore for touchscreens
            if( event.currentTarget != null ) event.dataTransfer.setDragImage(target, window.outerWidth, window.outerHeight);

            if( !this.checkAction('placePolyomino')) return;
            if( !dojo.hasClass(target, "copen_usable")) return;

            dojo.style( target, "z-index", 20 );

            // IF WE HAVEN'T SELECTED THE POLYOMINO, DO IT NOW
            //  if we have selected it, no need to do it again
            if( this.selectedPolyomino == null )
            {
                this.selectPolyomino( target );
            }

            this.hideOverlap();
            
            this.hideTooltip();
            this.removeTooltip( this.selectedPolyomino.id);

            var adjustedClientXY = this.adjustPositionBasedOnZoom( event.clientX, event.clientY);
            this.dragPositionLastFrame = {x: adjustedClientXY.x, y:adjustedClientXY.y};
        },

        onTouchStartPolyomino: function( event )
        {

            // FAKE AN EVENT
            //  I tried all sorts of things to send an event along
            //  I tried event.currentTarget.dispatchEvent, which never caused the event code to fire
            //  I tried dojo.emit - but I don't know whether that's supported, or how to include it
            //  so we're just going to go with calling the other function directly, and adding some extra parameters to check
            //  would love to know how to do this properly.
            var syntheticEvent = new MouseEvent("ondragstart", {
                clientX: event.clientX,
                clientY: event.clientY,
            });

            syntheticEvent.customTarget = event.currentTarget;
            this.onDragStartPolyomino( syntheticEvent );

        },

        onDragPolyomino: function( event )
        { 

            if( this.selectedPolyomino == null ) return;

            // NOTE:
            //  Apparently, there's been a 13+ year discussion about the clientX and clientY values for ondrag in firefox (https://bugzilla.mozilla.org/show_bug.cgi?id=505521#c80)
            //  Currently, they always return 0 - so this event doesn't have much useful information
            //  We take the standard fix, which is to use the ondragover event to capture the mouse position, store it, and reuse it here
            if( this.dragClient.x == 0 && this.dragClient.y == 0) return;

            var movementX = this.dragClient.x - this.dragPositionLastFrame.x;
            var movementY = this.dragClient.y - this.dragPositionLastFrame.y;

            var polyominoNode = dojo.query(`#${ this.selectedPolyomino.id}`)[0];

            this.adjustPositionHorizontally( polyominoNode, movementX );
            this.adjustPositionVertically( polyominoNode, movementY );

            this.dragPositionLastFrame = {x:this.dragClient.x, y: this.dragClient.y};
        },

        onTouchMovePolyomino: function( event )
        {

            var syntheticEvent = new MouseEvent("ondrag");

            var adjustedClientXY = this.adjustPositionBasedOnZoom( event.clientX, event.clientY);
            this.dragClient = { x: adjustedClientXY.x, y: adjustedClientXY.y };

            this.onDragPolyomino( syntheticEvent );
        },

        onDragEndPolyomino: function( event )
        {

            dojo.stopEvent( event );
            if( this.selectedPolyomino == null ) return;

            
            // IF WE START WITH DRAG, WE DON'T TURN ON PLACEMENT UI IMMEDIATELY.
            //   do it now, if it hasn't been done
            if( dojo.getStyle("polyomino_placement", "display") == "none")
            {
                dojo.style("polyomino_placement","display","block");
                this.putPolyominoOnPlacementLayer();

                this.fadeInPolyominoPlacementUI();
                this.showPositionPolyominoButtons();
            }
            
            this.dropPolyominoOnBoard();
        },

        onTouchEndPolyomino: function( event )
        {
            var syntheticEvent = new MouseEvent("ondragend");

            this.onDragEndPolyomino( syntheticEvent );
        },


        onRotatePolyomino: function( event )
        {

            if( this.selectedPolyomino == null ) return;  // make sure a polyomino is selected

            var polyominoNode = dojo.query(`#copen_wrapper #${this.selectedPolyomino["id"]}`)[0];

            var flip = this.selectedPolyomino["flip"];  // need to pass this to a local variable to use it in animation scope

            var rotationDegrees = flip == 0 ? 90 : -90; // if flipped, we need to rotate the other way so that the shape still rotates clockwise

            // CODE SNIPPET FROM: https://forum.boardgamearena.com/viewtopic.php?t=15158
            var game = this;
            var animation = dojo.animateProperty({
                node: polyominoNode,
                duration: 500,
                properties: {
                    propertyTransform: {start: this.selectedPolyomino["rotation"], end: this.selectedPolyomino["rotation"] + rotationDegrees }
                },
                onAnimate: function (values) {
                    dojo.style(this.node, 'transform', 'rotateY(' + flip + 'deg) rotateZ(' + parseFloat(values.propertyTransform.replace("px", "")) + 'deg)' );
                },
                onEnd: function() {
                    game.dropPolyominoOnBoard();
                }
            });
            animation.play();

            // NOTE: we mod the rotation by 360 here to keep the value between 0 and 360 for simplicity's sake
            //  however, we don't do that in the animation, as animating from 270 -> 0 animates differently than 270 -> 360
            this.selectedPolyomino["rotation"] = (this.selectedPolyomino["rotation"] + rotationDegrees) % 360;
            if( this.selectedPolyomino["rotation"] < 0 ) this.selectedPolyomino["rotation"] += 360;

            this.rotatePolyominoShape( this.selectedPolyomino["shape"] );

            // prepare preview polyomino - set in final position
            dojo.style("polyomino_preview","transform", `rotateY(${this.selectedPolyomino["flip"]}deg) rotateZ(${this.selectedPolyomino["rotation"]}deg)`);

        },
        
        onFlipPolyomino: function( event )
        {

            if( this.selectedPolyomino == null ) return;  // make sure a polyomino is selected

            var polyominoNode = dojo.query(`#copen_wrapper #${this.selectedPolyomino["id"]}`)[0];

            var rotation = this.selectedPolyomino["rotation"]; // need to pass this to a local variable to use it in animation scope

            // CODE SNIPPET FROM: https://forum.boardgamearena.com/viewtopic.php?t=15158

            var endingFlipValue = (this.selectedPolyomino["flip"] + 180) % 360;

            var game = this;
            var animation = dojo.animateProperty({
                node: polyominoNode,
                duration: 500,
                properties: {
                    propertyTransform: {start: this.selectedPolyomino["flip"], end: endingFlipValue }
                },
                onAnimate: function (values) {
                    dojo.style(this.node, 'transform', 'rotateY(' + parseFloat(values.propertyTransform.replace("px", "")) + 'deg) rotateZ(' + rotation + 'deg)');
                },
                onEnd: function() {
                    game.dropPolyominoOnBoard();
                },                
            });
            animation.play();

            this.selectedPolyomino["flip"] = endingFlipValue;

            this.flipPolyominoShape( this.selectedPolyomino["shape"] );

            // prepare preview polyomino - set in final position
            dojo.style("polyomino_preview","transform", `rotateY(${this.selectedPolyomino["flip"]}deg) rotateZ(${this.selectedPolyomino["rotation"]}deg)`);

        },

        onPreviewPlacePolyomino: function( event )
        {

            this.clearPreview();

            if( this.selectedPolyomino == null ) return; // make sure a polyomino is selected

            // Sometimes I make my own mouse event and call this function
            //  I couldn't figure out how to define currentTarget, so instead I store it in 'customTarget'
            var targetId = "";
            if( event.currentTarget != null ) targetId = event.currentTarget.id;
            else if( event.customTarget != null ) targetId = event.customTarget.id;

            var coordinates = this.getCoordinatesFromId( targetId );
            var adjustedCoordinates = this.getAdjustedCoordinates( this.selectedPolyomino["shape"], coordinates);
            var gridCells = this.getGridCellsForPolyominoAtCoordinates( this.selectedPolyomino["shape"] , adjustedCoordinates );
            var validity = this.isValidPlacementPosition( gridCells );

            // SHOW IF INVALID
            if( !validity )
            {
                gridCells.forEach( function(cell, index){
                    var query = dojo.query(`#copen_wrapper #owned_player_area #board_cell_${cell.x}_${cell.y}`); // the backticks here are for "template literals" - in case I forget javascript has those
                    query.addClass("copen_preview").addClass("copen_invalid");
                });    
            }
            // SHOW IF VALID
            else
            {
                
                dojo.style("polyomino_preview","display","block"); // have to display node before placing it - or we can't get the height of it correctly for htmlPlacement

                var polyominoPreviewNode = dojo.query("#copen_wrapper #polyomino_preview")[0];
                var htmlPlacement = this.determineHtmlPlacementForPolyominoAtCells( polyominoPreviewNode, gridCells );

                this.slideToObjectPos( "polyomino_preview",htmlPlacement.minCellNode, htmlPlacement.htmlX, htmlPlacement.htmlY, 0).play(); // use this instead of placeOnObjectPos, as I placeOnObjectPos does centering I don't want

            }


        },

        onPolyominoMouseMovePassThrough: function( event )
        {
            var cellNode = this.getCellNodeAtPageCoordinate( {x:event.pageX, y:event.pageY});
            
            // WE'RE NOT GUARANTEED TO GET A CELL NODE
            // if the mouse moves outside that region of the screen
            if( cellNode == null )
            {
                this.clearPreview();
                return;
            }

            var passThroughEvent = new MouseEvent("onmouseover");
            passThroughEvent.customTarget = cellNode;

            this.onPreviewPlacePolyomino( passThroughEvent );        

        },

        onPolyominoMouseOutPassThrough: function( event )
        {
            var cellNode = this.getCellNodeAtPageCoordinate( {x:event.pageX, y:event.pageY});
            
            // WE'RE NOT GUARANTEED TO GET A CELL NODE
            // if the mouse is outside all cell nodes, hide the preview
            if( cellNode == null ) this.clearPreview();;     

        },

        onPolyominoClickPassThrough: function( event )
        {
            var cellNode = this.getCellNodeAtPageCoordinate( {x:event.pageX, y:event.pageY});
            
            // WE'RE NOT GUARANTEED TO GET A CELL NODE
            // if the mouse moves outside that region of the screen
            if( cellNode == null ) return;

            var passThroughEvent = new MouseEvent("onclick");
            passThroughEvent.customTarget = cellNode;

            this.onPositionPolyomino( passThroughEvent );        

        },            


        onCancelPolyominoPlacement: function( event )
        {
            if( this.selectedPolyomino == null ) return; 

            var color = this.getPolyominoColorFromId( this.selectedPolyomino.id);
            var squares = this.getPolyominoSquaresFromId( this.selectedPolyomino.id);
            var stackId = this.getStackIdFromPolyominoId( this.selectedPolyomino.id ); 

            dojo.style(this.selectedPolyomino.id, "transform", "rotateY(0deg) rotateZ(0deg)");
            dojo.removeClass( this.selectedPolyomino.id, "copen_invalid_placement"); // in case it was cancelled while in an invalid position

            this.attachToNewParent( this.selectedPolyomino["id"], stackId);
            this.slideToObjectPos( this.selectedPolyomino["id"], stackId, this.selectedPolyomino.originalPosition.l, this.selectedPolyomino.originalPosition.t, 500 ).play();

            // RECONNECT THE EVENTS
            var polyominoNode = dojo.query(`#copen_wrapper #${this.selectedPolyomino["id"]}`)[0];
            this.connectDraggingEventsToPolyomino( polyominoNode );

            this.removeOverlap();
            this.selectedPolyomino = null;
            this.fadeOutPolyominoPlacementUI();
            this.clearPreview();


            this.hidePositionPolyominoButtons()
        },

        onClearPreviewPolyomino: function( event )
        {
            this.clearPreview();
        },

        onPositionPolyomino: function( event )
        {
            if( this.selectedPolyomino == null ) return; // make sure a polyomino is selected
            if( !this.checkAction('placePolyomino')) return;


            // Sometimes I make my own mouse event and call this function
            //  I couldn't figure out how to define currentTarget, so instead I store it in 'customTarget'
            var targetId = "";
            if( event.currentTarget != null ) targetId = event.currentTarget.id;
            else if( event.customTarget != null ) targetId = event.customTarget.id

            var coordinates = this.getCoordinatesFromId( targetId );
            this.positionPolyomino( coordinates);
        },

        onConfirmPolyominoPlacement: function( event )
        {
            dojo.stopEvent( event );

            // CLIENT VALIDATION
            if( this.selectedPolyomino == null ) return; // make sure a polyomino is selected
            if( dojo.hasClass(event.currentTarget, "copen_button_disabled")) return;
            if( !this.checkAction('placePolyomino')) return;

            this.requestPlacePolyomino();
        },

        onSelectCardToDiscard: function(event)
        {

            dojo.addClass(event.currentTarget, "copen_activated");

            var card_id = event.currentTarget.id.split("_")[1];
            if( !this.cardsToDiscard.includes( card_id ))
            {
                this.cardsToDiscard.push( card_id );
                this.requestPlacePolyomino();
            }
            
        },

        onTakeAbilityTile: function( event )
        {
            dojo.stopEvent( event );

            // CHECK THEY DON'T ALREADY HAVE ONE
            if( dojo.hasClass(event.currentTarget, "copen_unusable"))
            {
                this.showMessage( _("You already own that ability"), 'error' );
                return;
            } 

            // SEND SERVER REQUEST
            if( this.checkAction('takeAbilityTile'))
            {

                var ability_name = event.currentTarget.id.split("-")[0];
                var copy = event.currentTarget.id.split("-")[1];

                this.ajaxcall( "/copenhagen/copenhagen/takeAbilityTile.html",
                {
                    lock: true, 
                    ability_name: ability_name,
                    copy: copy,
                }, this, function( result ){} ); 
            }
        },

        onActivateAbilityAnyCards: function( event )
        {
            // SPECIAL CASE - Do something different if the ability is used
            if( dojo.hasClass(event.currentTarget, "copen_used_ability")) return this.onResetUsedAbilities( event ); 

            if( !this.checkAction('activateAbilityAnyCards')) return;
            if( !dojo.hasClass( event.currentTarget, "copen_usable")) return;
            if( dojo.hasClass( event.currentTarget, "copen_activated")) return; // don't re-activate

            this.ajaxcall( "/copenhagen/copenhagen/activateAbilityAnyCards.html",
            {
                lock: true, 
            }, this, function( result ){} ); 

        },

        onActivateAbilityAdditionalCard: function( event )
        {
            // SPECIAL CASE - Do something different if the ability is used
            if( dojo.hasClass(event.currentTarget, "copen_used_ability")) return this.onResetUsedAbilities( event );

            if( !this.checkAction('activateAbilityAdditionalCard')) return;
            if( !dojo.hasClass( event.currentTarget, "copen_usable")) return;
            if( dojo.hasClass( event.currentTarget, "copen_activated")) return; // don't re-activate

            this.ajaxcall( "/copenhagen/copenhagen/activateAbilityAdditionalCard.html",
            {
                lock: true, 
            }, this, function( result ){} ); 

        },

        onActivateAbilityBothActions: function( event )
        {
            // SPECIAL CASE - Do something different if the ability is used
            if( dojo.hasClass(event.currentTarget, "copen_used_ability")) return this.onResetUsedAbilities( event );

            if( !this.checkAction('activateAbilityBothActions')) return;
            if( !dojo.hasClass( event.currentTarget, "copen_usable")) return;
            if( dojo.hasClass( event.currentTarget, "copen_activated")) return; // don't re-activate

            this.ajaxcall( "/copenhagen/copenhagen/activateAbilityBothActions.html",
            {
                lock: true, 
            }, this, function( result ){} ); 

        },

        onActivateAbilityConstructionDiscount: function( event )
        {
            // SPECIAL CASE - Do something different if the ability is used
            if( dojo.hasClass(event.currentTarget, "copen_used_ability")) return this.onResetUsedAbilities( event );

            if( !this.checkAction('activateAbilityConstructionDiscount')) return;
            if( !dojo.hasClass( event.currentTarget, "copen_usable")) return;
            if( dojo.hasClass( event.currentTarget, "copen_activated")) return; // don't re-activate

            this.ajaxcall( "/copenhagen/copenhagen/activateAbilityConstructionDiscount.html",
            {
                lock: true, 
            }, this, function( result ){} ); 

        },

        onActivateAbilityChangeOfColors: function( event )
        {
            // SPECIAL CASE - Do something different if the ability is used
            if( dojo.hasClass(event.currentTarget, "copen_used_ability")) return this.onResetUsedAbilities( event );

            // VALIDATION
            if( !this.checkAction('activateAbilityChangeOfColors')) return;
            if( !dojo.hasClass( event.currentTarget, "copen_usable")) return;
            if( dojo.hasClass( event.currentTarget, "copen_activated")) return; // don't re-activate
            if( dojo.query("#copen_wrapper #cards_in_hand .copen_card").length == 0 ) return; // can't use if you have no cards in hand
            

            // CHANGE OF COLORS DOES SOME UI WORK BEFORE TALKING TO THE SERVER
            this.fadeInHand();
            dojo.addClass(event.currentTarget, "copen_activated");

            this.gamedatas.gamestate.originaldescriptionmyturn = this.gamedatas.gamestate.descriptionmyturn;
            this.gamedatas.gamestate.descriptionmyturn = _("Select a color from your hand.");
            this.updatePageTitle();

            // SET CARDS AS USABLE WITH A CLICK EVENT
            dojo.query("#copen_wrapper #cards_in_hand .copen_card").addClass("copen_usable");
            var cardsInHandQuery = dojo.query("#copen_wrapper #cards_in_hand .copen_card"); 

            for( var i = 0; i < cardsInHandQuery.length; i++ )
            {
                // have to connect this a little differently, since we want to remove thse handlers later
                var handler = dojo.connect( cardsInHandQuery[i], "onclick", this, "onSelectColorFromHandToChange");
                this.changeOfColorsCardHandlers.push( handler ); 
            }

            // DISPLAY UNDO BUTTON
            dojo.style("undo","display","inline");


        },

        onSelectColorFromHandToChange: function ( event )
        {

            if( !this.checkAction('activateAbilityChangeOfColors')) return;

            var colorName = this.getColorNameOfCard( event.currentTarget );


            var color = colorName.split("_")[1];
            this.showChangeOfColorsUI( event.currentTarget, colorName );

            // GIVE INSTRUCTIONS
            this.gamedatas.gamestate.descriptionmyturn = _(`What treat ${color} cards as what color?`);
            this.updatePageTitle();
            
            // CLEAN UP EFFECTS ON CARDS IN HAND
            dojo.query("#copen_wrapper #cards_in_hand .copen_usable").removeClass("copen_usable");
            dojo.forEach( this.changeOfColorsCardHandlers, dojo.disconnect);

        },

        onSelectChangeOfColorsOption: function ( event )
        {

            if( !this.checkAction('activateAbilityChangeOfColors')) return;

            var fromColorName = this.getColorNameOfCard( dojo.query( ".copen_card", event.currentTarget)[0] );
            var fromColor = fromColorName.split("_")[1];

            var toColorName = this.getColorNameOfCard( dojo.query( ".copen_new_color", event.currentTarget)[0] );
            var toColor = toColorName.split("_")[1];

            this.ajaxcall( "/copenhagen/copenhagen/activateAbilityChangeOfColors.html",
            {
                lock: true, 
                from_color: fromColor,
                to_color: toColor,
            }, this, function( result ){} ); 

            this.fadeOutChangeOfColorsUI();

            this.gamedatas.gamestate.descriptionmyturn = this.gamedatas.gamestate.originaldescriptionmyturn;
            this.updatePageTitle();

        },

        onResetUsedAbilities: function( event )
        {
            if( !this.checkAction('resetUsedAbilities')) return;
            if( !dojo.hasClass( event.currentTarget, "copen_usable")) return;

            this.ajaxcall( "/copenhagen/copenhagen/resetUsedAbilities.html",
            {
                lock: true, 
            }, this, function( result ){} ); 
        },


        onUndo: function( event )
        {

            if( !this.checkAction('undo')) return;

            this.ajaxcall( "/copenhagen/copenhagen/undo.html",
            {
                lock: true, 
            }, this, function( result ){} ); 

        },

        onEndTurn: function( event )
        {

            if( !this.checkAction('endTurn')) return;

            this.ajaxcall( "/copenhagen/copenhagen/endTurn.html",
            {
                lock: true, 
            }, this, function( result ){} ); 

        },

        
        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        /*
            setupNotifications:
            
            In this method, you associate each of your game notifications with your local method to handle it.
            
            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your copenhagen.game.php file.
        
        */
        setupNotifications: function()
        {
                     
            dojo.subscribe( 'takeCard', this, 'notif_takeCard' );

            dojo.subscribe( 'discardDownToMaxHandSize', this, 'notif_discardDownToMaxHandSize' );

            dojo.subscribe( 'refillHarbor', this, 'notif_refillHarbor' );
            this.notifqueue.setSynchronous( 'refillHarbor', 500 );

            dojo.subscribe( 'placePolyomino', this, 'notif_placePolyomino' );

            dojo.subscribe( 'takeAbilityTile', this, 'notif_takeAbilityTile' );

            dojo.subscribe( 'activateAbility', this, 'notif_activateAbility' );
            dojo.subscribe( 'activateAbilityChangeOfColors', this, 'notif_activateAbilityChangeOfColors' );

            dojo.subscribe( 'usedAbility', this, 'notif_usedAbility' );

            dojo.subscribe( 'resetUsedAbilities', this, 'notif_resetUsedAbilities' );

            dojo.subscribe( 'updateScore', this, 'notif_updateScore' );
        },  
        
        // TODO: from this point and below, you can write your game notifications handling methods

        notif_takeCard: function(notif)
        {

            // IF ITS YOUR CARD
            if( notif.args.player_id == this.player_id )
            {
                var card = this.attachToNewParent( `card_${notif.args.card_id}`, "cards_in_hand");
                dojo.place( card, "cards_in_hand", this.findPositionForNewCardInHand( card ));

                this.splayCardsInHand();
            }

            // IF ITS AN OPPONENTS CARD
            else
            {
                this.slideToObjectAndDestroy( `card_${notif.args.card_id}`, `player_hand_size_${notif.args.player_id}`)
            }

            // UPDATE CARD AMOUNT UI
            dojo.query(`#player_board_${notif.args.player_id} .copen_hand_size_number`)[0].textContent = notif.args.hand_size;

        },

        notif_discardDownToMaxHandSize: function(notif)
        {
            // IF IT'S YOUR CARD
            if( notif.args.player_id == this.player_id )
            {
                this.animateDiscard( `card_${notif.args.card_id}` );
            }

            // UPDATE CARD AMOUNT UI
            dojo.query(`#player_board_${notif.args.player_id} .copen_hand_size_number`)[0].textContent = notif.args.hand_size;
        },

        notif_refillHarbor: function(notif)
        {

            // JAVASCRIPT NOTE 
            //  we're doing a loop over a delayed closure - which would usually have issues
            //  as when the closure function fires, it'd just be using the last value of "cardId" for every call - not what we want
            //  but in javascript, if we replace "var" with "let" in the loop, it instead keeps ahold of each value of cardId for each seperate loop 
            var index = 0;
            for( let cardId in notif.args.harbor ) 
            {
                var game = this;
                setTimeout( function(){
                    game.makeHarborCard( notif.args.harbor[cardId]);
                }, index * this.animationTimeBetweenRefillHaborCards );
                index ++;
            }

            if( notif.args.mermaid_card == "deck" && dojo.query("#copen_wrapper #small_mermaid_card").length > 0)
            {
                var game = this;
                setTimeout( function(){
                    game.playShuffleDeckAnimation( notif.args.cards_in_deck );
                }, 200);
            } 
            else
            {
              this.updateDeckDisplay( notif.args.cards_in_deck);  
            }
            
        },

        notif_placePolyomino: function(notif)
        { 

            var polyominoData = notif.args.polyomino;
            var polyominoId = `${polyominoData.color}-${polyominoData.squares}_${polyominoData.copy}`;
            dojo.style(
                polyominoId, 
                "transform", 
                `rotateY(${polyominoData.flip}deg) rotateZ(${polyominoData.rotation}deg)`
            );

            this.placePolyomino( polyominoData );

            // handle the new top of stack
            var stackId = this.getStackIdFromPolyominoId( polyominoId );
            var newTopOfStack = this.determineTopPolyominoInStack( stackId );         
            if( newTopOfStack != null )
            {
                dojo.connect( newTopOfStack, "onclick", this, this.selectPolyominoEventHandlerName );
                this.connectDraggingEventsToPolyomino( newTopOfStack );
            }

            // UPDATE STACK TOOLTIPS
            this.updatePolyominoStackTooltips();

            // CLEAN UP POSITION UI
            if( this.player_id == notif.args.player_id)
            {
              this.fadeOutPolyominoPlacementUI(); // NOTE: this needs to come after polyomino placement, or it messes up where the polyomino ends up
              this.playerboard = notif.args.playerboard;  
            } 

            this.selectedPolyomino = null;

            // HANDLE DISCARDS FOR ACTIVE PLAYER
            if( notif.args.player_id == this.player_id )
            {
                var game = this;
                notif.args.discards.forEach( function( card_id ){
                    game.animateDiscard( `card_${card_id}` );
                });
            }

            // UPDATE CARD AMOUNT UI
            dojo.query(`#player_board_${notif.args.player_id} .copen_hand_size_number`)[0].textContent = notif.args.hand_size;
            

            // SHOW FEEDBACK FOR COAT OF ARMS
            for( var coat_of_arms_id_key in notif.args.coat_of_arms_ids )
            {
                var coat_of_arms_id = notif.args.coat_of_arms_ids[ coat_of_arms_id_key];
                this.animateCoatOfArms( coat_of_arms_id, notif.args.player_id );
            }

        },

        notif_takeAbilityTile: function(notif)
        {
            var abilityTileId = `${notif.args.ability_name}-${notif.args.copy}`;
            var parentId =  `copen_ability_slot_${notif.args.ability_name}_${notif.args.player_id}`;

            this.attachToNewParent( abilityTileId, parentId );
            this.slideToObject( abilityTileId, parentId, 500  ).play();

            // CONNECT THE TAKEN ABILITY TILE TO ITS NEW CLICK EVENT
            dojo.query(`#copen_wrapper #${abilityTileId}`).connect( 'onclick', this, this.abilityEventHandlers[notif.args.ability_name]);

            // CONNECT THE NEXT ABILITY TILE IN THE STACK TO CLICK EVENT
            dojo.query(`#copen_wrapper #ability_tile_stack_${notif.args.ability_name} .copen_ability_tile:last-child`).connect( 'onclick', this, 'onTakeAbilityTile');
            

            // REAPPLY TOOLTIPS
            this.updateSpecialAbilityTooltips();

        },

        notif_activateAbility: function(notif)
        {

            var node = dojo.query(`#copen_wrapper #copen_ability_slot_${notif.args.ability_name}_${notif.args.player_id} .copen_ability_tile`)[0];
            dojo.addClass( node, "copen_activated");

            // SPECIAL CASE FOR ANY CARDS
            if( this.stateName == "takeAdjacentCard" && notif.args.ability_name == "any_cards") this.triggerAnyCardsAbility();

            // SPECIAL CASE FOR CONSTRUCTION DISCOUNT
            if( notif.args.ability_name == "construction_discount")
            {
                this.hasConstructionDiscounted = true;
                this.determineUsablePolyominoes();

                // IF HAS SELECTED POLYOMINO, ALSO SET STYLE ON THAT
                if( this.selectedPolyomino != null ) this.updateSelectedPolyominoStyle();

            }

            dojo.style("undo","display","inline");
        },

        notif_activateAbilityChangeOfColors: function(notif)
        {

            var node = dojo.query(`#copen_wrapper #copen_ability_slot_${notif.args.ability_name}_${notif.args.player_id} .copen_ability_tile`)[0];
            dojo.addClass( node, "copen_activated");

            this.triggerChangeOfColorsAbility(notif.args.from_color, notif.args.to_color);

            dojo.style("undo","display","inline");
        },

        notif_usedAbility: function(notif)
        {
            // DEACTIVATE ANY USED UP ABILITIES
            this.deactivateUsedAbility( notif.args.used_ability, notif.args.player_id);
        },

        notif_resetUsedAbilities: function(notif)
        {
            dojo.query(`#copen_wrapper #ability_tile_area_${notif.args.player_id} .copen_used_ability`).removeClass("copen_used_ability");    
        },


        notif_updateScore: function(notif)
        {
            this.scoreCtrl[ notif.args.player_id ].toValue( notif.args.score );
        },



        // SCRIPT FOR PUTTING PICTURES IN LOG
        // from: https://en.doc.boardgamearena.com/BGA_Studio_Cookbook#Inject_images_and_styled_html_in_the_log
        /* @Override */
        format_string_recursive : function(log, args) {

            try {
                if (log && args && !args.processed) {
                    args.processed = true;
                    
                    for ( var i in this.preprocess_string_keys) {

                        var key = this.preprocess_string_keys[i];

                        // HANDLE KEYS IN TITLE MESSAGES
                        //  the strings in title messages are not passed through args, so work on the log function directly
                        log = this.preProcessTitle( log );

                        // HANDLE KEYS IN LOG MESSAGES
                        //  keys in log messages get passed into args directly
                        if(key in args) 
                        {  
                            args[key] = this.preProcessLog(key, args); 
                        }                           
                    }

                }
            } catch (e) {
                console.error(log,args,"Exception thrown", e.stack);
            }
            return this.inherited(arguments);
        },

        preProcessLog(key, args)
        {

            switch(key)
            {
                case 'log_polyomino':
                    return this.preProcessLogPolyomino( key, args );

                case 'log_ability_tile':
                    return this.preProcessLogAbilityTile( key, args );

                case 'title_special_facade_tile':
                    return this.preProcessTitleFormatStringSpecialFacadeTile( key, args);
            }
        },

        preProcessLogPolyomino( key, args )
        {

            var color = args[key].split("-")[0];
            var squares = args[key].split("-")[1];

            return this.format_block('jstpl_log_polyomino',{
                color: color,
                squares: squares,                
            }); 
        },

        preProcessLogAbilityTile( key, args )
        {
            return this.format_block('jstpl_log_ability_tile',{
                log_ability_tile: args[key],               
            }); 
        },

        preProcessTitle( title )
        {

            title = this.preProcessTitleSpecialFacadeTile( title );
            title = this.preProcessSpecialAbilityTile( title );
            title = this.preProcessSpecialAbilityTileUsed( title );

            return title;
        },

        preProcessTitleSpecialFacadeTile( title )
        {
            return title.replace(
                "${title_special_facade_tile}",
                this.format_block('jstpl_title_special_facade_tile',{})
            ); 
        },

        preProcessSpecialAbilityTile( title )
        {
            return title.replace(
                "${title_ability_tile}",
                this.format_block('jstpl_title_special_ability_tile',{})
            ); 
        },

        preProcessSpecialAbilityTileUsed( title )
        {
            return title.replace(
                "${title_ability_tile_used}",
                this.format_block('jstpl_title_special_ability_tile_used',{})
            ); 
        },




   });             
});
