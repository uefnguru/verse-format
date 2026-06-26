import { wrapMultiPropertyConstructionLine } from "./constructions";
import type { ResolvedFormatterOptions } from "./options";
import { isContinuationHeader, isRecognizedColonBlockHeader } from "./rules";
import {
    type CommentState,
    countCurlyBraceDelta,
    countGroupingDelta,
    splitLineComment
} from "./scanner";
import { normalizeCodeSpacing, normalizeInlineSpacing } from "./spacing";
import { countLeadingSpaces, expandTabs, removeTrailingBlankLines } from "./text";

export function formatBracedLines(
    lines: string[],
    indentSize: number,
    settings: ResolvedFormatterOptions
): string[] {
    const result: string[] = [];
    let indentLevel = 0;
    let groupingDepth = 0;
    const commentState: CommentState = { inBlockComment: false };
    const preservedColonIndents: number[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const rawLine = lines[lineIndex];
        const expandedLine = expandTabs(rawLine, indentSize);
        const sourceIndent = countLeadingSpaces(expandedLine);
        const trimmed = normalizeInlineSpacing(expandedLine.trim(), settings);

        if (trimmed.length === 0) {
            result.push("");
            continue;
        }

        while (
            preservedColonIndents.length > 0 &&
            sourceIndent <= preservedColonIndents[preservedColonIndents.length - 1]
        ) {
            preservedColonIndents.pop();
        }

        if (preservedColonIndents.length > 0) {
            result.push(expandedLine.trimEnd());
            continue;
        }

        if (isUnrecognizedColonHeader(expandedLine.trim(), settings)) {
            result.push(expandedLine.trimEnd());
            preservedColonIndents.push(sourceIndent);
            continue;
        }

        if (!commentState.inBlockComment && isStandaloneLineComment(trimmed)) {
            const previousCloseIndent = previousStandaloneCloseIndent(
                lines,
                lineIndex,
                indentSize,
                settings
            );
            const targetIndent =
                previousCloseIndent !== null && sourceIndent === previousCloseIndent
                    ? previousCloseIndent
                    : (nearestFormattedCodeIndent(
                          lines,
                          lineIndex,
                          lineIndex,
                          result,
                          indentLevel,
                          groupingDepth,
                          indentSize,
                          settings
                      ) ?? indentLevel * indentSize);
            result.push(`${" ".repeat(targetIndent)}${trimmed}`);
            continue;
        }

        if (commentState.inBlockComment || trimmed.startsWith("<#")) {
            if (!commentState.inBlockComment && trimmed.startsWith("<#")) {
                const blockComment = collectStandaloneMultilineBlockComment(
                    lines,
                    lineIndex,
                    indentSize
                );
                if (blockComment) {
                    const targetIndent =
                        nearestFormattedCodeIndent(
                            lines,
                            lineIndex,
                            blockComment.endIndex,
                            result,
                            indentLevel,
                            groupingDepth,
                            indentSize,
                            settings
                        ) ?? indentLevel * indentSize;
                    result.push(
                        ...reindentStandaloneBlockComment(blockComment.lines, targetIndent)
                    );
                    lineIndex = blockComment.endIndex;
                    continue;
                }
            }

            result.push(expandedLine.trimEnd());
            countCurlyBraceDelta(expandedLine, commentState);
            continue;
        }

        const logicalLines = splitTrailingUnmatchedClosingBraces(trimmed);
        for (const logicalLine of logicalLines) {
            const continuationIndent = groupingDepth > 0 && !startsWithClosingGrouping(logicalLine);
            indentLevel = formatBracedLine(
                logicalLine,
                result,
                indentLevel,
                continuationIndent,
                indentSize,
                settings,
                commentState
            );
            groupingDepth = Math.max(0, groupingDepth + countGroupingDelta(logicalLine));
        }
    }

    return result;
}

function isUnrecognizedColonHeader(trimmed: string, settings: ResolvedFormatterOptions): boolean {
    const parts = splitLineComment(trimmed);
    const code = parts.code.trimEnd();
    if (!code.endsWith(":")) {
        return false;
    }

    const header = normalizeCodeSpacing(code.slice(0, -1).trimEnd(), settings);
    if (looksLikeDigestOnlyMacroHeader(header) || looksLikeUsingHeader(header)) {
        return true;
    }

    return !isRecognizedColonBlockHeader(header);
}

function looksLikeDigestOnlyMacroHeader(header: string): boolean {
    return /(?:^|(?:=|:=)\s*)external$/.test(header);
}

function looksLikeUsingHeader(header: string): boolean {
    return /^using\b/.test(header);
}

