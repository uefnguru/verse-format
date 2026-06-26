import { expect, it } from "vitest";

import { formatVerseDocument } from "../src/formatter";
import { resolveFormatterOptions } from "../src/formatter/options";

it("resolves formatter defaults", () => {
    expect(resolveFormatterOptions()).toEqual({
        indentSize: 4,
        blockStyle: "braced",
        spacingStyle: "wide",
        wrapMultiPropertyConstructions: true,
        maxInlineConstructionProperties: 1,
        maxInlineAttributeProperties: 1,
        maxInlineArrayItems: 3,
        finalNewline: true
    });
});

it("resolves the dense spacing style", () => {
    expect(resolveFormatterOptions({ spacingStyle: "dense" }).spacingStyle).toBe("dense");
});

it("can omit the final newline", () => {
    expect(formatVerseDocument('Print("Hello")', { finalNewline: false })).toBe('Print("Hello")');
});

it("keeps empty and whitespace-only documents empty", () => {
    expect(formatVerseDocument("")).toBe("");
    expect(formatVerseDocument("   \t  \n\n")).toBe("");
});
