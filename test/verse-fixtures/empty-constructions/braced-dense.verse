vf_empty_constructions := module {
    empty_profile := class<concrete> {
        Name:string = ""
        Count:int = 0
    }

    holder := class<concrete> {
        Profile:empty_profile = empty_profile{}
        Values:[]int = array{}
        Names:[string]int = map{}
    }

    MakeDefault():holder = {
        holder{}
    }

    MakeProfile():empty_profile = {
        empty_profile {
            Name := "Alpha",
            Count := 1
        }
    }
}