function isStandaloneLineComment(trimmed: string): boolean {
    const parts = splitLineComment(trimmed);
    return parts.code.trim().length === 0 && parts.comment.length > 0;
}

function nearestFormattedCodeIndent(
    lines: string[],
    startIndex: number,
    endIndex: number,
    result: string[],
    indentLevel: number,
    groupingDepth: number,
    indentSize: number,
    settings: ResolvedFormatterOptions
): number | null {
    for (let distance = 1; distance < lines.length; distance += 1) {
        const belowIndex = endIndex + distance;
        if (belowIndex < lines.length) {
            const belowIndent = isGeneratedCloseBeforeBlank(lines, belowIndex, indentSize, settings)
                ? null
                : upcomingFormattedCodeIndent(
                      lines[belowIndex],
                      indentLevel,
                      groupingDepth,
                      indentSize,
                      settings
                  );
            if (belowIndent !== null) {
                return belowIndent;
            }
        }

        const aboveIndex = startIndex - distance;
        if (aboveIndex >= 0 && isSourceCodeLine(lines[aboveIndex], indentSize, settings)) {
            const previousIndent = previousFormattedCodeIndent(result);
            const previousLine = previousFormattedCodeLine(result);
            if (previousLine?.trimEnd().endsWith("{")) {
                const belowIndent = nextUpcomingFormattedCodeIndent(
                    lines,
                    endIndex,
                    indentLevel,
                    groupingDepth,
                    indentSize,
                    settings
                );
                if (
                    belowIndent !== null &&
                    (previousIndent === null || belowIndent > previousIndent)
                ) {
                    return belowIndent;
                }
            }

            return previousIndent;
        }

        if (belowIndex >= lines.length && aboveIndex < 0) {
            break;
        }
    }

    return null;
}

function nextUpcomingFormattedCodeIndent(
    lines: string[],
    endIndex: number,
    indentLevel: number,
    groupingDepth: number,
    indentSize: number,
    settings: ResolvedFormatterOptions
): number | null {
    for (let index = endIndex + 1; index < lines.length; index += 1) {
        const belowIndent = isGeneratedCloseBeforeBlank(lines, index, indentSize, settings)
            ? null
            : upcomingFormattedCodeIndent(
                  lines[index],
                  indentLevel,
                  groupingDepth,
                  indentSize,
                  settings
              );
        if (belowIndent !== null) {
            return belowIndent;
        }
    }

    return null;
}

function upcomingFormattedCodeIndent(
    line: string,
    indentLevel: number,
    groupingDepth: number,
    indentSize: number,
    settings: ResolvedFormatterOptions
): number | null {
    const trimmed = normalizeInlineSpacing(expandTabs(line, indentSize).trim(), settings);
    if (!isSourceCodeTrimmedLine(trimmed)) {
        return null;
    }

    const logicalLine = splitTrailingUnmatchedClosingBraces(trimmed)[0] ?? trimmed;
    const startsWithClosingBrace = logicalLine.startsWith("}");
    const lineIndentLevel = startsWithClosingBrace ? Math.max(0, indentLevel - 1) : indentLevel;
    const continuationIndent = groupingDepth > 0 && !startsWithClosingGrouping(logicalLine);
    return (lineIndentLevel + (continuationIndent ? 1 : 0)) * indentSize;
}

function isGeneratedCloseBeforeBlank(
    lines: string[],
    lineIndex: number,
    indentSize: number,
    settings: ResolvedFormatterOptions
): boolean {
    const trimmed = normalizeInlineSpacing(
        expandTabs(lines[lineIndex], indentSize).trim(),
        settings
    );
    return (
        isStandaloneCloseLine(trimmed) &&
        lineIndex + 1 < lines.length &&
        expandTabs(lines[lineIndex + 1], indentSize).trim().length === 0
    );
}

function previousStandaloneCloseIndent(
    lines: string[],
    lineIndex: number,
    indentSize: number,
    settings: ResolvedFormatterOptions
): number | null {
    if (lineIndex === 0) {
        return null;
    }

    const previous = expandTabs(lines[lineIndex - 1], indentSize);
    const trimmed = normalizeInlineSpacing(previous.trim(), settings);
    return isStandaloneCloseLine(trimmed) ? countLeadingSpaces(previous) : null;
}

function previousFormattedCodeIndent(result: string[]): number | null {
    const line = previousFormattedCodeLine(result);
    return line === null ? null : countLeadingSpaces(line);
}

function previousFormattedCodeLine(result: string[]): string | null {
    for (let index = result.length - 1; index >= 0; index -= 1) {
        const line = result[index];
        if (isSourceCodeTrimmedLine(line.trim())) {
            return line;
        }
    }

    return null;
}

