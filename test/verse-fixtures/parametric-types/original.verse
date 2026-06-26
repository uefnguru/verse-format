vf_parametric_types := module:
    pair(first_type:type, second_type:type) := class:
        First:first_type
        Second:second_type

    comparable_box(item_type:subtype(comparable)) := class:
        Value:item_type

    MakeIntStringPair(Number:int, Label:string)<transacts>:pair(int, string) =
        pair(int, string){First:=Number, Second:=Label}

    Identity(Value:t where t:type)<transacts>:t =
        Value

    BoxComparable(Value:t where t:subtype(comparable))<transacts>:comparable_box(t) = comparable_box(t){Value:=Value}

    KeepNonZero(Value:int)<transacts><decides>:void =
        Value <> 0

    FilterValues(Values:[]t, Predicate(:t)<transacts><decides>:void where t:type)<transacts>:[]t =
        for(Value:Values, Predicate[Value]):
            Value

    UseParametricTypes()<transacts>:int =
        Pair:=MakeIntStringPair(7, "seven")
        Box:=BoxComparable(Pair.First)
        Values:=FilterValues(array{0, 1, 2}, KeepNonZero)
        Identity(Box.Value + Values.Length)
