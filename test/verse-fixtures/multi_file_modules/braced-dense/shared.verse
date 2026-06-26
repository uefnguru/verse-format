vf_shared_math<public> := module {
    BaseValue<public>:int = 4

    AddBonus<public>(Value:int):int = {
        Value + BaseValue
    }
}

vf_shared_types<public> := module {
    result_pair<public> := struct {
        Left:int
        Right:int
    }
}