function isSourceCodeLine(
    line: string,
    indentSize: number,
    settings: ResolvedFormatterOptions
): boolean {
    const trimmed = normalizeInlineSpacing(expandTabs(line, indentSize).trim(), settings);
    return isSourceCodeTrimmedLine(trimmed);
}

function isSourceCodeTrimmedLine(trimmed: string): boolean {
    return trimmed.length > 0 && !trimmed.startsWith("<#") && !isStandaloneLineComment(trimmed);
}

function isStandaloneCloseLine(trimmed: string): boolean {
    return /^}+\s*$/.test(trimmed);
}

function collectStandaloneMultilineBlockComment(
    lines: string[],
    startIndex: number,
    indentSize: number
): { endIndex: number; lines: string[] } | null {
    const expandedStart = expandTabs(lines[startIndex], indentSize).trimEnd();
    const trimmedStart = expandedStart.trim();
    if (!trimmedStart.startsWith("<#") || trimmedStart.includes("#>")) {
        return null;
    }

    const blockLines = [expandedStart];
    for (let index = startIndex + 1; index < lines.length; index += 1) {
        const expandedLine = expandTabs(lines[index], indentSize).trimEnd();
        blockLines.push(expandedLine);

        if (expandedLine.includes("#>")) {
            return { endIndex: index, lines: blockLines };
        }
    }

    return null;
}

function reindentStandaloneBlockComment(lines: string[], targetIndent: number): string[] {
    const sourceIndent = countLeadingSpaces(lines[0]);

    return lines.map((line) => {
        if (line.trim().length === 0) {
            return "";
        }

        const relativeIndent = Math.max(0, countLeadingSpaces(line) - sourceIndent);
        return `${" ".repeat(targetIndent + relativeIndent)}${line.trimStart()}`;
    });
}

function formatBracedLine(
    trimmed: string,
    result: string[],
    indentLevel: number,
    continuationIndent: boolean,
    indentSize: number,
    settings: ResolvedFormatterOptions,
    commentState: CommentState
): number {
    const startsWithClosingBrace = trimmed.startsWith("}");
    if (startsWithClosingBrace) {
        indentLevel = Math.max(0, indentLevel - 1);
        removeTrailingBlankLines(result);
    }

    if (tryMergeExistingContinuation(result, trimmed, indentLevel, indentSize)) {
        const delta = countCurlyBraceDelta(trimmed, commentState);
        return Math.max(0, indentLevel + delta);
    }

    const lineIndentLevel = indentLevel + (continuationIndent ? 1 : 0);
    const wrappedConstruction = wrapMultiPropertyConstructionLine(
        trimmed,
        lineIndentLevel,
        indentSize,
        settings
    );
    if (wrappedConstruction) {
        result.push(...wrappedConstruction);
        return indentLevel;
    }

    result.push(`${" ".repeat(lineIndentLevel * indentSize)}${trimmed}`);

    const delta = countCurlyBraceDelta(trimmed, commentState);
    return Math.max(0, indentLevel + delta - (startsWithClosingBrace ? -1 : 0));
}

function startsWithClosingGrouping(trimmed: string): boolean {
    return /^[)\]]/.test(trimmed);
}

function tryMergeExistingContinuation(
    result: string[],
    trimmed: string,
    indentLevel: number,
    indentSize: number
): boolean {
    if (!isContinuationHeader(trimmed)) {
        return false;
    }

    removeTrailingBlankLines(result);

    if (result.length === 0) {
        return false;
    }

    const expectedPrevious = `${" ".repeat(indentLevel * indentSize)}}`;
    if (result[result.length - 1] !== expectedPrevious) {
        return false;
    }

    result[result.length - 1] = `${expectedPrevious} ${trimmed}`;
    return true;
}

export function splitTrailingUnmatchedClosingBraces(line: string): string[] {
    if (line.startsWith("}")) {
        return [line];
    }

    const parts = splitLineComment(line);
    let code = parts.code.trimEnd();
    if (!code.endsWith("}")) {
        return [line];
    }

    const delta = countCurlyBraceDelta(code, { inBlockComment: false });
    if (delta >= 0) {
        return [line];
    }

    const lines: string[] = [];
    const closingCount = -delta;

    for (let count = 0; count < closingCount; count += 1) {
        code = code.slice(0, -1).trimEnd();
    }

    if (code.length > 0) {
        lines.push(code);
    }

    for (let count = 0; count < closingCount; count += 1) {
        const comment =
            count === closingCount - 1 && parts.comment ? ` ${parts.comment.trimStart()}` : "";
        lines.push(`}${comment}`);
    }

    return lines.length > 0 ? lines : [line];
}
