import type { StepResult } from "./run.js";
/** One finding in the summary. */
export interface TopFinding {
    rule_id: string;
    severity: string;
    status: string;
    summary: string;
    location: string | null;
}
/** One step in the summary. */
export interface StepSummary {
    id: string;
    tool: string;
    version: string;
    status: StepResult["status"];
    reason: string | null;
    outputs: string[];
    findings: {
        total: number;
        by_severity: Record<string, number>;
        by_status: Record<string, number>;
    } | null;
    top: TopFinding[];
}
/** Product Check's part of the summary. */
export interface ProductSummary {
    verdict: string;
    tier: string;
    pillars: Record<string, {
        score: number | null;
        state: string;
        coverage: number;
        confidence: string;
    }>;
    open_findings: Record<string, number>;
    not_tested: {
        control_id: string;
        title: string;
        reason: string | null;
    }[];
    blocked: {
        control_id: string;
        title: string;
        reason: string | null;
    }[];
}
/** One recommended action. */
export interface Action {
    source: string;
    severity: string;
    summary: string;
    action: string;
    location: string | null;
}
/** The whole summary (commons-summary.json). */
export interface Summary {
    schema_version: "1.0";
    kind: "commons-summary";
    tool: {
        name: "commons-check";
        version: string;
    };
    repository: string;
    generated_at: string;
    stage: string;
    base: string | null;
    out_dir: string;
    steps: StepSummary[];
    product: ProductSummary | null;
    outcome: {
        id: string;
        title: string;
        value: number | null;
        unit: string;
        reason: string | null;
    }[] | null;
    actions: Action[];
    needs_confirmation: number;
    errors: number;
}
/** Input to buildSummary. */
export interface SummaryInput {
    steps: StepResult[];
    repository: string;
    stage: string;
    base: string | null;
    generatedAt: string;
    outDir: string;
}
/** Builds the summary from the step results. */
export declare function buildSummary(input: SummaryInput): Summary;
/** Renders SUMMARY.md. Every repository-derived string is escaped. */
export declare function renderSummaryMarkdown(s: Summary, options: {
    branding: boolean;
}): string;
