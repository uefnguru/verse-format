import * as vscode from "vscode";

import { formatVerseDocument } from "./formatter";

export function activate(context: vscode.ExtensionContext): void {
    const selector: vscode.DocumentSelector = [
        { language: "verse", scheme: "file" },
        { language: "verse", scheme: "untitled" }
    ];

    const provider = vscode.languages.registerDocumentFormattingEditProvider(selector, {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            const config = vscode.workspace.getConfiguration("verseFormat", document);
            const formatted = formatVerseDocument(document.getText(), {
                blockStyle: config.get("blockStyle"),
                spacingStyle: config.get("spacingStyle"),
                wrapMultiPropertyConstructions: config.get("wrapMultiPropertyConstructions", true),
                maxInlineConstructionProperties: config.get("maxInlineConstructionProperties", 1),
                maxInlineAttributeProperties: config.get("maxInlineAttributeProperties", 1),
                maxInlineArrayItems: config.get("maxInlineArrayItems", 3),
                finalNewline: config.get("finalNewline", true)
            });

            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );

            return [vscode.TextEdit.replace(fullRange, formatted)];
        }
    });

    context.subscriptions.push(provider);
}

export function deactivate(): void {}
