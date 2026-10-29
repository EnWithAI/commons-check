# GitHub Action

`action.yml` is a composite action:

1. It installs the runtime dependencies (the five pinned Commons tools) from the lockfile, with
   `npm ci --omit=dev --ignore-scripts`. This is the only step that uses the network, to reach the npm registry.
2. It runs Commons Check in-process.
3. It appends `SUMMARY.md` to the job summary.

## Example

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
          fetch-depth: 0 # Impact Check compares with the base branch
          persist-credentials: false
      - uses: enwithai/commons-check@<release-sha>
        id: commons
        with:
          stage: PRE_LAUNCH
          base: origin/${{ github.base_ref }}
      - uses: actions/upload-artifact@<sha>
        with:
          name: commons-report
          path: commons-report/
```

To include Outcome Check, export the data in an earlier step with a token that can read the repository, and pass the
files:

```yaml
- run: |
    gh pr list --state all --limit 1000 --json number,title,state,isDraft,createdAt,closedAt,mergedAt,author,labels,additions,deletions,reviews > prs.json
    gh run list --limit 1000 --json databaseId,headSha,event,status,conclusion,attempt,createdAt,workflowName > runs.json
  env:
    GH_TOKEN: ${{ github.token }} # needs pull-requests: read and actions: read
- uses: enwithai/commons-check@<release-sha>
  with:
    prs: prs.json
    runs: runs.json
```

This quick export leaves out `commits`, so CI first-pass rate and commits after first review are `unknown`. For the
full history with commits, run the paginated query from [Outcome Check's EXPORTING.md](https://github.com/enwithai/outcome-check/blob/main/docs/EXPORTING.md) in that step instead,
write `prs.jsonl`, and pass `prs: prs.jsonl`. Do not add `,commits` to `gh pr list`: GitHub rejects it from 50 PRs.

## Inputs and outputs

| Input               | Default          | Meaning                                                          |
| ------------------- | ---------------- | ---------------------------------------------------------------- |
| `working-directory` | `.`              | Repository root, relative to the workspace                       |
| `stage`             | `ALPHA`          | Product Check lifecycle stage                                    |
| `base`              | Impact Check's   | Base ref (on pull requests: `origin/${{ github.base_ref }}`)     |
| `specs`             | Spec Check's     | Spec paths, one per line                                         |
| `prs`, `runs`       | none             | Outcome Check exports; Outcome Check is skipped without `prs`    |
| `out-dir`           | `commons-report` | Output directory, relative to `working-directory`                |
| `fail-on-error`     | `false`          | Fail the step when a tool ended in error; findings never fail it |

The outputs are:

- `out-dir`: the output directory, relative to the workspace;
- `verdict`: Product Check's verdict, or `none`;
- `errors`: the number of steps that ended in error.

## Security model

- Use `pull_request` with `permissions: contents: read`. Do not use `pull_request_target`. A pull request can edit
  its own specs, model and tool configuration files.
- Inputs are passed through environment variables and never interpolated into shell code. Absolute paths and `..`
  are rejected.
- Commons Check never passes a URL to Product Check, so no application is contacted. It never calls GitHub: the
  `gh` exports above are your own steps, with your own token.
- Pin the action to a release commit SHA. The release tag contains the built `dist/`.

## Verification status

CI runs the action on this repository for every pull request (`action-clean-install`), starting from a clean install
as a consumer would.

First runs on GitHub, 2026-10-28, on EnWithAI/commons-check#1:

- **Run 40725664906 failed.** `action.yml` did not load because an input description contained a `${{ }}`
  expression, which GitHub evaluates even in descriptions. That is fixed, and a test now rejects expressions outside
  `value:` and `INPUT_*` lines.
- **Run 40726060980 passed.** The action's own install step added 50 packages. On this repository it reported:
  Spec Check skipped (no specs), Impact Check ok, Architecture Check `no-model` (as-built model attached), Outcome
  Check skipped, Product Check INCONCLUSIVE, 0 errors. The summary was written and the artifact uploaded.
