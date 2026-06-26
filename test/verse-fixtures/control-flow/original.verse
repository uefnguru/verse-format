vf_control_flow := module:
    Choose(Value:int):int =
        if(Value=0):
            10
        else if(Value=1):
            20
        else:
            30

    RequireBoth(Value:int):int =
        if:
            Value >= 0
            Value <> 3
        then:
            Value + 1
        else:
            0

    SumRange()<transacts>:int =
        var Total:int=0
        for(Index:=0..3):
            set Total += Index
        Total

    LoopOnce()<transacts>:int =
        var Count:int = 0
        loop:
            set Count += 1
            break
        Count

    NestedBlock():int =
        block:
            1 + 2

    CharacterIndex(Character:char):int =
        case(Character):
            '#' => 1
            '+' => 2
            '\\' => 3
            _ => 0
