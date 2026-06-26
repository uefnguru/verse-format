vf_strings_comments := module:
    FormatLabel(Value: int): string =
        "Value #{Value}: total {Value + 2 * 3}"

    HashInsideString(): string =
        "not a # comment"

    CommentedBlocks(): void =
        <#
        if(Value = 1) {
            ThisShouldStayCommented()
        }
        #>

        block:
            # Line comments should stay attached.
            if(true?):
                block:

    CharacterIndex(Character: char): int =
        case(Character):
            '#' => 1
            '+' => 2
            '\\' => 3
            _ => 0
