vf_parametric_failure := module:
    holder(t:type) := class:
        Value:t

    MakeHolder(Value:t where t:type):holder(t) =
        holder(t){Value:=Value}

    FirstValue(Values:[]t where t:type)<transacts><decides>:t =
        Values[0]

    UseFirst():int =
        Numbers:[]int = array{1,2,3}
        if(Value:=FirstValue[Numbers]):
            Value
        else:
            0

    KeepPositive(Value:int)<transacts><decides>:void =
        Value > 0

    FilterPositive(Values:[]int)<transacts>:[]int =
        for(Value:Values, KeepPositive[Value]):
            Value
