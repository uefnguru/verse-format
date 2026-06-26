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
    return /^[A-Za-z_][A-Za-z0-9_]*(?:<[^>]+>)*\s*\([^)]*\)(?:<[^>]+>)*\s*:\s*[^=]+=$/.test(code);
}
