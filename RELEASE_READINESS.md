# Release readiness — Commons Check 0.1.0

Date: 2026-10-28 · Branch `release/v0.1.0` · **Verdict: READY FOR HUMAN REVIEW**. On GitHub (EnWithAI/commons-check).
The npm release of 0.1.0 was requested by the user on 2026-10-28; the user publishes with 2FA.

## Verified (2026-10-28, macOS, Node v25.9.0)

Node 25 is outside the declared `engines` range (22/24/≥26). CI runs Node 22, 24 and 26 once the repository exists.

| Check             | Command                                                              | Result                                                                                                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full gate         | `npm run check:all`                                                  | exit 0: typecheck, lint, format, build; 4 files / 11 tests passed; lines 95.95%, branches 77.35%                                                                                                                                                                |
| Licenses          | `node scripts/license-audit.mjs` / `--all`                           | production: 50 packages (MIT 45, ISC 4, Apache-2.0 1: `typescript`, via Impact Check); all: 87; disallowed 0                                                                                                                                                    |
| Package           | `npm pack --dry-run`                                                 | 28 files, about 20 kB (the five tools come in as dependencies)                                                                                                                                                                                                  |
| Clean install     | pack → install the tarball in an empty directory                     | works; `commons-check --version` 0.1.0                                                                                                                                                                                                                          |
| Real repository 1 | impact-check, `--stage LAUNCH_GATE --base HEAD~3`, real `gh` exports | 4/5 steps ok in about 1 s; Spec Check skipped (no Spec Kit specs), Product Check INCONCLUSIVE at CT-T3 with 22 untested or blocked controls listed with reasons; Outcome Check metrics needing `commits` withheld as `field-not-exported`; repository untouched |
| Real repository 2 | spec-check with `--specs examples/demo/specs`                        | Spec Check 5 findings; "What to do first" lists exactly the 3 verified high/medium findings with `path:line`; Architecture Check `no-model` with `as-built.dsl`                                                                                                 |

## Found by the real runs (fixed before release)

- **`gh` export limit.** The export `gh pr list --limit 1000 --json …,commits` (also printed by Outcome Check 0.1.0's
  `--help` and `docs/EXPORTING.md`) fails on GitHub with gh 2.102: GraphQL node limit, 500,000. With `commits` the
  limit is about 30 PRs per call. Commons Check documents the export without `commits` and explains what that costs.
  A paginated export belongs in Outcome Check (follow-up).
- **Output paths** outside the repository were shown as long `../` paths. They are now listed relative to the output
  directory.
- **Over-escaping** in `SUMMARY.md`. Parentheses, `#`, `+` and `!` are no longer escaped (they cannot form markup once
  `[`, `]`, `<` and `>` are), and the stage is shown as code.

## GitHub verification (2026-10-28)

| Check                               | Result                                                                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository                          | public `EnWithAI/commons-check` (created with the user's approval); private vulnerability reporting enabled                                                      |
| CI on `main` (40725600974)          | green on Node 22, 24 and 26                                                                                                                                      |
| Action, first run (40725664906)     | failed: `${{ github.base_ref }}` in an input description made `action.yml` invalid. Fixed in #1, with a regression test                                          |
| Action, after the fix (40726060980) | passed from a clean install: 50 packages, 5 steps with 0 errors, summary and artifact written (the CI assertion was also corrected to this repository's outputs) |

## Not yet verified

- `npx @enwithai/commons-check` from the registry. It is not published.

## Process note

`docs/SPEC.md` was written before the code. The tests were written after the first version of the code and before
it was run, not strictly first. Every §8 case is covered.
