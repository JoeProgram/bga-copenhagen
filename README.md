# Overview
This is the project for the Board Game Arena implementation of _[Copenhagen](https://boardgamegeek.com/boardgame/269595/copenhagen)_, a game designed by **Asger Harding Granerud** and **Daniel Skjold Pedersen**, and published by **Queen Games**.

Copenhagen is what you'd get if you combined _[Ticket to Ride](https://boardgamegeek.com/boardgame/9209/ticket-ride)_ and _Tetris_. Players take cards to pay for polyominoes (aka Tetris pieces).  The polyominoes come from a shared limited market. Players try to place as many polyominoes on their personal board as they can, completing columns and rows before the end of the game.  There are also 5 abilities players can unlock that add a little spiciness to the game while keeping it solidly in the lightweight and easy to teach category.

# Tech
This project builds off the the default [Board Game Arena framework](https://en.doc.boardgamearena.com/Studio_file_reference?_gl=1*19qszbw*_ga*NjM2ODk4NzguMTY3NzA5OTE1Ng..*_ga_DWXD9R5L7D*MTY4MDAyMTUwOS44LjEuMTY4MDAyMTUxNC41NS4wLjA.).

It uses the Dojo Javascript Toolkit to make working with Javascript and HTML easier. 

# Features of Note

In addition to the basic table stakes implementation, I put some extra time into:

- **Polyomino Placement**: Polyominoes are easy to manipulate in real life, but many digital implementations are clunky.  This system features a drag-first design that also allows for a click-only fallback, hover states that make it clear where the polyomino will go on click, and has fast and easy rotation and flipping with only two buttons.

- **Physicality**: Cards have slight 3d rotation and lighting effects on hover, and interfaces help keep players interacting with the game elements rather than UI.  

- **Colorblind Support**: The base game isn't colorblind accessible, so working with friends and members of the community, I developed alternate colors and tile patterns to allow all levels of colorblind players to enjoy the game. 


# File Structure

## Front End

- **copenhagen_copenhagen.tpl**: The HTML of the page, including some HTML snippets for dynamic instantiation.

- **copenhagen.view.php**: Modifies the base structure of the HTML in the tpl file with the data from the server.

- **copenhagen.css**: Contains all the styling CSS for the game

- **copenhagen.js**: Contains all the client-side logic and AJAX requests and callbacks to the server.

## Back End
- **states.inc.php** - defines a state machine of how the game works, which can determine which actions and state transitions are allowed.

- **copenhagen.action.php** - defines the URLs the client is allowed to call on the server, and does some basic sanitization on provided parameters.

- **copenhagen.game.php** - the controller of the MVC, does all the heavy lifting of the server work: processing the client requests, checking input parameters, modifying the database, transitioning the game from one state to another, and returning data to the proper clients. While the javascript client handles some of the rules of the game to make for an accessible experience, the server handles all the rules of the game, to make sure no illegal moves are allowed from a hacked client.

- **dbmodel.sql** - The database that holds all of the information about the game state, so that it can be manipulated and restored at any time.  Every single game instance played on Board Game Arena has its own database.

- **stats.inc.php** - Defines the metrics the players see at the end of the match

- **material.inc.php** - A place to store global data and magic numbers used by the game.


## Configuration

- **gameinfos.inc.php** - information to display on the game's Board Game Arena overview page.

- **gameoptions.inc.php** - defines variaiants and additional options.  I only use for allowing players to turn on colorblind support.


# Codebase Vocabulary

- **Cell** or **Grid Cell** - a grid square on a player's board, used for positioning validation.
- **Playerboard** - the house the player plays their polyominoes on to score.  Not to be confused with the BGA UI element player board.
- **Polyominoes** - aka "Tetris Pieces" or "Facade Tiles."
- **Polyomino Origin** - the lowest, left-most square of the shape.  Since polyominoes can be irregular, there's not a super clear system of what their "origin" should be.
- **Polyomin Min Grid Cell** - a different sort of origin - the bottom left corner of the polyomino's "bounding box."  Because of the nature of polyominoes, there may or may not be an actual square in this grid cell, depending on the type of piece and its rotation and flip.
- **Position Selected Polyomino vs Place Selected Polyomino** - positioning is all done on the client side, and is akin to the player holding up the piece above their board and saying "hm..." as they rotate it around.  Placing it is submitted to the server, similar to a player actually putting a piece into its final spot.
- **Shape** - a list of local coordinates that represent the shape of a polyomino, that can be rotated, flipped, and used to check for valid placement.


# Things I'd Do Differently Next Time

This was my first Board Game Arena implementation, and the first time I've worked with webcode in several years.  The places this codebase could be improved are:

- **Dynamic Sizing** - Board Game Arena supports a wide range of resolutions, going down as low as 1024x768 on PCs, and requirements to support phones and tablets too.  I designed the interface with these tight restrictions in mind, so it plays great on every size interface - but it ends up looking too small on large displays.  There are places where I made some assumptions about the pixel size of elements that would need to be adjusted

- **Seperate Files** - I'm not as familiar with using Javascript and PHP as I am using C#.  Breaking the .js and .game.php files into more self-contained files would help readability. 

- **Coordinate Systems** - I ended up with a few coordinate systems:
-- The coordinate system of the HTML elements on the page
-- The coordinate system of the player's playerboard (5 cells wide, 9 cells high)
-- The local representation of the polyomino shape with it's origin
-- The representation of the polyomino shape at the "Min Grid Cell"

This system could be made more accessible and clear.