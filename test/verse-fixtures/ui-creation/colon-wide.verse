using { /Fortnite.com/Devices }
using { /Fortnite.com/UI }
using { /UnrealEngine.com/Temporary/SpatialMath }
using { /UnrealEngine.com/Temporary/UI }
using { /Verse.org/Simulation }

ScoreMessage<localizes>(Name: string, DisplayScore: int): message =
    "{Name}: {DisplayScore} points"

vf_ui_creation := class(creative_device):
    BuildScoreWidget(Name: string, Score: int): canvas =
        Header := text_block:
            DefaultText := ScoreMessage(Name, Score + 1)
            DefaultTextSize := 24.0
        Row := stack_box:
            Orientation := orientation.Vertical
            Slots := array:
                stack_box_slot:
                    Widget := Header
                    Padding := margin:
                        Left := 8.0
                        Top := 4.0
                        Right := 8.0
                        Bottom := 4.0
        canvas:
            Slots := array:
                canvas_slot:
                    Widget := Row
                    Anchors := anchors:
                        Minimum := vector2:
                            X := 0.5
                            Y := 0.0
                        Maximum := vector2:
                            X := 0.5
                            Y := 0.0
                    Offsets := margin:
                        Left := 0.0
                        Top := 64.0
                        Right := 240.0
                        Bottom := 96.0
                    Alignment := vector2:
                        X := 0.5
                        Y := 0.0
                    SizeToContent := false
                    ZOrder := 10

    OnBegin<override>()<suspends>: void =
        for(Player: GetPlayspace().GetPlayers()):
            if(PlayerUI := GetPlayerUI[Player]):
                PlayerUI.AddWidget(BuildScoreWidget("Player", 4), player_ui_slot{InputMode := ui_input_mode.None, ZOrder := 5})
