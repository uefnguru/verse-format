formatter_compile_probe := module:
    probe_item := class:
        Index: int
        Label: string

    MakeItem(Value: int): probe_item =
        probe_item:
            Index := Value
            Label := "Value {Value}"

    ChooseLabel(Value: int): string =
        if(Value = 0):
            "zero"
        else if(Value = 1):
            "one"
        else:
            "many"

    IfThen(Value: int): int =
        if:
            Value = 1
        then:
            10
        else:
            20

    CharacterIndex(Character: char): int =
        case(Character):
            '#' => 1
            '+' => 2
            '\\' => 3
            _ => 0

    BuildMap()<transacts>: [int]int =
        var Values: [int]int = map:
        if(set Values[0] = 1):
        if(set Values[1] = 2):
            block:
                if(Values[1] = 2):
        Values

    SumSmall()<transacts>: int =
        var Total: int = 0
        for(Value := 0..2):
            set Total += Value
        loop:
            break
        Total

    UseDefer(): void =
        defer:
            block:
                if(false?):

        <#
        if(Value = 1) {
            ThisShouldStayCommented()
        }
        #>

        if(true?):
            block:
