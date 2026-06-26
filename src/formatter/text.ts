export function expandTabs(line: string, indentSize: number): string {
    let output = "";
    let column = 0;

    for (const char of line) {
        if (char === "\t") {
            const spaces = indentSize - (column % indentSize);
            output += " ".repeat(spaces);
            column += spaces;
        } else {
            output += char;
            column += 1;
        }
    }

    return output;
}

export function countLeadingSpaces(line: string): number {
    const match = line.match(/^ */);
    return match ? match[0].length : 0;
}

export function removeTrailingBlankLines(lines: string[]): number {
    let removed = 0;
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
        lines.pop();
        removed += 1;
    }
    return removed;
}

export function normalizeLineEndings(text: string): string {
    return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function trimTrailingBlankLines(lines: string[]): string[] {
    const trimmed = [...lines];
    while (trimmed.length > 0 && trimmed[trimmed.length - 1].trim() === "") {
        trimmed.pop();
    }
    return trimmed;
}
