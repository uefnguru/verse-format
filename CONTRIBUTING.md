# Contributing

Thanks for considering a contribution.

Before opening a pull request:

- Keep changes focused and easy to review.
- Run `pnpm test`.
- Run `pnpm run format:check`.
- Add or update fixtures under `test/verse-fixtures/` for formatter behavior changes.
- Update `README.md` only for user-facing behavior.
- Update `DEVELOPMENT.md` for maintainer or test workflow changes.

For syntax-changing formatter work, run `pnpm run test:uefn` when a UEFN project is available.
