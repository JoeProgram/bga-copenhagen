{OVERALL_GAME_HEADER}

<!-- 
--------
-- BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
-- CopenhagenReboot implementation : © <Your name here> <Your email address here>
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-------
-->

<div id="playspace">

    <div id="harbors">
        <div class="harbor"></div>
        <div class="harbor"></div>
        <div class="harbor"></div>
        <div class="harbor"></div>
        <div class="harbor"></div>
        <div class="harbor"></div>
        <div class="harbor"></div>
    </div>

    <br/>

    <div id="deck_cards">
        <div id="deck"></div>
        <div id="mermaid_card"></div>
    </div>

    <div id="harbor_cards">
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
    </div>

    <br/>

    <div id="polyominoes">
        <div id="purple-2_1" class="polyomino purple-2"></div>
        <div id="purple-3_1" class="polyomino purple-3"></div>
        <div id="purple-4_1" class="polyomino purple-4"></div>
        <div id="purple-5_1" class="polyomino purple-5"></div>

        <div id="green-2_1" class="polyomino green-2"></div>
        <div id="green-3_1" class="polyomino green-3"></div>
        <div id="green-4_1" class="polyomino green-4"></div>
        <div id="green-5_1" class="polyomino green-5"></div>

        <div id="red-2_1" class="polyomino red-2"></div>
        <div id="red-3_1" class="polyomino red-3"></div>
        <div id="red-4_1" class="polyomino red-4"></div>
        <div id="red-5_1" class="polyomino red-5"></div>

        <div id="blue-2_1" class="polyomino blue-2"></div>
        <div id="blue-3_1" class="polyomino blue-3"></div>
        <div id="blue-4_1" class="polyomino blue-4"></div>
        <div id="blue-5_1" class="polyomino blue-5"></div>

        <div id="yellow-2_1" class="polyomino yellow-2"></div>
        <div id="yellow-3_1" class="polyomino yellow-3"></div>
        <div id="yellow-4_1" class="polyomino yellow-4"></div>
        <div id="yellow-5_1" class="polyomino yellow-5"></div>
    </div>

    <div id="owned_player_area" class="player_area">
        <div id="owned_playerboard" class="playerboard blue">
            <div class="board_cell" id="board_cell_0_0"></div>
            <div class="board_cell" id="board_cell_0_1"></div>
            <div class="board_cell" id="board_cell_0_2"></div>
            <div class="board_cell" id="board_cell_0_3"></div>
            <div class="board_cell" id="board_cell_0_4"></div>
            <div class="board_cell" id="board_cell_0_5"></div>
            <div class="board_cell" id="board_cell_0_6"></div>
            <div class="board_cell" id="board_cell_0_7"></div>
            <div class="board_cell" id="board_cell_0_8"></div>

            <div class="board_cell" id="board_cell_1_0"></div>
            <div class="board_cell" id="board_cell_1_1"></div>
            <div class="board_cell" id="board_cell_1_2"></div>
            <div class="board_cell" id="board_cell_1_3"></div>
            <div class="board_cell" id="board_cell_1_4"></div>
            <div class="board_cell" id="board_cell_1_5"></div>
            <div class="board_cell" id="board_cell_1_6"></div>
            <div class="board_cell" id="board_cell_1_7"></div>
            <div class="board_cell" id="board_cell_1_8"></div>

            <div class="board_cell" id="board_cell_2_0"></div>
            <div class="board_cell" id="board_cell_2_1"></div>
            <div class="board_cell" id="board_cell_2_2"></div>
            <div class="board_cell" id="board_cell_2_3"></div>
            <div class="board_cell" id="board_cell_2_4"></div>
            <div class="board_cell" id="board_cell_2_5"></div>
            <div class="board_cell" id="board_cell_2_6"></div>
            <div class="board_cell" id="board_cell_2_7"></div>
            <div class="board_cell" id="board_cell_2_8"></div>

            <div class="board_cell" id="board_cell_3_0"></div>
            <div class="board_cell" id="board_cell_3_1"></div>
            <div class="board_cell" id="board_cell_3_2"></div>
            <div class="board_cell" id="board_cell_3_3"></div>
            <div class="board_cell" id="board_cell_3_4"></div>
            <div class="board_cell" id="board_cell_3_5"></div>
            <div class="board_cell" id="board_cell_3_6"></div>
            <div class="board_cell" id="board_cell_3_7"></div>
            <div class="board_cell" id="board_cell_3_8"></div>

            <div class="board_cell" id="board_cell_4_0"></div>
            <div class="board_cell" id="board_cell_4_1"></div>
            <div class="board_cell" id="board_cell_4_2"></div>
            <div class="board_cell" id="board_cell_4_3"></div>
            <div class="board_cell" id="board_cell_4_4"></div>
            <div class="board_cell" id="board_cell_4_5"></div>
            <div class="board_cell" id="board_cell_4_6"></div>
            <div class="board_cell" id="board_cell_4_7"></div>
            <div class="board_cell" id="board_cell_4_8"></div>

            
        </div>
        <div class="ability_tile_area">
            <div class="ability_tile any_cards"></div>
            <div class="ability_tile additional_card"></div>
            <div class="ability_tile construction_discount"></div>
            <div class="ability_tile change_of_colors"></div>
            <div class="ability_tile both_actions"></div>
        </div>
    </div>

    <div id="opponent_playerboards">
        <div class="player_area">
            <div class="playerboard yellow"></div>
            <div class="ability_tile_area">
                <div class="ability_tile any_cards"></div>
                <div class="ability_tile additional_card"></div>
                <div class="ability_tile construction_discount"></div>
                <div class="ability_tile change_of_colors"></div>
                <div class="ability_tile both_actions"></div>
            </div>
        </div>

        <div class="player_area">
            <div class="playerboard green"></div>
            <div class="ability_tile_area">
                <div class="ability_tile any_cards"></div>
                <div class="ability_tile additional_card"></div>
                <div class="ability_tile construction_discount"></div>
                <div class="ability_tile change_of_colors"></div>
                <div class="ability_tile both_actions"></div>
            </div>
        </div>

        <div class="player_area">
            <div class="playerboard red"></div>
            <div class="ability_tile_area">
                <div class="ability_tile any_cards"></div>
                <div class="ability_tile additional_card"></div>
                <div class="ability_tile construction_discount"></div>
                <div class="ability_tile change_of_colors"></div>
                <div class="ability_tile both_actions"></div>
            </div>
        </div> 
    </div>

    <div id="shadow_box"></div>
    <div id="polyomino_placement">
        <div id="polyomino_placement_target"></div>
        <div id="polyomino_placement_buttons">
            <div id="polyomino_rotate_button"></div>
            <div id="polyomino_flip_button"></div>
        </div>
    </div>

</div>

<script type="text/javascript">

// Javascript HTML templates

/*
// Example:
var jstpl_some_game_item='<div class="my_game_item" id="my_game_item_${MY_ITEM_ID}"></div>';

*/

</script>  

{OVERALL_GAME_FOOTER}
