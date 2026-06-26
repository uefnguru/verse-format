import { type ResolvedFormatterOptions, resolveFormatterOptions } from "./options";
import {
    isContinuationHeader,
    isRecognizedColonBlockHeader,
    looksLikeCompositeHeader,
    looksLikeFunctionHeader
} from "./rules";
import { countGroupingDelta, splitLineComment } from "./scanner";
import { normalizeCodeSpacing } from "./spacing";
import { countLeadingSpaces, expandTabs, removeTrailingBlankLines } from "./text";

interface ColonBlockStackEntry {
    headerIndent: number;
    kind: "block" | "function";
    recoveredFlattenedBody?: boolean;
    resultIndex: number;
    sawBody: boolean;
}

interface PendingMultilineHeader {
    groupingDepth: number;
    headerIndent: number;
}

export function convertColonBlocks(
    lines: string[],
    indentSize: number,
    settings: ResolvedFormatterOptions = resolveFormatterOptions()
): string[] {
    const result: string[] = [];
    const stack: ColonBlockStackEntry[] = [];
    let pendingMultilineHeader: PendingMultilineHeader | null = null;
    let inStandaloneBlockComment = false;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const rawLine = lines[lineIndex];
        const expandedLine = expandTabs(rawLine, indentSize);
        const trimmed = expandedLine.trim();

        if (trimmed.length === 0) {
            result.push("");
            continue;
        }

        const indent = countLeadingSpaces(expandedLine);
        if (inStandaloneBlockComment) {
            result.push(expandedLine.trimEnd());
            inStandaloneBlockComment = !trimmed.includes("#>");
            continue;
        }

        if (trimmed.startsWith("<#")) {
            const blockComment = collectStandaloneBlockComment(lines, lineIndex, indentSize);
            if (!blockComment) {
                result.push(expandedLine.trimEnd());
                inStandaloneBlockComment = !trimmed.includes("#>");
                continue;
            }

            const commentIndent = standaloneCommentIndent(
                lines,
                lineIndex,
                blockComment.endIndex,
                indent,
                indentSize,
                stack
            );
            closeFinishedColonBlocks(result, stack, commentIndent, trimmed);
            result.push(...reindentStandaloneBlockComment(blockComment.lines, commentIndent));
            lineIndex = blockComment.endIndex;
            continue;
        }

        if (isCommentOnlyLine(trimmed)) {
            const commentIndent = standaloneCommentIndent(
                lines,
                lineIndex,
                lineIndex,
                indent,
                indentSize,
                stack
            );
            if (
                tryRecoverFlattenedFunctionCommentLine(
                    result,
                    stack,
                    commentIndent,
                    trimmed,
                    indentSize
                )
            ) {
                continue;
            }
            closeFinishedColonBlocks(result, stack, commentIndent, trimmed);
            result.push(`${" ".repeat(commentIndent)}${trimmed}`);
            continue;
        }

        if (tryRecoverFlattenedFunctionBodyLine(result, stack, indent, trimmed, indentSize)) {
            continue;
        }

        if (pendingMultilineHeader) {
            const convertedMultiline = convertPendingMultilineHeaderLine(
                trimmed,
                pendingMultilineHeader,
                settings
            );
            result.push(`${" ".repeat(indent)}${convertedMultiline.line}`);
            pendingMultilineHeader.groupingDepth = convertedMultiline.groupingDepth;
            if (convertedMultiline.finished) {
                stack.push({
                    headerIndent: pendingMultilineHeader.headerIndent,
                    kind: "block",
                    resultIndex: result.length - 1,
                    sawBody: false
                });
                pendingMultilineHeader = null;
            } else if (convertedMultiline.abandoned) {
                pendingMultilineHeader = null;
            }
            continue;
        }

        closeFinishedColonBlocks(result, stack, indent, trimmed);
        markBodyLine(stack, indent);

        const multilineHeader = startMultilineHeader(trimmed, indent, settings);
        if (multilineHeader) {
            result.push(expandedLine.trimEnd());
            pendingMultilineHeader = multilineHeader;
            continue;
        }

        const danglingCaseArm = convertDanglingCaseArm(trimmed, settings);
        if (danglingCaseArm) {
            const resultIndex = result.length;
            result.push(`${" ".repeat(indent)}${danglingCaseArm}`);
            stack.push({ headerIndent: indent, kind: "block", resultIndex, sawBody: false });
            continue;
        }

        const converted = convertColonHeader(trimmed, settings);
        if (converted) {
            if (tryMergeDanglingExpressionHeader(result, converted, indent)) {
                stack.push({
                    headerIndent: indent,
                    kind: "block",
                    resultIndex: result.length - 1,
                    sawBody: false
                });
                continue;
            }

            if (tryMergeContinuationHeader(result, converted, indent)) {
                stack.push({
                    headerIndent: indent,
                    kind: "block",
                    resultIndex: result.length - 1,
                    sawBody: false
                });
                continue;
            }

            const resultIndex = result.length;
            result.push(`${" ".repeat(indent)}${converted}`);
            stack.push({
                headerIndent: indent,
                kind: convertedHeaderKind(converted),
                resultIndex,
                sawBody: false
            });
            continue;
        }

        result.push(expandedLine.trimEnd());
    }

    closeFinishedColonBlocks(result, stack, -1, "");
    return result;
}

