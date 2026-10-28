// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 EnWithAI Technologies
/**
 * Runs the five Commons tools in order through their library APIs (docs/SPEC.md §4), writes each tool's outputs and
 * collects what the summary needs. A step that cannot run is recorded as skipped or error; the others still run.
 * Nothing here starts a process or opens a connection.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import * as architectureCheck from "@enwithai/architecture-check";
import * as impactCheck from "@enwithai/impact-check";
import * as outcomeCheck from "@enwithai/outcome-check";
import * as productCheck from "@enwithai/product-check";
import * as specCheck from "@enwithai/spec-check";
import { inputError, usageError } from "./errors.js";
import { buildSummary, renderSummaryMarkdown, type Summary } from "./summary.js";
import { toolVersions, type ToolName } from "./version.js";

/** Step identifiers, as used by --skip. */
export const STEPS = ["spec", "impact", "architecture", "outcome", "product"] as const;
export type StepId = (typeof STEPS)[number];

/** Options for one Commons Check run (see the CLI for defaults). */
export interface RunOptions {
  cwd: string;
  outDir: string;
  stage: string;
  base: string | null;
  specs: string[];
  prs: string | null;
  runs: string | null;
  testResults: string[];
  npmAudit: string | null;
  openslo: string[];
  alertRules: string[];
  serviceGraph: string | null;
  skip: StepId[];
  branding: boolean;
  now?: () => Date;
  log?: (message: string) => void;
}

/** Outcome of one step. */
export interface StepResult {
  id: StepId;
  tool: ToolName;
  version: string;
  status: "ok" | "skipped" | "error" | "no-model";
  reason: string | null;
  /** Output files, relative to the repository. */
  outputs: string[];
  /** The tool's JSON report (or Product Check results), when the step produced one. */
  report: unknown;
}

/** Everything a run produced. */
export interface RunResult {
  steps: StepResult[];
  summary: Summary;
  outDir: string;
}

const STEP_TOOL: Record<StepId, ToolName> = {
  spec: "spec-check",
  impact: "impact-check",
  architecture: "architecture-check",
  outcome: "outcome-check",
  product: "product-check",
};

/** An error thrown by one of the tools: message plus its exit code, when it has one. */
function toolError(error: unknown): { message: string; exitCode: number | null } {
  if (error instanceof Error) {
    const code = (error as { exitCode?: unknown }).exitCode;
    return { message: error.message, exitCode: typeof code === "number" ? code : null };
  }
  return { message: String(error), exitCode: null };
}

/** Loads a tool's config file when it exists in the repository, else its defaults. */
function configOf<T>(cwd: string, file: string, defaults: T, load: (path: string) => T): T {
  const path = join(cwd, file);
  return existsSync(path) ? load(path) : defaults;
}

