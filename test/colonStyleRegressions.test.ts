import { expect, it } from "vitest";

import { formatVerseDocument } from "../src/formatter";
import { testFormat } from "./helpers";

const colonOptions = { blockStyle: "colon" as const };

testFormat(
    "keeps tuple parameter function bodies indented in colon style",
    [
        "test := class():",
        "    OnBack(Args : tuple(float, float)) : void =",
        '        Print("hello")'
    ].join("\n"),
    [
        "test := class():",
        "    OnBack(Args: tuple(float, float)): void =",
        '        Print("hello")',
        ""
    ].join("\n"),
    colonOptions
);

testFormat(
    "recognizes nested parenthesized function parameters",
    [
        "test := class():",
        "    OnPair(Args : tuple(tuple(float, float), float)) : void =",
        '        Print("hello")'
    ].join("\n"),
    [
        "test := class():",
        "    OnPair(Args: tuple(tuple(float, float), float)): void =",
        '        Print("hello")',
        ""
    ].join("\n"),
    colonOptions
);

testFormat(
    "preserves multiline return array literal braces in colon style",
    ["Test()<transacts>:[]int =", "        return array{1, 2, 3, 4,", "            5, 6}"].join(
        "\n"
    ),
    [
        "Test()<transacts>: []int =",
        "    return array{1, 2, 3, 4,",
        "        5, 6",
        "    }",
        ""
    ].join("\n"),
    colonOptions
);

testFormat(
    "keeps empty function bodies braced in colon style",
    "Test(Agent:agent):void = {}",
    ["Test(Agent: agent): void = {}", ""].join("\n"),
    colonOptions
);

testFormat(
    "converts adjacent functions with standalone braced bodies to colon style",
    [
        "test := class(creative_device):",
        "",
        "    OnTest((Name:string, Value:int, OldValue:int)):void=",
        "    {",
        '        Print("Hello")',
        "    }",
        "    OnBegin<override>()<suspends>:void=",
        "    {",
        '        Print("World")',
        "    }"
    ].join("\n"),
    [
        "test := class(creative_device):",
        "",
        "    OnTest((Name: string, Value: int, OldValue: int)): void =",
        '        Print("Hello")',
        "    OnBegin<override>()<suspends>: void =",
        '        Print("World")',
        ""
    ].join("\n"),
    colonOptions
);

it("preserves array literal braces inside method invocation arguments", () => {
    const input = [
        "test := class():",
        "    Animator : animation_controller",
        "    ",
        "    Test(): void =",
        "        Animator.SetAnimation(",
        "            array{",
        "                RotationKeyframe(vector3{Y:= 4.98,X:=0.43,Z:=5.01})",
        "                RotationKeyframe(vector3{Y:=-5.74,X:=0.87,Z:=-0.85})",
        "                RotationKeyframe(vector3{Y:= 5.61,X:=0.18,Z:=-1.56})",
        "                RotationKeyframe(vector3{Y:= 0.0, X:=0.0, Z:=0.0})",
        "            },",
        "            ?Mode:=animation_mode.OneShot)",
        "",
        "    RotationKeyframe<private>(Rotation: vector3):keyframe_delta=",
        "        keyframe_delta:",
        "            DeltaLocation:= vector3{}",
        "            DeltaRotation:= MakeRotationFromYawPitchRollDegrees(Rotation.X, Rotation.Y, Rotation.Z)",
        "            DeltaScale   := UnitVector3",
        "            Time         := 0.3"
    ].join("\n");

    const formatted = formatVerseDocument(input, colonOptions);

    expect(formatted).toContain("            array{\n");
    expect(formatted).toContain("            },\n            ?Mode := animation_mode.OneShot)");
    expect(formatted).not.toContain("            array:\n");
    expect(formatVerseDocument(formatted, colonOptions)).toBe(formatted);
});
