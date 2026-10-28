// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 EnWithAI Technologies
/**
 * Unit tests: escaping, summary ordering and the facts-only action list, and the source-code invariants.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { code, escapeMd } from "../src/escape.js";
import type { StepResult } from "../src/run.js";
import { buildSummary, renderSummaryMarkdown } from "../src/summary.js";

const finding = (rule_id: string, severity: string, status: string, summary = `${rule_id} summary`) => ({
  rule_id,
  severity,
  status,
  summary,
  recommended_human_action: `Fix ${rule_id}.`,
  evidence: [{ path: "a/b.ts", line_start: 3 }],
});

const step = (id: StepResult["id"], findings: object[]): StepResult => ({
  id,
  tool: id === "spec" ? "spec-check" : id === "impact" ? "impact-check" : "architecture-check",
  version: "1.0.0",
  status: "ok",
  reason: null,
  outputs: [],
  report: { findings },
});

describe("escaping", () => {
  it("neutralizes Markdown, HTML, links and line breaks", () => {
    const evil = "<img src=x onerror=alert(1)> [click](http://x) **b** | `c`\nnext\u2028line";
    const e = escapeMd(evil);
    expect(e).not.toMatch(/(?<!\\)[<>[\]|`*]/);
    expect(e).not.toContain("\n");
    expect(e).not.toContain("\u2028");
    expect(code("a`b|c\nd")).toBe("`a b\\|c d`");
    expect(code("src/my_file.ts")).toBe("`src/my_file.ts`");
  });
});

describe("summary", () => {
  it("orders findings by severity then status, and lists only facts as actions", () => {
    const s = buildSummary({
      steps: [
        step("spec", [
          finding("vague-term", "low", "verified_static_fact"),
          finding("open-marker", "medium", "hypothesis"),
          finding("needs-clarification", "high", "verified_static_fact"),
        ]),
        step("architecture", [
          finding("boundary-violation", "high", "hypothesis"),
          finding("relationship-undeclared", "medium", "verified_static_fact"),
          finding("relationship-unobserved", "info", "unknown"),
        ]),
      ],
      repository: "shop",
      stage: "ALPHA",
      base: null,
      generatedAt: "2026-10-28T12:00:00.000Z",
      outDir: "commons-report",
    });
    expect(s.steps[0]?.top.map((f) => f.rule_id)).toEqual([
      "needs-clarification",
      "open-marker",
      "vague-term",
    ]);
    expect(s.steps[0]?.top[0]?.location).toBe("a/b.ts:3");
    expect(s.actions.map((a) => a.source)).toEqual([
      "spec-check needs-clarification",
      "architecture-check relationship-undeclared",
    ]);
    expect(s.needs_confirmation).toBe(3);
    expect(s.steps[1]?.findings).toEqual({
      total: 3,
      by_severity: { high: 1, medium: 1, info: 1 },
      by_status: { hypothesis: 1, verified_static_fact: 1, unknown: 1 },
    });
  });

  it("escapes repository-derived text in SUMMARY.md", () => {
    const s = buildSummary({
      steps: [
        step("spec", [
          finding("needs-clarification", "high", "verified_static_fact", "<script>x</script> | [l](u)"),
        ]),
      ],
      repository: "r`epo",
      stage: "ALPHA",
      base: "main",
      generatedAt: "2026-10-28T12:00:00.000Z",
      outDir: "commons-report",
    });
    const md = renderSummaryMarkdown(s, { branding: false });
    expect(md).not.toContain("<script>");
    expect(md).toContain("\\<script\\>");
    expect(md).toContain("\\[l\\](u)");
    expect(md).toContain("`r epo`");
  });
});

describe("source invariants", () => {
  it("src/ starts no processes, opens no connections and evaluates no code", () => {
    const root = fileURLToPath(new URL("../src", import.meta.url));
    const files = readdirSync(root, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(5);
    for (const f of files) {
      const text = readFileSync(join(root, f), "utf8");
      expect(text, f).not.toMatch(/node:(child_process|http|https|net|tls|dgram|vm|worker_threads)/);
      expect(text, f).not.toMatch(/\beval\s*\(|new Function\s*\(|\bimport\s*\(/);
    }
  });
});
