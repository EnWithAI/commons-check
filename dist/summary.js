// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 EnWithAI Technologies
/**
 * The summary (docs/SPEC.md §5): built only from the tools' own reports, with their statuses unchanged.
 * Hypotheses and unknowns are counted and shown, never put on the "what to do first" list.
 */
import { code, escapeMd } from "./escape.js";
import { TOOL_VERSION } from "./version.js";
const SEVERITY_RANK = { high: 0, medium: 1, low: 2, info: 3 };
const STATUS_RANK = { verified_static_fact: 0, hypothesis: 1, unknown: 2 };
const STATIC_STEPS = new Set(["spec", "impact", "architecture"]);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** `path:line` of a finding's first evidence item. */
function locationOf(f) {
    const e = f.evidence?.[0];
    if (!e?.path)
        return null;
    return typeof e.line_start === "number" ? `${e.path}:${e.line_start}` : e.path;
}
const byImportance = (a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
    (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9) ||
    (a.rule_id < b.rule_id ? -1 : a.rule_id > b.rule_id ? 1 : 0);
function findingsOf(report) {
    return isObj(report) && Array.isArray(report["findings"]) ? report["findings"] : [];
}
function count(values) {
    const out = {};
    for (const v of values)
        out[v] = (out[v] ?? 0) + 1;
    return out;
}
/** Builds the summary from the step results. */
export function buildSummary(input) {
    const steps = input.steps.map((s) => {
        const isStatic = STATIC_STEPS.has(s.id) && s.report !== null;
        const findings = isStatic ? findingsOf(s.report) : [];
        return {
            id: s.id,
            tool: s.tool,
            version: s.version,
            status: s.status,
            reason: s.reason,
            outputs: s.outputs,
            findings: isStatic
                ? {
                    total: findings.length,
                    by_severity: count(findings.map((f) => f.severity)),
                    by_status: count(findings.map((f) => f.status)),
                }
                : null,
            top: [...findings]
                .sort(byImportance)
                .slice(0, 3)
                .map((f) => ({
                rule_id: f.rule_id,
                severity: f.severity,
                status: f.status,
                summary: f.summary,
                location: locationOf(f),
            })),
        };
    });
    const productStep = input.steps.find((s) => s.id === "product" && s.status === "ok");
    const product = productStep ? productSummary(productStep.report) : null;
    const outcomeStep = input.steps.find((s) => s.id === "outcome" && s.status === "ok");
    // What to do first: facts only, Product Check P0/P1 before verified high, then verified medium.
    const actions = [];
    if (productStep && isObj(productStep.report)) {
        const pf = Array.isArray(productStep.report["findings"]) ? productStep.report["findings"] : [];
        for (const severity of ["P0", "P1"])
            for (const f of pf)
                if (f["severity"] === severity &&
                    f["epistemic"] === "fact" &&
                    (f["status"] === "OPEN" || f["status"] === "UNVERIFIED"))
                    actions.push({
                        source: `product-check ${String(f["control_id"])}`,
                        severity,
                        summary: String(f["title"]),
                        action: `Expected: ${String(f["expected"])}`,
                        location: typeof f["location"] === "string" ? f["location"] : null,
                    });
    }
    for (const severity of ["high", "medium"])
        for (const s of input.steps)
            if (STATIC_STEPS.has(s.id))
                for (const f of findingsOf(s.report).sort(byImportance))
                    if (f.severity === severity && f.status === "verified_static_fact")
                        actions.push({
                            source: `${s.tool} ${f.rule_id}`,
                            severity,
                            summary: f.summary,
                            action: f.recommended_human_action ?? "",
                            location: locationOf(f),
                        });
    return {
        schema_version: "1.0",
        kind: "commons-summary",
        tool: { name: "commons-check", version: TOOL_VERSION },
        repository: input.repository,
        generated_at: input.generatedAt,
        stage: input.stage,
        base: input.base,
        out_dir: input.outDir,
        steps,
        product,
        outcome: outcomeStep ? outcomeSummary(outcomeStep.report) : null,
        actions: actions.slice(0, 5),
        needs_confirmation: input.steps
            .filter((s) => STATIC_STEPS.has(s.id))
            .flatMap((s) => findingsOf(s.report))
            .filter((f) => f.status !== "verified_static_fact").length,
        errors: input.steps.filter((s) => s.status === "error").length,
    };
}
function productSummary(report) {
    if (!isObj(report) || !isObj(report["verdict"]) || !isObj(report["scorecard"]))
        return null;
    const scorecard = report["scorecard"];
    const pillars = {};
    if (isObj(scorecard["pillars"]))
        for (const [name, p] of Object.entries(scorecard["pillars"]))
            if (isObj(p))
                pillars[name] = {
                    score: typeof p["score"] === "number" ? p["score"] : null,
                    state: String(p["state"]),
                    coverage: typeof p["coverage"] === "number" ? p["coverage"] : 0,
                    confidence: String(p["confidence"]),
                };
    const validations = Array.isArray(report["validations"])
        ? report["validations"]
        : [];
    const listed = (status) => validations
        .filter((v) => v["status"] === status)
        .map((v) => ({
        control_id: String(v["control_id"]),
        title: String(v["title"]),
        reason: typeof v["reason"] === "string" ? v["reason"] : null,
    }));
    return {
        verdict: String(report["verdict"]["verdict"]),
        tier: String(report["verdict"]["tier"]),
        pillars,
        open_findings: isObj(scorecard["open_findings"])
            ? scorecard["open_findings"]
            : {},
        not_tested: listed("NOT_TESTED"),
        blocked: listed("BLOCKED"),
    };
}
function outcomeSummary(report) {
    if (!isObj(report) || !Array.isArray(report["metrics"]))
        return null;
    return report["metrics"].map((m) => {
        const all = isObj(m["segments"]) && isObj(m["segments"]["all"]) ? m["segments"]["all"] : {};
        return {
            id: String(m["id"]),
            title: String(m["title"]),
            value: typeof all["value"] === "number" ? all["value"] : null,
            unit: String(m["unit"]),
            reason: typeof all["unavailable_reason"] === "string" ? all["unavailable_reason"] : null,
        };
    });
}
const STATUS_WORD = {
    verified_static_fact: "fact",
    hypothesis: "hypothesis — confirm",
    unknown: "unknown",
};
const pct = (v) => `${Math.round(v * 100)}%`;
const fmtValue = (value, unit) => unit === "ratio" ? pct(value) : Number.isInteger(value) ? String(value) : value.toFixed(2);
/** Renders SUMMARY.md. Every repository-derived string is escaped. */
export function renderSummaryMarkdown(s, options) {
    const out = [];
    out.push("# Engineering Commons check", "");
    out.push(`Repository ${code(s.repository)} · Product Check stage ${code(s.stage)}${s.base ? ` · Impact Check base ${code(s.base)}` : ""} · ${s.generated_at}`, "");
    out.push("> Report only. Every finding, status and verdict below comes from the tool that produced it. A **fact** was verified statically; a **hypothesis** needs a person to confirm it; **unknown** cannot be determined statically. NOT_TESTED is never a pass.", "");
    out.push("| Step | Tool | Status | Findings | Outputs |", "|---|---|---|---|---|");
    for (const st of s.steps) {
        const f = st.findings
            ? `${st.findings.total} (${["high", "medium", "low", "info"].map((k) => `${k} ${st.findings?.by_severity[k] ?? 0}`).join(" · ")})`
            : "—";
        const status = st.reason ? `${st.status}: ${escapeMd(st.reason)}` : st.status;
        out.push(`| ${st.id} | ${st.tool} ${st.version} | ${status} | ${f} | ${st.outputs.map((o) => code(o)).join(", ") || "—"} |`);
    }
    out.push("");
    if (s.product) {
        const p = s.product;
        out.push(`## Product Check: ${escapeMd(p.verdict)} at ${escapeMd(p.tier)}`, "");
        out.push("| Pillar | Score | Coverage | Confidence |", "|---|---:|---:|---|");
        for (const [name, pillar] of Object.entries(p.pillars))
            out.push(`| ${name} | ${pillar.score === null ? `not scored (${pillar.state})` : pillar.score} | ${pct(pillar.coverage)} | ${pillar.confidence} |`);
        out.push("", `Open findings: ${["P0", "P1", "P2", "P3"].map((k) => `${k} ${p.open_findings[k] ?? 0}`).join(" · ")}`, "");
        if (p.not_tested.length > 0 || p.blocked.length > 0) {
            out.push("<details><summary>Controls not tested or blocked (" +
                (p.not_tested.length + p.blocked.length) +
                ")</summary>", "");
            for (const c of [
                ...p.blocked.map((c) => ({ ...c, s: "BLOCKED" })),
                ...p.not_tested.map((c) => ({ ...c, s: "NOT_TESTED" })),
            ])
                out.push(`- ${code(c.control_id)} ${c.s} — ${escapeMd(c.title)}${c.reason ? `: ${escapeMd(c.reason)}` : ""}`);
            out.push("", "</details>", "");
        }
    }
    if (s.outcome) {
        out.push("## Outcome Check (all PRs)", "");
        for (const m of s.outcome)
            out.push(`- ${escapeMd(m.title)}: ${m.value === null ? `withheld${m.reason ? ` (${escapeMd(m.reason)})` : ""}` : fmtValue(m.value, m.unit)}`);
        out.push("");
    }
    for (const st of s.steps.filter((x) => x.top.length > 0)) {
        out.push(`## ${st.tool}: top findings`, "");
        for (const f of st.top)
            out.push(`- **${f.severity}** ${code(f.rule_id)} (${STATUS_WORD[f.status] ?? escapeMd(f.status)}) — ${escapeMd(f.summary)}${f.location ? ` · ${code(f.location)}` : ""}`);
        out.push("");
    }
    out.push("## What to do first", "");
    if (s.actions.length === 0)
        out.push("No verified high- or medium-severity findings and no open P0/P1 facts.");
    s.actions.forEach((a, i) => out.push(`${i + 1}. **${a.severity}** ${escapeMd(a.summary)} (${escapeMd(a.source)}${a.location ? `, ${code(a.location)}` : ""}). ${escapeMd(a.action)}`));
    out.push("", `${s.needs_confirmation} hypothesis or unknown finding(s) need a person to confirm before acting.${s.errors ? ` ${s.errors} step(s) ended in error; see the table above.` : ""}`);
    if (options.branding)
        out.push("", `<sub>Commons Check ${s.tool.version} · offline · no code executed · no model used · An EnWithAI Engineering Commons tool · [crewpe.ai](https://crewpe.ai)</sub>`);
    return `${out.join("\n")}\n`;
}
