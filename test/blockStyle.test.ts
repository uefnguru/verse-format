import { expect, it } from "vitest";

import { resolveFormatterOptions } from "../src/formatter/options";
import { testFormat } from "./helpers";

testFormat(
    "converts braced class methods and control flow to colon style",
    [
        "example_device := class(creative_device) {",
        "    OnBegin<override>()<suspends>: void = {",
        "        if(Value = 1) {",
        '            Print("one")',
        "        } else if(Value = 2) {",
        '            Print("two")',
        "        } else {",
        '            Print("other")',
        "        }",
        "    }",
        "}"
    ].join("\n"),
    [
        "example_device := class(creative_device):",
        "    OnBegin<override>()<suspends>: void =",
        "        if(Value = 1):",
        '            Print("one")',
        "        else if(Value = 2):",
        '            Print("two")',
        "        else:",
        '            Print("other")',
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

testFormat(
    "keeps colon style colon when the colon block style is selected",
    [
        "example_device := class(creative_device):",
        "    OnBegin<override>()<suspends>:void =",
        "        if(Value = 1):",
        '            Print("one")',
        "        else:",
        '            Print("other")'
    ].join("\n"),
    [
        "example_device := class(creative_device):",
        "    OnBegin<override>()<suspends>: void =",
        "        if(Value = 1):",
        '            Print("one")',
        "        else:",
        '            Print("other")',
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

testFormat(
    "converts multiline if then and async blocks to colon style",
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
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device):",
        "    Run()<suspends>: void =",
        "        if:",
        "            Candidate := 1",
        "            Candidate = 1",
        "        then:",
        "            sync:",
        "                Sleep(0.0)",
        "                Sleep(0.0)",
        "            spawn:",
        "                BackgroundTask()",
        "    BackgroundTask()<suspends>: void =",
        "        Sleep(0.0)",
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

testFormat(
    "converts braced attribute and construction blocks to colon style",
    [
        "probe := class(creative_device) {",
        "    @editable_number(float) {",
        "        Categories := array{SettingsCategory},",
        "        MinValue := option{0.1}",
        "    }",
        "    Value: float = widget_config {",
        "        Enabled := true",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device):",
        "    @editable_number(float):",
        "        Categories := array{SettingsCategory},",
        "        MinValue := option{0.1}",
        "    Value: float = widget_config:",
        "        Enabled := true",
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

testFormat(
    "converts multiline constructions and keeps empty constructions braced by default",
    [
        "probe := module {",
        "    slot := class {",
        '        Name: string = ""',
        "    }",
        "",
        "    layout := class {",
        "        Slots: []slot = array{}",
        "    }",
        "",
        "    MakeLayout(): layout = {",
        "        layout {",
        "            Slots := array{",
        "                slot {",
        '                    Name := "Header"',
        "                },",
        "                slot {}",
        "            }",
        "        }",
        "    }",
        "",
        "    MakeMap(): [string]layout = {",
        "        map {",
        '            "main" => layout {',
        "                Slots := array{}",
        "            }",
        "        }",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := module:",
        "    slot := class:",
        '        Name: string = ""',
        "",
        "    layout := class:",
        "        Slots: []slot = array{}",
        "",
        "    MakeLayout(): layout =",
        "        layout:",
        "            Slots := array:",
        "                slot:",
        '                    Name := "Header"',
        "                slot{}",
        "",
        "    MakeMap(): [string]layout =",
        "        map:",
        '            "main" => layout:',
        "                Slots := array{}",
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

testFormat(
    "collapses blank runs left by removed closing braces in colon style",
    [
        "first_module := module {",
        "    first_value:int = 1",
        "}",
        "",
        "",
        "second_module := module {",
        "    second_value:int = 2",
        "}"
    ].join("\n"),
    [
        "first_module := module:",
        "    first_value: int = 1",
        "",
        "second_module := module:",
        "    second_value: int = 2",
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

testFormat(
    "collapses blank runs after converted empty constructions in colon style",
    [
        "probe := class(creative_device) {",
        "    Manager: text_display_manager_device = text_display_manager_device {}",
        "",
        "",
        "    Initiate(): void = {",
        "        return",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device):",
        "    Manager: text_display_manager_device = text_display_manager_device:",
        "",
        "    Initiate(): void =",
        "        return",
        ""
    ].join("\n"),
    { blockStyle: "colon", emptyConstructionStyle: "colon" }
);

testFormat(
    "keeps outdented section comments after colon construction bodies in colon style",
    [
        "text_display_manager := module:",
        "    text_display_manager_device<public> := class():",
        "        IconData<private>: [int]FontCharacter = map:",
        "            16 => FontCharacter:",
        "                Index := 96.0",
        "                Width := 1.0",
        "",
        "        # ================================================================================",
        "        # PUBLIC API - creator-facing functions",
        "        # ================================================================================",
        "        # Register and update text displays.",
        "        RegisterProp<public>():void =",
        "            return"
    ].join("\n"),
    [
        "text_display_manager := module:",
        "    text_display_manager_device<public> := class():",
        "        IconData<private>: [int]FontCharacter = map:",
        "            16 => FontCharacter:",
        "                Index := 96.0",
        "                Width := 1.0",
        "",
        "        # ================================================================================",
        "        # PUBLIC API - creator-facing functions",
        "        # ================================================================================",
        "        # Register and update text displays.",
        "        RegisterProp<public>(): void =",
        "            return",
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

testFormat(
    "does not preserve outer block close after multiline failable construction in colon style",
    [
        "probe := class(creative_device) {",
        "    Apply(): void = {",
        "        if(Data := ActiveProps[ID]) {",
        "            if(set ActiveProps[ID] = TextPropData {",
        "                ID := Data.ID,",
        "                Count := Data.Count",
        "            }) {}",
        "        }",
        "    }",
        "",
        "    Next(): void = {",
        "        return",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device):",
        "    Apply(): void =",
        "        if(Data := ActiveProps[ID]):",
        "            if(set ActiveProps[ID] = TextPropData {",
        "                    ID := Data.ID,",
        "                    Count := Data.Count",
        "                }) {}",
        "",
        "    Next(): void =",
        "        return",
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

testFormat(
    "keeps non-block braces in colon style",
    [
        "using { /Verse.org }",
        "",
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Values := array{1, 2, 3}",
        "        MaybeValue := option{Values}",
        '        Message := "Value is {Values.Length}"',
        "    }",
        "}"
    ].join("\n"),
    [
        "using { /Verse.org }",
        "",
        "probe := class(creative_device):",
        "    Run(): void =",
        "        Values := array{1, 2, 3}",
        "        MaybeValue := option{Values}",
        '        Message := "Value is {Values.Length}"',
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

testFormat(
    "keeps inline multiline block comments out of colon block conversion",
    [
        "probe := class(creative_device) {",
        "    Run(): int = {",
        "        Value := 1 <# {",
        "            still ignored }",
        "        #> + 2",
        "        Value",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device):",
        "    Run(): int =",
        "        Value := 1 <# {",
        "            still ignored }",
        "        #> + 2",
        "        Value",
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

testFormat(
    "preserves braced headers that carry inline block comments when formatting colon style",
    [
        "probe := class(creative_device) {",
        "    Run():void = <# keep this header note #> {",
        "        Value := 1",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device):",
        "    Run(): void = <# keep this header note #> {",
        "        Value := 1",
        "    }",
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

testFormat(
    "preserves converted block openings when a nested close line has an inline block comment",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        Value := 1",
        "    } <# keep this close note #>",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device):",
        "    Run(): void = {",
        "        Value := 1",
        "    } <# keep this close note #>",
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

it("resolves explicit colon block style", () => {
    expect(resolveFormatterOptions({ blockStyle: "colon" }).blockStyle).toBe("colon");
});

it("falls back to braced block style for missing configuration", () => {
    expect(resolveFormatterOptions({}).blockStyle).toBe("braced");
});