function standaloneCommentIndent(
    lines: string[],
    startIndex: number,
    endIndex: number,
    fallbackIndent: number,
    indentSize: number,
    stack: ColonBlockStackEntry[]
): number {
    const nearestIndent =
        nearestSourceCodeIndent(lines, startIndex, endIndex, indentSize) ?? fallbackIndent;
    const currentBlock = stack[stack.length - 1];
    if (!currentBlock) {
        return nearestIndent;
    }

    const nextIndent = nextSourceCodeIndent(lines, endIndex, indentSize);
    if (fallbackIndent <= currentBlock.headerIndent) {
        if (nextIndent !== null && nextIndent > fallbackIndent) {
            return nextIndent;
        }

        return fallbackIndent;
    }

    if (currentBlock.sawBody || nearestIndent > currentBlock.headerIndent) {
        return nearestIndent;
    }

    if (nextIndent !== null && nextIndent > currentBlock.headerIndent) {
        return nextIndent;
    }

    return nearestIndent;
}

function tryRecoverFlattenedFunctionBodyLine(
    result: string[],
    stack: ColonBlockStackEntry[],
    indent: number,
    trimmed: string,
    indentSize: number
): boolean {
    const current = stack[stack.length - 1];
    if (!current || current.kind !== "function" || indent !== current.headerIndent) {
        return false;
    }

    if (!looksLikeFlattenedFunctionBodyLine(trimmed)) {
        return false;
    }

    current.sawBody = true;
    current.recoveredFlattenedBody = true;
    result.push(`${" ".repeat((indent / indentSize + 1) * indentSize)}${trimmed}`);
    return true;
}

function tryRecoverFlattenedFunctionCommentLine(
    result: string[],
    stack: ColonBlockStackEntry[],
    indent: number,
    trimmed: string,
    indentSize: number
): boolean {
    const current = stack[stack.length - 1];
    if (
        !current ||
        current.kind !== "function" ||
        !current.recoveredFlattenedBody ||
        indent !== current.headerIndent
    ) {
        return false;
    }

    result.push(`${" ".repeat((indent / indentSize + 1) * indentSize)}${trimmed}`);
    return true;
}

function looksLikeFlattenedFunctionBodyLine(trimmed: string): boolean {
    if (trimmed.length === 0 || trimmed.startsWith("}")) {
        return false;
    }

    const colonHeader = trimmed.endsWith(":") ? trimmed.slice(0, -1).trimEnd() : trimmed;
    if (
        looksLikeFunctionHeader(trimmed) ||
        looksLikeCompositeHeader(trimmed) ||
        looksLikeCompositeHeader(colonHeader)
    ) {
        return false;
    }

    if (
        /^(?:var|set|return|if|for|case|loop|block|defer|sync|race|rush|branch|spawn)\b/.test(
            trimmed
        )
    ) {
        return true;
    }

    if (/^[A-Za-z_][A-Za-z0-9_]*\s*(?::|:=|=)/.test(trimmed)) {
        return true;
    }

    return false;
}

