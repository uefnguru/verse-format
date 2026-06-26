using { /Fortnite.com/Devices }
using { /Verse.org/Simulation }

EditableCategory<localizes>:message = "Formatter"

vf_editable_attributes := class(creative_device):
    @editable_number(float):
        Categories := array{EditableCategory}
        MinValue := option{0.0}
        MaxValue := option{10.0}
        SpinBoxDelta := option{0.5}
    Speed:float = 1.0

    @editable_slider(int){Categories:=array{EditableCategory},MinValue:=option{1},MaxValue:=option{5},SliderDelta:=option{1}}
    Count:int = 3

    @editable_text_box{Categories:=array{EditableCategory},MultiLine:=false,MaxLength:=32}
    Label:string = "Gate"

    OnBegin<override>()<suspends>:void =
        block {}
