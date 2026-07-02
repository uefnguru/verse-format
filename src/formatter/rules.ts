export const BLOCK_KEYWORDS = new Set<string>([
    "block",
    "branch",
    "defer",
    "loop",
    "race",
    "rush",
    "spawn",
    "sync",
    "then"
]);

export const BRACED_BLOCK_WORDS = new Set<string>([
    "block",
    "branch",
    "case",
    "class",
    "defer",
    "else",
    "enum",
    "for",
    "if",
    "interface",
    "loop",
    "module",
    "race",
    "rush",
    "spawn",
    "struct",
    "sync",
    "then",
    "using"
]);

export function isContinuationHeader(trimmed: string): boolean {
    return /^(else|then)\b/.test(trimmed);
}

export function isRecognizedColonBlockHeader(header: string): boolean {
    if (BLOCK_KEYWORDS.has(header)) {
        return true;
    }

    if (/^@[A-Za-z_][A-Za-z0-9_]*(?:\([^)]*\))?$/.test(header)) {
        return true;
    }

    if (/^if(?:\s*\(|\s*$)/.test(header)) {
        return true;
    }

    if (/^else(?:\s+if(?:\s*\(|\s+).*)?$/.test(header)) {
        return true;
    }

    if (/^}+\s*else(?:\s+if(?:\s*\(|\s+).*)?$/.test(header)) {
        return true;
    }

    if (/^}+\s*then$/.test(header)) {
        return true;
    }

    if (/^for\s*\(/.test(header)) {
        return true;
    }

    if (/^case\s*\(/.test(header)) {
        return true;
    }

    if (looksLikeCompositeHeader(header)) {
        return true;
    }

    if (looksLikeConstructionHeader(header)) {
        return true;
    }

    if (looksLikeStandaloneConstructionHeader(header)) {
        return true;
    }

    return false;
}

export function looksLikeCompositeHeader(header: string): boolean {
    return /:=\s*(?:class|module|struct|interface|enum)(?:<[^>]+>)*(?:\(.*\))?$/.test(header);
}

export function looksLikeConstructionHeader(header: string): boolean {
    return /(?:=|:=|=>)\s*(?:[A-Za-z_][A-Za-z0-9_]*(?:\([^)]*\))?|\(\/[A-Za-z0-9_.]+(?:\/[A-Za-z0-9_.]+)*(?::[A-Za-z0-9_.]+)*:\)[A-Za-z_][A-Za-z0-9_]*)$/.test(
        header
    );
}

export function looksLikeStandaloneConstructionHeader(header: string): boolean {
    return /^(?:[a-z][A-Za-z0-9_]*(?:\([^)]*\))?|\(\/[A-Za-z0-9_.]+(?:\/[A-Za-z0-9_.]+)*(?::[A-Za-z0-9_.]+)*:\)[A-Za-z_][A-Za-z0-9_]*)$/.test(
        header
    );
}

export function looksLikeFunctionHeader(code: string): boolean {
    const trimmed = code.trim();
    if (!trimmed.endsWith("=")) {
        return false;
    }

    const header = trimmed.slice(0, -1).trimEnd();
    let index = 0;
    const name = header.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (!name) {
        return false;
    }

    index += name[0].length;
    index = consumeAngleGroups(header, index);
    index = nextNonWhitespaceIndex(header, index);
    if (header[index] !== "(") {
        return false;
    }

    index = consumeBalancedGroup(header, index, "(", ")");
    if (index === -1) {
        return false;
    }

    index = consumeAngleGroups(header, index);
    index = nextNonWhitespaceIndex(header, index);
    if (header[index] !== ":") {
        return false;
    }

    return header.slice(index + 1).trim().length > 0;
}

function consumeAngleGroups(source: string, startIndex: number): number {
    let index = nextNonWhitespaceIndex(source, startIndex);
    while (source[index] === "<") {
        index = consumeBalancedGroup(source, index, "<", ">");
        if (index === -1) {
            return source.length;
        }
        index = nextNonWhitespaceIndex(source, index);
    }

    return index;
}

function consumeBalancedGroup(
    source: string,
    startIndex: number,
    open: string,
    close: string
): number {
    let depth = 0;
    let quote: '"' | "'" | null = null;
    let escaped = false;

    for (let index = startIndex; index < source.length; index += 1) {
        const char = source[index];

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

        if (char === open) {
            depth += 1;
        } else if (char === close) {
            depth -= 1;
            if (depth === 0) {
                return index + 1;
            }
        }
    }

    return -1;
}

function nextNonWhitespaceIndex(source: string, startIndex: number): number {
    let index = startIndex;
    while (index < source.length && /\s/.test(source[index])) {
        index += 1;
    }

    return index;
}