function convertedHeaderKind(converted: string): ColonBlockStackEntry["kind"] {
    return looksLikeFunctionHeader(converted.replace(/\{\s*$/, "").trimEnd())
        ? "function"
        : "block";
}

function startMultilineHeader(
    trimmed: string,
    indent: number,
    settings: ResolvedFormatterOptions
): PendingMultilineHeader | null {
    const parts = splitLineComment(trimmed);
    const code = parts.code.trimEnd();
    if (code.endsWith(":")) {
        return null;
    }

    const normalizedCode = normalizeCodeSpacing(code, settings);
    if (!isExpressionBlockHeader(normalizedCode)) {
        return null;
    }

    const groupingDepth = countGroupingDelta(code);
    if (groupingDepth <= 0) {
        return null;
    }

    return {
        groupingDepth,
        headerIndent: indent
    };
}

function convertPendingMultilineHeaderLine(
    trimmed: string,
    pending: PendingMultilineHeader,
    settings: ResolvedFormatterOptions
): { abandoned: boolean; finished: boolean; groupingDepth: number; line: string } {
    const parts = splitLineComment(trimmed);
    const code = parts.code.trimEnd();
    const headerTerminator = code.endsWith(":");
    const codeWithoutColon = headerTerminator ? code.slice(0, -1).trimEnd() : code;
    const groupingDepth = Math.max(0, pending.groupingDepth + countGroupingDelta(codeWithoutColon));

    if (headerTerminator && groupingDepth === 0) {
        const suffix = parts.comment ? ` ${parts.comment}` : "";
        return {
            abandoned: false,
            finished: true,
            groupingDepth,
            line: `${normalizeCodeSpacing(codeWithoutColon, settings)} {${suffix}`
        };
    }

    return {
        abandoned: !headerTerminator && groupingDepth === 0,
        finished: false,
        groupingDepth,
        line: trimmed
    };
}

function markBodyLine(stack: ColonBlockStackEntry[], indent: number): void {
    if (stack.length === 0) {
        return;
    }

    const current = stack[stack.length - 1];
    if (indent > current.headerIndent) {
        current.sawBody = true;
    }
}

function closeFinishedColonBlocks(
    result: string[],
    stack: ColonBlockStackEntry[],
    currentIndent: number,
    currentTrimmed: string
): void {
    while (stack.length > 0 && currentIndent <= stack[stack.length - 1].headerIndent) {
        closeGeneratedBlock(result, stack.pop() as ColonBlockStackEntry, currentTrimmed);
    }
}

function closeGeneratedBlock(
    result: string[],
    finished: ColonBlockStackEntry,
    currentTrimmed: string
): void {
    const removedBlankLines = removeTrailingBlankLines(result);
    if (!finished.sawBody && canCollapseEmptyGeneratedBlock(result[finished.resultIndex])) {
        result[finished.resultIndex] = result[finished.resultIndex].replace(/\{\s*$/, "{}");
    } else {
        result.push(`${" ".repeat(finished.headerIndent)}}`);
    }

    if (removedBlankLines > 0 && shouldMoveBlankAfterGeneratedClose(currentTrimmed)) {
        result.push("");
    }
}

function canCollapseEmptyGeneratedBlock(line: string | undefined): boolean {
    return Boolean(line && /\{\s*$/.test(line) && !splitLineComment(line).comment);
}

function shouldMoveBlankAfterGeneratedClose(currentTrimmed: string): boolean {
    if (!currentTrimmed) {
        return false;
    }

    if (currentTrimmed.startsWith("}")) {
        return false;
    }

    return !isContinuationHeader(currentTrimmed);
}

function isCommentOnlyLine(trimmed: string): boolean {
    const parts = splitLineComment(trimmed);
    return parts.code.trim().length === 0 && parts.comment.length > 0;
}

function nearestSourceCodeIndent(
    lines: string[],
    startIndex: number,
    endIndex: number,
    indentSize: number
): number | null {
    for (let distance = 1; distance < lines.length; distance += 1) {
        const belowIndex = endIndex + distance;
        if (belowIndex < lines.length && isSourceCodeLine(lines[belowIndex], indentSize)) {
            return countLeadingSpaces(expandTabs(lines[belowIndex], indentSize));
        }

        const aboveIndex = startIndex - distance;
        if (aboveIndex >= 0 && isSourceCodeLine(lines[aboveIndex], indentSize)) {
            return countLeadingSpaces(expandTabs(lines[aboveIndex], indentSize));
        }

        if (belowIndex >= lines.length && aboveIndex < 0) {
            break;
        }
    }

    return null;
}

function nextSourceCodeIndent(
    lines: string[],
    endIndex: number,
    indentSize: number
): number | null {
    for (let index = endIndex + 1; index < lines.length; index += 1) {
        if (isSourceCodeLine(lines[index], indentSize)) {
            return countLeadingSpaces(expandTabs(lines[index], indentSize));
        }
    }

    return null;
}

function collectStandaloneBlockComment(
    lines: string[],
    startIndex: number,
    indentSize: number
): { endIndex: number; lines: string[] } | null {
    const expandedStart = expandTabs(lines[startIndex], indentSize).trimEnd();
    const trimmedStart = expandedStart.trim();
    if (!trimmedStart.startsWith("<#")) {
        return null;
    }

    if (trimmedStart.includes("#>")) {
        return { endIndex: startIndex, lines: [expandedStart] };
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

function isSourceCodeLine(line: string, indentSize: number): boolean {
    const trimmed = expandTabs(line, indentSize).trim();
    if (trimmed.length === 0 || trimmed.startsWith("<#")) {
        return false;
    }

    return !isCommentOnlyLine(trimmed);
}

function tryMergeContinuationHeader(result: string[], converted: string, indent: number): boolean {
    const trimmedConverted = converted.trim();
    if (!isContinuationHeader(trimmedConverted)) {
        return false;
    }

    if (result.length === 0) {
        return false;
    }

    const previous = result[result.length - 1];
    if (previous !== `${" ".repeat(indent)}}`) {
        return false;
    }

    result[result.length - 1] = `${previous} ${trimmedConverted}`;
    return true;
}

function tryMergeDanglingExpressionHeader(
    result: string[],
    converted: string,
    indent: number
): boolean {
    const trimmedConverted = converted.trim();
    if (!isExpressionBlockHeader(trimmedConverted)) {
        return false;
    }

    const previousIndex = previousNonBlankLineIndex(result);
    if (previousIndex === -1) {
        return false;
    }

    const previous = result[previousIndex].trimEnd();
    const previousIndent = countLeadingSpaces(previous);
    if (previousIndent >= indent || !isDanglingExpressionPrefix(previous)) {
        return false;
    }

    removeTrailingBlankLines(result);
    result[result.length - 1] = `${previous} ${trimmedConverted}`;
    return true;
}

function previousNonBlankLineIndex(lines: string[]): number {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
        if (lines[index].trim().length > 0) {
            return index;
        }
    }

    return -1;
}

function isExpressionBlockHeader(trimmed: string): boolean {
    return /^(?:if|for|case|block|defer|loop|sync|race|rush|branch|spawn)\b/.test(trimmed);
}

function isDanglingExpressionPrefix(line: string): boolean {
    if (line.endsWith("=>")) {
        return true;
    }

    if (line.endsWith(":=")) {
        return true;
    }

    if (!line.endsWith("=")) {
        return false;
    }

    const beforeEquals = line.at(-2) ?? "";
    return !"<>=!+-*/".includes(beforeEquals);
}

function convertDanglingCaseArm(
    trimmed: string,
    settings: ResolvedFormatterOptions
): string | null {
    const parts = splitLineComment(trimmed);
    const code = parts.code.trimEnd();
    if (!code.endsWith("=>")) {
        return null;
    }

    const suffix = parts.comment ? ` ${parts.comment}` : "";
    return `${normalizeCodeSpacing(code, settings)} block {${suffix}`;
}

export function convertColonHeader(
    trimmed: string,
    settings: ResolvedFormatterOptions = resolveFormatterOptions()
): string | null {
    const parts = splitLineComment(trimmed);
    const code = parts.code.trimEnd();
    if (!code.endsWith(":")) {
        return convertEqualsFunctionHeader(trimmed, settings);
    }

    const beforeColon = normalizeCodeSpacing(code.slice(0, -1).trimEnd(), settings);
    if (!isConvertibleColonHeader(beforeColon)) {
        return null;
    }

    const suffix = parts.comment ? ` ${parts.comment}` : "";
    return `${beforeColon} {${suffix}`;
}

function convertEqualsFunctionHeader(
    trimmed: string,
    settings: ResolvedFormatterOptions
): string | null {
    const parts = splitLineComment(trimmed);
    const code = parts.code.trimEnd();
    if (!code.endsWith("=")) {
        return null;
    }

    const normalizedCode = normalizeCodeSpacing(code, settings);
    if (!looksLikeFunctionHeader(normalizedCode)) {
        return null;
    }

    const suffix = parts.comment ? ` ${parts.comment}` : "";
    return `${normalizedCode} {${suffix}`;
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

    return isRecognizedColonBlockHeader(header);
}

function looksLikeDigestOnlyMacroHeader(header: string): boolean {
    return /(?:^|(?:=|:=)\s*)external$/.test(header);
}

function looksLikeUsingHeader(header: string): boolean {
    return /^using\b/.test(header);
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
