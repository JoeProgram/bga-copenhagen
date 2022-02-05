
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * CopenhagenReboot implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * copenhagenreboot.js
 *
 * CopenhagenReboot user interface script
 * 
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */


define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter"
],
function (dojo, declare) {
    return declare("bgagame.copenhagenreboot", ebg.core.gamegui, {
        constructor: function(){
            console.log('copenhagenreboot constructor');
              
            // Here, you can init the global variables of your user interface
            // Example:
            // this.myGlobalValue = 0;

            this.boardWidth = 5;
            this.boardHeight = 9;
            this.playerboard = [];

            this.cardWidth = 66;
            this.cardSplayDistance = 20;
            this.maxHandSize = 7;
            this.maxHandSizeDiscardHandlers = []; // keep track of the events we attach to cards to allow the player to discard - since we'll want to disconnect them afterwards

            this.stateName = "";

            this.cardColorOrder = ["copen_red_card", "copen_yellow_card", "copen_green_card", "copen_blue_card", "copen_purple_card"];
            this.adjacentOffsets = [{x:1,y:0}, {x:0,y:-1}, {x:-1,y:0}, {x:0,y:1}];

            this.whitePolyominosPerStack = 3;

            this.log_replace_keys = ['log_polyomino', 'log_ability_tile']; // keys in the log that we do post-processing on

            this.activated_abilities = [];

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
            console.log( "Starting game setup" );

            // DEBUG - see all game data in console
            console.log( gamedatas);

            // DECK
            this.updateDeckDisplay(gamedatas.cards_in_deck);

            // MERMAID CARD
            if( gamedatas.mermaid_card == "deck") dojo.style("small_mermaid_card","display","none");

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

                if( polyomino.owner == null )
                {
                    dojo.place( polyominoHtml, this.getStackIdFromPolyominoId( `${polyomino.color}-${polyomino.squares}_${polyomino.copy}`));
                }
                else
                {
                    dojo.place( polyominoHtml, `player_${polyomino.owner}_playerboard`);
                    this.placePolyomino( polyomino ); 
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

            // TOOLTIPS
            this.updateSpecialAbilityTooltips();
            
            // CONNECT INTERACTIVE ELEMENTS
            dojo.query("#copen_wrapper #owned_player_area .copen_board_cell").connect( 'onclick', this, 'onPlacePolyomino');
            dojo.query("#copen_wrapper #owned_player_area .copen_board_cell").connect( 'onmouseover', this, 'onPreviewPlacePolyomino');
            dojo.query("#copen_wrapper #owned_player_area .copen_board_cells").connect( 'onmouseout', this, 'onClearPreviewPolyomino');
            dojo.query("#copen_wrapper #polyomino_rotate_button").connect( 'onclick', this, 'onRotatePolyomino');
            dojo.query("#copen_wrapper #polyomino_flip_button").connect( 'onclick', this, 'onFlipPolyomino');

            this.determineTopPolyominoInEveryStack();
            dojo.query("#copen_wrapper #polyominoes .copen_polyomino.copen_top_of_stack").connect( 'onclick', this, 'onSelectPolyomino');            

            dojo.query("#copen_wrapper .copen_ability_tile_stack .copen_ability_tile:last-child").connect( 'onclick', this, 'onTakeAbilityTile');

            dojo.query("#copen_wrapper #owned_player_area .copen_any_cards").connect( 'onclick', this, 'onActivateAbilityAnyCards');

            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();

            console.log( "Ending game setup" );

        },    

        ///////////////////////////////////////////////////
        //// Game & client states
        
        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  You can use this method to perform some user interface changes at this moment.
        //
        onEnteringState: function( stateName, args )
        {
            console.log( 'Entering state: '+stateName );
            
            this.stateName = stateName;

            //DEBUG
            console.log( args );

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

                case 'coatOfArms':
                    this.onEnteringCoatOfArms( args );
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
                this.splayCardsInHand();
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

                // TRIGGER BEHAVIOR OF ANY PREPARED ABILITIES
                if( this.activated_abilities.includes("any_cards")) this.triggerAnyCardsAbility();
            }
        },

        onLeavingTakeAdjacentCard()
        {
            dojo.query("#copen_wrapper .copen_card.copen_usable").removeClass("copen_usable");
            dojo.query("#copen_wrapper .copen_card.copen_unusable").removeClass("copen_unusable");

        },

        onEnteringCoatOfArms( args )
        {

            if( args.active_player != this.player_id ) return;

            dojo.query(".copen_white_polyomino.copen_top_of_stack").forEach(function(polyomino)
            {
                dojo.addClass( polyomino, "copen_usable");
            });

            this.determineWhichAbilityTilesAreTakeable();
        },

        onLeavingCoatOfArms()
        {
            dojo.query("#copen_wrapper .copen_polyomino.copen_usable").removeClass("copen_usable");
            dojo.query("#copen_wrapper .copen_polyomino.copen_unusable").removeClass("copen_unusable");
        },

        // onLeavingState: this method is called each time we are leaving a game state.
        //                 You can use this method to perform some user interface changes at this moment.
        //
        onLeavingState: function( stateName )
        {
            console.log( 'Leaving state: '+stateName );
            


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
            console.log( 'onUpdateActionButtons: '+stateName );
                      
            if( this.isCurrentPlayerActive() )
            {            
                switch( stateName )
                {

                case 'playerTurn':
                    this.addActionButton( 'cancel_polyomino_placement', _("Cancel"), "onCancelPolyominoPlacement", null, false, "red");
                    dojo.style("cancel_polyomino_placement","display","none");
                    break;

                case 'coatOfArms':
                    this.addActionButton( 'cancel_polyomino_placement', _("Cancel"), "onCancelPolyominoPlacement", null, false, "red");
                    dojo.style("cancel_polyomino_placement","display","none");
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
            if( numberCardsInDeck == 0 ) dojo.style("deck","display","none");
            else dojo.style("deck","display","block");
            this.addTooltip( "deck", `${numberCardsInDeck} ` + _("cards in deck"), "");
        },

        // REAPPLY TOOLTIPS TO SPECIAL ABILITIES
        //  since we re-parent special ability tokens - that means nodes get destroyed and recreated
        //  which means we need to hook up the tooltips to the new nodes
        updateSpecialAbilityTooltips: function()
        {
            this.addTooltipToClass('copen_any_cards', _("Any cards"), "");
            this.addTooltipToClass('copen_additional_card', _("Additional card"), "");
            this.addTooltipToClass('copen_construction_discount', _("Construction Dicount"), "");
            this.addTooltipToClass('copen_change_of_colors', _("Change of colors"), "");
            this.addTooltipToClass('copen_both_actions', _("Both actions"), "");
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

        splayCardsInHand: function()
        {
            var cardsInHandNode = dojo.query("#copen_wrapper #cards_in_hand")[0]; 
            var cardsInHand = this.getChildElementNodes( cardsInHandNode );

            if( cardsInHand == 0 ) return; // do nothing if we don't have any cards in hand

            var lastCard = cardsInHand[ cardsInHand.length - 1];
            var lastCardTop = dojo.position( lastCard ).y;
            this.slideToObject(lastCard, "hand_bottom_card_target").play();

            for( var i = 0; i < cardsInHand.length; i++)
            {
                this.slideToObjectPos( cardsInHand[i], "hand_bottom_card_target", 0, -this.cardSplayDistance * (cardsInHand.length - 1 - i) ).play();
            }

        },

        countColoredCardsInHand: function( color )
        {
            return dojo.query(`#copen_wrapper #cards_in_hand .copen_card.copen_${color}_card`).length;
        },

        hasTooManyCardsInHand: function()
        {
            return dojo.query("#copen_wrapper #cards_in_hand .copen_card").length > this.maxHandSize;
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

                // see if player can afford polyomino
                if( cardsOfColor >= cost ) dojo.addClass( polyomino, "copen_usable");
                else dojo.addClass(polyomino, "copen_unusable");
            });
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

        isCellEmpty: function( coordinates )
        {
            return this.playerboard[coordinates.x][coordinates.y].fill == null;
        },

        areCellsEmpty: function( coordinates )
        {

            for( var i = 0; i < coordinates.length; i++)
            {
                if( !this.isCellEmpty( coordinates[i]) )
                {
                    return false;
                }
            }
            return true;
        },

        isGroundedPosition: function( coordinates )
        {
            for( var i = 0; i < coordinates.length; i++)
            {
                if( coordinates[i].y == 0 ) return true;

                var coordBelow = {x:coordinates[i].x, y:coordinates[i].y - 1};
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

        isCellAdjacentToSameColor: function( coordinate, color )
        {
            for( var i = 0; i < this.adjacentOffsets.length ; i++)
            {

                var x = coordinate.x + this.adjacentOffsets[i].x;
                var y = coordinate.y + this.adjacentOffsets[i].y;

                // make sure its a valid square
                if( x < 0 || x >= this.boardWidth || y < 0 || y >= this.boardHeight) continue;

                if( this.playerboard[x][y].color == color ) return true;
            }

            return false;
        },

        isValidPlacementPosition: function( coordinates )
        {

            // CHECK EASY CONDITIONS FIRST
            if( !this.areCellsEmpty( coordinates ) || !this.isGroundedPosition( coordinates )) return false; 

            // CHECK IF WE CAN AFFORD IT
            var color = this.getPolyominoColorFromId( this.selectedPolyomino.id);

            // SPECIAL RULES FOR WHITE POLYOMINOES
            if( color == "white")  return this.stateName == "coatOfArms";
            
            // STANDARD RULES FOR OTHER COLORS
            var cardsOfColor = this.countColoredCardsInHand( color );
            var squares = this.getPolyominoSquaresFromId( this.selectedPolyomino.id);

            var cost = squares;
            if( this.isAdjacentToSameColor( coordinates, color)) cost -= 1;

            return cardsOfColor >= cost;
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

        fadeInShadowBox: function()
        {

            dojo.style("shadow_box", "opacity","0"); // note - don't use the (#) pound symbol for this function
            
            // set elements behind the shadow box
            dojo.query("#copen_wrapper #harbors").addClass("copen_behind_shadow_box");
            dojo.query("#copen_wrapper #deck_cards").addClass("copen_behind_shadow_box");
            dojo.query("#copen_wrapper #harbor_cards").addClass("copen_behind_shadow_box");
            dojo.query("#copen_wrapper #polyominoes").addClass("copen_behind_shadow_box");  
            dojo.query("#copen_wrapper #opponent_playerboards").addClass("copen_behind_shadow_box");  

            dojo.query("#copen_wrapper #polyomino_placement").style("display","block");


            dojo.animateProperty({
                node: "shadow_box",
                duration: 500,
                properties: 
                {
                    opacity: {start: 0, end: 0.5},
                }
            }).play();

        },

        fadeOutShadowBox: function()
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

        placePolyomino: function( polyominoData )
        {

            var polyominoNodeId = `${polyominoData.color}-${polyominoData.squares}_${polyominoData.copy}`;
            var polyominoNode = dojo.query(`#copen_wrapper #${polyominoNodeId}`)[0];
            dojo.removeClass(polyominoNode, "copen_top_of_stack");

            var boardCellNode = dojo.query(`#copen_wrapper #player_${polyominoData.owner}_playerboard .copen_board_cell_${polyominoData.x}_${polyominoData.y}`)[0];

            // DETERMINE HTML PLACEMENT FOR POLYOMINO
            var htmlPlacement = this.determineHtmlPlacementForPolyominoAtCell( polyominoNode, boardCellNode );

            this.attachToNewParent( polyominoNodeId, `player_${polyominoData.owner}_playerboard`);
            this.slideToObjectPos( polyominoNodeId, boardCellNode, htmlPlacement.htmlX, htmlPlacement.htmlY, 500 ).play();

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

        determineWhichAbilityTilesAreTakeable: function()
        {
            var game = this;
            dojo.query("#copen_wrapper .copen_ability_tile_stack .copen_ability_tile:last-child").forEach(function( abilityTile){
                var abilityName = abilityTile.id.split('-')[0];

                console.log("determineWhichAbilityTilesAreTakeable");
                console.log( abilityName);

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

                // WE SEND TO DIFFERENT SERVER POINTS FOR FIRST AND SECOND CARD
                if( this.stateName == "playerTurn")
                {
                    this.ajaxcall( "/copenhagenreboot/copenhagenreboot/takeCard.html",
                    {
                        card_id:event.currentTarget.id.split("_")[1],
                    }, this, function( result ){} ); 
                } 
                else if( this.stateName == "takeAdjacentCard")
                {
                    this.ajaxcall( "/copenhagenreboot/copenhagenreboot/takeAdjacentCard.html",
                    {
                        card_id:event.currentTarget.id.split("_")[1],
                        is_using_ability_any_cards: this.activated_abilities.includes("any_cards"),
                    }, this, function( result ){} ); 
                }
            }
 
        },

        onDiscardCardOverMaxHandSize: function( event )
        {
            dojo.stopEvent( event );

            // SEND SERVER REQUEST
            if( this.checkAction('discard'))
            {

                this.ajaxcall( "/copenhagenreboot/copenhagenreboot/discardDownToMaxHandSize.html",
                {
                    card_id:event.currentTarget.id.split("_")[1],
                }, this, function( result ){} ); 
            }
        },

        onSelectPolyomino: function( event )
        {

            if( !dojo.hasClass(event.currentTarget, "copen_usable")) return; // make sure we can afford this polyomino before selecting it

            this.selectedPolyomino = {};

            this.selectedPolyomino["id"] = event.currentTarget.id;
            this.selectedPolyomino["name"] = this.selectedPolyomino["id"].split("_")[0];
            this.selectedPolyomino["shape"] = this.getCopyOfShape(this.selectedPolyomino["name"]);
            this.selectedPolyomino["rotation"] = 0;
            this.selectedPolyomino["flip"] = 0;
            this.selectedPolyomino.originalPosition = dojo.getMarginBox( event.currentTarget); // getMarginBox includes 'l' and 't' - the values for "left" and "top"

            this.fadeInShadowBox(); // have to fade in the shadow box first - or the display:none css style won't allow the polyomino to slide to the target correctly

            this.attachToNewParent( this.selectedPolyomino.id, "polyomino_placement");
            this.slideToObject( this.selectedPolyomino.id, "polyomino_placement_target", 500 ).play();

            dojo.style("cancel_polyomino_placement","display","inline-block");


            // prepare polyomino preview for use
            var polyomino = dojo.query(`#copen_wrapper #${this.selectedPolyomino["id"]}`)[0];
            dojo.style("polyomino_preview","background-position", dojo.getStyle(polyomino, "background-position"));
            dojo.style("polyomino_preview","width", dojo.getStyle(polyomino, "width") + "px");
            dojo.style("polyomino_preview","height", dojo.getStyle(polyomino, "height") + "px");
            dojo.style("polyomino_preview","transform",""); // reset the transform from whatever it was before
            dojo.style("polyomino_preview","display","none"); // not ready to show yet - turn off
        },

        onRotatePolyomino: function( event )
        {

            if( this.selectedPolyomino == null ) return;  // make sure a polyomino is selected

            var polyominoNode = dojo.query(`#copen_wrapper #${this.selectedPolyomino["id"]}`)[0];

            var flip = this.selectedPolyomino["flip"];  // need to pass this to a local variable to use it in animation scope

            var rotationDegrees = flip == 0 ? 90 : -90; // if flipped, we need to rotate the other way so that the shape still rotates clockwise

            // CODE SNIPPET FROM: https://forum.boardgamearena.com/viewtopic.php?t=15158
            var animation = dojo.animateProperty({
                node: polyominoNode,
                duration: 500,
                properties: {
                    propertyTransform: {start: this.selectedPolyomino["rotation"], end: this.selectedPolyomino["rotation"] + rotationDegrees }
                },
                onAnimate: function (values) {
                    dojo.style(this.node, 'transform', 'rotateY(' + flip + 'deg) rotateZ(' + parseFloat(values.propertyTransform.replace("px", "")) + 'deg)' );
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

            var animation = dojo.animateProperty({
                node: polyominoNode,
                duration: 500,
                properties: {
                    propertyTransform: {start: this.selectedPolyomino["flip"], end: endingFlipValue }
                },
                onAnimate: function (values) {
                    dojo.style(this.node, 'transform', 'rotateY(' + parseFloat(values.propertyTransform.replace("px", "")) + 'deg) rotateZ(' + rotation + 'deg)');
                }
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

            var coordinates = this.getCoordinatesFromId( event.currentTarget.id);
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

        onCancelPolyominoPlacement: function( event )
        {
            if( this.selectedPolyomino == null ) return; 

            var color = this.getPolyominoColorFromId( this.selectedPolyomino.id);
            var squares = this.getPolyominoSquaresFromId( this.selectedPolyomino.id);
            var stackId = this.getStackIdFromPolyominoId( this.selectedPolyomino.id ); 

            dojo.style(this.selectedPolyomino.id, "transform", "rotateY(0deg) rotateZ(0deg)");

            this.attachToNewParent( this.selectedPolyomino["id"], stackId);
            this.slideToObjectPos( this.selectedPolyomino["id"], stackId, this.selectedPolyomino.originalPosition.l, this.selectedPolyomino.originalPosition.t, 500 ).play();

            // RECONNECT THE CLICK
            //   I tried connecting with dojo.connect() directly, but couldn't get it to work.             
            dojo.query( `#copen_wrapper #${this.selectedPolyomino.id}`).connect("onclick",this,"onSelectPolyomino");

            this.selectedPolyomino = null;
            this.fadeOutShadowBox();
            this.clearPreview();

            dojo.style("cancel_polyomino_placement","display","none");
        },

        onClearPreviewPolyomino: function( event )
        {
            this.clearPreview();
        },

        onPlacePolyomino: function( event )
        {
            dojo.stopEvent( event );

            if( this.selectedPolyomino == null ) return; // make sure a polyomino is selected
 
            var coordinates = this.getCoordinatesFromId( event.currentTarget.id);
            var adjustedCoordinates = this.getAdjustedCoordinates( this.selectedPolyomino["shape"], coordinates);
            var gridCells = this.getGridCellsForPolyominoAtCoordinates( this.selectedPolyomino["shape"] , adjustedCoordinates );
            
            // CLIENT VALIDATION - CHECK FOR A VALID POSITION
            var validity = this.isValidPlacementPosition( gridCells );
            if( !validity ) return; // can't place polyomino if space isn't valid

            // SEND SERVER REQUEST
            if( this.checkAction('placePolyomino'))
            {

                this.ajaxcall( "/copenhagenreboot/copenhagenreboot/placePolyomino.html",
                {
                    color: this.getPolyominoColorFromId( this.selectedPolyomino.id) ,
                    squares: this.getPolyominoSquaresFromId( this.selectedPolyomino.id),
                    copy:this.getPolyominoCopyFromId( this.selectedPolyomino.id),
                    x:adjustedCoordinates.x,
                    y:adjustedCoordinates.y,
                    flip:this.selectedPolyomino["flip"],
                    rotation:this.selectedPolyomino["rotation"],
                    card_id:event.currentTarget.id.split("_")[1],
                }, this, function( result ){} ); 
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

                this.ajaxcall( "/copenhagenreboot/copenhagenreboot/takeAbilityTile.html",
                {
                    ability_name: ability_name,
                    copy: copy,
                }, this, function( result ){} ); 
            }
        },

        onActivateAbilityAnyCards: function( event )
        {
            if( this.stateName != "takeAdjacentCard" && this.stateName != "playerTurn" ) return;
            if( !dojo.hasClass( event.currentTarget, "copen_usable")) return;

            // SET ABILITY AS ACTIVATED IN CLIENT
            dojo.addClass( event.currentTarget, "copen_activated");
            this.activated_abilities.push("any_cards");


            // trigger ability behavior if in correct state.  Otherwise, wait.
            if( this.stateName == "takeAdjacentCard" ) this.triggerAnyCardsAbility();

        },

        
        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        /*
            setupNotifications:
            
            In this method, you associate each of your game notifications with your local method to handle it.
            
            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your copenhagenreboot.game.php file.
        
        */
        setupNotifications: function()
        {
                     
            dojo.subscribe( 'takeCard', this, 'notif_takeCard' );

            dojo.subscribe( 'discardDownToMaxHandSize', this, 'notif_discardDownToMaxHandSize' );
            this.notifqueue.setSynchronous( 'discardDownToMaxHandSize', 500 );

            dojo.subscribe( 'refillHarbor', this, 'notif_refillHarbor' );
            this.notifqueue.setSynchronous( 'refillHarbor', 500 );

            dojo.subscribe( 'placePolyomino', this, 'notif_placePolyomino' );
            this.notifqueue.setSynchronous( 'placePolyomino', 500 );

            dojo.subscribe( 'takeAbilityTile', this, 'notif_takeAbilityTile' );
            this.notifqueue.setSynchronous( 'takeAbilityTile', 500 );

            dojo.subscribe( 'usedAbility', this, 'notif_usedAbility' );

            dojo.subscribe( 'updateScore', this, 'notif_updateScore' );
            this.notifqueue.setSynchronous( 'updateScore', 500 );
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
                dojo.destroy( `card_${notif.args.card_id}` );
                this.splayCardsInHand();
            }

            // UPDATE CARD AMOUNT UI
            dojo.query(`#player_board_${notif.args.player_id} .copen_hand_size_number`)[0].textContent = notif.args.hand_size;
        },

        notif_refillHarbor: function(notif)
        {
            for( var cardId in notif.args.harbor )
            {
                this.makeHarborCard( notif.args.harbor[cardId] );
            }


            if( notif.args.mermaid_card == "deck" && dojo.query("#copen_wrapper small_mermaid_card").length > 0)
            {
                this.slideToObjectAndDestroy( "small_mermaid_card", "deck");
            } 

            this.updateDeckDisplay( notif.args.cards_in_deck);
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
            if( newTopOfStack != null ) dojo.connect( newTopOfStack, "onclick", this, "onSelectPolyomino" );

            if( this.player_id == notif.args.player_id)
            {
              this.fadeOutShadowBox(); // NOTE: this needs to come after polyomino placement, or it messes up where the polyomino ends up
              this.playerboard = notif.args.playerboard;  
            } 

            this.selectedPolyomino = null;

            // HANDLE DISCARDS
            notif.args.discards.forEach( function( card_id ){
                dojo.destroy( `card_${card_id}` );
            });
            this.splayCardsInHand();

            // UPDATE CARD AMOUNT UI
            dojo.query(`#player_board_${notif.args.player_id} .copen_hand_size_number`)[0].textContent = notif.args.hand_size;
            
        },

        notif_takeAbilityTile: function(notif)
        {
            var abilityTileId = `${notif.args.ability_name}-${notif.args.copy}`;
            var parentId =  `copen_ability_slot_${notif.args.ability_name}_${notif.args.player_id}`;

            this.attachToNewParent( abilityTileId, parentId );
            this.slideToObject( abilityTileId, parentId, 500  ).play();

            // CONNECT THE NEXT ABILITY TILE IN THE STACK TO CLICK EVENT
            dojo.query(`#copen_wrapper #ability_tile_stack_${notif.args.ability_name} .copen_ability_tile:last-child`).connect( 'onclick', this, 'onTakeAbilityTile');
            
            // REAPPLY TOOLTIPS
            this.updateSpecialAbilityTooltips();

        },

        notif_usedAbility: function(notif)
        {
            // DEACTIVATE ANY USED UP ABILITIES
            this.deactivateUsedAbility( notif.args.used_ability, notif.args.player_id);

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
                    
                    for ( var i in this.log_replace_keys) {

                        var key = this.log_replace_keys[i];
                        if(key in args)  // only replace key if it's present
                        {  
                            args[key] = this.postProcessLogKey(key, args); 
                        }                           
                    }

                }
            } catch (e) {
                console.error(log,args,"Exception thrown", e.stack);
            }
            return this.inherited(arguments);
        },

        postProcessLogKey(key, args)
        {
            console.log( "post process" + key);

            switch(key)
            {
                case 'log_polyomino':
                    return this.postProcessLogPolyomino( key, args );

                case 'log_ability_tile':
                    return this.postProcessLogAbilityTile( key, args );
            }
        },

        postProcessLogPolyomino( key, args )
        {

            var color = args[key].split("-")[0];
            var squares = args[key].split("-")[1];

            return this.format_block('jstpl_log_polyomino',{
                color: color,
                squares: squares,                
            }); 
        },

        postProcessLogAbilityTile( key, args )
        {
            return this.format_block('jstpl_log_ability_tile',{
                log_ability_tile: args[key],               
            }); 
        },




   });             
});
