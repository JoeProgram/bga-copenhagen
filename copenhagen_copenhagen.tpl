{OVERALL_GAME_HEADER}

<!-- 
--------
-- BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
-- Copenhagen implementation : © <Joe France> <josephfrance@gmail.com>
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-------
-->

<div id="copen_wrapper">

    <div id="top_chunk" class="{SPECTATOR}">

        
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
            <div id="deck">
                <div id="cards_remaining" ><div>10</div> </div>
            </div>
            <div id="small_mermaid_card_slot"></div>
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

        <div id="ability_tile_stacks">
            <div id="ability_tile_stack_additional_card" class="copen_ability_tile_stack"></div>
            <div id="ability_tile_stack_construction_discount" class="copen_ability_tile_stack"></div>
            <div id="ability_tile_stack_change_of_colors" class="copen_ability_tile_stack"></div>
            <div id="ability_tile_stack_both_actions" class="copen_ability_tile_stack"></div>
        </div>

        <div id="hand">
            <div id="hand_bottom_card_target"></div>
            <div id="cards_in_hand"></div>
        </div>
        <div id="owned_player_area" class="copen_player_area {SPECTATOR}">

            <!-- BEGIN owned -->
            <div id="player_{ID}_playerboard" class="copen_playerboard">
            
                <div class="copen_playerboard_image"></div>

                <div class="copen_coat_of_arms_emblems">
                    <div id="copen_coat_of_arms_1_{ID}" class="copen_coat_of_arms copen_coat_of_arms_1"></div>
                    <div id="copen_coat_of_arms_2_{ID}" class="copen_coat_of_arms copen_coat_of_arms_2"></div>
                    <div id="copen_coat_of_arms_3_{ID}" class="copen_coat_of_arms copen_coat_of_arms_3"></div>
                    <div id="copen_coat_of_arms_4_{ID}" class="copen_coat_of_arms copen_coat_of_arms_4"></div>
                    <div id="copen_coat_of_arms_5_{ID}" class="copen_coat_of_arms copen_coat_of_arms_5"></div>
                    <div id="copen_coat_of_arms_6_{ID}" class="copen_coat_of_arms copen_coat_of_arms_6"></div>
                    <div id="copen_coat_of_arms_7_{ID}" class="copen_coat_of_arms copen_coat_of_arms_7"></div>
                </div>
            <!-- END owned -->

                <div id="polyomino_preview">
                    <div class="copen_polyomino_image"></div>
                </div>

                <div class="copen_board_cells">
                    <!-- BEGIN board_cell -->
                        <div id="board_cell_{X}_{Y}" class="copen_board_cell copen_board_cell_{X}_{Y}"></div>
                    <!-- END board_cell -->
                </div>

                
            </div>
            <!-- BEGIN owned_ability_tile_area -->
            <div id="ability_tile_area_{ID}" class="copen_ability_tile_area">
                <div id="copen_ability_slot_any_cards_{ID}" class="copen_ability_slot copen_ability_slot_any_cards"></div>
                <div id="copen_ability_slot_additional_card_{ID}" class="copen_ability_slot copen_ability_slot_additional_card"></div>
                <div id="copen_ability_slot_construction_discount_{ID}" class="copen_ability_slot copen_ability_slot_construction_discount"></div>
                <div id="copen_ability_slot_change_of_colors_{ID}" class="copen_ability_slot copen_ability_slot_change_of_colors"></div>
                <div id="copen_ability_slot_both_actions_{ID}" class="copen_ability_slot copen_ability_slot_both_actions"></div>
            </div>
            <!-- END owned_ability_tile_area -->
        </div>

        <div id="polyomino_placement">
            <div id="polyomino_placement_buttons">
                <div id="polyomino_rotate_button" class="copen_usable"></div>
                <div id="polyomino_flip_button" class="copen_usable"></div>
            </div>
        </div>

        <div id="change_of_colors_ui">
            <!-- BEGIN change_of_colors_option -->
                <div class="copen_change_of_colors_option copen_usable">
                    <div class="copen_card">
                        <div class="copen_card_image"></div>
                        <div class="copen_new_color"></div>
                    </div>
                </div>
            <!-- END change_of_colors_option -->
        </div>


    </div>
 
    <div id="bottom_chunk">


        <div id="opponent_playerboards">
   
            <!-- BEGIN opponent_playerboard -->
                <div id="player_area_{ID}" class="copen_player_area">

                    <div id="player_{ID}_playerboard" class="copen_playerboard copen_playerboard_color_{COLOR}">

                        <div class="copen_playerboard_image"></div>

                        <div class="copen_coat_of_arms_emblems">
                            <div id="copen_coat_of_arms_1_{ID}" class="copen_coat_of_arms copen_coat_of_arms_1"></div>
                            <div id="copen_coat_of_arms_2_{ID}" class="copen_coat_of_arms copen_coat_of_arms_2"></div>
                            <div id="copen_coat_of_arms_3_{ID}" class="copen_coat_of_arms copen_coat_of_arms_3"></div>
                            <div id="copen_coat_of_arms_4_{ID}" class="copen_coat_of_arms copen_coat_of_arms_4"></div>
                            <div id="copen_coat_of_arms_5_{ID}" class="copen_coat_of_arms copen_coat_of_arms_5"></div>
                            <div id="copen_coat_of_arms_6_{ID}" class="copen_coat_of_arms copen_coat_of_arms_6"></div>
                            <div id="copen_coat_of_arms_7_{ID}" class="copen_coat_of_arms copen_coat_of_arms_7"></div>
                        </div>

                        <div class="copen_board_cells">

                            <!-- BEGIN opponent_board_cell -->
                                <div id="player_{PLAYER}_board_cell_{X}_{Y}" class="copen_board_cell copen_board_cell_{X}_{Y}"></div>
                            <!-- END opponent_board_cell -->

                        </div>
                    </div>

                    <div id="ability_tile_area_{ID}" class="copen_ability_tile_area">
                        <div id="copen_ability_slot_any_cards_{ID}"  class="copen_ability_slot copen_ability_slot_any_cards"></div>
                        <div id="copen_ability_slot_additional_card_{ID}"  class="copen_ability_slot copen_ability_slot_additional_card"></div>
                        <div id="copen_ability_slot_construction_discount_{ID}"  class="copen_ability_slot copen_ability_slot_construction_discount"></div>
                        <div id="copen_ability_slot_change_of_colors_{ID}"  class="copen_ability_slot copen_ability_slot_change_of_colors"></div>
                        <div id="copen_ability_slot_both_actions_{ID}"  class="copen_ability_slot copen_ability_slot_both_actions"></div> 
                    </div>
                </div>
            <!-- END opponent_playerboard -->
                  
        </div>

    </div>

    <div id="shadow_box"></div>
    <div id="empty_pixel"></div>

