# Release readiness — Commons Check 0.2.0

Date: 2026-11-10 · Branch `release/0.2.0` · **Verdict: RELEASE APPROVED** by the user on 2026-11-10 (tag, GitHub
release; npm publish by the user with 2FA).

## 0.2.0

- Step 6: Blueprint Check 0.1.0 (published 2026-11-10) writes the as-built architecture blueprint to `blueprint/`.
  Step 6 was built on `feat/blueprint-step` (`620160d`) and cherry-picked onto 0.1.3; the release-gate reporting from
  0.1.3 is unchanged. The lockfile is regenerated from the registry.

| Check                    | Result                                                                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full gate                | `npm run check:all`: 4 files / 17 tests passed; lines 95.5%                                                                                                                                                          |
| Licenses / audit         | production 51 packages (MIT 46, ISC 4, Apache-2.0 1), 0 disallowed; `npm audit --omit=dev` 0                                                                                                                         |
| Package                  | 28 files, 23.5 kB; local pack shasum `1b90ef589c6e9effd98085b0e3c858fcf76999c7` (from this branch, no tag)                                                                                                           |
| Clean install, real data | packed 0.2.0 on the product-check repository: all steps ran or skipped as expected, `blueprint: ok`, blueprint PROVISIONAL with 18 elements and 34 relationships, 6 views produced, 10 blocked; repository untouched |

---

# Release readiness — Commons Check 0.1.3 (history)

Date: 2026-11-09 · Branch `release/0.1.3` · **Verdict: READY FOR HUMAN REVIEW**. Requested by the user on 2026-11-09
("keep it up to date"); the user publishes to npm with 2FA.

## 0.1.3

- Pins Product Check 0.3.0 (published 2026-11-09, EnWithAI/product-check#8, #9, #10).
- Reads Product Check's recorded release gate (`--release-gate`, default `.product-check/release-gate.json`) and
  reports it unchanged, flagging a gate for an older commit (workspace decision D-114, "later option").

| Check                    | Result                                                                                                                                                                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tests first              | `test/release-gate.test.ts`: a gate written by the real Product Check 0.3.0 CLI (`run` → `register` → `assure`) is reported with `current: true`; after a new commit `false`; an invalid file is `invalid` with the schema error; no file → no section; a missing `--release-gate` path exits 3 |
| Full gate                | `npm run check:all`: 4 files / 17 tests passed; lines 95.53%                                                                                                                                                                                                                                    |
| Licenses / audit         | production 50 packages (MIT 45, ISC 4, Apache-2.0 1), 0 disallowed; `npm audit --omit=dev` 0                                                                                                                                                                                                    |
| Package                  | 28 files, 22.6 kB; local pack shasum `96e39ffafec035244b6f9a554b71449dd2ab6b82` (from this branch, no tag)                                                                                                                                                                                      |
| Clean install, real data | packed 0.1.3 on the product-check repository: product-check 0.3.0 in the summary, verdict INCONCLUSIVE, no gate file so no gate section; repository untouched. On a synthetic repository with a recorded gate: `UNKNOWN`, `current: true`                                                       |

---

# Release readiness — Commons Check 0.1.2 (history)

Date: 2026-10-29 · Branch `release/v0.1.2` · **Verdict: READY FOR HUMAN REVIEW**. Release PR requested by the user on
2026-10-29; tag, GitHub release and npm publish (by the user, 2FA) each need approval.

## 0.1.2

- Pins Architecture Check 0.2.1 (published 2026-10-29, EnWithAI/architecture-check#7 and #8), whose walk honours
  `.gitignore` and `.git/info/exclude`.

| Check                    | Result                                                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pin proves the fix       | new test `leaves git-ignored directories out of the as-built model`: passes with Architecture Check 0.2.1, fails with 0.2.0 (`as-built.dsl` contains the ignored `nested_fixture` service)          |
| Full gate                | `npm run check:all`: 3 files / 14 tests passed; lines 95.95%                                                                                                                                        |
| Licenses / audit         | production 50 packages (MIT 45, ISC 4, Apache-2.0 1), 0 disallowed; `npm audit --omit=dev` 0                                                                                                        |
| Package                  | 28 files, 20.7 kB; local pack shasum `3ef3e3995822145c6a1d9f61b7ccef484c168a06` (from this branch, no tag)                                                                                          |
| Clean install, real data | packed 0.1.2 on the Engineering Commons workspace: architecture-check 0.2.1 in SUMMARY.md; `as-built.dsl` has 0 containers (0.1.1: 8 from Architecture Check's test fixtures); repository untouched |

---

# Release readiness — Commons Check 0.1.1 (history)

Date: 2026-10-29 · Branch `release/v0.1.1` · **Verdict: READY FOR HUMAN REVIEW**. The npm release of 0.1.1 was requested
by the user on 2026-10-29; the user publishes with 2FA.

## 0.1.1

- Pins Outcome Check 0.2.0, which adds JSON Lines input and the paginated export with commits.
- Updated export guidance.
- The README note from #3.

| Check                    | Result                                                                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pin proves the fix       | new test `accepts the paginated JSON Lines PR export`: passes with Outcome Check 0.2.0, fails with 0.1.0 (`--prs is not valid JSON`)                                                                                                                                |
| Full gate                | `npm run check:all`: 3 files / 13 tests passed; lines 95.95%                                                                                                                                                                                                        |
| Licenses / audit         | production 50 packages (MIT 45, ISC 4, Apache-2.0 1), 0 disallowed; `npm audit --omit=dev` 0                                                                                                                                                                        |
| Package                  | 28 files, 20.4 kB                                                                                                                                                                                                                                                   |
| Clean install, real data | packed 0.1.1 on impact-check with the paginated `prs.jsonl` export and `runs.json`: all steps at their pinned versions (Outcome Check 0.2.0); SUMMARY.md shows "CI first-pass rate: 100%", where 0.1.0 showed "withheld (field-not-exported)"; repository untouched |

---

# Release readiness — Commons Check 0.1.0 (history)

Date: 2026-10-28 · Branch `release/v0.1.0` · **Verdict: READY FOR HUMAN REVIEW**. On GitHub (EnWithAI/commons-check).
The npm release of 0.1.0 was requested by the user on 2026-10-28; the user publishes with 2FA.

## Verified (2026-10-28, macOS, Node v25.9.0)

Node 25 is outside the declared `engines` range (22/24/≥26). CI runs Node 22, 24 and 26 once the repository exists.

| Check             | Command                                                              | Result                                                                                                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full gate         | `npm run check:all`                                                  | exit 0: typecheck, lint, format, build; 3 files / 11 tests passed; lines 95.95%, branches 77.35%                                                                                                                                                                |
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
