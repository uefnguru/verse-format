import { BRACED_BLOCK_WORDS } from "./rules";
import { type ResolvedFormatterOptions, resolveFormatterOptions } from "./options";
import { splitLineComment } from "./scanner";

export interface ProtectedSegmentData {
    text: string;
    segments: string[];
}

const PROTECTED_TOKEN_PREFIX = "\u0000VERSE_PROTECTED_";
const PROTECTED_TOKEN_SUFFIX = "\u0000";

export function normalizeInlineSpacing(
    line: string,
    settings: ResolvedFormatterOptions = resolveFormatterOptions()
): string {
    const trimmed = line.trim();
    if (trimmed.startsWith("<#")) {
        return line;
    }

    const parts = splitLineComment(line);
    const code = parts.code.trimEnd();
    const comment = parts.comment.trimStart();

    if (code.trim().length === 0) {
        return comment || "";
    }

    const normalizedCode = normalizeCodeSpacing(code, settings).trimEnd();
    return comment ? `${normalizedCode} ${comment}` : normalizedCode;
}

export function normalizeCodeSpacing(
    code: string,
    settings: ResolvedFormatterOptions = resolveFormatterOptions()
): string {
    if (/^using\s*\{/.test(code.trim())) {
        return normalizeUsingSpacing(code, settings);
    }

    const protectedCode = protectSegments(code, settings);
    let result = protectedCode.text;

    result = result.replace(/[ \t]+/g, " ");
    result = normalizeOperatorSpacing(result);
    result = result.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\s+\(/g, "$1(");
    result = result.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\s+\[/g, "$1[");
    result = result.replace(/\(\s+/g, "(");
    result = result.replace(/\s+\)/g, ")");
    result = result.replace(/\[\s+/g, "[");
    result = result.replace(/\s+\]/g, "]");
    result = result.replace(/\s*,\s*/g, ", ");
    result = normalizeTypeSpacing(result, settings);
    result = result.replace(/\belse\s+if\s*\(/g, "else if(");
    result = result.replace(/\b(if|for|case|class|struct|interface|enum)\s*\(/g, "$1(");
    result = result.replace(/(@[A-Za-z_][A-Za-z0-9_]*(?:\([^)]*\))?)\s*\{/g, "$1 {");
    result = result.replace(/\}\s*else\b/g, "} else");
    result = result.replace(/\b(else|then)\s*\{/g, "$1 {");
    result = result.replace(/\)\s*\{/g, ") {");
    result = result.replace(
        /(?<!@)\b([A-Za-z_][A-Za-z0-9_]*)\s*\{/g,
        (match, word, offset, fullText) => {
            if (word === "array" || word === "option") {
                return `${word}{`;
            }

            if (word === "external") {
                return `${word} {`;
            }

            if (settings.spacingStyle === "dense" && word === "type") {
                return `${word} {`;
            }

            if (
                BRACED_BLOCK_WORDS.has(word) ||
                isMultilineConstructionBrace(fullText, offset + match.length)
            ) {
                return `${word} {`;
            }

            return `${word}{`;
        }
    );
    result = result.replace(
        /(?<!@)\b((?!using\b|external\b|type\b)[A-Za-z_][A-Za-z0-9_]*)\{\s*([^{}\n]*?)\s*\}/g,
        (_match, word, body) => {
            return `${word}{${body.trim()}}`;
        }
    );
    result = result.replace(/\bexternal\s*\{\s*([^{}\n]*?)\s*\}/g, (_match, body) => {
        return `external {${body.trim()}}`;
    });
    if (settings.spacingStyle === "dense") {
        result = result.replace(/\btype\s*\{\s*([^{}\n]*?)\s*\}/g, (_match, body) => {
            return `type {${body.trim()}}`;
        });
    }
    result = result.replace(/\{\s+$/g, "{");
    result = result.trim();

    return restoreSegments(result, protectedCode.segments);
}

export function normalizeUsingSpacing(
    code: string,
    settings: ResolvedFormatterOptions = resolveFormatterOptions()
): string {
    if (settings.spacingStyle === "dense") {
        return code
            .trim()
            .replace(/^using\s*\{\s*/, "using {")
            .replace(/\s*\}\s*$/, "}");
    }

    return code
        .trim()
        .replace(/^using\s*\{\s*/, "using { ")
        .replace(/\s*\}\s*$/, " }");
}

function isMultilineConstructionBrace(text: string, endOffset: number): boolean {
    return text.slice(endOffset).trim().length === 0;
}

export function normalizeOperatorSpacing(code: string): string {
    const arrowToken = "\u0000VERSE_ARROW_OPERATOR\u0000";
    let result = code.replace(/\s*-\s*>\s*/g, ` ${arrowToken} `);

    result = result.replace(/(\b\d+(?:\.\d+)?[eE])\s*([+-])\s*(\d)/g, "$1$2$3");
    result = result.replace(/\s*:=\s*/g, " := ");
    result = result.replace(/\s*=>\s*/g, " => ");
    result = result.replace(/\s*([+\-*/])\s*=\s*/g, " $1= ");
    result = result.replace(/\s*(<>|<=|>=)\s*/g, " $1 ");
    result = result.replace(/(?<![:<>=!+\-*/])\s*=\s*(?![=>])/g, " = ");
    result = normalizeSingleAngleOperatorSpacing(result);
    result = normalizeArithmeticOperatorSpacing(result);
    result = result.replace(/\s+\?/g, "?");
    result = result.replace(/\?\s+/g, "?");
    result = result.replace(/[ \t]+/g, " ");
    result = result.replace(new RegExp(`\\s*${arrowToken}\\s*`, "g"), " -> ");

    return result;
}

function normalizeSingleAngleOperatorSpacing(code: string): string {
    let result = "";
    let index = 0;

    while (index < code.length) {
        const char = code[index];
        if (char === "<" && isSingleLessThanOperator(code, index)) {
            result = result.trimEnd();
            result += " < ";
            index = nextNonWhitespaceIndex(code, index + 1);
            continue;
        }

        if (char === ">" && isSingleGreaterThanOperator(code, index)) {
            result = result.trimEnd();
            result += " > ";
            index = nextNonWhitespaceIndex(code, index + 1);
            continue;
        }

        result += char;
        index += 1;
    }

    return result;
}

function isSingleLessThanOperator(source: string, index: number): boolean {
    const next = source[index + 1];
    if (next === "=" || next === ">" || next === "#") {
        return false;
    }

    if (looksLikeAngleSpecifier(source, index)) {
        return false;
    }

    return hasOperandBefore(source, index) && hasOperandAfter(source, index);
}

function isSingleGreaterThanOperator(source: string, index: number): boolean {
    const next = source[index + 1];
    if (next === "=") {
        return false;
    }

    if (closesAngleSpecifier(source, index)) {
        return false;
    }

    return hasOperandBefore(source, index) && hasOperandAfter(source, index);
}

function looksLikeAngleSpecifier(source: string, index: number): boolean {
    return /^<[A-Za-z_][A-Za-z0-9_]*>/.test(source.slice(index));
}

function closesAngleSpecifier(source: string, index: number): boolean {
    let wordStart = index - 1;
    while (wordStart >= 0 && /[A-Za-z0-9_]/.test(source[wordStart])) {
        wordStart -= 1;
    }

    return wordStart >= 0 && source[wordStart] === "<" && wordStart + 1 < index;
}

function hasOperandBefore(source: string, index: number): boolean {
    const previousIndex = previousNonWhitespaceIndex(source, index - 1);
    return previousIndex >= 0 && /[A-Za-z0-9_)\]}"']/.test(source[previousIndex]);
}

function hasOperandAfter(source: string, index: number): boolean {
    const nextIndex = nextNonWhitespaceIndex(source, index + 1);
    return nextIndex < source.length && /[A-Za-z0-9_(\["'?+-]/.test(source[nextIndex]);
}

export function normalizeTypeSpacing(
    code: string,
    settings: ResolvedFormatterOptions = resolveFormatterOptions()
): string {
    let result = code;

    const colonReplacement = settings.spacingStyle === "dense" ? "$1:" : "$1: ";
    const suffixColonReplacement = settings.spacingStyle === "dense" ? "$1:" : "$1: ";

    result = result.replace(
        /(\??[A-Za-z_][A-Za-z0-9_]*)\s*:\s*(?=[?\[\]A-Za-z_])/g,
        colonReplacement
    );
    result = result.replace(/([)\]>])\s*:\s*(?!=)/g, suffixColonReplacement);
    result = result.replace(new RegExp(`:\\s+(${protectedTokenPattern()})`, "g"), ":$1");
    if (settings.spacingStyle === "wide") {
        result = result.replace(/:\s+void\b/g, ": void");
        result = result.replace(/:\s+message\b/g, ": message");
    } else {
        result = result.replace(
            new RegExp(`:\\s+(?=[A-Za-z_?\\[\\](/]|${protectedTokenPattern()})`, "g"),
            ":"
        );
    }
    result = result.replace(/\s+=\s+\{/g, " = {");

    return result;
}

function protectSegments(code: string, settings: ResolvedFormatterOptions): ProtectedSegmentData {
    const commentProtected = protectBlockComments(code, []);
    const stringProtected = protectQuotedLiterals(
        commentProtected.text,
        settings,
        commentProtected.segments
    );
    return protectParenthesizedVersePaths(stringProtected.text, stringProtected.segments);
}

function protectQuotedLiterals(
    code: string,
    settings: ResolvedFormatterOptions,
    segments: string[] = []
): ProtectedSegmentData {
    let output = "";
    let index = 0;

    while (index < code.length) {
        const quote = code[index];
        if (quote !== '"' && quote !== "'") {
            output += code[index];
            index += 1;
            continue;
        }

        const start = index;
        index += 1;
        let escaped = false;

        while (index < code.length) {
            const char = code[index];
            index += 1;

            if (escaped) {
                escaped = false;
            } else if (char === "\\") {
                escaped = true;
            } else if (char === quote) {
                break;
            }
        }

        const token = createProtectedToken(segments.length);
        const literal = code.slice(start, index);
        segments.push(quote === '"' ? formatStringLiteral(literal, settings) : literal);
        output += token;
    }

    return { text: output, segments };
}

function protectBlockComments(code: string, segments: string[]): ProtectedSegmentData {
    let output = "";
    let index = 0;
    let quote: '"' | "'" | null = null;
    let escaped = false;

    while (index < code.length) {
        const char = code[index];

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

        if (code[index] !== "<" || code[index + 1] !== "#") {
            output += char;
            index += 1;
            continue;
        }

        const start = index;
        const closeIndex = code.indexOf("#>", index + 2);
        index = closeIndex === -1 ? code.length : closeIndex + 2;

        const token = createProtectedToken(segments.length);
        segments.push(code.slice(start, index));
        output += token;
    }

    return { text: output, segments };
}

function protectParenthesizedVersePaths(code: string, segments: string[]): ProtectedSegmentData {
    const text = code.replace(
        /\(\/[A-Za-z0-9_.]+(?:\/[A-Za-z0-9_.]+)*(?::[A-Za-z0-9_.]+)*:\)/g,
        (match) => {
            const token = createProtectedToken(segments.length);
            segments.push(match);
            return token;
        }
    );

    return { text, segments };
}

function formatStringLiteral(literal: string, settings: ResolvedFormatterOptions): string {
    if (!literal.startsWith('"') || literal.length < 2) {
        return literal;
    }

    let output = '"';
    let index = 1;
    const end = literal.endsWith('"') ? literal.length - 1 : literal.length;

    while (index < end) {
        const char = literal[index];

        if (char === "\\") {
            output += literal.slice(index, Math.min(index + 2, end));
            index += 2;
            continue;
        }

        if (char !== "{") {
            output += char;
            index += 1;
            continue;
        }

        const closeIndex = findInterpolationClose(literal, index + 1, end);
        if (closeIndex === -1) {
            output += char;
            index += 1;
            continue;
        }

        const expression = literal.slice(index + 1, closeIndex);
        output += `{${formatInterpolationExpression(expression, settings)}}`;
        index = closeIndex + 1;
    }

    if (literal.endsWith('"')) {
        output += '"';
    }

    return output;
}

function findInterpolationClose(literal: string, start: number, end: number): number {
    let depth = 0;

    for (let index = start; index < end; index += 1) {
        const char = literal[index];

        if (char === "\\") {
            index += 1;
            continue;
        }

        if (char === "{") {
            depth += 1;
            continue;
        }

        if (char === "}") {
            if (depth === 0) {
                return index;
            }
            depth -= 1;
        }
    }

    return -1;
}

function formatInterpolationExpression(
    expression: string,
    settings: ResolvedFormatterOptions
): string {
    return normalizeCodeSpacing(expression, settings).trim();
}

function restoreSegments(code: string, segments: string[]): string {
    let result = code;

    segments.forEach((value, index) => {
        result = result.replace(createProtectedToken(index), () => value);
    });

    return result;
}

function normalizeArithmeticOperatorSpacing(code: string): string {
    let result = "";
    let index = 0;

    while (index < code.length) {
        const char = code[index];
        if (!"+-*/".includes(char) || code[index + 1] === "=") {
            result += char;
            index += 1;
            continue;
        }

        if ((char === "+" || char === "-") && isNumberLiteralSign(code, result, index)) {
            result += char;
            index = nextNonWhitespaceIndex(code, index + 1);
            continue;
        }

        result = result.trimEnd();
        result += ` ${char} `;
        index = nextNonWhitespaceIndex(code, index + 1);
    }

    return result;
}

function isNumberLiteralSign(source: string, outputBeforeSign: string, signIndex: number): boolean {
    const nextIndex = nextNonWhitespaceIndex(source, signIndex + 1);
    if (!startsNumberLiteral(source, nextIndex)) {
        return false;
    }

    if (isExponentSign(source, signIndex, nextIndex)) {
        return true;
    }

    const previous = previousNonWhitespace(outputBeforeSign);
    if (!previous) {
        return true;
    }

    if ("({[,=:+-*/<>".includes(previous)) {
        return true;
    }

    const previousWord = outputBeforeSign.match(/[A-Za-z_][A-Za-z0-9_]*\s*$/)?.[0].trim();
    return previousWord === "return";
}

function startsNumberLiteral(source: string, index: number): boolean {
    const char = source[index];
    if (/\d/.test(char)) {
        return true;
    }

    return char === "." && /\d/.test(source[index + 1] ?? "");
}

function isExponentSign(source: string, signIndex: number, nextIndex: number): boolean {
    if (!/\d/.test(source[nextIndex] ?? "")) {
        return false;
    }

    const exponentIndex = previousNonWhitespaceIndex(source, signIndex - 1);
    if (!/[eE]/.test(source[exponentIndex] ?? "")) {
        return false;
    }

    const numberIndex = previousNonWhitespaceIndex(source, exponentIndex - 1);
    return /\d/.test(source[numberIndex] ?? "");
}

function nextNonWhitespaceIndex(source: string, index: number): number {
    while (index < source.length && /\s/.test(source[index])) {
        index += 1;
    }

    return index;
}

function previousNonWhitespaceIndex(source: string, index: number): number {
    while (index >= 0 && /\s/.test(source[index])) {
        index -= 1;
    }

    return index;
}

function previousNonWhitespace(source: string): string | null {
    const index = previousNonWhitespaceIndex(source, source.length - 1);
    return index >= 0 ? source[index] : null;
}

function createProtectedToken(index: number): string {
    return `${PROTECTED_TOKEN_PREFIX}${index}${PROTECTED_TOKEN_SUFFIX}`;
}

function protectedTokenPattern(): string {
    return `${PROTECTED_TOKEN_PREFIX}\\d+${PROTECTED_TOKEN_SUFFIX}`;
}
