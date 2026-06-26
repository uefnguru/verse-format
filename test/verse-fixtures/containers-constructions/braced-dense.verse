vf_containers_constructions := module {
    entry := class {
        Index:int
        Label:string
        Weight:float = 1.0
    }

    MakeEntry(Value:int):entry = {
        entry {
            Index := Value,
            Label := "Entry {Value}",
            Weight := 2.0
        }
    }

    MakeNested():entry = {
        entry {
            Index := 7,
            Label := "nested",
            Weight := 3.0
        }
    }

    UseArray(Value:int):?int = {
        Values:[]int = array{1, 2, 3}
        if(Item := Values[Value]) {
            option{Item}
        } else {
            false
        }
    }

    BuildMap()<transacts>:[int]int = {
        var Values:[int]int = map{}
        if(set Values[0] = 1) {}
        if(set Values[1] = 2) {
            block {
                if(Values[1] = 2) {}
            }
        }
        Values
    }
}
