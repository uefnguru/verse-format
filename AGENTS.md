# Agent Instructions

This repository is close to public release. Keep changes small, deliberate, and easy to review.

## Product Shape

- The public extension name is `Verse Format`; avoid calling the formatter or default style "C-style".
- Describe block styles as `braced` and `colon`.
- The README is user-facing and appears in VS Code. Keep it focused on what the extension does, settings, format-on-save, and limitations.
- Put maintainer setup, tests, release steps, and UEFN bridge details in `DEVELOPMENT.md`.

## Code

- Prefer existing formatter modules and patterns over new abstractions.
- The formatter is conservative by design. If a Verse construct is not recognized, preserve it rather than guessing.
- Keep public configuration small. Do not add new settings unless they solve a real user-facing need.
- Keep indentation fixed at four spaces unless the project explicitly decides otherwise.
- Do not add generated comments, AI references, broad rewrites, or unrelated cleanup.

## Tests

- Run `pnpm test` after formatter changes.
- Run `pnpm run format:check` for changed TypeScript, JSON, and Markdown files.
- Run `pnpm run package` after manifest, README, packaging, or `.vscodeignore` changes.
- Use `pnpm run test:uefn` before release or after risky syntax-changing behavior when a live UEFN project is available.

## Fixtures

- Keep Verse fixtures small and public-safe.
- Add or update all four style references when fixture behavior changes: braced-wide, colon-wide, braced-dense, and colon-dense.
- Preserve round-trip/idempotence expectations in `test/fixtureReferences.test.ts`.

## Packaging

- Do not commit `out/`, `node_modules/`, `.vsix` files, local corpora, or personal review notes.
- Keep internal development docs and agent instructions out of the VSIX unless the project intentionally changes `.vscodeignore`.
- Before publishing, confirm the built VSIX contains only package metadata, README, changelog, license, and compiled output.