/** Runs all steps and writes every output plus the summary. */
export async function runCommons(options: RunOptions): Promise<RunResult> {
  const cwd = resolve(options.cwd);
  const outDir = resolve(cwd, options.outDir);
  const now = options.now ?? ((): Date => new Date());
  const log = options.log ?? ((): void => undefined);
  const versions = toolVersions();
  const rel = (path: string): string => {
    const r = relative(cwd, path).split(sep).join("/") || ".";
    return r.startsWith("../") || r === ".." ? path : r;
  };
  /** Output files are listed relative to the output directory. */
  const inOut = (path: string): string => relative(outDir, path).split(sep).join("/");
  const abs = (path: string): string => resolve(cwd, path);

  if (!(STAGES as readonly string[]).includes(options.stage))
    throw usageError(`--stage must be one of ${STAGES.join(", ")} (got "${options.stage}").`);
  for (const file of [
    options.prs,
    options.runs,
    options.npmAudit,
    options.serviceGraph,
    ...options.testResults,
    ...options.openslo,
    ...options.alertRules,
  ])
    if (file !== null && !existsSync(abs(file))) throw inputError(`Input file not found: ${file}`);

  mkdirSync(outDir, { recursive: true });
  const write = (name: string, content: string): string => {
    const path = join(outDir, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content.endsWith("\n") ? content : `${content}\n`);
    return inOut(path);
  };
  const steps: StepResult[] = [];
  const step = (
    id: StepId,
    status: StepResult["status"],
    reason: string | null,
    outputs: string[],
    report: unknown
  ): StepResult => {
    const result: StepResult = {
      id,
      tool: STEP_TOOL[id],
      version: versions[STEP_TOOL[id]],
      status,
      reason,
      outputs,
      report,
    };
    steps.push(result);
    log(`${result.tool}: ${status}${reason ? ` (${reason})` : ""}`);
    return result;
  };
  const skipped = (id: StepId): boolean => options.skip.includes(id);

  // 1. Spec Check.
  let specReport: string | null = null;
  if (skipped("spec")) step("spec", "skipped", "--skip spec", [], null);
  else {
    try {
      const report = specCheck.analyze({
        cwd,
        paths: options.specs.map(abs),
        config: configOf(cwd, ".spec-check.json", specCheck.DEFAULT_CONFIG, specCheck.loadConfigFile),
        configSource: existsSync(join(cwd, ".spec-check.json")) ? ".spec-check.json" : "defaults",
        policy: false,
        excerpts: true,
        now,
      });
      const outputs = [
        write("spec-check.json", specCheck.renderJson(report)),
        write("spec-check.md", specCheck.renderMarkdown(report, { branding: options.branding })),
      ];
      specReport = join(outDir, "spec-check.json");
      step("spec", "ok", null, outputs, report);
    } catch (error) {
      const e = toolError(error);
      step("spec", e.exitCode === 3 ? "skipped" : "error", e.message, [], null);
    }
  }

  // 2. Impact Check: the change report and the module graph, recorded separately.
  let impactReport: string | null = null;
  let graphFile: string | null = null;
  if (skipped("impact")) step("impact", "skipped", "--skip impact", [], null);
  else {
    const config = configOf(
      cwd,
      ".impact-check.json",
      impactCheck.DEFAULT_CONFIG,
      impactCheck.loadConfigFile
    );
    const outputs: string[] = [];
    const problems: string[] = [];
    let report: unknown = null;
    try {
      const r = await impactCheck.analyze({
        cwd,
        base: options.base,
        head: null,
        diffMode: "merge-base",
        config,
        now,
      });
      outputs.push(
        write("impact-check.json", impactCheck.renderJson(r)),
        write("impact-check.md", impactCheck.renderMarkdown(r, { branding: options.branding }))
      );
      impactReport = join(outDir, "impact-check.json");
      report = r;
    } catch (error) {
      problems.push(`change report: ${toolError(error).message}`);
    }
    try {
      const graph = await impactCheck.exportGraph({ cwd, head: null, config, now });
      outputs.push(write("graph.json", `${JSON.stringify(graph, null, 2)}\n`));
      graphFile = join(outDir, "graph.json");
    } catch (error) {
      problems.push(`module graph: ${toolError(error).message}`);
    }
    step(
      "impact",
      problems.length === 0 ? "ok" : "error",
      problems.length ? problems.join("; ") : null,
      outputs,
      report
    );
  }

  // 3. Architecture Check, with the graph and the change report when they exist.
  let architectureReport: string | null = null;
  if (skipped("architecture")) step("architecture", "skipped", "--skip architecture", [], null);
  else {
    const config = configOf(
      cwd,
      ".architecture-check.json",
      architectureCheck.DEFAULT_CONFIG,
      architectureCheck.loadConfigFile
    );
    try {
      const report = architectureCheck.analyze({
        cwd,
        command: "analyze",
        config,
        graphPath: graphFile,
        impactCheckPath: impactReport,
        now,
      });
      const outputs = [
        write("architecture-check.json", architectureCheck.renderJson(report)),
        write(
          "architecture-check.md",
          architectureCheck.renderMarkdown(report, { branding: options.branding })
        ),
      ];
      architectureReport = join(outDir, "architecture-check.json");
      step("architecture", "ok", null, outputs, report);
    } catch (error) {
      const e = toolError(error);
      if (e.exitCode === 3 && /no declared model/i.test(e.message)) {
        try {
          const derived = architectureCheck.analyze({
            cwd,
            command: "derive",
            config,
            graphPath: graphFile,
            now,
          });
          step(
            "architecture",
            "no-model",
            "No declared architecture model; the as-built model is attached for review (nothing was invented).",
            [write("as-built.dsl", architectureCheck.renderDsl(derived))],
            null
          );
        } catch (deriveError) {
          step("architecture", "error", toolError(deriveError).message, [], null);
        }
      } else step("architecture", "error", e.message, [], null);
    }
  }

  // 4. Outcome Check, only with exported PR data.
  let outcomeReport: string | null = null;
  if (skipped("outcome")) step("outcome", "skipped", "--skip outcome", [], null);
  else if (options.prs === null)
    step(
      "outcome",
      "skipped",
      "No --prs export given (see `commons-check --help` for the gh commands).",
      [],
      null
    );
  else {
    try {
      const report = outcomeCheck.analyze({
        prsPath: abs(options.prs),
        runsPath: options.runs === null ? null : abs(options.runs),
        attributionPath: null,
        since: null,
        until: null,
        baselineSince: null,
        baselineUntil: null,
        config: configOf(
          cwd,
          ".outcome-check.json",
          outcomeCheck.DEFAULT_CONFIG,
          outcomeCheck.loadConfigFile
        ),
        configSource: existsSync(join(cwd, ".outcome-check.json")) ? ".outcome-check.json" : "defaults",
        audit: false,
        now,
      });
      const outputs = [
        write("outcome-check.json", outcomeCheck.renderJson(report)),
        write("outcome-check.html", outcomeCheck.renderHtml(report, { branding: options.branding })),
      ];
      outcomeReport = join(outDir, "outcome-check.json");
      step("outcome", "ok", null, outputs, report);
    } catch (error) {
      step("outcome", "error", toolError(error).message, [], null);
    }
  }

  // 5. Product Check, importing every report above that exists. Never given a URL: no network.
  if (skipped("product")) step("product", "skipped", "--skip product", [], null);
  else {
    try {
      const contract = productCheck.applyFlags(
        productCheck.defaultContract(),
        {
          repo: cwd,
          stage: options.stage,
          testResults: options.testResults.map(abs),
          npmAudit: options.npmAudit === null ? undefined : abs(options.npmAudit),
          specCheck: specReport ?? undefined,
          impactCheck: impactReport ?? undefined,
          outcomeCheck: outcomeReport ?? undefined,
          architectureCheck: architectureReport ?? undefined,
          openslo: options.openslo.map(abs),
          alertRules: options.alertRules.map(abs),
          serviceGraph: options.serviceGraph === null ? undefined : abs(options.serviceGraph),
        },
        cwd,
        now().toISOString().slice(0, 10)
      );
      const permissions = productCheck.decidePermissions(contract, false, false);
      const { results } = await productCheck.runAssessment({
        contract,
        permissions,
        baseline: null,
        baseDir: cwd,
        now,
      });
      const branding = { branding: options.branding };
      const outputs = [
        write("product-check/product-check-results.json", `${JSON.stringify(results, null, 2)}\n`),
        write("product-check/report.md", productCheck.renderReport(results, branding)),
        write("product-check/blueprint.md", productCheck.renderBlueprint(results, branding)),
        write("product-check/dashboard.html", productCheck.renderDashboard(results, branding)),
      ];
      for (const packet of results.blueprint.work_packets)
        write(`product-check/work-packets/${packet.id}.md`, productCheck.renderPacket(results, packet));
      if (results.blueprint.work_packets.length > 0) outputs.push("product-check/work-packets/");
      step("product", "ok", null, outputs, results);
    } catch (error) {
      step("product", "error", toolError(error).message, [], null);
    }
  }

  const summary = buildSummary({
    steps,
    repository: basename(cwd),
    stage: options.stage,
    base: options.base,
    generatedAt: now().toISOString(),
    outDir: rel(outDir),
  });
  write("commons-summary.json", `${JSON.stringify(summary, null, 2)}\n`);
  write("SUMMARY.md", renderSummaryMarkdown(summary, { branding: options.branding }));
  return { steps, summary, outDir };
}

/** Product Check lifecycle stages accepted by --stage. */
export const STAGES = Object.keys(productCheck.STAGE_TIER) as readonly string[];
