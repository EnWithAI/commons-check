// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 EnWithAI Technologies
/**
 * Command-line interface (docs/SPEC.md §3): parses arguments, runs the five steps and maps errors to exit codes.
 * Findings never change the exit code.
 */
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { CommonsCheckError, ExitCode, inputError, usageError } from "../errors.js";
import { runCommons, STAGES, STEPS } from "../run.js";
import { TOOL_VERSION } from "../version.js";
const HELP = `Commons Check ${TOOL_VERSION} — run the EnWithAI Engineering Commons on a repository with one command.

Usage:
  commons-check [run] [options]
  commons-check --help | --version

Runs, in order and in-process: Spec Check → Impact Check (+ module graph) → Architecture Check →
Outcome Check (with --prs) → Product Check, which imports the reports above. Writes every report plus
SUMMARY.md and commons-summary.json to the output directory. Report only: findings never fail the run.

Options:
  --cwd <dir>               Repository root (default: current directory)
  --out-dir <dir>           Output directory, relative to --cwd (default: commons-report)
  --stage <stage>           Product Check lifecycle stage (default: ALPHA):
                            ${STAGES.join(", ")}
  --base <ref>              Impact Check base ref (default: main, origin/main, master, origin/master)
  --specs <path>            Spec Check input file or directory (repeatable; default: its config or specs/*/spec.md)
  --prs <file>              Outcome Check PR export (step skipped without it); --runs <file> CI run export
  --test-results <file>     JUnit XML or Jest/Vitest JSON for Product Check (repeatable)
  --npm-audit <file>        \`npm audit --json\` output for Product Check
  --openslo <file>          OpenSLO v1 file for Product Check (repeatable)
  --alert-rules <file>      Prometheus/Mimir rules for Product Check (repeatable)
  --service-graph <file>    Jaeger dependencies or service-graph query result for Product Check
  --skip <step>             Skip a step: ${STEPS.join(", ")} (repeatable)
  --fail-on-error           Exit 4 when a step ended in error (default: report it and exit 0)
  --no-branding             Omit footer links
  --quiet                   No progress messages on stderr
  -h, --help / -v, --version

Outcome Check reads data you export yourself (Commons Check never calls an API):
  gh pr list --state all --limit 1000 --json number,title,state,isDraft,createdAt,closedAt,mergedAt,author,labels,additions,deletions,reviews > prs.json
  gh run list --limit 1000 --json databaseId,headSha,event,status,conclusion,attempt,createdAt,workflowName > runs.json
  (Without ,commits: CI first-pass and post-review commits are unknown. Adding ,commits hits GitHub's node limit
   above ~30 PRs per call, so use --limit 30 with it.)

Impact Check compares with the base branch: in CI, check out with full history (fetch-depth: 0).
Exit codes: 0 completed · 1 internal error · 2 usage error · 3 input error · 4 a step errored (--fail-on-error)
Privacy: offline; no network access, no telemetry, nothing from the repository is executed, no model used.
`;
/** Runs the CLI and returns the exit code. */
export async function run(argv, io) {
    try {
        return await main(argv, io);
    }
    catch (error) {
        if (error instanceof CommonsCheckError) {
            io.stderr(`commons-check: error: ${error.message}\n`);
            if (error.hint)
                io.stderr(`commons-check: hint: ${error.hint}\n`);
            return error.exitCode;
        }
        io.stderr(`commons-check: internal error: ${error instanceof Error ? error.message : String(error)}\n`);
        return ExitCode.Internal;
    }
}
async function main(argv, io) {
    let parsed;
    try {
        parsed = parseArgs({
            args: argv,
            allowPositionals: true,
            strict: true,
            options: {
                cwd: { type: "string" },
                "out-dir": { type: "string" },
                stage: { type: "string" },
                base: { type: "string" },
                specs: { type: "string", multiple: true },
                prs: { type: "string" },
                runs: { type: "string" },
                "test-results": { type: "string", multiple: true },
                "npm-audit": { type: "string" },
                openslo: { type: "string", multiple: true },
                "alert-rules": { type: "string", multiple: true },
                "service-graph": { type: "string" },
                skip: { type: "string", multiple: true },
                "fail-on-error": { type: "boolean" },
                "no-branding": { type: "boolean" },
                quiet: { type: "boolean" },
                help: { type: "boolean", short: "h" },
                version: { type: "boolean", short: "v" },
            },
        });
    }
    catch (error) {
        throw usageError(error instanceof Error ? error.message : String(error), "See `commons-check --help`.");
    }
    const { values, positionals } = parsed;
    if (values.help) {
        io.stdout(HELP);
        return ExitCode.Ok;
    }
    if (values.version) {
        io.stdout(`${TOOL_VERSION}\n`);
        return ExitCode.Ok;
    }
    if (positionals.length > 1 || (positionals.length === 1 && positionals[0] !== "run"))
        throw usageError(`Unknown command: ${positionals.join(" ")}`, "The only command is `run` (the default).");
    const skip = values.skip ?? [];
    for (const s of skip)
        if (!STEPS.includes(s))
            throw usageError(`--skip accepts ${STEPS.join(", ")} (got "${s}").`);
    const cwd = resolve(io.cwd, values.cwd ?? ".");
    if (!existsSync(cwd) || !statSync(cwd).isDirectory())
        throw inputError(`--cwd is not a directory: ${values.cwd ?? cwd}`);
    const log = values.quiet ? undefined : (message) => io.stderr(`commons-check: ${message}\n`);
    const result = await runCommons({
        cwd,
        outDir: values["out-dir"] ?? "commons-report",
        stage: values.stage ?? "ALPHA",
        base: values.base ?? null,
        specs: values.specs ?? [],
        prs: values.prs ?? null,
        runs: values.runs ?? null,
        testResults: values["test-results"] ?? [],
        npmAudit: values["npm-audit"] ?? null,
        openslo: values.openslo ?? [],
        alertRules: values["alert-rules"] ?? [],
        serviceGraph: values["service-graph"] ?? null,
        skip: skip,
        branding: !values["no-branding"],
        ...(io.now ? { now: io.now } : {}),
        ...(log ? { log } : {}),
    });
    io.onResult?.(result);
    const s = result.summary;
    if (!values.quiet) {
        const verdict = s.product ? ` · Product Check ${s.product.verdict}` : "";
        io.stderr(`commons-check: ${s.steps.filter((x) => x.status === "ok").length}/${s.steps.length} steps ok${verdict} · ${s.errors} error(s) · summary in ${s.out_dir}/SUMMARY.md\n`);
    }
    return values["fail-on-error"] && s.errors > 0 ? ExitCode.StepError : ExitCode.Ok;
}
