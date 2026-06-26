# Development

Verse Format is a VS Code extension with no runtime npm dependencies. The extension entrypoint is `src/extension.ts`; the formatter core lives under `src/formatter/`; tests and reference fixtures live under `test/`.

## Setup

Install dependencies with pnpm:

```powershell
pnpm install
```

Compile:

```powershell
pnpm run compile
```

Run unit and fixture tests:

```powershell
pnpm test
```

Check formatting:

```powershell
pnpm run format:check
```

Package a local VSIX:

```powershell
pnpm run package
```

To try the extension in VS Code, open this repository and press `F5` to launch the Extension Development Host. VS Code runs the compiled extension entrypoint from `out/extension.js`, so compile first with `pnpm run compile`, or keep `pnpm run watch` running while you edit. The current launch configuration does not run a compile task automatically.

## Fixtures

Tracked Verse fixtures are under `test/verse-fixtures/`. Each single-file fixture has:

- `original.verse`
- `braced-wide.verse`
- `colon-wide.verse`
- `braced-dense.verse`
- `colon-dense.verse`

Multi-file fixtures use matching style directories. Keep fixtures small and focused on formatter-sensitive syntax. Run `pnpm test` after changing formatter behavior or fixture references.

## UEFN Compile Testing

The optional UEFN test bridge deploys formatted fixtures into a live UEFN project and asks UEFN to compile them. Use this before release or after risky formatting changes.

Create or open a normal UEFN project first. Then install the bridge by passing either the project folder or the `.uefnproject` file:

```powershell
pnpm run uefn:install-test-bridge -- "C:\path\to\YourProject"
```

or:

```powershell
pnpm run uefn:install-test-bridge -- "C:\path\to\YourProject\YourProject.uefnproject"
```

The installer:

- enables project Python in the `.uefnproject`
- copies `init_unreal.py` and `verse_formatter_test_listener.py` into `Content/Python`
- adds Python bytecode patterns to `.loreignore`

Restart or reload the UEFN project after installing so `Content/Python/init_unreal.py` starts the listener. The listener binds to localhost ports `8785` through `8791` and exposes only restricted test commands. It does not expose arbitrary Python execution.

Run the compile test:

```powershell
pnpm run test:uefn
```

The test formats every tracked fixture to braced and colon styles, deploys the generated `.verse` files into `Content/VerseFormatterCompileTests`, compiles through UEFN, reports compiler errors, and clears the deployed test files. UEFN compile tests are serialized because Verse compilation is project-global.

## Release Checks

Before publishing:

```powershell
pnpm run format:check
pnpm test
pnpm run package
```

Also run `pnpm run test:uefn` when a live UEFN project is available.
