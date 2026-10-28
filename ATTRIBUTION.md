# Attribution and provenance

## Publisher

- **Project:** Commons Check (`@enwithai/commons-check`): one command for the EnWithAI Engineering Commons.
- **Commons:** EnWithAI Engineering Commons. _Check the spec. Check the impact. Check the outcome._ Commons Check runs
  all of it at once.
- **Copyright holder:** EnWithAI Technologies (as stated in [LICENSE](LICENSE)).
- **License:** MIT, for all code, documentation and examples in this repository.
- **Maintainer:** Koushik Ramani ([@aiwithrk](https://github.com/aiwithrk)), EnWithAI Technologies.
- **Contact:** [hello@enwithai.com](mailto:hello@enwithai.com)
- **Security issues:** see [SECURITY.md](SECURITY.md).

## Development provenance

Commons Check was written for this repository, spec first (`docs/SPEC.md`). It was developed with substantial AI
assistance (Claude Code). Commits carry a `Co-Authored-By` trailer, and changes were directed and accepted by the
project's human sponsor. Test fixtures are synthetic.

## Built on

| Upstream                                                             | Version        | License | How Commons Check uses it                  |
| -------------------------------------------------------------------- | -------------- | ------- | ------------------------------------------ |
| [Node.js](https://nodejs.org)                                        | 22 / 24 / ≥ 26 | MIT     | Runtime only                               |
| [Spec Check](https://github.com/enwithai/spec-check)                 | 0.2.0          | MIT     | Step 1, called in-process                  |
| [Impact Check](https://github.com/enwithai/impact-check)             | 0.3.0          | MIT     | Step 2 (change report and module graph)    |
| [Architecture Check](https://github.com/enwithai/architecture-check) | 0.2.0          | MIT     | Step 3                                     |
| [Outcome Check](https://github.com/enwithai/outcome-check)           | 0.1.0          | MIT     | Step 4 (with exported PR data)             |
| [Product Check](https://github.com/enwithai/product-check)           | 0.2.0          | MIT     | Step 5, importing the reports of steps 1–4 |

Development tools (Vitest, ESLint, typescript-eslint, Prettier, TypeScript) are not distributed. Listing a project
does not mean its maintainers endorse Commons Check.

## Frameworks

| Framework | Owner                  | Relationship   | Note                                                                          |
| --------- | ---------------------- | -------------- | ----------------------------------------------------------------------------- |
| CLEAR     | NetworkGain Consulting | `none`         | Commons Check adds no method; it runs the tools and reports what they report. |
| TRACE     | EnWithAI Technologies  | `not-assessed` | Alignment with TRACE cannot be stated until it is published.                  |

## Ecosystem

Commons Check is independently usable. It has no dependency on CrewPE, any EnWithAI service or NetworkGain, and it
never uses the network. CrewPE is EnWithAI's enterprise engineering-lifecycle product; no integration exists today.

## Not affiliated

Commons Check is not affiliated with, endorsed by or certified by GitHub, Anthropic or Google.
