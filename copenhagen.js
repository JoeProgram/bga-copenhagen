
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
 * This file handles all the interactions of the client-side logic and communication with the server. 
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
	
		
		// Defines global variables and data structures used throughout the client
        constructor: function(){

			// global variables about the layout of the boards and basic game rules
            this.boardWidth = 5;
            this.boardHeight = 9;
            this.playerboard = [];
            this.cellMeasurement = 34;
            this.cardWidth = 66;
            this.cardHeight = 101;
            this.cardSplayDistance = 24;
            this.cardHorizontalSpacing = 20;
            this.colorChangeUITop = 360;
            this.maxHandSize = 7;
			this.whitePolyominosPerStack = 3;
			
			// magic numbers for animation timing
			this.discardAnimationTime = 500;
            this.animationTimeBetweenRefillHaborCards = 100;
            this.animationTimeBetweenCardSpread = 25;

			// Determines how extreme the 3d effect of card hovering is
            this.cardXAxisRotationFactor = 1/4.0;
            this.cardYAxisRotationFactor = 1/2.0;

            this.stateName = "";

			// since the cards in this game are just simple colors and have no special abilities, we can automatically sort them for the player to make counting easier.
			// here we sort them by rainbow order
            this.cardColorOrder = ["copen_red_card", "copen_yellow_card", "copen_green_card", "copen_blue_card", "copen_purple_card"];
    
    		// when checking adjacent spots on the playerboard,
    		// we check right, down, left, and up - mathematically defined here as a list of objects
            this.adjacentOffsets = [{x:1,y:0}, {x:0,y:-1}, {x:-1,y:0}, {x:0,y:1}];

            // Players on BGA often play without reading all the rules
            // The mermaid card rule is the one that consistenly catches them off-guard when the game seems to suddenly end
            // so we add some extra effects to help warn players that it's coming
            this.mermaidCardWarningThreshold = 10;
            this.mermaidCardWarningAnimation = null;

            // keys in the log that we do custom pre-processing on
            // this allows us to put pictures in the game log, which is a lot better player experience than saying
           	// "4-square purple facade tile"
            this.preprocess_string_keys = [
                'log_polyomino', 
                'log_ability_tile',
            ]; 

			// A dictionary of polyonimno shapes as represented by local coordinates
			// We manipulate these during rotation and flipping to help the client keep track of valid or invalid placements,
			// as well as color adjacency bonuses
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

			// a data structure to represent the player's polyomino that they're actively placing
            this.selectedPolyomino = null;

			// surprisingly, dragging still doesn't have great cross-browser support.
			// we need to store a little extra data to help out mobile systems and firefox drag properly.
            this.dragClient = {x:0, y:0 }; //used to pass the data of the dragged objects position from onDragOver to other DragEvents
            this.dragPositionLastFrame = {x:0, y:0};
            this.isMobileDragging = 0; // there's a separate system for dragging on mobile. This keep tracks whether the drag has actually started.

			// these are the 5 abilities in the game
			// storing in them a dictionary makes the setup code cleaner
            this.abilityEventHandlers = {
                "any_cards":"onActivateAbilityAnyCards",
                "additional_card":"onActivateAbilityAdditionalCard",
                "construction_discount":"onActivateAbilityConstructionDiscount",
                "change_of_colors":"onActivateAbilityChangeOfColors",
                "both_actions":"onActivateAbilityBothActions",
            };

			// track flags and event handlers - particularly event handlers that are dynamic (like on discarding cards from the hand)
			this.maxHandSizeDiscardHandlers = []; // keep track of the events we attach to cards to allow the player to discard - since we'll want to disconnect them afterwards
            this.hasConstructionDiscounted = false;
            this.changeOfColorsCardHandlers = []; // keep track of the click handles attached to the hand of cards (doing it this way since cards in hand change all the time)
            this.changeColorsFromTo = null;
            this.cardsToDiscard = [];
            this.cellToPlacePolyomino = null;
            this.discardHandlers = []; // keep track of click handles attached to cards in hand when choosing which cards to discard



        },
        
        /*
            setup:
            
            This method must set up the game user interface according to current game situation specified
            in parameters.
            
            The method is called each time the game interface is displayed to a player, ie:
            _ when the game starts
            _ when a player refreshes the game page (F5)
            
            "gamedatas" argument contains all datas retrieved by the "getAllDatas" PHP method.
        */
        
        setup: function( gamedatas )
        {
            // DEBUG - see all game data in console
            // console.log( gamedatas);

            // INITALIZE VALUES
            //  To support undo, these need to be initialized here
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
            //  the cards players can choose from
            for( var card_id in gamedatas.harbor )
            {
                this.makeHarborCard( gamedatas.harbor[card_id] );
            }

            // UI PLAYER_BOARDS
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
                
                this.displayNumberOfCardsInHand(player_id, gamedatas.hand_sizes[player_id]); // add tooltips too
            }
            

            // PLAYERBOARD DATA OBJECT
            //  these are the buildings players place their polyominoes down on
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

                // ABILITY - CONSTRUCTION DISCOUNT
                if( abilityName == "construction_discount")
                {
                    this.hasConstructionDiscounted = true;
                    this.determineUsablePolyominoes();
                }

				// ABILITY - CHANGE OF COLORS
                if( abilityName == "change_of_colors")
                {
                    this.triggerChangeOfColorsAbility( this.gamedatas.change_of_colors.from_color, this.gamedatas.change_of_colors.to_color);
                }

            }


            // TOOLTIPS
            this.updateSpecialAbilityTooltips();
            
            
            // CONNECT INTERACTIVE ELEMENTS
            
            // Only the top polyomino in each stack should be interactible
            this.determineTopPolyominoInEveryStack();

			// NEEDED FOR PROPER DRAGGING CURSOR
            dojo.query("#copen_wrapper").connect( 'ondragover', this, 'onDragOver');

            var game = this;
            dojo.query("#copen_wrapper #harbor_cards .copen_card").forEach( function(x){ game.connectMouseOverEventsToCard(x); });    

			// CONNECT EVENTS TO POLYOMINOES
			// To support clicking and dragging, many events are needed
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'onclick', this, "onSelectPolyomino"); 
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'ondragstart', this, "onDragStartPolyomino"); 
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'ontouchstart', this, "onTouchStartPolyomino"); 
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'ondrag', this, "onDragPolyomino"); 
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'ontouchmove', this, "onTouchMovePolyomino"); 
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'ondragend', this, "onDragEndPolyomino"); 
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'ontouchend', this, "onTouchEndPolyomino"); 
            
            // CONNECT EVENTS TO PLAYER BOARD
            //	If the player isn't dragging, they're clicking on the polyomino, then clicking on the board to place it
            //  so the playerboard also needs to respond to events
            dojo.query("#copen_wrapper #owned_player_area .copen_board_cell").connect( 'onclick', this, 'onPositionPolyomino');
            dojo.query("#copen_wrapper #owned_player_area .copen_board_cell").connect( 'onmouseover', this, 'onPreviewPlacePolyomino');
            dojo.query("#copen_wrapper #owned_player_area .copen_board_cells").connect( 'onmouseout', this, 'onClearPreviewPolyomino');            
            
            // POLYOMINO TRANSFORMATION BUTTONS
            dojo.query("#copen_wrapper #polyomino_rotate_button").connect( 'onclick', this, 'onRotatePolyomino');
            dojo.query("#copen_wrapper #polyomino_flip_button").connect( 'onclick', this, 'onFlipPolyomino');

            // CHANGE OF COLORS UI
            dojo.query("#copen_wrapper .copen_change_of_colors_option").connect('onclick', this, 'onSelectChangeOfColorsOption' );
            dojo.query("#copen_wrapper .copen_change_of_colors_option .copen_card").forEach( function(x){ game.connectMouseOverEventsToCard(x); });

            //CLICKING ABILITY TILES
            dojo.query("#copen_wrapper .copen_ability_tile_stack .copen_ability_tile:last-child").connect( 'onclick', this, 'onTakeAbilityTile');
            dojo.query("#copen_wrapper #owned_player_area .copen_any_cards").connect( 'onclick', this, 'onActivateAbilityAnyCards');
            dojo.query("#copen_wrapper #owned_player_area .copen_additional_card").connect( 'onclick', this, 'onActivateAbilityAdditionalCard');
            dojo.query("#copen_wrapper #owned_player_area .copen_both_actions").connect( 'onclick', this, 'onActivateAbilityBothActions');
            dojo.query("#copen_wrapper #owned_player_area .copen_construction_discount").connect( 'onclick', this, 'onActivateAbilityConstructionDiscount');
            var query = dojo.query("#copen_wrapper #owned_player_area .copen_change_of_colors").connect( 'onclick', this, 'onActivateAbilityChangeOfColors');

            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();

			// SAFARI SPECIFIC SETUP
            if( dojo.isSafari ) this.adjustAbilityTilesForSafari();

			// REPLAY SPECIFIC SETUP
			if( dojo.byId("archivecontrol").children.length != 0 ) dojo.style("shadow_box","display","none");

            //console.log( "Ending game setup" );

        },    

        ///////////////////////////////////////////////////
        //// Game & client states
        
        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  Use this method to perform some user interface changes at this moment.
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

		// REMOVE INTERACTIVE ELEMENTS IF ITS NO LONGER THE PLAYERS TURN
        onLeavingPlayerTurn()
        {
            dojo.query("#copen_wrapper .copen_card.copen_usable").removeClass("copen_usable");
            dojo.query("#copen_wrapper .copen_card.copen_unusable").removeClass("copen_unusable");
            dojo.query("#copen_wrapper .copen_polyomino.copen_usable").removeClass("copen_usable");
            dojo.query("#copen_wrapper .copen_polyomino.copen_unusable").removeClass("copen_unusable");
        },

		// IF THE PLAYER HAS TOO MANY CARDS, GO TO A SPECIAL GAME STATE
        onEnteringStateDiscardDownToMaxHandSize( args )
        {

            if( args.active_player != this.player_id ) return;

            this.fadeInHand();
            this.spreadCardsHorizontally();

            dojo.addClass("hand","copen_over_max_hand_size");
            dojo.query("#copen_wrapper #cards_in_hand .copen_card").addClass("copen_usable");

            var cardsInHandNode = dojo.query("#copen_wrapper #cards_in_hand")[0]; 
            var cardsInHand = this.getChildElementNodes( cardsInHandNode );

            for( var i = 0; i < cardsInHand.length; i++ )
            {
                // have to connect this a little differently, since we want to remove these handlers later
                var handlers = this.connectMouseOverEventsToCard( cardsInHand[i]);
                handlers.push( dojo.connect( cardsInHand[i], "onclick", this, "onDiscardCardOverMaxHandSize"));
                
                this.maxHandSizeDiscardHandlers = this.maxHandSizeDiscardHandlers.concat( handlers ); 
            }

        },

        onLeavingStateDiscardDownToMaxHandSize()
        {

            // FADE SHADOW BOX
            dojo.animateProperty({
                node: "shadow_box",
                duration: 500,
                properties: 
                {
                    opacity: {start: 0.5, end: 0},
                },

                // CLEAR BEHIND SHADOW BOX PROPERTY
                //  we do this on end so the elements don't pop in too early
                onEnd: function(){
                    dojo.query("#copen_wrapper .copen_behind_shadow_box").removeClass("copen_behind_shadow_box");
                },
            }).play();


            dojo.removeClass("hand","copen_over_max_hand_size");
            dojo.forEach( this.maxHandSizeDiscardHandlers, dojo.disconnect);
            dojo.query("#copen_wrapper .copen_usable").removeClass("copen_usable");

            this.splayCardsInHand();
        },

		// ONCE A PLAYER HAS TAKEN A CARD
		//  they usually have to take an adjacent one, so the set of valid choices changes
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

		// THIS SPECIAL ABILITY LETS THE PLAYER TAKE ANY CARD
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

		// LAST CALL STATES ARE SPECIAL REMINDER STATES
		//  We try to be generous to the player, since in the physical game players can be pretty sloppy with the order of doing actions and turning over tiles
		//  To help simulate that workflow, we call out possible tiles the player might have meant to use, rather than assuming to skip past them
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

		// A special ability lets the player place a polyomino after taking cards
		//  but its a special state, as some of the actions are no longer available
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


		// PLAYER HAS EARNED A COAT OF ARMS
		//  Coats of arms fuel the special abilities in the game,
		//  and its possible to earn several at once, or chain from one into another.
        onEnteringCoatOfArms( args )
        {

            if( args.active_player != this.player_id ) return;


            dojo.query("#copen_wrapper .copen_white_polyomino.copen_top_of_stack").addClass( "copen_usable");
            dojo.query("#copen_wrapper #owned_player_area .copen_used_ability").addClass("copen_usable");
            
            // SPECIAL CASE - ALLOW IMAGE TO BE CLICKABLE IN HEADER
            //   a user has reported trying to use the ability tile image in the header as a button
            //   hey - why not?  Otherwise clicking it does nothing, which isn't useful.
            if( this.hasUsedAbility())
            {
                dojo.query(".copen_title_ability_tile_used").addClass("copen_usable").connect("onclick", this, "onResetUsedAbilities");
            }

            this.determineWhichAbilityTilesAreTakeable();



        },

        onLeavingCoatOfArms()
        {
            dojo.query("#copen_wrapper .copen_polyomino.copen_usable").removeClass("copen_usable");
            dojo.query("#copen_wrapper .copen_polyomino.copen_unusable").removeClass("copen_unusable");
            dojo.query("#copen_wrapper #owned_player_area .copen_used_ability").removeClass("copen_usable");
        },

        // ALSO RESETS VARIABLES - PREP FOR NEXT TURN
        //  we always enter refill Harbor at the end of a turn, so we use it to do some client side cleanup
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



        // onUpdateActionButtons: in this method that manages "action buttons" that are displayed in the
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

		// LERP
        lerp( low, high, percent)
        {
            return low * (1 - percent) + high * percent;
        },

		// DISTANCE FORMULA
		distance( x1, y1, x2, y2 )
		{
			return Math.sqrt( Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2 ) );
		},

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

		// DISPLAY HOW MANY CARDS REMAIN IN THE DECK
		//  In the physical game you're allowed to count the cards, so this makes it easier
		//	Also adds tooltips to help explain how the end of game works for players who are caught off guard
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

		// CALL OUT THAT THE DECK IS ALMOST OUT OF CARDS
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


		// THE SMALL MERMAID CARD SIGNIFIES TO PLAYERS
		//  whether the deck will be reshuffled once more or not
        isSmallMermaidCardVisible: function()
        {

            var query = dojo.query("#copen_wrapper #small_mermaid_card");

            return query.length != 0 ;
        },

		// SHOW THE DECK BEING SHUFFLED
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

		// 3D HOVER EFFECTS FOR CARDS IN THE HARBOR
        connectMouseOverEventsToCard: function( cardNode )
        {
            var handlers = []
            handlers.push( dojo.connect(cardNode, 'onmousemove', this, "onMouseMoveHarborCard"));
            handlers.push( dojo.connect(cardNode, 'onmouseout', this, "onMouseOutHarborCard"));
            return handlers;
        },

		// CLEAN UP 3D HOVER EFFECTS
        resetCard3DRotation: function( cardNode )
        {
            dojo.style(cardNode, "transform", "");
            dojo.style(cardNode, "filter", "");
            dojo.style(cardNode.children[0], "transform", "");
            dojo.style(cardNode.children[1], "transform", "");  
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

        // IMMEDIATELY CLOSE TOOLTIPS
        //  tooltips and dragging don't play together well
        hideTooltip() { 
            var node = dojo.byId("dijit__MasterTooltip_0");
            if( node )
            {
                dojo.addClass( node ,"copen_hidden");  
            } 
        },

		// PULL A CARD FROM THE DECK
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

                this.connectMouseOverEventsToCard( card );    

        },

		// DETERMINE COLOR OF CARD
        getColorNameOfCard: function( node )
        {

            for( var i = 0; i < this.cardColorOrder.length; i++ )
            {
                if( dojo.hasClass(node, this.cardColorOrder[i])) return this.cardColorOrder[i];
            }

        },

        /********************** CARDS IN HAND INFORMATION ******************************/

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

        getColorNamesInHand: function()
        {

            var colorsInHand = [];
            for( var i = 0; i < this.cardColorOrder.length ; i++ )
            {
                var color = this.cardColorOrder[i].split("_")[1]; // get the name of the color without the class prefix or suffix
                if( this.countColoredCardsInHand( color ) > 0 ) colorsInHand.push( this.cardColorOrder[i]);
            }

            return colorsInHand;
        },

		// HOW MANY OF A COLOR DOES THE PLAYER HAVE?
        countColoredCardsInHand: function( color )
        {
            return this.getNodeListOfColoredCardsInHand( color ).length;
        },

		// WHICH CARDS OF A PARTICULAR COLOR DOES THE PLAYER HAVE?
		//  includes cards that have had their color temporarily changed
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

		// DOES THE PLAYER HAVE BOTH BASE COLOR CARDS AND COLOR CHANGED CARDS?
		//  typically, the player doesn't care which cards get discarded
		//  unless they have used the color change ability, and also have cards with that base color
		//  in only that scenario, we'll need to let them select which cards to discard
        hasMixOfBaseCardsAndChangedColorCards: function( color )
        {
            var baseCards = dojo.query(`#copen_wrapper #cards_in_hand .copen_card.copen_${color}_card .copen_new_color.copen_hidden`);
            var changedColorCards = dojo.query(`#copen_wrapper #cards_in_hand .copen_card .copen_new_color.copen_${color}_card`);
            
            return baseCards.length > 0 && changedColorCards.length > 0;
        },        

		// HAS THE PLAYER EXCEEDED THE HAND LIMIT?
        hasTooManyCardsInHand: function()
        {
            return dojo.query("#copen_wrapper #cards_in_hand .copen_card").length > this.maxHandSize;
        },
        
        // update the display and tooltips 
        // that count how many cards a player has in their hand
        // can be used for active player or opponents
        displayNumberOfCardsInHand: function( player_id, hand_size )
        {
			dojo.query(`#player_board_${player_id} .copen_hand_size_number`)[0].textContent = hand_size;
			
			if( player_id == this.player_id)
			{
				// BGA FRAMEWORK NOTE - Since this string will be translated, I _think_ doing it with dojo.string.substitute is a little more secure than doing it with string templates
				var hand_tooltip_text = dojo.string.substitute( _("You have ${hand} cards in hand, out of a maximum of 7."), {
	    			hand: hand_size,
				} );
				
				this.addTooltip(`player_hand_size_${player_id}`, hand_tooltip_text,'');
				
				this.addTooltip("cards_in_hand", hand_tooltip_text,'');
			}
			
			
		},

        /**************** CARDS IN HAND ARRANGEMENT *****************************/

		// Nicely display the cards beside the player's board'
        splayCardsInHand: function()
        {
            var cardsInHandNode = dojo.byId("cards_in_hand"); 
            var cardsInHand = this.getChildElementNodes( cardsInHandNode );

            if( cardsInHand.length == 0 ) return; // do nothing if we don't have any cards in hand

            var lastCard = cardsInHand[ cardsInHand.length - 1];
            var lastCardTop = dojo.position( lastCard ).y;
            this.placeOnObject(lastCard, "hand_bottom_card_target");

            for( var i = 0; i < cardsInHand.length; i++)
            {
                this.placeOnObjectPos( cardsInHand[i], "hand_bottom_card_target", 0, -this.cardSplayDistance * (cardsInHand.length - 1 - i) );
            
                // RESET ANY 3D ROTATION
                this.resetCard3DRotation( cardsInHand[i] );
            }
        },

        // PUT CARDS IN HORIZONTAL ROW
        //  used for discarding them - when you need a better click area
        spreadCardsHorizontally: function()
        {
            var cardsInHandNode = dojo.byId("cards_in_hand"); 

            var topChunkHeight = dojo.getContentBox("top_chunk").h;
            var topChunkWidth = dojo.getContentBox("top_chunk").w;
            var numberOfCards = cardsInHandNode.children.length;
            var cardDisplayWidth = (numberOfCards * this.cardWidth) + (numberOfCards * this.cardHorizontalSpacing);
            var leftMargin = (topChunkWidth - cardDisplayWidth)/2;

            var game = this;
            for( let i = 0; i < cardsInHandNode.children.length; i++)
            {
                setTimeout(function(){
                    var card = cardsInHandNode.children[i];

                    // placeOnObjecPos wants to center things in a way that's not helpful here
                    //   so we do some math to undo that
                    var x = game.cardWidth/2;
                    x -= topChunkWidth/2;
                    x += leftMargin + (i * (game.cardWidth + game.cardHorizontalSpacing));

                    game.placeOnObjectPos( card, "top_chunk", x, 0);
                }, i * game.animationTimeBetweenCardSpread );
            }
            
            // HIDE CARD COUNTING TOOLTIP
            this.removeTooltip('cards_in_hand'); 
        },

		// PUT CARDS IN HORIZONTAL ROW, BUT ALSO GROUP UP CARDS OF SIMILAR COLOR
		//  the player isn't really selecting a "card" here, they're selecting a color of a card they have
		//  so grouping up the cards lets the player still click on the game elements without presenting a "false choice"
        spreadCardsHorizontallyByColor: function()
        {
            var colors = this.getColorNamesInHand();
            var cardsInHandNode = dojo.byId("cards_in_hand"); 

            var topChunkHeight = dojo.getContentBox("top_chunk").h;
            var topChunkWidth = dojo.getContentBox("top_chunk").w;
            var cardDisplayWidth = (colors.length * this.cardWidth) + (colors.length * this.cardHorizontalSpacing);
            var leftMargin = (topChunkWidth - cardDisplayWidth)/2;

            var game = this;
            for( let i = 0; i < cardsInHandNode.children.length; i++)
            {
                setTimeout(function(){

                    var card = cardsInHandNode.children[i];
                    var colorName = game.getColorNameOfCard( card );
                    var colorIndex = colors.indexOf( colorName );

                    // placeOnObjecPos wants to center things in a way that's not helpful here
                    //   so we do some math to undo that
                    var x = game.cardWidth/2;
                    x -= topChunkWidth/2;
                    x += leftMargin + (colorIndex * (game.cardWidth + game.cardHorizontalSpacing));

                    // DETERMINE HOW HIGH UP THE CARD SHOULD BE PLACED
                    //   we want to spread the cards verticall in the group so players can see how many they have of each card
                    //   so have to do a little forward looking in the array to find that out
                    // JAVASCRIPT NOTE
                    //   node.children returns an HTMLCollection - not an array
                    //   can convert it to an array with Array.from()
                    var cardsYetToBeProcessed = Array.from(cardsInHandNode.children).slice( i + 1, cardsInHandNode.children.length);

                    var numberSharedColorCardsYetToBeProcessed = cardsYetToBeProcessed.filter( node => dojo.hasClass( node, colorName )).length;
                    var y = -(game.cardHeight + game.cardHorizontalSpacing);
                    y -= numberSharedColorCardsYetToBeProcessed * game.cardSplayDistance;


                    game.placeOnObjectPos( card, "top_chunk", x, y);
                }, i * game.animationTimeBetweenCardSpread );
            }
        },

		// SHOW CARD BEING DISCARDED
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


        /************************ POLYOMINOES ******************************/

		// WHICH POLYOMINO IS AT THE TOP OF EACH STACK?
        determineTopPolyominoInEveryStack: function()
        {

            var game = this;
            dojo.query("#copen_wrapper .copen_stack").forEach( function( stackNode ){
                game.determineTopPolyominoInStack( stackNode.id );
            });
        },

		// WHICH STACK DOES THIS POLYOMINO BELONG TO
		//  useful for putting it back after a canceled placement
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

		// FIND THE TOP POLYOMINO IN A PARTICULAR STACK
        determineTopPolyominoInStack: function( stackId )
        {
            var query = dojo.query( `#copen_wrapper #${stackId} > *:last-child` );
            if( query.length == 0 ) return null; // no more polyominoes in this stack

            var topOfStackNode = query[0];
            dojo.addClass( topOfStackNode, "copen_top_of_stack");
            return topOfStackNode;
        },

		// MARK WHICH POLYOMINOES CAN BE USED BY THE PLAYER
		//  we try to account for simple rules like color cards
		//  but there are some rules we don't account for - like determining if there's any valid placement spot
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

		// ADD BUTTONS TO CONFIRM OR CANCEL POLYOMINO PLACEMENT
		//  polyominoes can be manipulated around before being locked in, so we need a confirm button
        createPositionPolyominoButtons: function()
        {
            this.addActionButton( 'cancel_polyomino_placement', _("Cancel"), "onCancelPolyominoPlacement", null, false, "red");
            this.addActionButton( 'confirm_polyomino_placement', _("Confirm"), "onConfirmPolyominoPlacement", null, false, "blue");
            dojo.style("cancel_polyomino_placement","display","none");
            dojo.style("confirm_polyomino_placement","display","none");
        },

		// SHOW THE CONFIRM OR CANCEL BUTTONS WHEN THE TIME IS RIGHT
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

		// HIDE THE CONFIRM AND CANCEL BUTTONS IF NOT NEEDED
        hidePositionPolyominoButtons: function()
        {
            dojo.style("cancel_polyomino_placement","display","none");
            dojo.style("confirm_polyomino_placement","display","none");

            var query = dojo.query("#end_turn");
            if( query.length > 0 ) dojo.style(query[0], "display", "inline-block");
        },

		// PLAYERS CAN GET A DISCOUNT FOR PLACING SAME COLORS ADJACENT
		//  check to see if the player has the right pieces to get this discount
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

		// POLYOMINO ID CONTAINS COLOR
        getPolyominoColorFromId: function( polyominoId )
        {
            return polyominoId.split('-')[0];
        },

		// POLYOMINO ID CONTAINS SQUARE COUNT
        getPolyominoSquaresFromId: function( polyominoId )
        {
            return polyominoId.split('-')[1].split('_')[0];
        },

		// POLYOMINO ID CONTAINS "COPY" - i.e., if there are 3 copies of this type of piece, which is it?
        getPolyominoCopyFromId: function( polyominoId )
        {
            return polyominoId.split('_')[1];
        },


		// THE FACADE CELLS IDS HAVE THE COORDINATES WRITTEN IN
        getCoordinatesFromId: function( id )
        {
            var coordinates = id.split('_');
            return {
                x:parseInt(coordinates[2]),
                y:parseInt(coordinates[3]),
            };
        },

		// IS THIS CELL OF THE BOARD EMPTY?
        isCellEmpty: function( gridCell )
        {
            return this.playerboard[gridCell.x][gridCell.y].fill == null;
        },

		// ARE ALL THESE CELLS EMPTY?
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

		// IF A POLYOMINO WAS PLACED HERE, WOULD IT BE SUPPORTED?
		//  vs would it be "floating"?
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

		// IF A POLYOMINO OF A COLOR WAS PLACED HERE, WOULD IT BE ADJACENT TO ANOTHER POLYOMINO OF THE SAME COLOR?
        isAdjacentToSameColor: function( gridCells, color )
        {
            for( var i = 0; i < gridCells.length; i++ )
            {
                if( this.isCellAdjacentToSameColor( gridCells[i], color )) return true;
            }
            return false;
        },

		// HOW MUCH WOULD IT COST TO PLACE A POLYOMINO HERE, ACCOUNTING FOR BONUSES?
        getCostOfShapeAtPosition( gridCells, color )
        {
            var cost = gridCells.length;
            if( this.isAdjacentToSameColor( gridCells, color) ) cost -= 1;
            if( this.hasConstructionDiscounted ) cost -= 1;
            return cost;
        },

		// DOES THIS CELL HAVE A POLYOMINO OF THE CHOSTEN COLOR ADJACENT TO IT?
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

		// WOULD PLACING A POLYOMINO HERE BE ALLOWED, CHECKING ALL THE PLACEMENT RULES
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

		// SHOW DIFFERENT STYLES ON THE SELECTED POLYOMINO WHETHER IT CAN BE PLACED HERE OR NOT
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

		// SHOW WHAT IS UNDERNEATH THE POLYOMINO
		//  in real life, it's trivial to look at and understand if the space beneath a polyomino is free
		//  but in a digital version, we need to show an extra styling element that the space is already taken up
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

		// DEPRECATED
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

		// IF WE PUT THE POLYOMINO AT THIS POSITION,
		//  which grid cells does it take up?
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

		// REMOVE PREVIEW SHOWN WHEN PLAYER HOVERS
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

		// RECONNECT NEW POLYOMINO DOM ELEMENT WITH EVENTS
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


		// FOCUS THE PLAYER ON THE POLYOMINO PLACEMENT BY DARKENING THE BACKGROUND
		//  The BGA way to do things is to have physical parity
		//  But with so many elements on screen, it's nice to be able to focus the player's attention
		//  The solution here is to darken everything not used with a scrim, which is a nice compromise between these two philosophies
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
            dojo.query("#copen_wrapper .copen_playerboard_image").addClass("copen_behind_shadow_box");  

			// select elements to show
            dojo.query("#copen_wrapper #polyomino_placement").style("display","block");
            dojo.query("#copen_wrapper #polyomino_placement_buttons").style("display","block"); // sometimes we turn this off seperately from its parent - so make sure it's back on too

			// fade in scrim
            dojo.animateProperty({
                node: "shadow_box",
                duration: 500,
                properties: 
                {
                    opacity: {start: 0, end: 0.5},
                }
            }).play();
            
            // MAKE BUTTONS POP IN
            var buttonIds = ["polyomino_rotate_button", "polyomino_flip_button"].forEach( function(button){
            
	            dojo.style(button,"transform", "scale(0)");
	            // pop in buttons with animation so they're more visible
	            dojo.animateProperty({
					node: "polyomino_rotate_button",
					duration: 500,
					delay:500,
					easing: dojo.fx.easing.backOut,
					properties:
					{
						s: {start: 0, end: 1},
	                },
	                onAnimate: function (values) {
	                    dojo.style(button, "transform", `scale(${values.s.replace("px","")})`);
	                },
				}).play();
			});

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

		// WHEN THE PLAYER HAS TO DISCARD A CARD, LET THEM CLICK A CARD FROM THEIR HAND
        showSelectDiscardUI: function( color, cost )
        {

            // MAKE SURE WE'RE COMING IN WITH CLEAN DATA STRUCTURE
            this.discardHandlers = [];

            // HIDE ADDITIONAL ELEMENTS
            dojo.query("#copen_wrapper #polyomino_placement_buttons").style("display","none");
            dojo.query(`#copen_wrapper #owned_player_area`).addClass("copen_behind_shadow_box");
            dojo.query('#copen_wrapper #polyomino_placement').addClass("copen_behind_shadow_box");  

            // FIRST, TAG ALL CARDS IN HAND AS UNUSABLE
            dojo.query("#copen_wrapper #cards_in_hand .copen_card").addClass("copen_unusable");

            // NEXT, GET SET CORRECT CARDS TO BE USABLE
            var query = this.getNodeListOfColoredCardsInHand( color );
            
            for( var i = 0; i < query.length; i++ )
            {
                // CONNECT HANDLERS IN A WAY TO REMOVE THEM LATER
                var handlers = this.connectMouseOverEventsToCard( query[i]);
                handlers.push( dojo.connect( query[i], "onclick", this, "onSelectCardToDiscard") );
                this.discardHandlers = this.discardHandlers.concat( handlers ); 

                // SHOW THEM AS USABLE
                dojo.removeClass( query[i], "copen_unusable");
                dojo.addClass( query[i], "copen_usable");
            }

            // SPREAD CARDS OUT TO BE EASY TO CLICK
            this.spreadCardsHorizontally();

            // DISPLAY INSTRUCTIONS TO USER
            this.gamedatas.gamestate.descriptionmyturn = _(`Select ${cost} card(s) to discard`);
            this.updatePageTitle();

            // DISPLAY UNDO BUTTON
            dojo.style("undo","display","inline");

        },

		// WHEN THE PLAYER HAS SELECTED A POLYOMINO TO TRY AND PLACE
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

		// WHEN A PLAYER IS DONE USING THE POLYOMINO PLACEMENT UI
        fadeOutPolyominoPlacementUI: function()
        {
            dojo.query("#copen_wrapper .copen_behind_shadow_box").removeClass("copen_behind_shadow_box");

            dojo.query("#copen_wrapper #polyomino_placement").style("display","none");

            dojo.animateProperty({
                node: "shadow_box",
                duration: 500,
                properties: 
                {
                    opacity: { end: 0},
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

        },

		// AKIN TO A PLAYER HOLDING A POLYOMINO OVER A PHYSICAL BOARD AND THINKING "HMM... WOULD THIS FIT HERE?"
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

		// IS THE POLYOMINO OVERLAPPING THE PLAYER'S BOARD AT ALL?
		isPolyominoAboveBoard: function()
		{
			// FIRST, SCOOT POLYOMINO TO BE FULLY ON BOARD (IF NEEDED)
            var boardCellsNode = dojo.query(`#copen_wrapper #player_${this.player_id}_playerboard .copen_board_cells`)[0];
        	var polyominoNode = dojo.byId(this.selectedPolyomino.id);

            boardCellsNodePosition = dojo.position( boardCellsNode, true );
            polyominoNodePosition = dojo.position( polyominoNode, true);
            
            
            return ( polyominoNodePosition.x + polyominoNodePosition.w > boardCellsNodePosition.x)
             	&& ( polyominoNodePosition.x < boardCellsNodePosition.x + boardCellsNodePosition.w)
            	&& ( polyominoNodePosition.y + polyominoNodePosition.h > boardCellsNodePosition.y)
            	&& ( polyominoNodePosition.y < boardCellsNodePosition.y + boardCellsNodePosition.h);
		},

		// WHEN THE PLAYER DROPS THE POLYOMINO ON THE BOARD
		//  there's all sorts of ways it might not line up nicely with the grid
		//  so we make some educated guesses about where to put it, and allow the user to adjust if they're off
        dropPolyominoOnBoard: function()
        {


            try{

                // FIRST, SCOOT POLYOMINO TO BE FULLY ON BOARD (IF NEEDED)
                var boardCellsNode = dojo.query(`#copen_wrapper #player_${this.player_id}_playerboard .copen_board_cells`)[0];
                var polyominoNode = dojo.byId(this.selectedPolyomino.id);

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

		// ACTUALLY PUT THE POLYOMINO ON THE BOARD
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

		// ROTATE THE SHAPE DATA BY 90 DEGREES
        rotatePolyominoShape: function( polyominoShape )
        {
            for( var i = 0; i < polyominoShape.length; i++)
            {
                polyominoShape[i] = { x:polyominoShape[i].y, y:-polyominoShape[i].x};  
            } 

            return this.setNewShapeOrigin( polyominoShape ); 
        },

		// FLIP THE POLYOMINO SHAPE OVER
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

		// WHEN YOU PUT THE POLYOMINO AT THIS CELL, WHERE SHOULD IT BE PHYSICALLY MOVED IN HTML COORDINATES?
        determineHtmlPlacementForPolyominoAtCell: function( polyominoNode, boardCellNode )
        {

            // FIND THE GRID CELL AT MINX, MINY BOUNDARY
            var boardCellPosition = dojo.position(boardCellNode);

            // POSITION POLYOMINO AT THAT GRID CELL
            var htmlY = boardCellPosition.h - dojo.position(polyominoNode).h;

            return {htmlX:0, htmlY:htmlY };
        },

        /******************* SPECIAL ABILITY TILES ********************/

		// PLAY AN ANIMATION WHEN A COAT OF ARMS IS EARNED TO HELP DRAW THE PLAYER'S ATTENTION
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

		// SHOW WHICH ABILITY TILES CAN BE TAKEN
        determineWhichAbilityTilesAreTakeable: function()
        {
            var game = this;
            dojo.query("#copen_wrapper .copen_ability_tile_stack .copen_ability_tile:last-child").forEach(function( abilityTile){
                var abilityName = abilityTile.id.split('-')[0];

                if( !game.ownsAbility(abilityName) ) dojo.addClass( abilityTile, "copen_usable" );
                else dojo.addClass( abilityTile, "copen_unusable" );
            });
        },

		// DOES THE PLAYER OWN THE ABILITY?
        ownsAbility: function( abilityName )
        {
            return dojo.query(`#copen_wrapper #owned_player_area .copen_${abilityName}`).length > 0;
        },

		// HAS THE PLAYER USED THIS ABILITY?
        hasUsedAbility: function()
        {
            return dojo.query("#copen_wrapper #owned_player_area .copen_used_ability").length > 0;
        },

		// SHOW THAT THIS ABILITY IS USABLE
        setAbilityAsUsable: function (abilityName)
        {
            dojo.query(`#copen_wrapper #owned_player_area .copen_${abilityName}:not(.copen_used_ability)`).addClass("copen_usable");
        },

		// SHOW THAT THIS ABILITY IS UNUSABLE
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

		// CAUSE ANY CARDS ABILITY TO HAPPEN
		//  I wanted players to be able to click ability tiles without worrying about a specific sequence too much,
		//  as that's what they'd do in the physical game.
		//  That means sometimes an ability is clicked, but we wait until the proper state to actually cause it to happen
        triggerAnyCardsAbility: function()
        {
            // SHOW ALL CARDS SELECTABLE
            dojo.query("#copen_wrapper #harbor_cards .copen_card.copen_unusable").removeClass("copen_unusable").addClass("copen_usable");

            // CHANGE THE INSTRUCTION TITLE TEXT
            this.gamedatas.gamestate.descriptionmyturn = _("You must take another card");
            this.updatePageTitle();
        },

		// CAUSE CHANGE OF COLORS ABILITY TO HAPPEN
        triggerChangeOfColorsAbility: function( fromColor, toColor)
        {

            this.changeColorsFromTo = {};
            this.changeColorsFromTo[fromColor] = toColor;

            dojo.query(`#copen_wrapper #cards_in_hand .copen_${fromColor}_card .copen_new_color`)
                .removeClass('copen_hidden')
                .addClass(`copen_${toColor}_card`);

            this.determineUsablePolyominoes();
        },

		// RESET UI AFTER CHANGE OF COLORS ABILITY
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

		// SHOW A DARK SCRIM BEHIND THE PLAYER'S HAND OF CARDS
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

		// BRING UP UI FOR CHANGE OF COLORS ABILITY
		//	this is by far the most complex ability in the game, requiring two of its own special interfaces - one for a special edge case
        showChangeOfColorsUI: function( selectedCard, baseColorName )
        {

            dojo.query("#copen_wrapper #change_of_colors_ui .copen_card").addClass(baseColorName);

            var queryIndex = 0;
            var cardColorOptionQuery = dojo.query("#copen_wrapper .copen_change_of_colors_option");
            for( var i = 0; i < this.cardColorOrder.length; i++ )
            {
                if( this.cardColorOrder[i] == baseColorName) continue; //skip the base color card.  i.e. - we won't show an option to change "green" into "green"

                // SET THE OVERLAY COLOR ON THE COLOR CHANGE OPTION            
                var query = dojo.query(".copen_new_color", cardColorOptionQuery[queryIndex]).addClass(this.cardColorOrder[i]);


                // SET INITIAL STYLE TO PREP FOR ANIMATION
                //  since we've added a delay, it also delays the animation setting the initial style
                dojo.style( cardColorOptionQuery[queryIndex], "opacity", 0);
                dojo.style( cardColorOptionQuery[queryIndex], "top", -20)

                // FADE IT IN
                dojo.animateProperty({
                    node: cardColorOptionQuery[queryIndex],
                    duration: 500,
                    delay: i * 100,
                    properties: 
                    {
                        opacity: {start: 0, end: 1},
                        top: {start: -20, end: 0},
                    }
                }).play();

                queryIndex += 1;
            }

            // HAVE CARDS APPEAR AT CONSISTENT HEIGHT, INDEPENDENT OF THE CARD SELECTED
            var y = this.colorChangeUITop - dojo.position( selectedCard ).y 

            dojo.style("change_of_colors_ui","display","block");
            this.placeOnObjectPos( "change_of_colors_ui", selectedCard, 0, y );
            
        },

		// FINISHED WITH CHANGES OF COLORS ABILITY UI
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

            this.splayCardsInHand(); 
            
            this.displayNumberOfCardsInHand( this.player_id, this.getNumberOfCardsInHand()); // restore the tooltip on cards in hand
        },

        ///////////////////////////////////////////////////
        //// Player's action
        
        /*
        
            Here, we define methods to handle player's action (ex: results of mouse click on 
            game objects).
            
            Most of the time, these methods:
            _ check the action is possible at this game state.
            _ make a call to the game server
        
        */

		// SHOW NICE 3D EFFECT WHEN MOVING MOUSE OVER HARBOR CARDS
        onMouseMoveHarborCard: function( event )
        {
            // ONLY WORKS FOR ACTIVE PLAYER
            if( !this.isCurrentPlayerActive() ) return;

            dojo.style(event.currentTarget, "transform", "scale(1.1)");

            var offsetX = event.clientX - dojo.position( event.currentTarget).x; // We calculate our own offsetX, rather than using the one on the event, as the event one is affected by whether the mouse is on or off the rotated card
            var offsetY = event.clientY - dojo.position( event.currentTarget).y;
            var rotateY = (offsetX - (dojo.getContentBox( event.currentTarget ).w / 2)) * this.cardYAxisRotationFactor ;
            var rotateX = -(offsetY - (dojo.getContentBox( event.currentTarget ).h / 2)) * this.cardXAxisRotationFactor ;
            
            dojo.style(event.currentTarget, "filter", `brightness(${this.lerp( 1.2, 0.8, offsetY/this.cardHeight)}) drop-shadow(0px 0px 5px white)`);

            // ROTATE THE CARD IMAGE AND THE NEW COLOR (IN CASE ITS VISIBLE)
            //  JAVASCRIPT NOTE: node.childNodes returns elements and text nodes, node.children does NOT return text nodes - so it's usually what you want
            //    
            dojo.style(event.currentTarget.children[0],"transform",`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
            dojo.style(event.currentTarget.children[1],"transform",`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
        },

		// RESET 3D EFFECT ON HARBOR CARDS
        onMouseOutHarborCard: function (event)
        {
            this.resetCard3DRotation( event.currentTarget );
        },

		// REQUEST SERVER TO TAKE A CARD FROM THE HARBOR
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

		// REQUEST SERVER TO DISCARD A CARD
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

		// CLICK A POLYOMINO TO TRY AND PLACE IT SOMEWHERE
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

		// NEEDED TO MAKE THE CURSOR LOOK CORRECT ON DRAGS
        onDragOver: function( event )
        {
            
            // MAKES CURSOR DIFFERENT
            //  If you don't include this, the cursor ends up looking like a "no" - a circle with a line through it
            dojo.stopEvent( event ); 
            event.dataTransfer.dropEffect = "move"; // I would love to use the "grabbing" hand - but I'm not sure how to keep it up - if that's even possible

            var adjustedClientXY = this.adjustPositionBasedOnZoom( event.clientX, event.clientY);
            this.dragClient = { x: adjustedClientXY.x, y: adjustedClientXY.y };
        },

		// START DRAGGING A POLYOMINO
        onDragStartPolyomino: function( event )
        {
            //console.log("onDragStartPolyomino");

            var target = event.currentTarget ?? event.customTarget;

            // DISABLING DRAG IMAGE
            if( event.currentTarget != null )
            {

                // FRAGILE BROWSER ALERT - REMOVING DRAG IMAGE
                //  I want the user to drag the polyomino itself, rather than a ghosted image (leaving the original in place)
                //  it's surprisingly hard to get all browsers to do this
                //    some advice is to set the drag image offscreen - but that doesn't work on Safari, where it constrains the image to under the mouse
                //    some advice is to create an empty pixel just-in-time - but that doesn't work on Safari, where if the image isn't pre-loaded, it will immediately break and call an ondragend
                //    having an empty pixel in the HTML that is 1 x 1 with a clear alpha is the only way I've seen this work across all browsers
                var deck = dojo.byId("empty_pixel");
                event.dataTransfer.setDragImage( deck, 0, 0);

            }

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

		// START DRAGGING A POLYOMINO ON MOBILE
        onTouchStartPolyomino: function( event )
        {

			//console.log("onTouchStartPolyomino");

			this.isMobileDragging = false;

            //console.log( "onTouchStartPolyomino" );
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


		// WHILE DRAGGING A POLYOMINO
        onDragPolyomino: function( event )
        { 
	
			//console.log( "onDragPolyomino");

            if( this.selectedPolyomino == null ) return;

            // FRAGILE BROWSER ALERT:
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

		// WHILE DRAGGING A POLYOMINO ON MOBILE
        onTouchMovePolyomino: function( event )
        {

			//console.log( "onTouchMovePolyomino");

			this.isMobileDragging = true;

            var syntheticEvent = new MouseEvent("ondrag");

            var adjustedClientXY = this.adjustPositionBasedOnZoom( event.clientX, event.clientY);
            this.dragClient = { x: adjustedClientXY.x, y: adjustedClientXY.y };

            this.onDragPolyomino( syntheticEvent );
        },

		// FINSIHED DRAGGING A POLYOMINO
        onDragEndPolyomino: function( event )
        {

            //console.log("onDragEndPolyomino");

            dojo.stopEvent( event );
            if( this.selectedPolyomino == null ) return;

			// IF POLYOMINO ISN'T OVERLAPPING BOARD AT ALL, CANCEL PLACEMENT
			if( !this.isPolyominoAboveBoard()) 
			{
				//console.log( "polyomino is not above board")
				this.onCancelPolyominoPlacement( event );
				return;
			}

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

		// FINSIHED DRAGGING A POLYOMINO ON MOBILE
        onTouchEndPolyomino: function( event )
        {

			//console.log("OnTouchEndPolyomino")

			// JAVASCRIPT NOTE
			//  onTouchEnd is being called also on just tapping an object,
			//  so we need to keep track of whether any dragging actually happened 
			//  and only send onDragEnd if it did
			if( this.isMobileDragging )
			{
            	var syntheticEvent = new MouseEvent("ondragend");
            	this.onDragEndPolyomino( syntheticEvent );
            	
          		// JAVASCRIPT NOTE
            	//  I thought stopping events was just to prevent that event from being sent to parents of the child catching the event
           	 	//  But in this case, an iPad will send both a touchend event AND a onclick if the user hasn't moved their finger past a certain threshold
            	//  you can stop the onclick by stopping the event   
            	dojo.stopEvent( event );
            }

            
            this.isMobileDragging = false;
        },

		// ROTATE A POLYOMINO
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
        
        
        // FLIP A POLYOMINO
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


		// PREVIEW WHETHER A POLYOMINO CAN BE PLACED OR NOT
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

		// IF WE HAVE SELECTED A POLYOMINO, AND AREN'T DRAGGING IT
		//  then show a preview of where it would be placed
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

		// IF WE HAVE SELECTED A POLYOMINO, AND AREN'T DRAGGING IT
		//  when we click, position the polyomino there
        onPolyominoClickPassThrough: function( event )
        {

            //console.log("onPolyominoClickPassThrough");

            var cellNode = this.getCellNodeAtPageCoordinate( {x:event.pageX, y:event.pageY});
            
            // WE'RE NOT GUARANTEED TO GET A CELL NODE
            // if the mouse moves outside that region of the screen
            if( cellNode == null ) return;

            var passThroughEvent = new MouseEvent("onclick");
            passThroughEvent.customTarget = cellNode;

            this.onPositionPolyomino( passThroughEvent );        

        },            

		// CANCEL OUT OF USING THIS POLYOMINO
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
            var polyominoNode = dojo.byId(this.selectedPolyomino.id);
            dojo.connect( polyominoNode, "onclick", this, "onSelectPolyomino" );
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

		// PUT THE POLYOMINO ON THE BOARD CLIENT SIDE, LET PLAYER EDIT IT BEFORE SUBMITTING TO SERVER
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

		// PLAYER CONFIRMED THIS IS WHERE THEY WANT THE POLYOMINO, SUBMIT TO SERVER
        onConfirmPolyominoPlacement: function( event )
        {
            dojo.stopEvent( event );

            // CLIENT VALIDATION
            if( this.selectedPolyomino == null ) return; // make sure a polyomino is selected
            if( dojo.hasClass(event.currentTarget, "copen_button_disabled")) return;
            if( !this.checkAction('placePolyomino')) return;

            this.requestPlacePolyomino();
        },

		// EDGE CASE - In a very specific scenario, the player will care about which cards get discarded to pay for the polyomino
		//  this allows them to select those cards
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

		// PLAYER EARNED AN ABILITY TILE - CHOOSE WHICH ONE TO TAKE
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

		// PLAYER CLICKED ON ABILITY "ANY CARDS"
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

		// PLAYER CLICKED ON ABILITY "ADDITIONAL CARD"
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

		// PLAYER CLICKED ON ABILITY "BOTH ACTIONS"
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

		// PLAYER CLICKED ON ABILITY "CONSTRUCTION DISCOUNT"
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

		// PLAYER CLICKED ON ABILTY "CHANGE OF COLORS"
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
            this.spreadCardsHorizontallyByColor();
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

            // HIDE CARD COUNTING TOOLTIP
            this.removeTooltip('cards_in_hand');

        },

		// PLAYER USED CHANGE OF COLORS UI TO SELECT WHICH COLOR TO CHANGE
        onSelectColorFromHandToChange: function ( event )
        {

            if( !this.checkAction('activateAbilityChangeOfColors')) return;

            var colorName = this.getColorNameOfCard( event.currentTarget );

            // TURN ON CHANGE OF COLORS UI
            var color = colorName.split("_")[1];
            this.showChangeOfColorsUI( event.currentTarget, colorName );
 
            // PUT UNCHOSEN CARDS BEHIND THE SHADOW BOX
            dojo.query("#copen_wrapper #cards_in_hand .copen_card").forEach( function(card){
                if( !dojo.hasClass(card,colorName))
                {
                    dojo.addClass( card, "copen_behind_shadow_box");
                }


            });


            // GIVE INSTRUCTIONS
            this.gamedatas.gamestate.descriptionmyturn = dojo.string.substitute( _("Treat ${color_translated} cards as what color?"), {color_translated: _(color)} );
            
            this.updatePageTitle();
            
            // CLEAN UP EFFECTS ON CARDS IN HAND
            dojo.query("#copen_wrapper #cards_in_hand .copen_usable").removeClass("copen_usable");
            dojo.forEach( this.changeOfColorsCardHandlers, dojo.disconnect);

        },

		// PART 2 OF CHANGING COLORS UI - WHICH COLOR TO CHANGE TO
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

		// PLAYER REQUESTED TO REFRESH ALL UNLOCKED ABILITIES
        onResetUsedAbilities: function( event )
        {

            if( !this.checkAction('resetUsedAbilities')) return;
            if( !dojo.hasClass( event.currentTarget, "copen_usable")) return;

            this.ajaxcall( "/copenhagen/copenhagen/resetUsedAbilities.html",
            {
                lock: true, 
            }, this, function( result ){} ); 
        },

		// UNDO SUPPORT
        onUndo: function( event )
        {

            if( !this.checkAction('undo')) return;

            this.ajaxcall( "/copenhagen/copenhagen/undo.html",
            {
                lock: true, 
            }, this, function( result ){} ); 

        },

		// EDGE CASE - PLAYER CONFIRMED END OF TURN
		//  I try to be generous with players with special abilities - giving them a reminder they can use it if they want
		//  if they don't want to, they'll use this to confirm they just want to end their turn
        onEndTurn: function( event )
        {

            if( !this.checkAction('endTurn')) return;

            this.ajaxcall( "/copenhagen/copenhagen/endTurn.html",
            {
                lock: true, 
            }, this, function( result ){} ); 

        },
        
        /********************* BROWSER SPECIFIC CODE **********************/

		// Unfortunately, safari handles the scaling effect on the tiles differently than all the other browsers
		//  so there's a separate set of css styles for it
        adjustAbilityTilesForSafari: function()
        {
            dojo.addClass("copen_wrapper", "copen_safari");
        },

        
        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        /*
            setupNotifications:
            
            This handles responses from the server
        
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
        
		// SERVER SAYS: PLAYER HAS TAKEN A CARD
        notif_takeCard: function(notif)
        {

            // CLEAR 3D STYLING
            var cardNode = dojo.byId(`card_${notif.args.card_id}`);
            this.resetCard3DRotation( cardNode );

            // IF ITS YOUR CARD
            if( notif.args.player_id == this.player_id )
            {
                var card = this.attachToNewParent( `card_${notif.args.card_id}`, "cards_in_hand");
                dojo.place( card, "cards_in_hand", this.findPositionForNewCardInHand( card ));

                // SPLAY CARDS IN HAND IF WE DON'T HAVE TOO MANY
                //  otherwise, we'll be spreading them differently and don't want the animations to fight
                if( dojo.byId("cards_in_hand").children.length <= this.maxHandSize ) this.splayCardsInHand();
            }

            // IF ITS AN OPPONENTS CARD
            else
            {
                this.slideToObjectAndDestroy( `card_${notif.args.card_id}`, `player_hand_size_${notif.args.player_id}`)
            }

            // UPDATE CARD AMOUNT UI
            this.displayNumberOfCardsInHand( notif.args.player_id, notif.args.hand_size );

        },


		// SERVER SAYS: PLAYER HAS DISCARDED A CARD
        notif_discardDownToMaxHandSize: function(notif)
        {
            // IF IT'S YOUR CARD
            if( notif.args.player_id == this.player_id )
            {
                this.animateDiscard( `card_${notif.args.card_id}` );
            }

            // UPDATE CARD AMOUNT UI
            this.displayNumberOfCardsInHand( notif.args.player_id, notif.args.hand_size );
        },

		// SERVER SAYS: THE HARBOR HAS BEEN REFILLED WITH NEW CARDS
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

		// SERVER SAYS: PLAYER HAS PLACED A POLYOMINO
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
                dojo.connect( newTopOfStack, "onclick", this, "onSelectPolyomino" );
                this.connectDraggingEventsToPolyomino( newTopOfStack );
            }

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

            // CLEAN UP DISCARD UI
            dojo.forEach( this.discardHandlers, dojo.disconnect);

            // UPDATE CARD AMOUNT UI
            this.displayNumberOfCardsInHand( notif.args.player_id, notif.args.hand_size );


            // SHOW FEEDBACK FOR COAT OF ARMS
            for( var coat_of_arms_id_key in notif.args.coat_of_arms_ids )
            {
                var coat_of_arms_id = notif.args.coat_of_arms_ids[ coat_of_arms_id_key];
                this.animateCoatOfArms( coat_of_arms_id, notif.args.player_id );
            }

        },

		// SERVER SAYS: PLAYER HAS TAKEN AN ABILITY TILE
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


		// SERVER SAYS: PLAYER HAS USED AN ABILITY
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

		// SERVER SAYS: PLAYER HAS ACTIVATED CHANGE OF COLORS ABILITY
        notif_activateAbilityChangeOfColors: function(notif)
        {

            var node = dojo.query(`#copen_wrapper #copen_ability_slot_${notif.args.ability_name}_${notif.args.player_id} .copen_ability_tile`)[0];
            dojo.addClass( node, "copen_activated");

            this.triggerChangeOfColorsAbility(notif.args.from_color, notif.args.to_color);

            dojo.style("undo","display","inline");
        },

		// SERVER SAYS: PLAYER USED UP AN ABILITY
        notif_usedAbility: function(notif)
        {
            // DEACTIVATE ANY USED UP ABILITIES
            this.deactivateUsedAbility( notif.args.used_ability, notif.args.player_id);
        },

		// SERVER SAYS: PLAYER'S ABILITIES ARE RESET
        notif_resetUsedAbilities: function(notif)
        {
            dojo.query(`#copen_wrapper #ability_tile_area_${notif.args.player_id} .copen_used_ability`).removeClass("copen_used_ability");    
        },


		// SERVER SAYS: HERE ARE THE NEW SCORES
        notif_updateScore: function(notif)
        {
            this.scoreCtrl[ notif.args.player_id ].toValue( notif.args.score );
        },


		///////////////////////////////////////////////////////////////////////////////
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
