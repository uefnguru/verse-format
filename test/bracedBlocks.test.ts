import { expect, it } from "vitest";

import { countCurlyBraceDelta } from "../src/formatter/scanner";
import { testFormat } from "./helpers";

testFormat(
    "does not let interpolation or construction braces disturb indentation",
    [
        "probe := class(creative_device) {",
        "Run():void = {",
        'Print("Value is {Value}")',
        "Translation := vector3{Up := 10.0}",
        "MaybeValue := option{Translation}",
        "}",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        '        Print("Value is {Value}")',
        "        Translation := vector3{Up := 10.0}",
        "        MaybeValue := option{Translation}",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "does not keep trailing blank lines before generated method close in existing class",
    [
        "probe := class(creative_device) {",
        "    Run():void =",
        '        Print("Hello")',
        "",
        "",
        "}"
    ].join("\n"),
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
    "forces existing braced else onto closing brace line",
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        if(Number = 1) {",
        '            Print("one")',
        "        }",
        "",
        "        else {",
        '            Print("two")',
        "        }",
        "    }",
        "}"
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
    "moves glued multiline closing braces onto their own indented lines",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        Translation := vector3 {",
        "            Up := 1152.0}",
        "        if(Value = 1) {",
        '            Print("one")}',
        "        Nested := widget_config {",
        "            Offset := vector3 {",
        "                Up := 10.0}}",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Translation := vector3 {",
        "            Up := 1152.0",
        "        }",
        "        if(Value = 1) {",
        '            Print("one")',
        "        }",
        "        Nested := widget_config {",
        "            Offset := vector3 {",
        "                Up := 10.0",
        "            }",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "aligns standalone multiline block comments with neighboring code",
    [
        "probe := class(creative_device) {",
        "Run():void = {",
        "<# before code",
        "    keep inner indent",
        "#>",
        "Value:=1",
        "  <# after code",
        "      keep inner indent",
        "  #>",
        "",
        "Next:=2",
        "}",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        <# before code",
        "            keep inner indent",
        "        #>",
        "        Value := 1",
        "        <# after code",
        "            keep inner indent",
        "        #>",
        "",
        "        Next := 2",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "aligns standalone multiline block comments by nearest code while preserving blank lines",
    [
        "probe := class(creative_device) {",
        "Run():void = {",
        "TopValue:=1",
        "  <# closer to code above",
        "      keep inner indent",
        "  #>",
        "",
        "",
        "BottomValue:=2",
        "",
        "",
        "<# closer to code below",
        "    keep inner indent",
        "#>",
        "NextValue:=3",
        "}",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        TopValue := 1",
        "        <# closer to code above",
        "            keep inner indent",
        "        #>",
        "",
        "",
        "        BottomValue := 2",
        "",
        "",
        "        <# closer to code below",
        "            keep inner indent",
        "        #>",
        "        NextValue := 3",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "aligns standalone multiline block comments to following code on direct ties",
    [
        "probe := class(creative_device) {",
        "Run():void = {",
        "Before:=1",
        "        <# next method",
        "            keep inner indent",
        "        #>",
        "}",
        "Next():void = {",
        "return",
        "}",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Before := 1",
        "    <# next method",
        "        keep inner indent",
        "    #>",
        "    }",
        "    Next(): void = {",
        "        return",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "aligns standalone line comments to following top-level braced code",
    [
        "        # A Verse-authored NPC Behavior that can be used within an NPC Character Definition or a NPC Spawner device's NPC Behavior Script Override.",
        "custom_npc_behavior := class(npc_behavior) {",
        "}"
    ].join("\n"),
    [
        "# A Verse-authored NPC Behavior that can be used within an NPC Character Definition or a NPC Spawner device's NPC Behavior Script Override.",
        "custom_npc_behavior := class(npc_behavior) {",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "aligns standalone line comments by nearest code while preserving blank lines",
    [
        "probe := class(creative_device) {",
        "Run():void = {",
        "TopValue:=1",
        "  # closer to code above",
        "",
        "",
        "BottomValue:=2",
        "",
        "",
        "# closer to code below",
        "NextValue:=3",
        "}",
        "}"
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
    "aligns standalone line comments to following braced code on direct ties",
    [
        "probe := class(creative_device) {",
        "Run():void = {",
        "Before:=1",
        "        # next method",
        "}",
        "Next():void = {",
        "return",
        "}",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Before := 1",
        "    # next method",
        "    }",
        "    Next(): void = {",
        "        return",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "aligns standalone line comments to following formatted braced code",
    [
        "probe := class(creative_device) {",
        "Run():void = {",
        "# before code",
        "Value:=1",
        "}",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        # before code",
        "        Value := 1",
        "    }",
        "}",
        ""
    ].join("\n")
);

it("ignores braces in strings and block comments while counting indentation deltas", () => {
    const state = { inBlockComment: false };

    expect(countCurlyBraceDelta('Print("{not a block}") <# {', state)).toBe(0);
    expect(state.inBlockComment).toBe(true);
    expect(countCurlyBraceDelta("still ignored } #>", state)).toBe(0);
    expect(state.inBlockComment).toBe(false);
});
