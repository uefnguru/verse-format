import { convertBracedBlocksToColon } from "./formatter/bracedToColon";
import { convertColonBlocks } from "./formatter/colonBlocks";
import { formatVerseDocument } from "./formatter/pipeline";
import {
    isRecognizedColonBlockHeader,
    looksLikeConstructionHeader,
    looksLikeFunctionHeader
} from "./formatter/rules";
import { countCurlyBraceDelta } from "./formatter/scanner";
import { normalizeCodeSpacing } from "./formatter/spacing";

export type {
    FormatterOptions,
    ResolvedFormatterOptions,
    VerseBlockStyle,
    VerseEmptyConstructionStyle,
    VerseSpacingStyle
} from "./formatter/options";
export { formatVerseDocument } from "./formatter/pipeline";

export {
    convertBracedBlocksToColon,
    convertColonBlocks,
    isRecognizedColonBlockHeader,
    looksLikeConstructionHeader,
    looksLikeFunctionHeader,
    countCurlyBraceDelta,
    normalizeCodeSpacing
};

/**
 * @deprecated Prefer importing named internals from focused formatter modules in tests.
 */
export const _private = {
    convertColonBlocks,
    countCurlyBraceDelta,
    isRecognizedColonBlockHeader,
    looksLikeConstructionHeader,
    looksLikeFunctionHeader,
    normalizeCodeSpacing
};
