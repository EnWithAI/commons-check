# Changelog

All notable changes are documented here. The format follows Keep a Changelog; versions follow SemVer (pre-1.0: minor
versions may change the summary format, which carries its own `schema_version`).

## Unreleased

## 0.3.261110 — 2026-11-10

- Version alignment: every EnWithAI Engineering Commons tool now uses `0.3.YYMMDD`, the date of the release
  (`0.3.261110` = 2026-11-10). It continues from `0.2.0`. No functional change; report and schema versions are
  unchanged.
- Pins every tool at 0.3.261110: Spec Check, Impact Check, Architecture Check, Outcome Check, Product Check and
  Blueprint Check (same code as the previous pins).

## 0.2.0 — 2026-11-10

- Step 6: Blueprint Check 0.1.0 generates the as-built architecture blueprint (dossier, Mermaid views, model,
  evidence, coverage, `workspace.dsl`) into `blueprint/`, from the module graph and Product Check's surface. The
  summary gains a `blueprint` block and a section in `SUMMARY.md`; `--skip blueprint` skips it. Additive: summary
  schema stays 1.0. Pins `@enwithai/blueprint-check` 0.1.0.

## 0.1.3 — 2026-11-09

- Pins Product Check 0.3.0 (CT3 v3.2 review-and-closure layer). The in-process assessment is unchanged: results
  schema 0.1.0 and the same 51 controls; the new workflow needs git and opt-in execution, so Commons Check does not
  run it.
- Reads Product Check's release gate when one exists (`--release-gate <file>`, default
  `.product-check/release-gate.json`), validates it against Product Check's schema and reports its decision in
  `commons-summary.json` (`release_gate`) and `SUMMARY.md` as recorded, never re-evaluated. A gate recorded for an
  older commit than the one assessed is flagged. Additive: summary schema stays 1.0. A file read, no process.

## 0.1.2 — 2026-10-29

- Pins Architecture Check 0.2.1. Its repository walk honours `.gitignore` and `.git/info/exclude`, so git-ignored
  directories (nested repositories, generated manifests, other tools' fixtures) no longer reach the as-built model.
  Skipped paths are listed in Architecture Check's own report as `gitignored-skipped`. Found by running Commons
  Check on the Engineering Commons workspace, where the attached `as-built.dsl` held 8 containers from
  Architecture Check's test fixtures; with 0.2.1 it holds none. Impact Check and Product Check already respected git,
  so the three tools now agree on what the repository contains.

## 0.1.1 — 2026-10-29

- Pins Outcome Check 0.2.0. `--prs` and `--runs` now accept JSON Lines, so the paginated, read-only
  `gh api graphql --paginate` export with commits (Outcome Check's `docs/EXPORTING.md`) can be passed directly. The
  full PR history with CI first-pass rate is now possible.
- `--help`, the README and `docs/ACTION.md` recommend that export and correct the limit of the
  `gh pr list …,commits` export. GitHub rejects it from 50 PRs; 0.1.0 said "about 30".
- README note: `npx @enwithai/commons-check` fails inside a checkout of Commons Check itself.

## 0.1.0 — 2026-10-28

First version. Runs Spec Check 0.2.0, Impact Check 0.3.0 (with its module graph), Architecture Check 0.2.0, Outcome
Check 0.1.0 (with exported PR data) and Product Check 0.2.0 on a repository with one command. It calls them
in-process, wires each report into the next, and writes `SUMMARY.md` and `commons-summary.json` (schema 1.0).

- Report only: findings never change the exit code. A step that cannot run is recorded as `skipped`, `error` or
  `no-model` with its reason, and the other steps continue. `--fail-on-error` exits 4 when a step errored.
- The summary keeps facts, hypotheses and unknowns apart. "What to do first" lists only facts: Product Check P0/P1,
  then verified high and medium findings. NOT_TESTED and BLOCKED controls are listed with their reasons.
- GitHub Action (`action.yml`), report only by default. Verified on a GitHub runner from a clean install.
- The documented PR export leaves out `commits`. With it, GitHub's GraphQL node limit is exceeded above about 30
  PRs per call.
