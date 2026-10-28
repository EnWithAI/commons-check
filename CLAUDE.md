# CLAUDE.md — Commons Check repository conventions

These conventions apply inside this repository. They never override the EnWithAI Engineering Commons launch pack
(internal workspace) (`../START_HERE.md`, `../MASTER_PROMPT.md`, `../PHASE_GATES.md`) or the user's explicit
instructions.

## Commands

- Install: `npm ci --ignore-scripts`
- Full gate: `npm run check:all` (typecheck → lint → format check → build → tests with coverage ≥ 80% lines)
- Licenses: `node scripts/license-audit.mjs` and `--all`

## Scope

A thin runner: calls Spec Check, Impact Check, Architecture Check, Outcome Check and Product Check in-process, wires
their outputs, writes one summary. No rules, scores or verdicts of its own (docs/SPEC.md).

## Invariants (tests enforce most of these)

- No `child_process`, network modules, `vm`, `eval` or dynamic `import()` in `src/` (`test/units.test.ts`).
- Statuses come from the tools unchanged; only facts reach "What to do first"; NOT_TESTED is never a pass.
- Never pass a URL or network authorization to Product Check; never call an API (Outcome Check reads exported files).
- The five tools are pinned exactly; updating a pin is a release.
- Fixtures are synthetic only. Tests first.

## Permission gates

Local commits on the work branch are fine. **Pushing, creating remotes/repos, publishing to npm, opening external
issues/PRs, or enabling third-party services requires explicit user approval for that specific action.**
