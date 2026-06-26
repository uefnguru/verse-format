# Verse Fixtures

Tracked fixtures are small, compileable Verse feature probes. Each fixture directory contains:

- `original.verse`: intentionally mixed or unformatted input.
- `braced-wide.verse`: expected output for `blockStyle: "braced"` and `spacingStyle: "wide"`.
- `colon-wide.verse`: expected output for `blockStyle: "colon"` and `spacingStyle: "wide"`.
- `braced-dense.verse`: expected output for `blockStyle: "braced"` and `spacingStyle: "dense"`.
- `colon-dense.verse`: expected output for `blockStyle: "colon"` and `spacingStyle: "dense"`.

Multi-file fixtures use matching `braced-wide`, `colon-wide`, `braced-dense`, and `colon-dense` directories. The reference test verifies formatter round trips, and the opt-in UEFN test compiles every block style and spacing style combination. Keep fixtures focused on formatter-sensitive syntax instead of copying full project source.
