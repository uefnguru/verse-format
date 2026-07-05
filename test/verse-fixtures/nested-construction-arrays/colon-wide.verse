vf_nested_construction_arrays := module:
    slot := class:
        Name: string
        Padding: int = 0

    layout := class:
        Slots: []slot = array{}

    MakeLayout(): layout =
        layout:
            Slots := array:
                slot:
                    Name := "Header"
                    Padding := 4
                slot:
                    Name := "Body"
                    Padding := 8
                slot:
                    Name := "Footer"
                    Padding := 2

    MakeMap(): [string]layout =
        map:
            "main" => layout:
                Slots := array:
                    slot:
                        Name := "Main"
                        Padding := 1
            "side" => layout:
                Slots := array:
                    slot:
                        Name := "Side"
                        Padding := 2
