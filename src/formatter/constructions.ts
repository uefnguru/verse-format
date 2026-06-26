import type { ResolvedFormatterOptions } from "./options";
import { findOpeningBraceForFinalClose, splitLineComment, splitTopLevelComma } from "./scanner";

type AggregateKind = "array" | "attribute" | "construction" | "option";

export interface AggregateLiteral {
    body: string;
    kind: AggregateKind;
    prefix: string;
    typeName: string;
    typeText: string;
}

export function wrapMultiPropertyConstructionLine(
    line: string,
    indentLevel: number,
    indentSize: number,
    settings: ResolvedFormatterOptions
): string[] | null {
    if (settings.wrapMultiPropertyConstructions === false) {
        return null;
    }

    const parts = splitLineComment(line);
    const code = parts.code.trimEnd();
    const trailingComment = parts.comment.trimStart();
    const trailingComma = code.endsWith(",");
    const aggregateLine = trailingComma ? code.replace(/,\s*$/, "") : code;
    const aggregate = findTrailingAggregateLiteral(aggregateLine);
    if (!aggregate || !shouldWrapAggregate(aggregate, settings)) {
        return null;
    }

    return formatAggregateLiteral(
        aggregate,
        indentLevel,
        indentSize,
        trailingComma,
        settings,
        trailingComment
    );
}

function formatAggregateLiteral(
    aggregate: AggregateLiteral,
    indentLevel: number,
    indentSize: number,
    trailingComma: boolean,
    settings: ResolvedFormatterOptions,
    trailingComment = ""
): string[] | null {
    const items = splitAggregateItems(aggregate);

    if (aggregate.kind === "array") {
        return formatArrayLiteral(
            aggregate,
            items,
            indentLevel,
            indentSize,
            trailingComma,
            settings,
            trailingComment
        );
    }

    if (!items.every(looksLikeNamedConstructionProperty)) {
        return null;
    }

    const baseIndent = " ".repeat(indentLevel * indentSize);
    const lines = [`${baseIndent}${aggregate.prefix}${aggregate.typeText} {`];

    items.forEach((property, index) => {
        lines.push(
            ...formatAggregateItem(
                property,
                indentLevel + 1,
                indentSize,
                index < items.length - 1,
                settings
            )
        );
    });

    lines.push(formatAggregateCloseLine(baseIndent, trailingComma, trailingComment));
    return lines;
}

function formatArrayLiteral(
    aggregate: AggregateLiteral,
    items: string[],
    indentLevel: number,
    indentSize: number,
    trailingComma: boolean,
    settings: ResolvedFormatterOptions,
    trailingComment = ""
): string[] {
    const baseIndent = " ".repeat(indentLevel * indentSize);
    const lines = [`${baseIndent}${aggregate.prefix}${aggregate.typeText}{`];

    items.forEach((item, index) => {
        lines.push(
            ...formatAggregateItem(
                item,
                indentLevel + 1,
                indentSize,
                index < items.length - 1,
                settings
            )
        );
    });

    lines.push(formatAggregateCloseLine(baseIndent, trailingComma, trailingComment));
    return lines;
}

function formatAggregateItem(
    item: string,
    indentLevel: number,
    indentSize: number,
    trailingComma: boolean,
    settings: ResolvedFormatterOptions
): string[] {
    const nestedAggregate = findTrailingAggregateLiteral(item);
    if (nestedAggregate && shouldWrapAggregate(nestedAggregate, settings)) {
        const nestedLines = formatAggregateLiteral(
            nestedAggregate,
            indentLevel,
            indentSize,
            trailingComma,
            settings
        );
        if (nestedLines) {
            return nestedLines;
        }
    }

    const itemIndent = " ".repeat(indentLevel * indentSize);
    return [`${itemIndent}${item}${trailingComma ? "," : ""}`];
}

function formatAggregateCloseLine(
    baseIndent: string,
    trailingComma: boolean,
    trailingComment: string
): string {
    const suffix = trailingComment ? ` ${trailingComment}` : "";
    return `${baseIndent}}${trailingComma ? "," : ""}${suffix}`;
}

function shouldWrapAggregate(
    aggregate: AggregateLiteral,
    settings: ResolvedFormatterOptions
): boolean {
    if (aggregate.kind === "option") {
        return false;
    }

    const items = splitAggregateItems(aggregate);
    if (items.length === 0) {
        return false;
    }

    if (aggregate.kind === "array") {
        return (
            items.length > settings.maxInlineArrayItems ||
            items.some((item) => hasWrappableNestedAggregate(item, settings))
        );
    }

    if (!items.every(looksLikeNamedConstructionProperty)) {
        return false;
    }

    const maxInlineProperties =
        aggregate.kind === "attribute"
            ? settings.maxInlineAttributeProperties
            : settings.maxInlineConstructionProperties;

    return (
        items.length > maxInlineProperties ||
        items.some((item) => hasWrappableNestedAggregate(item, settings))
    );
}

function hasWrappableNestedAggregate(item: string, settings: ResolvedFormatterOptions): boolean {
    const nestedAggregate = findTrailingAggregateLiteral(item);
    return Boolean(nestedAggregate && shouldWrapAggregate(nestedAggregate, settings));
}

function splitAggregateItems(aggregate: AggregateLiteral): string[] {
    return splitTopLevelComma(aggregate.body)
        .map((item) => item.trim().replace(/,+$/g, "").trim())
        .filter((item) => item.length > 0);
}

export function findTrailingConstructionLiteral(line: string): AggregateLiteral | null {
    const aggregate = findTrailingAggregateLiteral(line);
    return aggregate?.kind === "construction" ? aggregate : null;
}

function findTrailingAggregateLiteral(line: string): AggregateLiteral | null {
    if (!line.endsWith("}")) {
        return null;
    }

    const openBraceIndex = findOpeningBraceForFinalClose(line);
    if (openBraceIndex === -1) {
        return null;
    }

    const beforeBrace = line.slice(0, openBraceIndex).trimEnd();
    const attributeMatch = beforeBrace.match(/@[A-Za-z_][A-Za-z0-9_]*(?:\([^)]*\))?$/);
    if (attributeMatch) {
        const typeText = attributeMatch[0];
        return {
            body: line.slice(openBraceIndex + 1, -1),
            kind: "attribute",
            prefix: beforeBrace.slice(0, beforeBrace.length - typeText.length),
            typeName: typeText.replace(/^@/, "").replace(/\([^)]*\)$/, ""),
            typeText
        };
    }

    const typeMatch = beforeBrace.match(
        /(?:\(\/[A-Za-z0-9_.]+(?:\/[A-Za-z0-9_.]+)*(?::[A-Za-z0-9_.]+)*:\))?[A-Za-z_][A-Za-z0-9_.]*$/
    );
    if (!typeMatch) {
        return null;
    }

    const typeText = typeMatch[0];
    const typeName = typeText.replace(
        /^\(\/[A-Za-z0-9_.]+(?:\/[A-Za-z0-9_.]+)*(?::[A-Za-z0-9_.]+)*:\)/,
        ""
    );

    return {
        body: line.slice(openBraceIndex + 1, -1),
        kind: getAggregateKind(typeName),
        prefix: beforeBrace.slice(0, beforeBrace.length - typeText.length),
        typeName,
        typeText
    };
}

function getAggregateKind(typeName: string): AggregateKind {
    if (typeName === "array") {
        return "array";
    }

    if (typeName === "option") {
        return "option";
    }

    return "construction";
}

export function looksLikeNamedConstructionProperty(property: string): boolean {
    return /^\??[A-Za-z_][A-Za-z0-9_]*\s*:=/.test(property);
}
