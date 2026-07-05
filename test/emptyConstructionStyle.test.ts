import { testFormat } from "./helpers";

const issueExample = [
    "test_device:= class(creative_device):",
    "    @editable",
    "    ShowVolume : volume_device = volume_device{}",
    "",
    "    @editable",
    "    Curve : editable_curve = editable_curve{}",
    "    ",
    "    # Reference to a UMG widget.",
    "    RootWidget : widget = MyFolder.W_MyWidget{}"
].join("\n");

testFormat(
    "keeps empty construction expressions braced in colon style by default",
    issueExample,
    [
        "test_device := class(creative_device):",
        "    @editable",
        "    ShowVolume: volume_device = volume_device{}",
        "",
        "    @editable",
        "    Curve: editable_curve = editable_curve{}",
        "",
        "    # Reference to a UMG widget.",
        "    RootWidget: widget = MyFolder.W_MyWidget{}",
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);

testFormat(
    "converts empty construction expressions to colon style when configured",
    issueExample,
    [
        "test_device := class(creative_device):",
        "    @editable",
        "    ShowVolume: volume_device = volume_device:",
        "",
        "    @editable",
        "    Curve: editable_curve = editable_curve:",
        "",
        "    # Reference to a UMG widget.",
        "    RootWidget: widget = MyFolder.W_MyWidget{}",
        ""
    ].join("\n"),
    { blockStyle: "colon", emptyConstructionStyle: "colon" }
);

testFormat(
    "ignores empty construction style when braced block style is selected",
    [
        "test_device:= class(creative_device) {",
        "    ShowVolume : volume_device = volume_device{}",
        "}"
    ].join("\n"),
    [
        "test_device := class(creative_device) {",
        "    ShowVolume: volume_device = volume_device{}",
        "}",
        ""
    ].join("\n"),
    { blockStyle: "braced", emptyConstructionStyle: "colon" }
);

testFormat(
    "still converts non-empty construction blocks to colon style",
    [
        "profile := class {",
        '    Name: string = ""',
        "}",
        "",
        "MakeProfile(): profile = {",
        "    profile {",
        '        Name := "Alpha"',
        "    }",
        "}"
    ].join("\n"),
    [
        "profile := class:",
        '    Name: string = ""',
        "",
        "MakeProfile(): profile =",
        "    profile:",
        '        Name := "Alpha"',
        ""
    ].join("\n"),
    { blockStyle: "colon" }
);
