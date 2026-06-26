import { expect, it } from "vitest";

import { formatVerseDocument, type FormatterOptions } from "../src/formatter";

export function testFormat(
    name: string,
    input: string,
    expected: string,
    options?: FormatterOptions
): void {
    it(name, () => {
        expect(formatVerseDocument(input, options)).toBe(expected);
    });
}