</div>


<script type="text/javascript">

/****************************** JAVASCRIPT HTML TEMPLATES ******************************/
var jstpl_card= '<div id="card_${id}" class="copen_card copen_${color}_card">' +
                    '<div class="copen_card_image"></div>' +
                    '<div class="copen_new_color copen_hidden"></div>' +
                '</div>';

var jstpl_polyomino=    '<div id="${color}-${squares}_${copy}" draggable="true" class="copen_polyomino copen_${color}_polyomino copen_${color}-${squares}" style="transform: rotateY(${flip}deg) rotateZ(${rotation}deg)">' +
                            '<div class="copen_polyomino_image"></div>' +
                            '<div class="copen_polyominoes_remaining">${copy}</div>' +
                        '</div>';

var jstpl_player_board = '<div class="copen_hand_size_wrapper">' +
                            '<div class="copen_hand_size_card">' +
                                '<div id="player_hand_size_${player_id}" class="copen_hand_size_number">' +
                                    '${hand_size}'+
                                '</div>' +
                            '</div>' + 
                        '</div>';


var jstpl_log_polyomino =   '<div class="copen_log_polyomino copen_${color}-${squares}">' +
                                '<div class="copen_polyomino_image"></div>' +
                            '</div>';

var jstpl_ability_tile= '<div id="${ability_name}-${copy}" class="copen_ability_tile copen_${ability_name}">'+
                            '<div class="copen_ability_tile_inner">' +
                                '<div class="copen_ability_tile_front"></div>' +
                                '<div class="copen_ability_tile_back"></div>' +                                
                            '</div>' +      
                        '</div>';
 
var jstpl_log_ability_tile = '<div class="copen_log_ability_tile copen_log_ability_tile_${log_ability_tile}"></div>';

var jstpl_overlap = '<div id="${id}" class="copen_overlap"></div>';

var jstpl_title_special_ability_tile =      '<div class="copen_title_ability_tile"></div>';
var jstpl_title_special_ability_tile_used = '<div class="copen_title_ability_tile_used"></div>';
var jstpl_title_special_facade_tile =       '<div class="copen_title_polyomino"></div>';

var jstpl_deck_shuffle_card = '<div id="deck_shuffle_card_${id}" class="deck_shuffle_card"></div>';

</script>  

{OVERALL_GAME_FOOTER}
