import { type Summary } from "./summary.js";
import { type ToolName } from "./version.js";
/** Step identifiers, as used by --skip. */
export declare const STEPS: readonly ["spec", "impact", "architecture", "outcome", "product"];
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
/** Runs all steps and writes every output plus the summary. */
export declare function runCommons(options: RunOptions): Promise<RunResult>;
/** Product Check lifecycle stages accepted by --stage. */
export declare const STAGES: readonly string[];
