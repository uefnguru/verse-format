vf_string_interpolation := module:
    BuildString(Name:string, Score:int, Bonus:int):string =
        "Player {Name} has {Score + Bonus * 2} points"

    BuildMessage<localizes>(Name:string, Score:int):message =
        "Winner {Name}: score {Score}"

    UseStrings():string =
        Name := "Ada"
        Score := 7
        "{BuildString(Name, Score, 3)} / raw score {Score}"
