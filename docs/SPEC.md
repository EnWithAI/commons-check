# Commons Check — specification (0.1)

## 1. Purpose

Run the five EnWithAI Engineering Commons tools on one repository with **one command**, in the right order, wire
their outputs into each other, and write **one summary**. Commons Check adds no rules, no score and no judgement of
its own. Every finding, status and verdict comes from the tool that produced it, unchanged.

| Step | Tool (pinned)                       | Question                                               |
| ---- | ----------------------------------- | ------------------------------------------------------ |
| 1    | Spec Check 0.2.0                    | Are the requirements clear enough to build from?       |
| 2    | Impact Check 0.3.0 (+ module graph) | What does this change affect?                          |
| 3    | Architecture Check 0.2.0            | Does the architecture model still describe the code?   |
| 4    | Outcome Check 0.2.0 (optional)      | What did delivery achieve? (needs exported PR/CI data) |
| 5    | Product Check 0.2.0                 | Does the product work, can it be trusted?              |

## 2. Invariants

- **In-process.** The tools are exact-pinned dependencies called through their published library APIs. Commons
  Check starts no processes, makes no network requests and runs no repository code; ESLint and a test enforce this.
  The tools keep their own invariants: Impact Check reads git history, as it always does.
- **Report only.** Findings never change the exit code. A step that cannot run is recorded as `skipped` or `error`
  with its reason, and the other steps still run.
- **Status vocabulary unchanged.** The summary keeps `verified_static_fact` (fact), `hypothesis` (a person must
  confirm) and `unknown` (not determinable statically) apart. Product Check's NOT_TESTED and BLOCKED controls are
  listed with their reasons and never described as passed.
- **No guessing.** If there is no architecture model, the summary says so and attaches the derived as-built model.
  No model is invented, and nothing is written outside the output directory.
- **Outcome Check data is exported by the user** (`gh pr list`, `gh run list`). Commons Check never calls an API. The
  `--help` output prints the export commands.

## 3. Command

```
commons-check [run] [options]
commons-check --help | --version
```

