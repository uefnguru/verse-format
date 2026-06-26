import { expect, it } from "vitest";

import { splitLineComment } from "../src/formatter/scanner";
import { testFormat } from "./helpers";

testFormat(
    "preserves character literals while normalizing case arms",
    [
        "GetMetric(Character:char):CharMetric =",
        "    case(Character):",
        "        '#' => CharMetric{Index := 21.0, Width := 0.4361}",
        "        '$' => CharMetric{Index := 22.0, Width := 0.4537}",
        "        '+' => CharMetric{Index := 19.0, Width := 0.3656}",
        "        '\\\\' => CharMetric{Index := 14.0, Width := 0.4009}"
    ].join("\n"),
    [
        "GetMetric(Character: char): CharMetric = {",
        "    case(Character) {",
        "        '#' => CharMetric {",
        "            Index := 21.0,",
        "            Width := 0.4361",
        "        }",
        "        '$' => CharMetric {",
        "            Index := 22.0,",
        "            Width := 0.4537",
        "        }",
        "        '+' => CharMetric {",
        "            Index := 19.0,",
        "            Width := 0.3656",
        "        }",
        "        '\\\\' => CharMetric {",
        "            Index := 14.0,",
        "            Width := 0.4009",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "formats existing braced component blocks",
    [
        "using { /Verse.org }",
        "",
        "mesh_collision_component<public> := class<final_super>(component) {",
        "var MaybeSubscription<private> : ?cancelable = false",
        "OnBeginSimulation<override>():void = {",
        "if (Mesh := Self.Entity.GetComponent[mesh_component]) {",
        "set MaybeSubscription = option{Mesh.EntityEnteredEvent.Subscribe(OnEntityEnteredEvent)}",
        "}",
        "}",
        "}"
    ].join("\n"),
    [
        "using { /Verse.org }",
        "",
        "mesh_collision_component<public> := class<final_super>(component) {",
        "    var MaybeSubscription<private>: ?cancelable = false",
        "    OnBeginSimulation<override>(): void = {",
        "        if(Mesh := Self.Entity.GetComponent[mesh_component]) {",
        "            set MaybeSubscription = option{Mesh.EntityEnteredEvent.Subscribe(OnEntityEnteredEvent)}",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "normalizes call and parameter spacing outside strings",
    [
        "probe := class(creative_device) {",
        'Run   (   Value : int,   ?Label : string = "if/then else block"   )   : void = {',
        'Print     (    "if/then else block"    )',
        'Print     (    "keep    inner   string spacing"    ,   ?Duration := 1.0   )',
        "}",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        '    Run(Value: int, ?Label: string = "if/then else block"): void = {',
        '        Print("if/then else block")',
        '        Print("keep    inner   string spacing", ?Duration := 1.0)',
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "normalizes control-flow headers and failable call brackets",
    [
        "probe := class(creative_device) {",
        "Run():void = {",
        "if     (    Mesh := Self.Entity.GetComponent   [    mesh_component    ]    )      {",
        "for    (    Comp : Mesh.Entity.GetComponents  (   )   ,   Fort := fort_character   [   Comp   ]   )    {",
        'Print     (    "fort character"   )',
        "}",
        "}     else      {",
        "case     (    1    )     {",
        '_ => Print     (    "fallback"    )',
        "}",
        "}",
        "}",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        if(Mesh := Self.Entity.GetComponent[mesh_component]) {",
        "            for(Comp: Mesh.Entity.GetComponents(), Fort := fort_character[Comp]) {",
        '                Print("fort character")',
        "            }",
        "        } else {",
        "            case(1) {",
        '                _ => Print("fallback")',
        "            }",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "normalizes construction braces without changing imports",
    [
        "using     {   /Verse.org   }",
        "",
        "probe := class(creative_device) {",
        "Run():void = {",
        "Translation := vector3     {    Up := 10.0    }",
        "MaybeValue := option     {    Translation    }",
        "}",
        "}"
    ].join("\n"),
    [
        "using { /Verse.org }",
        "",
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Translation := vector3{Up := 10.0}",
        "        MaybeValue := option{Translation}",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "normalizes declaration assignment and function signature spacing",
    [
        "custom_npc_behavior_message_module:=module {",
        "    OnFollowBeginMessage<public><localizes>(Agent:agent, X:float, Y:float, Z:float):message={",
        '        "NPC Agent = {Agent}: Is following closest player at [{X},{Y},{Z}]"',
        "    }",
        "}",
        "",
        "OnBegin<override>()<suspends>:void={",
        '    Print("Hello")',
        "}"
    ].join("\n"),
    [
        "custom_npc_behavior_message_module := module {",
        "    OnFollowBeginMessage<public><localizes>(Agent: agent, X: float, Y: float, Z: float): message = {",
        '        "NPC Agent = {Agent}: Is following closest player at [{X},{Y},{Z}]"',
        "    }",
        "}",
        "",
        "OnBegin<override>()<suspends>: void = {",
        '    Print("Hello")',
        "}",
        ""
    ].join("\n")
);

testFormat(
    "normalizes expressions inside string interpolation",
    [
        "message_module := module {",
        "    OnFollowBeginMessage<public><localizes>(Agent:agent, X:float, Y:float, Z:float):message = {",
        '        "NPC Agent = {   Agent  }: Is following closest player at [{X    },{   Y    },{Z +      2 + Y}]"',
        "    }",
        "}"
    ].join("\n"),
    [
        "message_module := module {",
        "    OnFollowBeginMessage<public><localizes>(Agent: agent, X: float, Y: float, Z: float): message = {",
        '        "NPC Agent = {Agent}: Is following closest player at [{X},{Y},{Z + 2 + Y}]"',
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "normalizes comparison and arithmetic spacing",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        if(Number=1 and Score>=10 and Score<>12) {",
        "            Total:=Score+2*Y",
        "        } else {",
        "            Total:=Score-1",
        "        }",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        if(Number = 1 and Score >= 10 and Score <> 12) {",
        "            Total := Score + 2 * Y",
        "        } else {",
        "            Total := Score - 1",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "normalizes single angle comparisons between identifiers",
    [
        "probe := class(creative_device) {",
        "    Run(A:int, B:int):void = {",
        "        if(A<B and A>B) {",
        "            return",
        "        }",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(A: int, B: int): void = {",
        "        if(A < B and A > B) {",
        "            return",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "preserves signed and exponent numeric literals",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        Tiny:=1e-3",
        "        TinyFloat:=1.0e-3",
        "        Big:=1e+3",
        "        Negative:=-1",
        "        NegativeFloat:=-1.5",
        "        Values:=array{-1,-2}",
        "        Maybe:=option{-1}",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Tiny := 1e-3",
        "        TinyFloat := 1.0e-3",
        "        Big := 1e+3",
        "        Negative := -1",
        "        NegativeFloat := -1.5",
        "        Values := array{-1, -2}",
        "        Maybe := option{-1}",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "normalizes binary operators near numeric operands",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        Difference:=Score-1",
        "        Sum:=A+B",
        "        Ratio:=A/B",
        "        if(Score>=10 and Score<>12) {",
        "            return",
        "        }",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Difference := Score - 1",
        "        Sum := A + B",
        "        Ratio := A / B",
        "        if(Score >= 10 and Score <> 12) {",
        "            return",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "keeps compound assignment operators intact",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        set LoopIndex += 1",
        "        set LoopIndex-=1",
        "        set Scale*=2",
        "        set Scale /= 2",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        set LoopIndex += 1",
        "        set LoopIndex -= 1",
        "        set Scale *= 2",
        "        set Scale /= 2",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "preserves inline block comments during spacing",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        Total:=1 <# keep { } #> + 2",
        "        Value:=1 <# keep {",
        "            still ignored }",
        "        #> + 2",
        "        After:=3",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Total := 1 <# keep { } #> + 2",
        "        Value := 1 <# keep {",
        "            still ignored }",
        "        #> + 2",
        "        After := 3",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "preserves quoted text inside inline block comments",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        Total:=1 <# keep \"quoted\" and \\'single\\' text #> + 2",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Total := 1 <# keep \"quoted\" and \\'single\\' text #> + 2",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "does not confuse user text with protected segment tokens",
    ['X := ___VERSE_PROTECTED_0___ + "hello"'].join("\n"),
    ['X := ___VERSE_PROTECTED_0___ + "hello"', ""].join("\n")
);

testFormat(
    "keeps map iteration arrows intact",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        for(Key -> Item: SampleItems) {",
        "            set ProcessedCount += 1",
        "        }",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        for(Key -> Item: SampleItems) {",
        "            set ProcessedCount += 1",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "does not space slashes inside parenthesized Verse module paths",
    ["(/Fortnite.com:)UI<public> := module:", "    WidgetValue:int = 1"].join("\n"),
    ["(/Fortnite.com:)UI<public> := module {", "    WidgetValue: int = 1", "}", ""].join("\n")
);

testFormat(
    "does not space slashes inside parenthesized nested Verse type paths",
    [
        "focus_interface<public> := interface<epic_internal>:",
        "    # Look At specified location. Will never complete unless interrupted.",
        "    MaintainFocus<public>(Location:(/UnrealEngine.com/Temporary/SpatialMath:)vector3)<suspends>:void"
    ].join("\n"),
    [
        "focus_interface<public> := interface<epic_internal> {",
        "    # Look At specified location. Will never complete unless interrupted.",
        "    MaintainFocus<public>(Location:(/UnrealEngine.com/Temporary/SpatialMath:)vector3)<suspends>: void",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "uses dense digest-style spacing when requested",
    [
        "using     {   /Verse.org/Simulation   }",
        "sample_module:=module:",
        "    Sample<public>(Value : int, ?Label : message = external {})<transacts> : void = external {}",
        "    Field<public> : type { _X : int where 0 <= _X, _X <= 10 } = external {}"
    ].join("\n"),
    [
        "using {/Verse.org/Simulation}",
        "sample_module := module {",
        "    Sample<public>(Value:int, ?Label:message = external {})<transacts>:void = external {}",
        "    Field<public>:type {_X:int where 0 <= _X, _X <= 10} = external {}",
        "}",
        ""
    ].join("\n"),
    { spacingStyle: "dense" }
);

testFormat(
    "keeps external macro brace spacing in wide style",
    [
        "sample_module:=module:",
        "    Sample<public>(Value : int, ?Label : message = external {})<transacts> : void = external {}",
        "    Field<public> : type { _X : int where 0 <= _X, _X <= 10 } = external {}"
    ].join("\n"),
    [
        "sample_module := module {",
        "    Sample<public>(Value: int, ?Label: message = external {})<transacts>: void = external {}",
        "    Field<public>: type{ _X: int where 0 <= _X, _X <= 10 } = external {}",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "uses dense digest-style spacing inside string interpolation when requested",
    [
        "message_module := module:",
        "    Label<localizes>(Value:int):message =",
        '        "Value: { Value  +  1 }"'
    ].join("\n"),
    [
        "message_module := module {",
        "    Label<localizes>(Value:int):message = {",
        '        "Value: {Value + 1}"',
        "    }",
        "}",
        ""
    ].join("\n"),
    { spacingStyle: "dense" }
);

it("splits line comments without treating hashes inside strings as comments", () => {
    expect(splitLineComment('Print("value #1") # trailing')).toEqual({
        code: 'Print("value #1") ',
        comment: "# trailing"
    });
});

it("splits line comments without treating inline block comments as comments", () => {
    expect(splitLineComment("Total := 1 <# keep #> + 2 # trailing")).toEqual({
        code: "Total := 1 <# keep #> + 2 ",
        comment: "# trailing"
    });
});
