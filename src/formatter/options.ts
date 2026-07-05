export type VerseBlockStyle = "braced" | "colon";
export type VerseEmptyConstructionStyle = "braced" | "colon";
export type VerseSpacingStyle = "wide" | "dense";

export interface FormatterOptions {
    blockStyle?: VerseBlockStyle;
    emptyConstructionStyle?: VerseEmptyConstructionStyle;
    spacingStyle?: VerseSpacingStyle;
    wrapMultiPropertyConstructions?: boolean;
    maxInlineConstructionProperties?: number;
    maxInlineAttributeProperties?: number;
    maxInlineArrayItems?: number;
    finalNewline?: boolean;
}

export interface ResolvedFormatterOptions {
    indentSize: number;
    blockStyle: VerseBlockStyle;
    emptyConstructionStyle: VerseEmptyConstructionStyle;
    spacingStyle: VerseSpacingStyle;
    wrapMultiPropertyConstructions: boolean;
    maxInlineConstructionProperties: number;
    maxInlineAttributeProperties: number;
    maxInlineArrayItems: number;
    finalNewline: boolean;
}

export function resolveFormatterOptions(options: FormatterOptions = {}): ResolvedFormatterOptions {
    return {
        indentSize: 4,
        blockStyle: resolveBlockStyle(options),
        emptyConstructionStyle: resolveEmptyConstructionStyle(options),
        spacingStyle: resolveSpacingStyle(options),
        wrapMultiPropertyConstructions: options.wrapMultiPropertyConstructions !== false,
        maxInlineConstructionProperties: resolveNonNegativeInteger(
            options.maxInlineConstructionProperties,
            1
        ),
        maxInlineAttributeProperties: resolveNonNegativeInteger(
            options.maxInlineAttributeProperties,
            1
        ),
        maxInlineArrayItems: resolveNonNegativeInteger(options.maxInlineArrayItems, 3),
        finalNewline: options.finalNewline !== false
    };
}

function resolveBlockStyle(options: FormatterOptions): VerseBlockStyle {
    if (options.blockStyle === "braced" || options.blockStyle === "colon") {
        return options.blockStyle;
    }

    return "braced";
}

function resolveEmptyConstructionStyle(options: FormatterOptions): VerseEmptyConstructionStyle {
    if (options.emptyConstructionStyle === "braced" || options.emptyConstructionStyle === "colon") {
        return options.emptyConstructionStyle;
    }

    return "braced";
}

function resolveSpacingStyle(options: FormatterOptions): VerseSpacingStyle {
    if (options.spacingStyle === "dense" || options.spacingStyle === "wide") {
        return options.spacingStyle;
    }

    return "wide";
}

function resolveNonNegativeInteger(value: number | undefined, fallback: number): number {
    return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : fallback;
}