| Option                                                                                        | Meaning                                                                                       |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--cwd <dir>`                                                                                 | Repository root (default: current directory)                                                  |
| `--out-dir <dir>`                                                                             | Output directory, relative to `--cwd` (default `commons-report`)                              |
| `--stage <stage>`                                                                             | Product Check lifecycle stage (default `ALPHA`; see Product Check for the list)               |
| `--base <ref>`                                                                                | Impact Check base ref (default: Impact Check's own: main, origin/main, master, origin/master) |
| `--specs <path>` (repeatable)                                                                 | Spec Check inputs (default: Spec Check's config or `specs/*/spec.md`)                         |
| `--prs <file>`, `--runs <file>`                                                               | Outcome Check exports; step 4 is skipped without `--prs`                                      |
| `--test-results`, `--openslo`, `--alert-rules` (repeatable); `--npm-audit`, `--service-graph` | Passed to Product Check                                                                       |
| `--skip <step>` (repeatable)                                                                  | `spec`, `impact`, `architecture`, `outcome`, `product`                                        |
| `--fail-on-error`                                                                             | Exit 4 when any step ended in `error` (default: report and exit 0)                            |
| `--quiet`, `--no-branding`                                                                    | No progress on stderr; no footer link                                                         |

**Exit codes:**

- **0** completed (whatever the findings);
- **1** internal error;
- **2** usage error;
- **3** input error (`--cwd` missing; an input file unreadable);
- **4** a step errored and `--fail-on-error` was given.

## 4. Steps and wiring

Each step's configuration file is used when present: `.spec-check.json`, `.impact-check.json`,
`.architecture-check.json`, `.outcome-check.json`.

1. **Spec Check** `analyze`
   - Writes `spec-check.json` and `spec-check.md`.
   - No spec files → `skipped` (reason from Spec Check).
2. **Impact Check** `analyze` of the working tree against `--base`
   - Writes `impact-check.json` and `impact-check.md`.
   - `exportGraph` writes `graph.json`.
   - Each part is recorded separately, so a missing base ref still leaves the graph.
3. **Architecture Check** `analyze` with `graph.json` and `impact-check.json` when they exist
   - Writes `architecture-check.json` and `architecture-check.md`.
   - No declared model → status `no-model`; `derive` writes `as-built.dsl` for review.
4. **Outcome Check** `analyze` (only with `--prs`)
   - Writes `outcome-check.json` and `outcome-check.html`.
5. **Product Check** run at `--stage` on the repository
   - Imports the JSON reports from steps 1–4 that succeeded, plus the passthrough files.
   - Writes `product-check/`: `product-check-results.json`, `report.md`, `blueprint.md`, `work-packets/` and
     `dashboard.html`.
   - No network: no URL and no authorization is ever passed.

Then `SUMMARY.md` and `commons-summary.json` are written to the output directory.

## 5. Summary

`commons-summary.json` (`schema_version` "1.0", kind `commons-summary`) and `SUMMARY.md` contain the following:

- **Header:** Commons Check version, each tool's version, the repository, and the time.
- **Per step:**
  - status (`ok`, `skipped`, `error`, `no-model`) with its reason;
  - the output files;
  - finding counts by severity and by status;
  - the top 3 findings (high before medium before low; facts before hypotheses before unknowns), each with
    rule, status, summary and `path:line`.
- **Product Check:**
  - the verdict;
  - the three pillar scores with coverage and confidence (or "not scored");
  - open findings P0–P3;
  - every NOT_TESTED and BLOCKED control, with its reason.
- **Outcome Check:** each metric's all-PR value, or the reason it was withheld.
- **"What to do first":** up to 5 actions in this order:
  1. Product Check P0, then P1, findings;
  2. verified high findings from steps 1–3;
  3. verified medium findings.

  Each action quotes the tool's own recommended action and links to the finding. Hypotheses and unknowns are never
  put on this list; the summary names how many need a person to confirm.

Paths in the summary are relative to `--cwd`. Repository-derived text is escaped for Markdown.

## 6. GitHub Action

`action.yml` (composite) installs the runtime dependencies from the lockfile (`npm ci --omit=dev
--ignore-scripts`) and runs the built CLI.

- **Inputs** are passed through environment variables, never interpolated into shell: `stage`, `base`, `specs`
  (newline list), `prs`, `runs`, `out-dir`, `fail-on-error`.
- **Output:** it appends `SUMMARY.md` to the job summary and sets the outputs `out-dir`, `verdict` and `errors`.
- **Requirements:**
  - `actions/checkout` with `fetch-depth: 0`, so Impact Check sees the base branch;
  - `permissions: contents: read`, on `pull_request`.
- **Report only by default.** Uploading the output directory is left to the workflow (example in `docs/ACTION.md`).

## 7. Versions

Commons Check `0.1.1` pins Spec Check 0.2.0, Impact Check 0.3.0, Outcome Check 0.2.0, Architecture Check 0.2.0 and
Product Check 0.2.0 exactly. A new tool release reaches users through a new Commons Check release. The summary
schema has its own `schema_version`.

## 8. Expected cases (tests are written first)

- **Synthetic repository**, a git repo built in the test with a spec, a model, code, a branch change and test
  results:
  - all five steps `ok`;
  - every output file written;
  - Product Check imported all four reports;
  - the summary lists top findings with `path:line`, the verdict, the pillars and NOT_TESTED reasons;
  - "What to do first" holds facts only.
- **No specs, no model, not on a branch:**
  - Spec Check `skipped`;
  - Architecture Check `no-model` with `as-built.dsl`;
  - Product Check still runs;
  - exit 0.
- **Not a git repository:** Impact Check `error` (graph too) and the other steps continue; with `--fail-on-error`,
  exit 4.
- **Inputs and usage:** `--prs` given → Outcome Check `ok`; `--skip product` honored; an unknown option → exit 2; a
  missing `--cwd` → exit 3.
- **Safety:**
  - no `child_process`, network modules, `eval` or dynamic `import()` in `src/`;
  - a malicious finding summary (Markdown or HTML) is escaped in `SUMMARY.md`.
- **Action:** inputs come from the environment, the job summary is appended and the outputs are written (in-process
  test).
