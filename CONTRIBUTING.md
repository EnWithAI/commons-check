# Contributing to Commons Check

Thanks for helping! Commons Check is a thin runner. Its job is to call the five Engineering Commons tools in the right
order, wire their outputs together and summarize them **without adding or changing any judgement**.

## Ground rules

- No rules, scores or verdicts of its own. A finding's severity, status and wording come from the tool that produced
  it. Rule changes belong in that tool's repository.
- Keep the status vocabulary apart: facts (`verified_static_fact`), hypotheses and unknowns. Only facts may appear in
  "What to do first". NOT_TESTED is never presented as a pass.
- No child processes, network access, `eval` or dynamic imports in `src/` (a test enforces this). Call the tools
  through their published library APIs.
- The tools are pinned exactly. Updating a pin is a release of Commons Check: run the full gate and the end-to-end
  test on a real repository first.
- Fixtures are **synthetic**. Never commit real repositories, secrets or personal data.
- Write a failing test first (see `docs/SPEC.md` §8), then the code.

## Development

```bash
npm ci --ignore-scripts
npm run check:all                     # typecheck, lint, format check, build, tests with coverage
node scripts/license-audit.mjs --all
```

## Pull requests

- Keep PRs focused; include tests that assert behavior.
- Describe user-visible changes in `CHANGELOG.md` under "Unreleased".
- By contributing you agree your contribution is licensed under the MIT License.

## Licensing of contributions and attribution

- Contributions are accepted under this repository's MIT License, inbound = outbound. By opening a pull request you
  confirm you have the right to submit the work under that license.
- Do not paste code or text from other projects. New source files start with `// SPDX-License-Identifier: MIT`
  (or `#` for YAML and shell).
- Do not add framework (CLEAR/TRACE) or product (CrewPE) claims unless
  [commons-provenance.yaml](commons-provenance.yaml) records an evidenced relationship. See
  [ATTRIBUTION.md](ATTRIBUTION.md).
- AI-assisted contributions are welcome. You are responsible for reviewing them and for their licensing; mention
  significant AI assistance in the PR description.

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).
