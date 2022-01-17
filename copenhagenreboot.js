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
            dojo.query("#polyominoes .polyomino").connect( 'onclick', this, 'onSelectPolyomino');


            // TODO: Set up your game interface here, according to "gamedatas"
            
 
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

        getGridCellsForPolyominoAtCoordinates: function( polyomino, coordinates )
        {

            results = [];

            // storing variables for use in anonymous function
            var boardWidth = this.boardWidth;
            var boardHeight = this.boardHeight;

            // ADJUST PLACEMENT TO BE ON BOARD
            var bounds = this.getPolyominoBounds( polyomino );
            
            if( coordinates.x + bounds.min.x < 0 ) coordinates.x = -bounds.min.x; //scootch it to the right
            else if(coordinates.x + bounds.max.x >= boardWidth) coordinates.x = boardWidth - 1 - bounds.max.x; // scootch it to the left

            if( coordinates.y + bounds.max.y >= boardHeight) coordinates.y = boardHeight - 1 - bounds.max.y; // scootch it down

            polyomino.forEach( function( polyCoord, index)
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
        getPolyominoBounds: function( polyomino )
        {
            var bounds = {
                min: {x:0,y:0},
                max: {x:0,y:0},
            };

            polyomino.forEach( function( polyCoord, index)
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

        onSelectPolyomino: function( event )
        {

            this.selectedPolyomino = {};

            this.selectedPolyomino["id"] = event.currentTarget.id;
            this.selectedPolyomino["name"] = this.selectedPolyomino["id"].split("_")[0];
            this.selectedPolyomino["shape"] = this.polyominoShapes[this.selectedPolyomino["name"]];

            this.fadeInShadowBox(); // have to fade in the shadow box first - or the display:none css style won't allow the polyomino to slide to the target correctly

            this.attachToNewParent( event.currentTarget, "polyomino_placement");
            this.slideToObject( this.selectedPolyomino["id"], "polyomino_placement_target", 500 ).play();
        },

        onPreviewPlacePolyomino: function( event )
        {

            this.clearPreview();

            if( this.selectedPolyomino == null ) return; // make sure a polyomino is selected

            var coordinates = this.getCoordinatesFromId( event.currentTarget.id);
            var gridCells = this.getGridCellsForPolyominoAtCoordinates( this.selectedPolyomino["shape"] , coordinates );
            var validity = this.isValidPlacementPosition( gridCells );

            // DISPLAY PREVIEW
            gridCells.forEach( function(cell, index){
                var query = dojo.query(`#board_cell_${cell.x}_${cell.y}`); // the backticks here are for "template literals" - in case I forget javascript has those
                query.addClass("preview");
                if( !validity ) query.addClass("invalid");
            });
        },

        onPlacePolyomino: function( event )
        {

            if( this.selectedPolyomino == null ) return; // make sure a polyomino is selected
 
            var coordinates = this.getCoordinatesFromId( event.currentTarget.id);
            var gridCells = this.getGridCellsForPolyominoAtCoordinates( this.selectedPolyomino["shape"] , coordinates );
            var validity = this.isValidPlacementPosition( gridCells );

            if( !validity ) return; // can't place polyomino if space isn't valid

            var board = this.board; // scope issue - need to assign board to temp variable, since context of "this" changes in anonymous function
            gridCells.forEach( function(item, index){
                board[item.x][item.y] = true;
            });

            this.showPlayerBoardDebug( this.board );

            this.attachToNewParent(  this.selectedPolyomino["id"], "owned_playerboard");

             // TODO: position polyomino correctly
            this.slideToObject( this.selectedPolyomino["id"], "board_cell_0_0", 500 ).play();

            this.fadeOutShadowBox();

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
