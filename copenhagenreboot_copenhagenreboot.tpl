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

<div id="copen_wrapper">

    <div id="top_chunk">

        
        <div id="harbors">
            <div id="harbor_0" class="copen_harbor"></div>
            <div id="harbor_1" class="copen_harbor"></div>
            <div id="harbor_2" class="copen_harbor"></div>
            <div id="harbor_3" class="copen_harbor"></div>
            <div id="harbor_4" class="copen_harbor"></div>
            <div id="harbor_5" class="copen_harbor"></div>
            <div id="harbor_6" class="copen_harbor"></div>
        </div>



        <div id="deck_cards">
            <div id="deck"></div>
            <div id="small_mermaid_card"></div>
        </div>

        <div id="harbor_cards">
            <div id="harbor_position_0" class="copen_harbor_position"></div>
            <div id="harbor_position_1" class="copen_harbor_position"></div>
            <div id="harbor_position_2" class="copen_harbor_position"></div>
            <div id="harbor_position_3" class="copen_harbor_position"></div>
            <div id="harbor_position_4" class="copen_harbor_position"></div>
            <div id="harbor_position_5" class="copen_harbor_position"></div>
            <div id="harbor_position_6" class="copen_harbor_position"></div>
        </div>



        <div id="polyominoes">

            <div id="purple-2_stack" class="copen_stack"></div>        
            <div id="purple-3_stack" class="copen_stack"></div>
            <div id="purple-4_stack" class="copen_stack"></div>
            <div id="purple-5_stack" class="copen_stack"></div>

            <div id="green-2_stack" class="copen_stack"></div>
            <div id="green-3_stack" class="copen_stack"></div>
            <div id="green-4_stack" class="copen_stack"></div>
            <div id="green-5_stack" class="copen_stack"></div>

            <div id="red-2_stack" class="copen_stack"></div>
            <div id="red-3_stack" class="copen_stack"></div>
            <div id="red-4_stack" class="copen_stack"></div>
            <div id="red-5_stack" class="copen_stack"> </div>

            <div id="blue-2_stack" class="copen_stack"></div>
            <div id="blue-3_stack" class="copen_stack"></div>        
            <div id="blue-4_stack" class="copen_stack"></div>
            <div id="blue-5_stack" class="copen_stack"></div>

            <div id="yellow-2_stack" class="copen_stack"></div>
            <div id="yellow-3_stack" class="copen_stack"></div>
            <div id="yellow-4_stack" class="copen_stack"></div>
            <div id="yellow-5_stack" class="copen_stack"></div>

            <div id="white-1_stack_1" class="copen_stack"></div>
            <div id="white-1_stack_2" class="copen_stack"></div>
            <div id="white-1_stack_3" class="copen_stack"></div>
            <div id="white-1_stack_4" class="copen_stack"></div>

        </div>

        <div id="hand">
            <div id="hand_bottom_card_target"></div>
            <div id="cards_in_hand"></div>
        </div>
        <div id="owned_player_area" class="copen_player_area">

            <!-- BEGIN owned -->
            <div id="player_{ID}_playerboard" class="copen_playerboard">
            <!-- END owned -->

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

              
    </div>
 
    <div id="bottom_chunk">


        <div id="opponent_playerboards">
   
            <!-- BEGIN opponent_playerboard -->
                <div id="player_area_{ID}" class="copen_player_area">

                    <div id="player_{ID}_playerboard" class="copen_playerboard copen_playerboard_color_{COLOR}">
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
var jstpl_card='<div id="card_${id}" class="copen_card copen_${color}_card"></div>';
var jstpl_polyomino='<div id="${color}-${squares}_${copy}" class="copen_polyomino ${color}_polyomino ${color}-${squares}" style="transform: rotateY(${flip}deg) rotateZ(${rotation}deg)"></div>';

var jstpl_player_board = '<div class="copen_hand_size_wrapper">' +
                            '<div class="copen_hand_size_card">' +
                                '<div id="player_hand_size_${player_id}" class="copen_hand_size_number">' +
                                    '${hand_size}' +
                                '</div>' +
                            '</div>' + 
                        '</div>';

</script>  

{OVERALL_GAME_FOOTER}
