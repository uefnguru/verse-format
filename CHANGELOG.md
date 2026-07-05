# Changelog

## 0.0.2

- Keep empty construction and container expressions braced by default when formatting colon block style, including forms such as `volume_device{}`, `array{}`, and `map{}`.
- Add `verseFormat.emptyConstructionStyle` so users can opt into the previous colon conversion for empty constructions when using colon block style.
- Fix colon-style regressions for tuple-parameter callbacks, multiline array returns, empty function bodies, adjacent function declarations, and `SetAnimation` calls.
- Expand formatter fixtures and UEFN compile coverage for the reported colon-style edge cases.

## 0.0.1

Initial public release.

- Format Verse files in braced or colon/indentation block style.
- Configure wide or dense spacing.
- Wrap multi-property construction expressions, attribute blocks, and arrays.
- Preserve Verse delimiter meanings for failable calls, construction expressions, imports, options, and specifiers.
- Register `.verse` files for formatting in VS Code.
- Use the `verseFormat.*` settings namespace.
