import { testFormat } from "./helpers";

testFormat(
    "converts recognized colon blocks to braces",
    [
        "example_device := class(creative_device):",
        "    OnBegin<override>()<suspends>:void =",
        "        if(Value = 1):",
        '            Print("one")',
        "        else:",
        '            Print("other")'
    ].join("\n"),
    [
        "example_device := class(creative_device) {",
        "    OnBegin<override>()<suspends>: void = {",
        "        if(Value = 1) {",
        '            Print("one")',
        "        } else {",
        '            Print("other")',
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "converts multiline if then and async blocks",
    [
        "probe := class(creative_device):",
        "    Run()<suspends>:void =",
        "        if:",
        "            Candidate := 1",
        "            Candidate = 1",
        "        then:",
        "            sync:",
        "                Sleep(0.0)",
        "                Sleep(0.0)",
        "            spawn:",
        "                BackgroundTask()",
        "    BackgroundTask()<suspends>:void =",
        "        Sleep(0.0)"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run()<suspends>: void = {",
        "        if {",
        "            Candidate := 1",
        "            Candidate = 1",
        "        } then {",
        "            sync {",
        "                Sleep(0.0)",
        "                Sleep(0.0)",
        "            }",
        "            spawn {",
        "                BackgroundTask()",
        "            }",
        "        }",
        "    }",
        "    BackgroundTask()<suspends>: void = {",
        "        Sleep(0.0)",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "does not let braced multiline if construction consume the next method",
    [
        "probe := class(creative_device):",
        "    Apply():void =",
        "        if (set Store[Key] = SampleRecord{",
        "            Key := Key",
        "        }){}",
        "",
        "    # Builds the next state.",
        "    Next():void =",
        "        return"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Apply(): void = {",
        "        if(set Store[Key] = SampleRecord {",
        "                Key := Key",
        "            }) {}",
        "    }",
        "",
        "    # Builds the next state.",
        "    Next(): void = {",
        "        return",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "converts hybrid closing-brace else colon blocks",
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        if(Number = 1) {",
        '            Print("if block")',
        "        } else:",
        '            Print("else block")',
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        if(Number = 1) {",
        '            Print("if block")',
        "        } else {",
        '            Print("else block")',
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "converts hybrid closing-brace else-if colon blocks",
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        if(Number = 1) {",
        '            Print("one")',
        "        } else if(Number = 2):",
        '            Print("two")',
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        if(Number = 1) {",
        '            Print("one")',
        "        } else if(Number = 2) {",
        '            Print("two")',
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "does not keep trailing blank lines inside converted colon-style method",
    ["probe := class(creative_device):", "    Run():void =", '        Print("Hello")', "", ""].join(
        "\n"
    ),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        '        Print("Hello")',
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "moves blank separator after generated method close before next method",
    [
        "example_component := class(component) {",
        "    TestImmediateBlocks<private>():void =",
        "        Number: int = braced_block_examples.ExampleNumber",
        "",
        "        if(Number = 1) {",
        '            Print("if block")',
        "        } else:",
        '            Print("else block")',
        "        ",
        "",
        "        if {",
        "            Candidate: int = Number",
        "            Candidate = 1",
        "        } then {",
        '            Print("if/then block")',
        "        } else {",
        '            Print("if/then else block")',
        "        }",
        "",
        "        defer {",
        '            Print("defer block")',
        "        }",
        "",
        '        Print("after defer")',
        "    ",
        "",
        "    TestAsyncBlocks<private>()<suspends>:void = {",
        "        sync {",
        "            Sleep(0.0)",
        "            Sleep(0.0)",
        "        }",
        "",
        "        race {",
        "            Sleep(0.0)",
        "            Sleep(0.0)",
        "        }",
        "    }",
        "}"
    ].join("\n"),
    [
        "example_component := class(component) {",
        "    TestImmediateBlocks<private>(): void = {",
        "        Number: int = braced_block_examples.ExampleNumber",
        "",
        "        if(Number = 1) {",
        '            Print("if block")',
        "        } else {",
        '            Print("else block")',
        "        }",
        "",
        "        if {",
        "            Candidate: int = Number",
        "            Candidate = 1",
        "        } then {",
        '            Print("if/then block")',
        "        } else {",
        '            Print("if/then else block")',
        "        }",
        "",
        "        defer {",
        '            Print("defer block")',
        "        }",
        "",
        '        Print("after defer")',
        "    }",
        "",
        "    TestAsyncBlocks<private>()<suspends>: void = {",
        "        sync {",
        "            Sleep(0.0)",
        "            Sleep(0.0)",
        "        }",
        "",
        "        race {",
        "            Sleep(0.0)",
        "            Sleep(0.0)",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "does not insert blank separator before else sibling",
    [
        "probe := class(creative_device):",
        "    Run():void =",
        "        if(Number = 1):",
        '            Print("one")',
        "",
        "        else:",
        '            Print("two")'
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        if(Number = 1) {",
        '            Print("one")',
        "        } else {",
        '            Print("two")',
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "converts editable attribute colon blocks to braces",
    [
        "probe := class(creative_device):",
        "    @editable_number(float):",
        "        Categories := array{SettingsCategory},",
        "        MinValue := option{0.1}",
        "    Value:float = 0.5"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    @editable_number(float) {",
        "        Categories := array{SettingsCategory},",
        "        MinValue := option{0.1}",
        "    }",
        "    Value: float = 0.5",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "merges dangling assignment lines with following expression blocks",
    [
        "probe := class(creative_device):",
        "    Run():void =",
        "        Items :=",
        "            if(UseAlternate?):",
        "                BuildItems(InputValue, true)",
        "            else:",
        "                BuildItems(InputValue, false)",
        "        ChosenValue :=",
        "            if(Candidate := MaybeValue?):",
        "                Candidate",
        "            else:",
        "                DefaultValue"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Items := if(UseAlternate?) {",
        "            BuildItems(InputValue, true)",
        "        } else {",
        "            BuildItems(InputValue, false)",
        "        }",
        "        ChosenValue := if(Candidate := MaybeValue?) {",
        "            Candidate",
        "        } else {",
        "            DefaultValue",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "preserves blank lines before non-dangling expression blocks",
    [
        "probe := class(creative_device):",
        "    Run():void =",
        "        var Selected: ?int = false",
        "",
        "        for(Value: Values):",
        "            set Selected = option{Value}",
        "",
        "        Selected?"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        var Selected: ?int = false",
        "",
        "        for(Value: Values) {",
        "            set Selected = option{Value}",
        "        }",
        "",
        "        Selected?",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "converts multiline parenthesized if headers to braced blocks",
    [
        "probe := class(creative_device):",
        "    Parse(Buffer:string, Index:int):void =",
        "        if (",
        "            EndIndex < Buffer.Length,",
        "            A := Buffer[Index + 1],",
        "            B := Buffer[Index + 2],",
        "            C := Buffer[Index + 3]",
        "        ):",
        "            if(A = 'a', B = 'b', C = 'c'):",
        '                Print("match")'
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Parse(Buffer: string, Index: int): void = {",
        "        if(",
        "            EndIndex < Buffer.Length,",
        "            A := Buffer[Index + 1],",
        "            B := Buffer[Index + 2],",
        "            C := Buffer[Index + 3]",
        "        ) {",
        "            if(A = 'a', B = 'b', C = 'c') {",
        '                Print("match")',
        "            }",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "converts long function signatures with map parameter types",
    [
        "sample_service := class():",
        "    BuildResult<private>(NewItems: [int]SampleItem, OldItems: [int]SampleItem, Labels: [int]string, Options: [int]SampleOptions, OldSummary: SampleSummary, ItemCount: int): SampleSummary =",
        "        SafeCount := ClampCount(ItemCount)",
        "        SlotsPerItem: int = 11",
        "        TotalCount := SafeCount * SlotsPerItem",
        "        PrimaryValues := for (I := 0..TotalCount - 1) { sample_value{} }",
        "        SecondaryValues := for (I := 0..SafeCount - 1) { sample_value{} }",
        "        CharsPerItem: int = 32"
    ].join("\n"),
    [
        "sample_service := class() {",
        "    BuildResult<private>(NewItems: [int]SampleItem, OldItems: [int]SampleItem, Labels: [int]string, Options: [int]SampleOptions, OldSummary: SampleSummary, ItemCount: int): SampleSummary = {",
        "        SafeCount := ClampCount(ItemCount)",
        "        SlotsPerItem: int = 11",
        "        TotalCount := SafeCount * SlotsPerItem",
        "        PrimaryValues := for(I := 0..TotalCount - 1) { sample_value{} }",
        "        SecondaryValues := for(I := 0..SafeCount - 1) { sample_value{} }",
        "        CharsPerItem: int = 32",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "recovers flattened function bodies after previous formatting damage",
    [
        "ApplySampleState<private>(Target: SampleTarget, Key: string, Items: [int]SampleItem, MaybeLabels: ?[int]string, MaybeCount: ?int, Mode: sample_mode): void =",
        "var NewCount: int = 5",
        "var NewLabels: [int]string = map{}",
        "RequestedMode := ChooseMode(Items)",
        "var SavedItem: ?SampleRecord = false",
        "if(StoredItem := Store[Key], set SavedItem = option{StoredItem}) {}",
        "",
        "# --- SAMPLE SECTION ---",
        "if(PreviousItem := SavedItem?) {}",
        "var ShouldApply: logic = false"
    ].join("\n"),
    [
        "ApplySampleState<private>(Target: SampleTarget, Key: string, Items: [int]SampleItem, MaybeLabels: ?[int]string, MaybeCount: ?int, Mode: sample_mode): void = {",
        "    var NewCount: int = 5",
        "    var NewLabels: [int]string = map{}",
        "    RequestedMode := ChooseMode(Items)",
        "    var SavedItem: ?SampleRecord = false",
        "    if(StoredItem := Store[Key], set SavedItem = option{StoredItem}) {}",
        "",
        "    # --- SAMPLE SECTION ---",
        "    if(PreviousItem := SavedItem?) {}",
        "    var ShouldApply: logic = false",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "merges dangling case arms with following expression blocks",
    [
        "probe := class(creative_device):",
        "    Pick(Value:int):int =",
        "        case(Value):",
        "            1 =>",
        "                if(Enabled?):",
        "                    10",
        "                else:",
        "                    11",
        "            _ =>",
        "                if(Fallback?):",
        "                    20",
        "                else:",
        "                    21"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Pick(Value: int): int = {",
        "        case(Value) {",
        "            1 => block {",
        "                if(Enabled?) {",
        "                    10",
        "                } else {",
        "                    11",
        "                }",
        "            }",
        "            _ => block {",
        "                if(Fallback?) {",
        "                    20",
        "                } else {",
        "                    21",
        "                }",
        "            }",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "does not close colon blocks on outdented comment separators",
    [
        "sample_module := module:",
        "    sample_device := class():",
        "        Values: [int]int = map {",
        "            1 => 1",
        "        }",
        "",
        "    # Outdented section comment still belongs to the class.",
        "        Run():void =",
        '            Print("ok")'
    ].join("\n"),
    [
        "sample_module := module {",
        "    sample_device := class() {",
        "        Values: [int]int = map {",
        "            1 => 1",
        "        }",
        "",
        "        # Outdented section comment still belongs to the class.",
        "        Run(): void = {",
        '            Print("ok")',
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "aligns standalone line comments to following top-level code",
    [
        "        # A Verse-authored NPC Behavior that can be used within an NPC Character Definition or a NPC Spawner device's NPC Behavior Script Override.",
        "custom_npc_behavior := class(npc_behavior):"
    ].join("\n"),
    [
        "# A Verse-authored NPC Behavior that can be used within an NPC Character Definition or a NPC Spawner device's NPC Behavior Script Override.",
        "custom_npc_behavior := class(npc_behavior) {}",
        ""
    ].join("\n")
);

testFormat(
    "aligns standalone line comments to the following code line on direct ties",
    [
        "probe := class(creative_device):",
        "    Run():void =",
        "        Before := 1",
        "        # Describes the next method.",
        "    Next():void =",
        "        return"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Before := 1",
        "    }",
        "    # Describes the next method.",
        "    Next(): void = {",
        "        return",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "aligns standalone line comments in colon blocks while preserving blank lines",
    [
        "probe := class(creative_device):",
        "    Run():void =",
        "        TopValue := 1",
        "        # closer to code above",
        "",
        "",
        "        BottomValue := 2",
        "",
        "",
        "# closer to code below",
        "        NextValue := 3"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        TopValue := 1",
        "        # closer to code above",
        "",
        "",
        "        BottomValue := 2",
        "",
        "",
        "        # closer to code below",
        "        NextValue := 3",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "keeps standalone multiline block comments inside colon function bodies before first expression",
    [
        "block_indent_probe := module:",
        "    F():int =",
        "<# before",
        "    inner",
        "#>",
        "        1"
    ].join("\n"),
    [
        "block_indent_probe := module {",
        "    F(): int = {",
        "        <# before",
        "            inner",
        "        #>",
        "        1",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "keeps standalone multiline block comments inside colon function bodies after code and blanks",
    [
        "block_indent_after_probe := module:",
        "    F():int =",
        "        X := 1",
        "<# after",
        "    inner",
        "#>",
        "",
        "        X"
    ].join("\n"),
    [
        "block_indent_after_probe := module {",
        "    F(): int = {",
        "        X := 1",
        "        <# after",
        "            inner",
        "        #>",
        "",
        "        X",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "keeps standalone line comments after code aligned with previous code before blank",
    [
        "blank_comment_probe := module:",
        "    F():void =",
        "        X := 1",
        "        # above blank",
        "",
        "    G():void =",
        "        return"
    ].join("\n"),
    [
        "blank_comment_probe := module {",
        "    F(): void = {",
        "        X := 1",
        "        # above blank",
        "    }",
        "",
        "    G(): void = {",
        "        return",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "keeps outdented section comments after colon construction bodies",
    [
        "font_table := module:",
        "    GetCharacter(Index:int):FontCharacter =",
        "        case(Index):",
        "            16 => FontCharacter:",
        "                Index := 96.0",
        "                Width := 1.0",
        "",
        "        # PUBLIC API",
        "        Register():void =",
        "            return"
    ].join("\n"),
    [
        "font_table := module {",
        "    GetCharacter(Index: int): FontCharacter = {",
        "        case(Index) {",
        "            16 => FontCharacter {",
        "                Index := 96.0",
        "                Width := 1.0",
        "            }",
        "        }",
        "",
        "        # PUBLIC API",
        "        Register(): void = {",
        "            return",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "aligns one-line standalone block comments in colon function bodies",
    [
        "one_line_block_probe := module:",
        "    F():int =",
        "<# before #>",
        "        Before := 1",
        "<# after #>",
        "",
        "        Before"
    ].join("\n"),
    [
        "one_line_block_probe := module {",
        "    F(): int = {",
        "        <# before #>",
        "        Before := 1",
        "        <# after #>",
        "",
        "        Before",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "leaves inline multiline block comments out of colon block indentation decisions",
    [
        "inline_multi_probe := module:",
        "    F():int =",
        "        Value := 1 <# {",
        "            still ignored }",
        "        #> + 2",
        "        Value"
    ].join("\n"),
    [
        "inline_multi_probe := module {",
        "    F(): int = {",
        "        Value := 1 <# {",
        "            still ignored }",
        "        #> + 2",
        "        Value",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "preserves unrecognized colon blocks instead of converting them",
    ["MysteryHeader:", "    PreserveMe()"].join("\n"),
    ["MysteryHeader:", "    PreserveMe()", ""].join("\n")
);

testFormat(
    "preserves digest-only external colon blocks instead of flattening them",
    ["Value := external:", "    PreserveMe()"].join("\n"),
    ["Value := external:", "    PreserveMe()", ""].join("\n")
);

testFormat(
    "converts no-argument editable attribute colon blocks to spaced braces",
    [
        "probe := class(creative_device):",
        "    @editable:",
        "        Categories := array{SettingsCategory}",
        "    Enabled:logic = true"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    @editable {",
        "        Categories := array{SettingsCategory}",
        "    }",
        "    Enabled: logic = true",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "converts colon-style construction assignment blocks to braces",
    [
        "hello_world_device := class(creative_device):",
        "    OnBegin<override>()<suspends>:void =",
        "        MyNewEntity := SamplePrefab{}",
        "        if(SimEntity := GetSimulationEntity[]):",
        "            SimEntity.AddEntities(array{MyNewEntity})",
        "            OtherValue := widget_config:",
        "                Enabled := true",
        "            MyOtherTransform:transform = transform:",
        "                Translation := vector3{Up := 1152.0}",
        "            if(Transform := MyNewEntity.GetComponent[transform_component]):",
        "                set Transform.GlobalTransform = MyOtherTransform"
    ].join("\n"),
    [
        "hello_world_device := class(creative_device) {",
        "    OnBegin<override>()<suspends>: void = {",
        "        MyNewEntity := SamplePrefab{}",
        "        if(SimEntity := GetSimulationEntity[]) {",
        "            SimEntity.AddEntities(array{MyNewEntity})",
        "            OtherValue := widget_config {",
        "                Enabled := true",
        "            }",
        "            MyOtherTransform: transform = transform {",
        "                Translation := vector3{Up := 1152.0}",
        "            }",
        "            if(Transform := MyNewEntity.GetComponent[transform_component]) {",
        "                set Transform.GlobalTransform = MyOtherTransform",
        "            }",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);
