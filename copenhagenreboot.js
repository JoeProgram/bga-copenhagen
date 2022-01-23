
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

            this.harborCardsToRefill = [];
            this.cardWidth = 66;
            this.cardSplayDistance = 20;
            this.maxHandSize = 7;
            this.maxHandSizeDiscardHandlers = []; // keep track of the events we attach to cards to allow the player to discard - since we'll want to disconnect them afterwards

            this.cardColorOrder = ["red_card", "yellow_card", "green_card", "blue_card", "purple_card"];

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
            
            // logic for setting up data of playboard
            this.board = [];
            for( var x = 0; x < 5; x++)
            {
                this.board[x] = [];
                for( var y = 0; y < 9; y++ ) this.board[x][y] = false;
            } 
            this.showPlayerBoardDebug( this.board );


            // Setting up player boards 
            for( var player_id in gamedatas.players )
            {
                var player = gamedatas.players[player_id];
                     

                // TODO: Setting up players boards if needed
            }
            
            dojo.query(".board_cell").connect( 'onclick', this, 'onPlacePolyomino');
            dojo.query(".board_cell").connect( 'onmouseover', this, 'onPreviewPlacePolyomino');
            dojo.query("#board_cells").connect( 'onmouseout', this, 'onClearPreviewPolyomino');
            dojo.query("#polyomino_rotate_button").connect( 'onclick', this, 'onRotatePolyomino');
            dojo.query("#polyomino_flip_button").connect( 'onclick', this, 'onFlipPolyomino');

            dojo.query("#harbor_cards .card").connect('onclick',this, 'onTakeHarborCard');

            this.determineTopPolyominoInEveryStack();
            dojo.query("#polyominoes .polyomino.top_of_stack").connect( 'onclick', this, 'onSelectPolyomino');            

            this.determineUsablePolyominoes();
 
            // DEBUG
            dojo.query("#deck").connect("onclick",this,"refillHarborCards");

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
            
            switch( stateName )
            {
            
            /* Example:
            
            case 'myGameState':
            
                // Show some HTML block at this game state
                dojo.style( 'my_html_block_id', 'display', 'block' );
                
                break;
           */
           
           
            case 'dummmy':
                break;
            }
        },

        // onLeavingState: this method is called each time we are leaving a game state.
        //                 You can use this method to perform some user interface changes at this moment.
        //
        onLeavingState: function( stateName )
        {
            console.log( 'Leaving state: '+stateName );
            
            switch( stateName )
            {
            
            /* Example:
            
            case 'myGameState':
            
                // Hide the HTML block we are displaying only during this game state
                dojo.style( 'my_html_block_id', 'display', 'none' );
                
                break;
           */
           
           
            case 'dummmy':
                break;
            }               
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
/*               
                 Example:
 
                 case 'myGameState':
                    
                    // Add 3 action buttons in the action status bar:
                    
                    this.addActionButton( 'button_1_id', _('Button 1 label'), 'onMyMethodToCall1' ); 
                    this.addActionButton( 'button_2_id', _('Button 2 label'), 'onMyMethodToCall2' ); 
                    this.addActionButton( 'button_3_id', _('Button 3 label'), 'onMyMethodToCall3' ); 
                    break;
*/
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

        refillHarborCards: function ()
        {
            var game = this;

            this.harborCardsToRefill.forEach( function(harborPosition, index)
            {

                // CREATE A NEW CARD
                var cardHtml = game.format_block('jstpl_card',{   // make the html in memory
                    color: "yellow_card",
                }); 
                var card = dojo.place( cardHtml, harborPosition);  // put it in the html dom

                //ANIMATE IT FROM DECK TO CORRECT SPOT
                game.placeOnObject( card, "deck" ); // we use some visual illusion here.  The card starts on its final parent, but we snap it to the deck, then animate its slide back to its actual parent
                game.slideToObject( card, harborPosition, 500  ).play();

                dojo.connect(card, "onclick", game, "onTakeHarborCard");
            });

            this.harborCardsToRefill = [];
        },

        // we want to keep cards organized by color in hand
        //   we'll do that when we add the card to the hand
        findPositionForNewCardInHand: function( card )
        {
            var cardsInHandNode = dojo.query("#cards_in_hand")[0]; 
            var cardsInHand = this.getChildElementNodes( cardsInHandNode );

            var position = 0;

            for( var i = 0; i < this.cardColorOrder.length; i++)
            {
                var color = this.cardColorOrder[i];

                if( dojo.hasClass( card, color)) return position;
                position += dojo.query(`#cards_in_hand .${color}`).length;
            }

            return -1; // something went wrong - the card didn't have a color class
        },

        splayCardsInHand: function()
        {
            var cardsInHandNode = dojo.query("#cards_in_hand")[0]; 
            var cardsInHand = this.getChildElementNodes( cardsInHandNode );

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
            return dojo.query(`#cards_in_hand .card.${color}_card`).length;
        },

        hasTooManyCardsInHand: function()
        {
            return dojo.query("#cards_in_hand .card").length > this.maxHandSize;
        },

        checkHandSize: function()
        {
            if( this.hasTooManyCardsInHand())
            {

                dojo.addClass("hand","over_max_hand_size");

                var cardsInHandNode = dojo.query("#cards_in_hand")[0]; 
                var cardsInHand = this.getChildElementNodes( cardsInHandNode );

                for( var i = 0; i < cardsInHand.length; i++ )
                {
                    // have to connect this a little differently, since we want to remove thse handlers later
                    var discardHandler = dojo.connect( cardsInHand[i], "onclick", this, "onDiscardCardOverMaxHandSize");
                    this.maxHandSizeDiscardHandlers.push( discardHandler ); 
                }
            }
        },


        determineTopPolyominoInEveryStack: function()
        {

            for( const [key, value] of Object.entries(this.polyominoShapes))
            {
                this.determineTopPolyominoInStack( key );
            }
        },

        determineTopPolyominoInStack: function( polyominoClass )
        {
            return dojo.query( `.${polyominoClass}:last-child` ).addClass("top_of_stack");
        },

        determineUsablePolyominoes: function()
        {
            var game = this;

            dojo.query(".polyomino.top_of_stack").forEach(function(polyomino)
            {
                // clear previously let classes
                dojo.removeClass(polyomino, "usable");
                dojo.removeClass(polyomino, "unusable");

                // gather the information
                var color = polyomino.id.split('-')[0];
                var squares = polyomino.id.split('-')[1].split('_')[0];
                var cardsOfColor = game.countColoredCardsInHand( color );

                // see if player can afford polyomino
                if( cardsOfColor >= squares ) dojo.addClass( polyomino, "usable");
                else dojo.addClass(polyomino, "unusable");
            });
        },

        payPolyominoCost: function( polyominoId )
        {
            var color = polyominoId.split('-')[0];
            var squares = polyominoId.split('-')[1].split('_')[0];

            var cost = squares;

            for( var i = 0; i < cost; i++ ) this.discardCardOfColor( color );
        },

        discardCardOfColor: function( color )
        {
            var card = dojo.query(`#hand .card.${color}_card:first-child`)[0];
            dojo.destroy( card );
        },

        showPlayerBoardDebug: function( board )
        {

            for( var x = 0; x < board.length; x++)
            {
                for( var y = 0; y < board[x].length; y++ )
                {
                    if( board[x][y] == true) dojo.query( "#board_cell_" + x + "_" + y).addClass("full");
                }
            }

            dojo.query()
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
            return this.board[coordinates.x][coordinates.y] == false;
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

        isValidPlacementPosition: function( coordinates )
        {
            return this.areCellsEmpty( coordinates ) && this.isGroundedPosition( coordinates );
        },

        getGridCellsForPolyominoAtCoordinates: function( polyominoShape, coordinates )
        {

            results = [];

            // storing variables for use in anonymous function
            var boardWidth = this.boardWidth;
            var boardHeight = this.boardHeight;

            // ADJUST PLACEMENT TO BE ON BOARD
            var bounds = this.getPolyominoBounds( polyominoShape );
            
            if( coordinates.x + bounds.min.x < 0 ) coordinates.x = -bounds.min.x; //scootch it to the right
            else if(coordinates.x + bounds.max.x >= boardWidth) coordinates.x = boardWidth - 1 - bounds.max.x; // scootch it to the left

            if( coordinates.y + bounds.max.y >= boardHeight) coordinates.y = boardHeight - 1 - bounds.max.y; // scootch it down

            polyominoShape.forEach( function( polyCoord, index)
            {

                var newCoord = {
                    x: coordinates.x + polyCoord.x,
                    y: coordinates.y + polyCoord.y,
                };

                // IT'S VALID - ADD IT
                results.push(newCoord);
 
            });

            return results;
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
            dojo.query(".preview").removeClass("invalid").removeClass("preview");
            dojo.query("#polyomino_preview").style("display","none");
        },

        fadeInShadowBox: function()
        {

            dojo.style("shadow_box", "opacity","0"); // note - don't use the (#) pound symbol for this function
            
            // set elements behind the shadow box
            dojo.query("#harbors").addClass("behind_shadow_box");
            dojo.query("#deck_cards").addClass("behind_shadow_box");
            dojo.query("#harbor_cards").addClass("behind_shadow_box");
            dojo.query("#polyominoes").addClass("behind_shadow_box");  
            dojo.query("#opponent_playerboards").addClass("behind_shadow_box");  

            dojo.query("#polyomino_placement").style("display","block");


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
            dojo.query("#harbors").removeClass("behind_shadow_box");
            dojo.query("#deck_cards").removeClass("behind_shadow_box");
            dojo.query("#harbor_cards").removeClass("behind_shadow_box");
            dojo.query("#polyominoes").removeClass("behind_shadow_box");  
            dojo.query("#opponent_playerboards").removeClass("behind_shadow_box"); 

            dojo.query("#polyomino_placement").style("display","none");

            dojo.animateProperty({
                node: "shadow_box",
                duration: 500,
                properties: 
                {
                    opacity: {start: 0.5, end: 0},
                }
            }).play(); 
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
        determineHtmlPlacementForPolyominoAtCell: function( polyominoNode, gridCells )
        {
            // FIND THE GRID CELL AT MINX, MINY BOUNDARY
            var minX = gridCells[0].x;
            var minY = gridCells[0].y;
            for( var i = 1; i < gridCells.length; i++)
            {
                if( gridCells[i].x < minX) minX = gridCells[i].x;
                if( gridCells[i].y < minY) minY = gridCells[i].y;
            }

            var minCellNode = dojo.query(`#board_cell_${minX}_${minY}`)[0];
            var minCellNodePosition = dojo.position(minCellNode);

            // POSITION POLYOMINO AT THAT GRID CELL
            var htmlX = 0;
            var htmlY = minCellNodePosition.h - dojo.position(polyominoNode).h;

            return {htmlX:htmlX, htmlY:htmlY, minCellNode:minCellNode};
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
        
        /* Example:
        
        onMyMethodToCall1: function( evt )
        {
            console.log( 'onMyMethodToCall1' );
            
            // Preventing default browser reaction
            dojo.stopEvent( evt );

            // Check that this action is possible (see "possibleactions" in states.inc.php)
            if( ! this.checkAction( 'myAction' ) )
            {   return; }

            this.ajaxcall( "/copenhagenreboot/copenhagenreboot/myAction.html", { 
                                                                    lock: true, 
                                                                    myArgument1: arg1, 
                                                                    myArgument2: arg2,
                                                                    ...
                                                                 }, 
                         this, function( result ) {
                            
                            // What to do after the server call if it succeeded
                            // (most of the time: nothing)
                            
                         }, function( is_error) {

                            // What to do after the server call in anyway (success or failure)
                            // (most of the time: nothing)

                         } );        
        },        
        
        */

        onTakeHarborCard: function( event )
        {
            if( this.hasTooManyCardsInHand()) return; // doesn't work if your hand is full

            this.harborCardsToRefill.push(event.currentTarget.parentNode);

            var card = this.attachToNewParent( event.currentTarget, "cards_in_hand");
            dojo.place( card, "cards_in_hand", this.findPositionForNewCardInHand( card ));

            this.splayCardsInHand();
            this.checkHandSize();

            if( !this.hasTooManyCardsInHand()) this.determineUsablePolyominoes();
        },

        onDiscardCardOverMaxHandSize: function( event )
        {
            dojo.removeClass("hand","over_max_hand_size");

            dojo.destroy( event.currentTarget );
            dojo.forEach( this.maxHandSizeDiscardHandlers, dojo.disconnect);
            this.splayCardsInHand();
            this.determineUsablePolyominoes();
        },

        onSelectPolyomino: function( event )
        {

            if( !dojo.hasClass(event.currentTarget, "usable")) return; // make sure we can afford this polyomino before selecting it

            this.selectedPolyomino = {};

            this.selectedPolyomino["id"] = event.currentTarget.id;
            this.selectedPolyomino["name"] = this.selectedPolyomino["id"].split("_")[0];
            this.selectedPolyomino["shape"] = this.getCopyOfShape(this.selectedPolyomino["name"]);
            this.selectedPolyomino["rotation"] = 0;
            this.selectedPolyomino["flip"] = 0;

            this.fadeInShadowBox(); // have to fade in the shadow box first - or the display:none css style won't allow the polyomino to slide to the target correctly

            this.attachToNewParent( event.currentTarget, "polyomino_placement");
            this.slideToObject( this.selectedPolyomino["id"], "polyomino_placement_target", 500 ).play();

            // prepare polyomino preview for use
            var polyomino = dojo.query(`#${this.selectedPolyomino["id"]}`)[0];
            dojo.style("polyomino_preview","background-position", dojo.getStyle(polyomino, "background-position"));
            dojo.style("polyomino_preview","width", dojo.getStyle(polyomino, "width") + "px");
            dojo.style("polyomino_preview","height", dojo.getStyle(polyomino, "height") + "px");
            dojo.style("polyomino_preview","transform",""); // reset the transform from whatever it was before
            dojo.style("polyomino_preview","display","none"); // not ready to show yet - turn off
        },

        onRotatePolyomino: function( event )
        {

            if( this.selectedPolyomino == null ) return;  // make sure a polyomino is selected

            var polyominoNode = dojo.query(`#${this.selectedPolyomino["id"]}`)[0];

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

            this.selectedPolyomino["rotation"] = (this.selectedPolyomino["rotation"] + rotationDegrees) % 360;

            this.rotatePolyominoShape( this.selectedPolyomino["shape"] );

            // prepare preview polyomino - set in final position
            dojo.style("polyomino_preview","transform", `rotateY(${this.selectedPolyomino["flip"]}deg) rotateZ(${this.selectedPolyomino["rotation"]}deg)`);

        },
        
        onFlipPolyomino: function( event )
        {

            if( this.selectedPolyomino == null ) return;  // make sure a polyomino is selected

            var polyominoNode = dojo.query(`#${this.selectedPolyomino["id"]}`)[0];

            var rotation = this.selectedPolyomino["rotation"]; // need to pass this to a local variable to use it in animation scope

            // CODE SNIPPET FROM: https://forum.boardgamearena.com/viewtopic.php?t=15158

            var animation = dojo.animateProperty({
                node: polyominoNode,
                duration: 500,
                properties: {
                    propertyTransform: {start: this.selectedPolyomino["flip"], end: this.selectedPolyomino["flip"]+180 }
                },
                onAnimate: function (values) {
                    dojo.style(this.node, 'transform', 'rotateY(' + parseFloat(values.propertyTransform.replace("px", "")) + 'deg) rotateZ(' + rotation + 'deg)');
                }
            });
            animation.play();

            this.selectedPolyomino["flip"] = (this.selectedPolyomino["flip"] + 180) % 360;

            this.flipPolyominoShape( this.selectedPolyomino["shape"] );

            // prepare preview polyomino - set in final position
            dojo.style("polyomino_preview","transform", `rotateY(${this.selectedPolyomino["flip"]}deg) rotateZ(${this.selectedPolyomino["rotation"]}deg)`);

        },

        onPreviewPlacePolyomino: function( event )
        {

            this.clearPreview();

            if( this.selectedPolyomino == null ) return; // make sure a polyomino is selected

            var coordinates = this.getCoordinatesFromId( event.currentTarget.id);
            var gridCells = this.getGridCellsForPolyominoAtCoordinates( this.selectedPolyomino["shape"] , coordinates );
            var validity = this.isValidPlacementPosition( gridCells );

            // SHOW IF INVALID
            if( !validity )
            {
                gridCells.forEach( function(cell, index){
                    var query = dojo.query(`#board_cell_${cell.x}_${cell.y}`); // the backticks here are for "template literals" - in case I forget javascript has those
                    query.addClass("preview").addClass("invalid");
                });    
            }
            // SHOW IF VALID
            else
            {
                
                dojo.style("polyomino_preview","display","block"); // have to display node before placing it - or we can't get the height of it correctly for htmlPlacement

                var polyominoPreviewNode = dojo.query("#polyomino_preview")[0];
                var htmlPlacement = this.determineHtmlPlacementForPolyominoAtCell( polyominoPreviewNode, gridCells );

                this.slideToObjectPos( "polyomino_preview",htmlPlacement.minCellNode, htmlPlacement.htmlX, htmlPlacement.htmlY, 0).play(); // use this instead of placeOnObjectPos, as I placeOnObjectPos does centering I don't want

            }


        },

        onClearPreviewPolyomino: function( event )
        {
            this.clearPreview();
        },

        onPlacePolyomino: function( event )
        {

            if( this.selectedPolyomino == null ) return; // make sure a polyomino is selected
 
            var coordinates = this.getCoordinatesFromId( event.currentTarget.id);
            var gridCells = this.getGridCellsForPolyominoAtCoordinates( this.selectedPolyomino["shape"] , coordinates );
            var validity = this.isValidPlacementPosition( gridCells );

            if( !validity ) return; // can't place polyomino if space isn't valid

            var board = this.board; // NOTE: scope issue - need to assign board to temp variable, since context of "this" changes in anonymous function
            gridCells.forEach( function(item, index){
                board[item.x][item.y] = true;
            });

            this.showPlayerBoardDebug( this.board );
            dojo.query(".board_cell.preview").removeClass("preview");

            var polyominoNode = dojo.query(`#${this.selectedPolyomino["id"]}`)[0];
            dojo.removeClass(polyominoNode, "top_of_stack");

            // DETERMINE HTML PLACEMENT FOR POLYOMINO
            var htmlPlacement = this.determineHtmlPlacementForPolyominoAtCell( polyominoNode, gridCells );

            this.attachToNewParent(  this.selectedPolyomino["id"], "owned_playerboard");
            this.slideToObjectPos( this.selectedPolyomino["id"],htmlPlacement.minCellNode, htmlPlacement.htmlX, htmlPlacement.htmlY, 500 ).play();

            this.fadeOutShadowBox();

            this.payPolyominoCost( this.selectedPolyomino.id );

            // handle the new top of stack
            var newTopOfStack = this.determineTopPolyominoInStack( this.selectedPolyomino["name"]);
            dojo.query(`.${this.selectedPolyomino["name"]}.top_of_stack`).connect( 'onclick', this, 'onSelectPolyomino');            

            // recalculate what you can afford
            this.determineUsablePolyominoes();

            this.selectedPolyomino = null;

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
            console.log( 'notifications subscriptions setup' );
            
            // TODO: here, associate your game notifications with local methods
            
            // Example 1: standard notification handling
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            
            // Example 2: standard notification handling + tell the user interface to wait
            //            during 3 seconds after calling the method in order to let the players
            //            see what is happening in the game.
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            // this.notifqueue.setSynchronous( 'cardPlayed', 3000 );
            // 
        },  
        
        // TODO: from this point and below, you can write your game notifications handling methods
        
        /*
        Example:
        
        notif_cardPlayed: function( notif )
        {
            console.log( 'notif_cardPlayed' );
            console.log( notif );
            
            // Note: notif.args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call
            
            // TODO: play the card in the user interface.
        },    
        
        */
   });             
});
