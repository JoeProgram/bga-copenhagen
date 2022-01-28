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
        <div id="small_mermaid_card"></div>
    </div>

    <div id="harbor_cards">
        <div id="harbor_position_0" class="harbor_position"></div>
        <div id="harbor_position_1" class="harbor_position"></div>
        <div id="harbor_position_2" class="harbor_position"></div>
        <div id="harbor_position_3" class="harbor_position"></div>
        <div id="harbor_position_4" class="harbor_position"></div>
        <div id="harbor_position_5" class="harbor_position"></div>
        <div id="harbor_position_6" class="harbor_position"></div>
    </div>

    <br/>

    <div id="polyominoes">

        <div id="purple-2_stack"></div>        
        <div id="purple-3_stack"></div>
        <div id="purple-4_stack"></div>
        <div id="purple-5_stack"></div>

        <div id="green-2_stack"></div>
        <div id="green-3_stack"></div>
        <div id="green-4_stack"></div>
        <div id="green-5_stack"></div>

        <div id="red-2_stack"></div>
        <div id="red-3_stack"></div>
        <div id="red-4_stack"></div>
        <div id="red-5_stack"> </div>

        <div id="blue-2_stack"></div>
        <div id="blue-3_stack"></div>        
        <div id="blue-4_stack"></div>
        <div id="blue-5_stack"></div>

        <div id="yellow-2_stack"></div>
        <div id="yellow-3_stack"></div>
        <div id="yellow-4_stack"></div>
        <div id="yellow-5_stack"></div>
    </div>

    <div id="hand">
        <div id="hand_bottom_card_target"></div>
        <div id="cards_in_hand"></div>
    </div>
    <div id="owned_player_area" class="player_area">
        <div id="owned_playerboard" class="playerboard">
            <div id="polyomino_preview"></div>

            <div class="board_cells">
                <!-- BEGIN board_cell -->
                    <div id="board_cell_{X}_{Y}" class="board_cell board_cell_{X}_{Y}"></div>
                <!-- END board_cell -->
            </div>

            
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

        <!-- BEGIN opponent_playerboard -->
            <div id="player_area_{ID}" class="player_area">
                <div class="playerboard playerboard_color_{COLOR}">
                    <div class="board_cells">

                        <!-- BEGIN opponent_board_cell -->
                            <div id="player_{PLAYER}_board_cell_{X}_{Y}" class="board_cell board_cell_{X}_{Y}"></div>
                        <!-- END opponent_board_cell -->
                    
                    </div>
                </div>
                <div class="ability_tile_area">
                    <div class="ability_tile any_cards"></div>
                    <div class="ability_tile additional_card"></div>
                    <div class="ability_tile construction_discount"></div>
                    <div class="ability_tile change_of_colors"></div>
                    <div class="ability_tile both_actions"></div>
                </div>
            </div>
        <!-- END opponent_playerboard -->
        
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

/****************************** JAVASCRIPT HTML TEMPLATES ******************************/
var jstpl_card='<div id="card_${id}" class="card ${color}_card"></div>';
var jstpl_polyomino='<div id="${color}-${squares}_${copy}" class="polyomino ${color}_polyomino ${color}-${squares}"></div>';

</script>  

{OVERALL_GAME_FOOTER}
