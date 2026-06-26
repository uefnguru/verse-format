import { expect, it } from "vitest";

import { findOpeningBraceForFinalClose, splitTopLevelComma } from "../src/formatter/scanner";
import { testFormat } from "./helpers";

testFormat(
    "wraps inline construction expressions with multiple named properties by default",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        Translation := vector3{ Up := 1152.0 }",
        "        OtherTranslation := vector3{ Up := 1152.0, Down := 11.0 }",
        '        Nested := widget_config{ Label := "A, B", Offset := vector3{Up := 10.0, Down := 2.0} }',
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Translation := vector3{Up := 1152.0}",
        "        OtherTranslation := vector3 {",
        "            Up := 1152.0,",
        "            Down := 11.0",
        "        }",
        "        Nested := widget_config {",
        '            Label := "A, B",',
        "            Offset := vector3 {",
        "                Up := 10.0,",
        "                Down := 2.0",
        "            }",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "can keep multi-property construction expressions inline when wrapping is disabled",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        Translation := vector3{ Up := 1152.0, Down := 11.0 }",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Translation := vector3{Up := 1152.0, Down := 11.0}",
        "    }",
        "}",
        ""
    ].join("\n"),
    { wrapMultiPropertyConstructions: false }
);

testFormat(
    "wraps inline attribute blocks with multiple named properties by default",
    [
        "probe := class(creative_device) {",
        "    @editable_slider(int) {Categories := array{EditableCategory}, MinValue := option{1}, MaxValue := option{5}, SliderDelta := option{1}}",
        "    Count:int = 3",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    @editable_slider(int) {",
        "        Categories := array{EditableCategory},",
        "        MinValue := option{1},",
        "        MaxValue := option{5},",
        "        SliderDelta := option{1}",
        "    }",
        "    Count: int = 3",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "can keep inline attribute blocks under the configured property threshold",
    [
        "probe := class(creative_device) {",
        "    @editable_slider(int) {Categories := array{EditableCategory}, MinValue := option{1}, MaxValue := option{5}, SliderDelta := option{1}}",
        "    Count:int = 3",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    @editable_slider(int) {Categories := array{EditableCategory}, MinValue := option{1}, MaxValue := option{5}, SliderDelta := option{1}}",
        "    Count: int = 3",
        "}",
        ""
    ].join("\n"),
    { maxInlineAttributeProperties: 4 }
);

testFormat(
    "wraps arrays that exceed the configured item threshold",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        Values := array{1, 2, 3, 4}",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Values := array{",
        "            1,",
        "            2,",
        "            3,",
        "            4",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "can keep arrays inline under the configured item threshold",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        Values := array{1, 2, 3, 4}",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Values := array{1, 2, 3, 4}",
        "    }",
        "}",
        ""
    ].join("\n"),
    { maxInlineArrayItems: 4 }
);

testFormat(
    "wraps nested aggregates recursively when child thresholds are exceeded",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        Layout := canvas{Slots := array{canvas_slot{Widget := Header, ZOrder := 1}, canvas_slot{Widget := Footer, ZOrder := 2}}}",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Layout := canvas {",
        "            Slots := array{",
        "                canvas_slot {",
        "                    Widget := Header,",
        "                    ZOrder := 1",
        "                },",
        "                canvas_slot {",
        "                    Widget := Footer,",
        "                    ZOrder := 2",
        "                }",
        "            }",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "wraps trailing-comma aggregate literals on the first pass",
    [
        "probe := module {",
        "    Values := map {",
        '        "main" => layout{Slots := array{slot{Name := "Main", Padding := 1}}},',
        '        "side" => layout{Slots := array{slot{Name := "Side", Padding := 2}}}',
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := module {",
        "    Values := map {",
        '        "main" => layout {',
        "            Slots := array{",
        "                slot {",
        '                    Name := "Main",',
        "                    Padding := 1",
        "                }",
        "            }",
        "        },",
        '        "side" => layout {',
        "            Slots := array{",
        "                slot {",
        '                    Name := "Side",',
        "                    Padding := 2",
        "                }",
        "            }",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "wraps aggregate literals with trailing line comments",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        "        Translation := vector3{ Up := 1152.0, Down := 11.0 } # keep transform note",
        "        Layout := map {",
        '            "main" => widget_config{Label := "Main", Padding := 1}, # keep map entry note',
        "        }",
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Translation := vector3 {",
        "            Up := 1152.0,",
        "            Down := 11.0",
        "        } # keep transform note",
        "        Layout := map {",
        '            "main" => widget_config {',
        '                Label := "Main",',
        "                Padding := 1",
        "            }, # keep map entry note",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);

testFormat(
    "keeps colon aggregate trailing comments idempotent",
    [
        "probe := class(creative_device):",
        "    Run():void =",
        "        Translation := vector3:",
        "            Up := 1152.0",
        "            Down := 11.0",
        "        # keep transform note"
    ].join("\n"),
    [
        "probe := class(creative_device):",
        "    Run(): void =",
        "        Translation := vector3:",
        "            Up := 1152.0",
        "            Down := 11.0",
        "        # keep transform note",
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

it("splits only top-level construction commas", () => {
    expect(
        splitTopLevelComma('Label := "A, B", Offset := vector3{Up := 10.0, Down := 2.0}')
    ).toEqual(['Label := "A, B"', " Offset := vector3{Up := 10.0, Down := 2.0}"]);
});

it("ignores commas and braces inside inline block comments while splitting aggregate items", () => {
    expect(
        splitTopLevelComma(
            'Label := "A" <# keep comma, and brace } here #>, Offset := vector3{Up := 10.0, Down := 2.0}'
        )
    ).toEqual([
        'Label := "A" <# keep comma, and brace } here #>',
        " Offset := vector3{Up := 10.0, Down := 2.0}"
    ]);
});

it("ignores braces inside inline block comments while finding trailing aggregate braces", () => {
    const line =
        'Config := widget_config{Label := "A" <# keep brace } here #>, Offset := vector3{Up := 10.0, Down := 2.0}}';

    expect(findOpeningBraceForFinalClose(line)).toBe(line.indexOf("{"));
});

testFormat(
    "wraps aggregate literals without splitting inline block comments",
    [
        "probe := class(creative_device) {",
        "    Run():void = {",
        '        Config := widget_config{Label := "A" <# keep comma, and brace } here #>, Offset := vector3{Up := 10.0, Down := 2.0}}',
        "    }",
        "}"
    ].join("\n"),
    [
        "probe := class(creative_device) {",
        "    Run(): void = {",
        "        Config := widget_config {",
        '            Label := "A" <# keep comma, and brace } here #>,',
        "            Offset := vector3 {",
        "                Up := 10.0,",
        "                Down := 2.0",
        "            }",
        "        }",
        "    }",
        "}",
        ""
    ].join("\n")
);
