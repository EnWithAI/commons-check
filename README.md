# Commons Check

**One command for the EnWithAI Engineering Commons: is the spec clear, what does the change affect, does the
architecture still match, what did delivery achieve, and is the product ready?**

```bash
npx @enwithai/commons-check --stage PRE_LAUNCH
```

Commons Check runs the five Engineering Commons tools on your repository, in order, in one process. It feeds each
report into the next and writes one summary:

| Step | Tool                                                                 | Question                                                        |
| ---- | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1    | [Spec Check](https://github.com/enwithai/spec-check)                 | Are the requirements clear and verifiable enough to build from? |
| 2    | [Impact Check](https://github.com/enwithai/impact-check)             | What does this change affect? (also exports the module graph)   |
| 3    | [Architecture Check](https://github.com/enwithai/architecture-check) | Does the architecture model still describe the code?            |
| 4    | [Outcome Check](https://github.com/enwithai/outcome-check)           | What did delivery achieve? (with exported PR data)              |
| 5    | [Product Check](https://github.com/enwithai/product-check)           | Does the product work, can it be trusted, what's next?          |

The output goes to `commons-report/`:

- every tool's own report;
- Product Check's dashboard;
- **`SUMMARY.md`**, which holds:
  - each step's status and top findings with `path:line`;
  - Product Check's verdict and pillar scores, and every control it could not test, with the reason;
  - **what to do first**.

**Report only.** Findings never fail the command. Nothing is invented: every finding, status and verdict comes from
the tool that produced it. A **fact** was verified statically, a **hypothesis** needs a person to confirm it, and
**unknown** cannot be determined statically. Only facts appear in "what to do first".

> Status: **early release** (`0.1.0`, pre-1.0, summary schema 1.0). Pins Spec Check 0.2.0, Impact Check 0.3.0,
> Architecture Check 0.2.0, Outcome Check 0.1.0 and Product Check 0.2.0.

## Usage

Requires Node.js 22, 24 or ≥ 26, and git. Run it from the repository root, on the branch you want assessed.

> Do not run `npx @enwithai/commons-check` inside a checkout of Commons Check itself. There npx resolves the name to
> the local project instead of downloading the package, and fails with `commons-check: command not found`. Run it
> from the repository you want to assess.

```bash
npx @enwithai/commons-check                                   # stage ALPHA, all defaults
npx @enwithai/commons-check --stage LAUNCH_GATE --base main   # choose the lifecycle stage and the base branch
npx @enwithai/commons-check --specs docs/requirements         # specs outside specs/*/spec.md
npx @enwithai/commons-check --test-results junit.xml --npm-audit npm-audit.json
npx @enwithai/commons-check --prs prs.json --runs runs.json   # add Outcome Check (export below)
npx @enwithai/commons-check --skip outcome --out-dir reports/commons
```

Outcome Check reads data you export yourself. Commons Check never calls an API:

```bash
gh pr list --state all --limit 1000 --json number,title,state,isDraft,createdAt,closedAt,mergedAt,author,labels,additions,deletions,reviews > prs.json
gh run list --limit 1000 --json databaseId,headSha,event,status,conclusion,attempt,createdAt,workflowName > runs.json
```

Current `gh` releases fetch up to 100 commits with authors for each PR, so adding `commits` to the field list hits
GitHub's 500,000-node GraphQL limit above about 30 PRs per call. The command above leaves `commits` out, so Outcome
Check shows CI first-pass rate and post-review commits as `unknown`. For those two metrics, add `,commits` and use
`--limit 30` (recent PRs only).

**Choose the stage honestly.** The stage decides which Product Check controls apply:

- **CT-T3** (`LAUNCH_GATE`): architecture drift counts from here on.
- **CT-T4** (`JUST_LAUNCHED`): SLOs, alerting and runtime dependencies count from here on. Pass `--openslo`,
  `--alert-rules` and `--service-graph` for them.

What happens when a step cannot run:

- **No specs:** Spec Check is `skipped`.
- **No architecture model:** Architecture Check is `no-model`, and the derived as-built model is attached as
  `as-built.dsl` for review. No model is invented.
- **Not a git repository, or no base branch:** Impact Check is `error`.

In every case the other steps still run.

| Exit code | Meaning                                        |
| --------- | ---------------------------------------------- |
| 0         | Completed (whatever the findings)              |
| 1         | Internal error                                 |
| 2         | Usage error                                    |
| 3         | Input error (missing `--cwd` or input file)    |
| 4         | A step errored and `--fail-on-error` was given |

## GitHub Action

```yaml
on: pull_request
permissions:
  contents: read
jobs:
  commons:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>
        with:
          fetch-depth: 0
          persist-credentials: false
      - uses: enwithai/commons-check@<release-sha>
        with:
          stage: PRE_LAUNCH
          base: origin/${{ github.base_ref }}
```

The summary appears in the job summary. See [docs/ACTION.md](docs/ACTION.md) for the inputs, outputs, Outcome Check
exports and the security model.

## What it will not do

- No rules, scores or verdicts of its own.
- No network access, no API calls, no telemetry, and nothing from your repository is executed. The tools run
  in-process. Product Check is never given a URL.
- No fixes: it changes nothing in your repository and writes only to the output directory.

Each tool's limits apply and are listed in its own report.

## Documentation

[SPEC](docs/SPEC.md) · [ACTION](docs/ACTION.md) · [SECURITY](SECURITY.md) · [CONTRIBUTING](CONTRIBUTING.md) ·
[CHANGELOG](CHANGELOG.md)

## License

MIT © EnWithAI Technologies. See [LICENSE](LICENSE), [NOTICE](NOTICE.md), [ATTRIBUTION](ATTRIBUTION.md) and
[TRADEMARKS](TRADEMARKS.md).

---

<sub>An EnWithAI Engineering Commons tool · offline · no code executed · no model used · [crewpe.ai](https://crewpe.ai)</sub>
