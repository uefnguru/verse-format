import { formatBracedLines } from "./bracedBlocks";
import { convertBracedBlocksToColon } from "./bracedToColon";
import { convertColonBlocks } from "./colonBlocks";
import { type FormatterOptions, resolveFormatterOptions } from "./options";
import { normalizeLineEndings, trimTrailingBlankLines } from "./text";

export function formatVerseDocument(text: string, options: FormatterOptions = {}): string {
    const settings = resolveFormatterOptions(options);
    const normalizedText = normalizeLineEndings(text);
    const sourceLines = trimTrailingBlankLines(normalizedText.split("\n"));
    if (sourceLines.length === 0) {
        return "";
    }

    const blockReadyLines = convertColonBlocks(sourceLines, settings.indentSize, settings);
    const formatted = formatBracedLines(blockReadyLines, settings.indentSize, settings);
    const styled =
        settings.blockStyle === "colon"
            ? convertBracedBlocksToColon(formatted, settings.indentSize, settings)
            : formatted;
    const body = styled.join("\n").replace(/[ \t]+$/gm, "");
    return settings.finalNewline ? `${body}\n` : body;
}
