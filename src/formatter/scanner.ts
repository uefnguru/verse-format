export interface CommentState {
    inBlockComment: boolean;
}

export interface LineCommentParts {
    code: string;
    comment: string;
}

export function splitLineComment(line: string): LineCommentParts {
    let quote: '"' | "'" | null = null;
    let escaped = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];

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

        if (char === "<" && line[index + 1] === "#") {
            const closeIndex = line.indexOf("#>", index + 2);
            if (closeIndex === -1) {
                break;
            }
            index = closeIndex + 1;
            continue;
        }

        if (char === "#") {
            return {
                code: line.slice(0, index),
                comment: line.slice(index)
            };
        }
    }

    return { code: line, comment: "" };
}

export function countCurlyBraceDelta(line: string, state: CommentState): number {
    let delta = 0;
    let quote: '"' | "'" | null = null;
    let escaped = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const next = line[index + 1];

        if (state.inBlockComment) {
            if (char === "#" && next === ">") {
                state.inBlockComment = false;
                index += 1;
            }
            continue;
        }

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

        if (char === "<" && next === "#") {
            state.inBlockComment = true;
            index += 1;
            continue;
        }

        if (char === "#") {
            break;
        }

        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }

        if (char === "{") {
            delta += 1;
        } else if (char === "}") {
            delta -= 1;
        }
    }

    return delta;
}

export function countGroupingDelta(line: string): number {
    const parts = splitLineComment(line);
    let delta = 0;
    let quote: '"' | "'" | null = null;
    let escaped = false;

    for (let index = 0; index < parts.code.length; index += 1) {
        const char = parts.code[index];

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

        if (char === "(" || char === "[") {
            delta += 1;
        } else if (char === ")" || char === "]") {
            delta -= 1;
        }
    }

    return delta;
}

export function findOpeningBraceForFinalClose(line: string): number {
    const stack: number[] = [];
    let quote: '"' | "'" | null = null;
    let escaped = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const next = line[index + 1];

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

        if (char === "<" && next === "#") {
            const closeIndex = line.indexOf("#>", index + 2);
            if (closeIndex === -1) {
                break;
            }
            index = closeIndex + 1;
            continue;
        }

        if (char === "#") {
            break;
        }

        if (char === "{") {
            stack.push(index);
        } else if (char === "}") {
            const openIndex = stack.pop();
            if (index === line.length - 1) {
                return openIndex ?? -1;
            }
        }
    }

    return -1;
}

export function splitTopLevelComma(text: string): string[] {
    const parts: string[] = [];
    let start = 0;
    let curlyDepth = 0;
    let parenDepth = 0;
    let bracketDepth = 0;
    let quote: '"' | "'" | null = null;
    let escaped = false;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];

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

        if (char === "<" && text[index + 1] === "#") {
            const closeIndex = text.indexOf("#>", index + 2);
            index = closeIndex === -1 ? text.length : closeIndex + 1;
            continue;
        }

        if (char === "#") {
            break;
        }

        if (char === "{") {
            curlyDepth += 1;
        } else if (char === "}") {
            curlyDepth = Math.max(0, curlyDepth - 1);
        } else if (char === "(") {
            parenDepth += 1;
        } else if (char === ")") {
            parenDepth = Math.max(0, parenDepth - 1);
        } else if (char === "[") {
            bracketDepth += 1;
        } else if (char === "]") {
            bracketDepth = Math.max(0, bracketDepth - 1);
        } else if (char === "," && curlyDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
            parts.push(text.slice(start, index));
            start = index + 1;
        }
    }

    parts.push(text.slice(start));
    return parts;
}
