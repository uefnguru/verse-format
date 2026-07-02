import {
    isContinuationHeader,
    isRecognizedColonBlockHeader,
    looksLikeFunctionHeader
} from "./rules";
import {
    type CommentState,
    countCurlyBraceDelta,
    countGroupingDelta,
    splitLineComment
} from "./scanner";
import { countLeadingSpaces, expandTabs } from "./text";

interface BraceStackEntry {
    converted: boolean;
    originalLine?: string;
    resultIndex?: number;
    stripTrailingCommas?: boolean;
}

interface ParsedCloseLine {
    comment: string;
    continuationHeader: string | null;
    hasInlineBlockComment: boolean;
    hasNonContinuationSuffix: boolean;
}

interface ParsedEmptyBlockLine {
    header: string;
    comment: string;
    hasInlineBlockComment: boolean;
}

interface ParsedOpenLine {
    header: string;
    comment: string;
    hasInlineBlockComment: boolean;
}

export function convertBracedBlocksToColon(lines: string[], indentSize: number): string[] {
    const result: string[] = [];
    const stack: BraceStackEntry[] = [];
    const commentState: CommentState = { inBlockComment: false };
    let groupingDepth = 0;
    let removedConvertedClose = false;

    for (const rawLine of lines) {
        let expandedLine = expandTabs(rawLine, indentSize).trimEnd();
        let trimmed = expandedLine.trim();

        if (trimmed.length === 0) {
            if (removedConvertedClose && result[result.length - 1]?.trim().length === 0) {
                continue;
            }
            result.push("");
            continue;
        }
        removedConvertedClose = false;

        if (commentState.inBlockComment || trimmed.startsWith("<#")) {
            result.push(expandedLine);
            countCurlyBraceDelta(expandedLine, commentState);
            groupingDepth = Math.max(0, groupingDepth + countGroupingDelta(expandedLine));
            continue;
        }

        const groupingDepthBefore = groupingDepth;
        const groupingDepthAfter = Math.max(0, groupingDepth + countGroupingDelta(expandedLine));
        const isInsideGrouping = groupingDepthBefore > 0 && groupingDepthAfter > 0;
        const indent = countLeadingSpaces(expandedLine);
        if (shouldStripTrailingComma(stack, indent, trimmed)) {
            expandedLine = stripTrailingCodeComma(expandedLine);
            trimmed = expandedLine.trim();
        }

        const emptyBlockLine = parseEmptyBlockLine(trimmed);
        if (emptyBlockLine) {
            if (looksLikeFunctionHeader(emptyBlockLine.header)) {
                result.push(expandedLine);
                const braceDelta = countCurlyBraceDelta(expandedLine, commentState);
                adjustUntrackedBraceStack(stack, braceDelta, 0);
                groupingDepth = groupingDepthAfter;
                continue;
            }

            if (
                !emptyBlockLine.hasInlineBlockComment &&
                isConvertibleColonHeader(emptyBlockLine.header)
            ) {
                result.push(
                    `${" ".repeat(indent)}${formatColonHeader(emptyBlockLine.header, emptyBlockLine.comment)}`
                );
                removedConvertedClose = true;
            } else {
                result.push(expandedLine);
            }
            const braceDelta = countCurlyBraceDelta(expandedLine, commentState);
            adjustUntrackedBraceStack(stack, braceDelta, 0);
            groupingDepth = groupingDepthAfter;
            continue;
        }

        const closeLine = parseCloseLine(trimmed);
        if (closeLine) {
            const closed = stack.pop();
            let trackedBraceDelta = -1;

            if (!closed?.converted) {
                result.push(expandedLine);
                if (
                    closeLine.continuationHeader &&
                    isConvertibleColonHeader(closeLine.continuationHeader)
                ) {
                    stack.push({
                        converted: true,
                        stripTrailingCommas: shouldStripBodyCommas(closeLine.continuationHeader)
                    });
                    trackedBraceDelta += 1;
                }
                const braceDelta = countCurlyBraceDelta(expandedLine, commentState);
                adjustUntrackedBraceStack(stack, braceDelta, trackedBraceDelta);
                groupingDepth = groupingDepthAfter;
                continue;
            }

            if (closeLine.hasInlineBlockComment) {
                revertConvertedOpen(result, closed);
                result.push(expandedLine);
                const braceDelta = countCurlyBraceDelta(expandedLine, commentState);
                adjustUntrackedBraceStack(stack, braceDelta, trackedBraceDelta);
                groupingDepth = groupingDepthAfter;
                continue;
            }

            if (closeLine.continuationHeader) {
                result.push(
                    `${" ".repeat(indent)}${formatColonHeader(closeLine.continuationHeader, closeLine.comment)}`
                );
                stack.push({
                    converted: true,
                    originalLine: `${" ".repeat(indent)}${formatBracedHeader(closeLine.continuationHeader, closeLine.comment)}`,
                    resultIndex: result.length - 1,
                    stripTrailingCommas: shouldStripBodyCommas(closeLine.continuationHeader)
                });
                trackedBraceDelta += 1;
            } else if (closeLine.comment) {
                result.push(`${" ".repeat(indent)}${closeLine.comment}`);
            } else if (closeLine.hasNonContinuationSuffix) {
                revertConvertedOpen(result, closed);
                result.push(expandedLine);
            } else {
                removedConvertedClose = true;
            }
            const braceDelta = countCurlyBraceDelta(expandedLine, commentState);
            adjustUntrackedBraceStack(stack, braceDelta, trackedBraceDelta);
            groupingDepth = groupingDepthAfter;
            continue;
        }

        const openLine = parseOpenLine(trimmed);
        if (
            !openLine ||
            openLine.hasInlineBlockComment ||
            !isConvertibleColonHeader(openLine.header) ||
            isInsideGrouping
        ) {
            result.push(expandedLine);
            const braceDelta = countCurlyBraceDelta(expandedLine, commentState);
            if (openLine) {
                stack.push({ converted: false });
                adjustUntrackedBraceStack(stack, braceDelta, 1);
            } else {
                adjustUntrackedBraceStack(stack, braceDelta, 0);
            }
            groupingDepth = groupingDepthAfter;
            continue;
        }

        const originalLine = `${" ".repeat(indent)}${formatBracedHeader(openLine.header, openLine.comment)}`;
        result.push(`${" ".repeat(indent)}${formatColonHeader(openLine.header, openLine.comment)}`);
        stack.push({
            converted: true,
            originalLine,
            resultIndex: result.length - 1,
            stripTrailingCommas: shouldStripBodyCommas(openLine.header)
        });
        const braceDelta = countCurlyBraceDelta(expandedLine, commentState);
        adjustUntrackedBraceStack(stack, braceDelta, 1);
        groupingDepth = groupingDepthAfter;
    }

    return result;
}

