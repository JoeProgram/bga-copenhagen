# Overview
This is the project for the Board Game Arena implementation of _[Copenhagen](https://boardgamegeek.com/boardgame/269595/copenhagen)_, a game designed by **Asger Harding Granerud** and **Daniel Skjold Pedersen**, and published by **Queen Games**.

Copenhagen is what you'd get if you combined _Ticket to Ride_ and _Tetris_. Players take cards to pay for polyominoes (aka Tetris pieces).  The polyominoes come from a shared limited market. Players try to place as many polyominoes on their personal board as they can, completing columns and rows before the end of the game.  There are also 5 abilities players can unlock that add a little spiciness to the game, while keeping it solidly in the lightweight and easy to teach category.

# Tech
This project builds off the the default [Board Game Arena framework](https://en.doc.boardgamearena.com/Studio_file_reference?_gl=1*19qszbw*_ga*NjM2ODk4NzguMTY3NzA5OTE1Ng..*_ga_DWXD9R5L7D*MTY4MDAyMTUwOS44LjEuMTY4MDAyMTUxNC41NS4wLjA.).

It uses the Dojo Javascript Toolkit to make working with Javascript and HTML easier. 

# Features of Note

In addition to the basic table-stakes implementation, the areas I put some extra time into are:

- **Polyomino Placement**: Polyominoes are so easy to manipulate in real life, but a lot of digital implementations get clunky quickly.  This system features a drag-first design that also allows for a click-only fallback, and allows for fast and easy rotation and flipping with only two buttons.

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

- **copenhagen.game.php** - the controller of the MVC, does all the heavy lifting of the server work: processing the client requests, checking input parameters, modifying the database, transitioning the game from one state to another, and returning data to the proper clients.

- **dbmodel.sql** - The database that holds all of the information about the game state, so that it can be manipulated and restored at any time.  Every single game instance played on Board Game Arena has its own database.

- **stats.inc.php** - Defines the metrics the players see at the end of the match

- **material.inc.php** - A place to store global data and magic numbers used by the game.


## Configuration

- **gameinfos.inc.php** - information to display on the game's Board Game Arena overview page.

- **gameoptions.inc.php** - defines variaiants and additional options.  I only use for allowing players to turn on colorblind support.
