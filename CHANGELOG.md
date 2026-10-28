# Changelog

All notable changes are documented here. The format follows Keep a Changelog; versions follow SemVer (pre-1.0: minor
versions may change the summary format, which carries its own `schema_version`).

## Unreleased

## 0.1.0 — unreleased

First version. Runs Spec Check 0.2.0, Impact Check 0.3.0 (with its module graph), Architecture Check 0.2.0, Outcome
Check 0.1.0 (with exported PR data) and Product Check 0.2.0 on a repository with one command. It calls them
in-process, wires each report into the next, and writes `SUMMARY.md` and `commons-summary.json` (schema 1.0).

- Report only: findings never change the exit code. A step that cannot run is recorded as `skipped`, `error` or
  `no-model` with its reason, and the other steps continue. `--fail-on-error` exits 4 when a step errored.
- The summary keeps facts, hypotheses and unknowns apart. "What to do first" lists only facts: Product Check P0/P1,
  then verified high and medium findings. NOT_TESTED and BLOCKED controls are listed with their reasons.
- GitHub Action (`action.yml`), report only by default.
