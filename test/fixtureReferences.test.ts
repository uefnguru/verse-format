import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { formatVerseDocument } from "../src/formatter";
import type { FormatterOptions, VerseBlockStyle, VerseSpacingStyle } from "../src/formatter";

const FIXTURE_ROOT = path.join(__dirname, "verse-fixtures");
const STYLE_COMBINATIONS: StyleCombination[] = [
    {
        blockStyle: "braced",
        directoryName: "braced-wide",
        fileName: "braced-wide.verse",
        name: "braced-wide",
        spacingStyle: "wide"
    },
    {
        blockStyle: "colon",
        directoryName: "colon-wide",
        fileName: "colon-wide.verse",
        name: "colon-wide",
        spacingStyle: "wide"
    },
    {
        blockStyle: "braced",
        directoryName: "braced-dense",
        fileName: "braced-dense.verse",
        name: "braced-dense",
        spacingStyle: "dense"
    },
    {
        blockStyle: "colon",
        directoryName: "colon-dense",
        fileName: "colon-dense.verse",
        name: "colon-dense",
        spacingStyle: "dense"
    }
];

describe("tracked Verse fixtures", () => {
    for (const fixture of loadFixtures()) {
        it(`${fixture.name} matches block and spacing references`, () => {
            for (const file of loadFixtureFiles(fixture)) {
                const original = fs.readFileSync(file.originalPath, "utf8");

                for (const combination of STYLE_COMBINATIONS) {
                    const expected = fs.readFileSync(file.referencePaths[combination.name], "utf8");
                    expect(formatVerseDocument(original, formatOptions(combination))).toBe(
                        ensureFinalNewline(expected)
                    );
                }

                for (const spacingStyle of ["wide", "dense"] as const) {
                    const braced = fs.readFileSync(
                        file.referencePaths[`braced-${spacingStyle}`],
                        "utf8"
                    );
                    const colon = fs.readFileSync(
                        file.referencePaths[`colon-${spacingStyle}`],
                        "utf8"
                    );

                    expect(
                        formatVerseDocument(braced, { blockStyle: "braced", spacingStyle })
                    ).toBe(ensureFinalNewline(braced));
                    expect(formatVerseDocument(colon, { blockStyle: "colon", spacingStyle })).toBe(
                        ensureFinalNewline(colon)
                    );
                    expect(formatVerseDocument(braced, { blockStyle: "colon", spacingStyle })).toBe(
                        ensureFinalNewline(colon)
                    );
                    expect(
                        formatVerseDocument(
                            formatVerseDocument(colon, { blockStyle: "braced", spacingStyle }),
                            {
                                blockStyle: "colon",
                                spacingStyle
                            }
                        )
                    ).toBe(ensureFinalNewline(colon));
                }
            }
        });
    }
});

interface StyleCombination {
    blockStyle: VerseBlockStyle;
    directoryName: string;
    fileName: string;
    name: `${VerseBlockStyle}-${VerseSpacingStyle}`;
    spacingStyle: VerseSpacingStyle;
}

interface Fixture {
    name: string;
    path: string;
}

interface FixtureFile {
    originalPath: string;
    referencePaths: Record<StyleCombination["name"], string>;
}

function loadFixtures(): Fixture[] {
    return fs
        .readdirSync(FIXTURE_ROOT, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({
            name: entry.name,
            path: path.join(FIXTURE_ROOT, entry.name)
        }))
        .sort((left, right) => left.name.localeCompare(right.name));
}

function loadFixtureFiles(fixture: Fixture): FixtureFile[] {
    const singleOriginal = path.join(fixture.path, "original.verse");
    if (fs.existsSync(singleOriginal)) {
        return [
            {
                originalPath: singleOriginal,
                referencePaths: Object.fromEntries(
                    STYLE_COMBINATIONS.map((combination) => [
                        combination.name,
                        path.join(fixture.path, combination.fileName)
                    ])
                ) as Record<StyleCombination["name"], string>
            }
        ];
    }

    const originalRoot = path.join(fixture.path, "original");
    return collectVerseFiles(originalRoot).map((originalPath) => {
        const relativePath = path.relative(originalRoot, originalPath);
        return {
            originalPath,
            referencePaths: Object.fromEntries(
                STYLE_COMBINATIONS.map((combination) => [
                    combination.name,
                    path.join(fixture.path, combination.directoryName, relativePath)
                ])
            ) as Record<StyleCombination["name"], string>
        };
    });
}

function formatOptions(combination: StyleCombination): FormatterOptions {
    return {
        blockStyle: combination.blockStyle,
        spacingStyle: combination.spacingStyle
    };
}

function collectVerseFiles(directory: string): string[] {
    const files: string[] = [];

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectVerseFiles(entryPath));
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".verse")) {
            files.push(entryPath);
        }
    }

    return files.sort();
}

function ensureFinalNewline(value: string): string {
    return value.endsWith("\n") ? value : `${value}\n`;
}
