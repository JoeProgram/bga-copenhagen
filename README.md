# Overview
This is the project for the Board Game Arena implementation of Copenhagen, a board game designed by **Asger Harding Granerud** and **Daniel Skjold Pedersen**, and published by **Queen Games**.

# Tech
This project builds off the the default [Board Game Arena framework](https://en.doc.boardgamearena.com/Studio_file_reference?_gl=1*19qszbw*_ga*NjM2ODk4NzguMTY3NzA5OTE1Ng..*_ga_DWXD9R5L7D*MTY4MDAyMTUwOS44LjEuMTY4MDAyMTUxNC41NS4wLjA.).

It uses the Dojo Javascript Toolkit to make working with javascript and HTML easier. 

# File Structure

## Front End

- **copenhagen_copenhagen.tpl**: The HTML of the page, including some HTML snippets for dynamic instantiation.

- **copenhagen.view.php**: Modifies the base structure of the HTML in the tpl file with the data from the server.

- **copenhagen.css**: Contains all the styling CSS for the game

- **copenhagen.js**: Contains all the client-side logic and AJAX requests and callbacks to the server.

## Back End
- **states.inc.php** - defines a state machine to mark which actions and state transitions are allowed.

- **copenhagen.action.php** - defines the URLs the client is allowed to call on the server, and does some basic sanitization on provided parameters.

- **copenhagen.game.php** - the "controller" of the MVC, does all the heavy lifting of the server work, including checking input parameters for validity, processing the events, and transitioning the game from one state to another.

- **dbmodel.sql** - The database that holds all of the information in the game state, so that it can be manipulated and restored at any time.  Every single game instance played on Board Game Arena ends up getting its own database.

- **stats.inc.php** - Defines the metrics the players see at the end of the match

- **material.inc.php** - A place to store global data and magic numbers used by the game.


## Configuration

- **gameinfos.inc.php** - information to display on the game's overview page.

- **gameoptions.inc.php** - defines variaiants and additional options.  I only use it here for allowing colorblind support.