function adjustUntrackedBraceStack(
    stack: BraceStackEntry[],
    braceDelta: number,
    trackedDelta: number
): void {
    const untrackedDelta = braceDelta - trackedDelta;
    if (untrackedDelta > 0) {
        for (let count = 0; count < untrackedDelta; count += 1) {
            stack.push({ converted: false });
        }
        return;
    }

    for (let count = 0; count < -untrackedDelta; count += 1) {
        stack.pop();
    }
}

function shouldStripTrailingComma(
    stack: BraceStackEntry[],
    indent: number,
    trimmed: string
): boolean {
    if (trimmed.startsWith("}")) {
        return false;
    }

    return stack.some(
        (entry) => entry.converted && entry.stripTrailingCommas && indent > entryHeaderIndent(entry)
    );
}

function entryHeaderIndent(entry: BraceStackEntry): number {
    if (entry.resultIndex === undefined || entry.originalLine === undefined) {
        return -1;
    }

    return countLeadingSpaces(entry.originalLine);
}

function stripTrailingCodeComma(line: string): string {
    const parts = splitLineComment(line);
    if (!parts.code.trimEnd().endsWith(",")) {
        return line;
    }

    const code = parts.code.replace(/,\s*$/, "");
    return parts.comment ? `${code} ${parts.comment.trimStart()}` : code;
}

function parseEmptyBlockLine(trimmed: string): ParsedEmptyBlockLine | null {
    const parts = splitLineComment(trimmed);
    const codeWithComments = parts.code.trimEnd();
    const code = stripInlineBlockComments(codeWithComments).trimEnd();
    if (/^}[\])]/.test(code)) {
        return null;
    }

    const match = code.match(/^(.*?)\{\s*\}\s*,?$/);
    if (!match) {
        return null;
    }

    const header = match[1].trimEnd();
    if (header.length === 0) {
        return null;
    }

    return {
        comment: parts.comment.trimStart(),
        hasInlineBlockComment: code !== codeWithComments,
        header
    };
}

function parseCloseLine(trimmed: string): ParsedCloseLine | null {
    const parts = splitLineComment(trimmed);
    const codeWithComments = parts.code.trimEnd();
    const code = stripInlineBlockComments(codeWithComments).trimEnd();
    if (!code.startsWith("}")) {
        return null;
    }
    const hasInlineBlockComment = code !== codeWithComments;

    const remainder = code.slice(1).trimStart();
    if (remainder.length === 0) {
        return {
            comment: parts.comment.trimStart(),
            continuationHeader: null,
            hasInlineBlockComment,
            hasNonContinuationSuffix: false
        };
    }

    if (remainder === ",") {
        return {
            comment: parts.comment.trimStart(),
            continuationHeader: null,
            hasInlineBlockComment,
            hasNonContinuationSuffix: false
        };
    }

    if (remainder.endsWith("{")) {
        const continuationHeader = remainder.slice(0, -1).trimEnd();
        if (isContinuationHeader(continuationHeader)) {
            return {
                comment: parts.comment.trimStart(),
                continuationHeader,
                hasInlineBlockComment,
                hasNonContinuationSuffix: false
            };
        }
    }

    return {
        comment: parts.comment.trimStart(),
        continuationHeader: null,
        hasInlineBlockComment,
        hasNonContinuationSuffix: true
    };
}

function parseOpenLine(trimmed: string): ParsedOpenLine | null {
    const parts = splitLineComment(trimmed);
    const codeWithComments = parts.code.trimEnd();
    const code = stripInlineBlockComments(codeWithComments).trimEnd();
    if (!code.endsWith("{")) {
        return null;
    }

    const header = code.slice(0, -1).trimEnd();
    if (header.length === 0) {
        return null;
    }

    return {
        comment: parts.comment.trimStart(),
        hasInlineBlockComment: code !== codeWithComments,
        header
    };
}

function isConvertibleColonHeader(header: string): boolean {
    if (/^}+\s*(?:else|then)\b/.test(header)) {
        return true;
    }

    if (/^[}\])]/.test(header)) {
        return false;
    }

    if (hasUnclosedGrouping(header)) {
        return false;
    }

    if (looksLikeDigestOnlyMacroHeader(header) || looksLikeUsingHeader(header)) {
        return false;
    }

    return looksLikeFunctionHeader(header) || isRecognizedColonBlockHeader(header);
}

function looksLikeDigestOnlyMacroHeader(header: string): boolean {
    return /(?:^|(?:=|:=)\s*)external$/.test(header);
}

function looksLikeUsingHeader(header: string): boolean {
    return /^using\b/.test(header);
}

function shouldStripBodyCommas(header: string): boolean {
    if (looksLikeFunctionHeader(header)) {
        return false;
    }

    if (/^@/.test(header)) {
        return false;
    }

    if (/^(?:if|else|for|case|block|defer|loop|sync|race|rush|branch|spawn|then)\b/.test(header)) {
        return false;
    }

    if (/(?:^|:=\s*)(?:class|module|struct|interface|enum)\b/.test(header)) {
        return false;
    }

    return true;
}

function formatColonHeader(header: string, comment: string): string {
    const suffix = comment ? ` ${comment}` : "";
    if (looksLikeFunctionHeader(header)) {
        return `${header}${suffix}`;
    }

    return `${header}:${suffix}`;
}

function formatBracedHeader(header: string, comment: string): string {
    const suffix = comment ? ` ${comment}` : "";
    return `${header} {${suffix}`;
}

function revertConvertedOpen(result: string[], entry: BraceStackEntry | undefined): void {
    if (entry?.resultIndex === undefined || entry.originalLine === undefined) {
        return;
    }

    result[entry.resultIndex] = entry.originalLine;
}

function stripInlineBlockComments(code: string): string {
    let output = "";
    let index = 0;
    let quote: '"' | "'" | null = null;
    let escaped = false;

    while (index < code.length) {
        const char = code[index];
        const next = code[index + 1];

        if (quote) {
            output += char;
            if (escaped) {
                escaped = false;
            } else if (char === "\\") {
                escaped = true;
            } else if (char === quote) {
                quote = null;
            }
            index += 1;
            continue;
        }

        if (char === '"' || char === "'") {
            quote = char;
            output += char;
            index += 1;
            continue;
        }

        if (char === "<" && next === "#") {
            const closeIndex = code.indexOf("#>", index + 2);
            if (closeIndex === -1) {
                break;
            }
            index = closeIndex + 2;
            continue;
        }

        output += char;
        index += 1;
    }

    return output;
}

function hasUnclosedGrouping(header: string): boolean {
    let parenDepth = 0;
    let bracketDepth = 0;
    let quote: '"' | "'" | null = null;
    let escaped = false;

    for (let index = 0; index < header.length; index += 1) {
        const char = header[index];

        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (char === "\\") {
                escaped = true;
            } else if (char === quote) {
                quote = null;
            }
            continue;
        }

        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }

        if (char === "(") {
            parenDepth += 1;
        } else if (char === ")") {
            parenDepth = Math.max(0, parenDepth - 1);
        } else if (char === "[") {
            bracketDepth += 1;
        } else if (char === "]") {
            bracketDepth = Math.max(0, bracketDepth - 1);
        }
    }

    return parenDepth > 0 || bracketDepth > 0;
}
