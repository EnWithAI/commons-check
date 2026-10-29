// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 EnWithAI Technologies
/**
 * End-to-end cases from docs/SPEC.md §8: a synthetic repository through all five tools, degraded repositories, and
 * the usage contract.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cli, gitRepo, SHOP, tempDir } from "./helpers.js";

const change = {
  "src/cart/total.ts": "export const total = (xs: number[]): number => xs.reduce((a, b) => a + b, 1);\n",
};

describe("full run", () => {
  it("runs all five tools, wires their outputs and writes one summary", async () => {
    const dir = gitRepo(SHOP, change);
    const r = await cli(
      ["--stage", "LAUNCH_GATE", "--prs", "ops/prs.json", "--test-results", "ops/junit.xml", "--quiet"],
      dir
    );
    expect(r.code).toBe(0);
    const s = r.result!.summary;
    expect(s.steps.map((x) => `${x.id}:${x.status}`)).toEqual([
      "spec:ok",
      "impact:ok",
      "architecture:ok",
      "outcome:ok",
      "product:ok",
    ]);
    const out = join(dir, "commons-report");
    for (const f of [
      "spec-check.json",
      "spec-check.md",
      "impact-check.json",
      "impact-check.md",
      "graph.json",
      "architecture-check.json",
      "architecture-check.md",
      "outcome-check.json",
      "outcome-check.html",
      "product-check/product-check-results.json",
      "product-check/report.md",
      "product-check/dashboard.html",
      "SUMMARY.md",
      "commons-summary.json",
    ])
      expect(existsSync(join(out, f)), f).toBe(true);

    // Product Check imported every report produced above.
    const results = JSON.parse(
      readFileSync(join(out, "product-check/product-check-results.json"), "utf8")
    ) as {
      contract: { imports: Record<string, unknown> };
    };
    for (const key of ["spec_check", "impact_check", "architecture_check", "outcome_check"])
      expect(results.contract.imports[key], key).toMatch(/commons-report/);

    // The spec's unresolved clarification is a verified high finding, located, and first on the action list.
    const spec = s.steps.find((x) => x.id === "spec")!;
    expect(spec.top[0]).toMatchObject({
      rule_id: "needs-clarification",
      severity: "high",
      status: "verified_static_fact",
    });
    expect(spec.top[0]?.location).toMatch(/^specs\/001-cart\/spec\.md:\d+$/);
    expect(s.actions.length).toBeGreaterThan(0);
    expect(s.actions.every((a) => a.severity !== "low")).toBe(true);
    expect(s.actions.some((a) => a.source === "spec-check needs-clarification")).toBe(true);

    // Product Check: verdict, pillars, and NOT_TESTED controls with reasons.
    expect(s.product?.tier).toBe("CT-T3");
    expect(Object.keys(s.product!.pillars).sort()).toEqual(["customer", "technology", "trust"]);
    expect(s.product!.not_tested.length).toBeGreaterThan(0);
    expect(s.product!.not_tested.every((c) => c.reason !== null)).toBe(true);
    expect(s.outcome?.some((m) => m.id === "acceptance_rate")).toBe(true);

    const md = readFileSync(join(out, "SUMMARY.md"), "utf8");
    expect(md).toContain("# Engineering Commons check");
    expect(md).toContain("## Product Check:");
    expect(md).toContain("## What to do first");
    expect(md).toContain("`needs-clarification`");
    expect(md).toContain("NOT_TESTED is never a pass");
    expect(JSON.parse(readFileSync(join(out, "commons-summary.json"), "utf8"))).toEqual(s);
  });
});

describe("Outcome Check exports", () => {
  it("accepts the paginated JSON Lines PR export (Outcome Check 0.2.0)", async () => {
    const lines = (JSON.parse(SHOP["ops/prs.json"]!) as object[]).map((r) => JSON.stringify(r)).join("\n");
    const dir = gitRepo({ ...SHOP, "ops/prs.jsonl": `${lines}\n` });
    const r = await cli(["--prs", "ops/prs.jsonl", "--skip", "product", "--quiet"], dir);
    expect(r.code).toBe(0);
    const outcome = r.result!.summary.steps.find((x) => x.id === "outcome")!;
    expect(outcome.status, outcome.reason ?? "").toBe("ok");
    expect(r.result!.summary.outcome?.find((m) => m.id === "acceptance_rate")?.value).toBe(1);
  });
});

describe("degraded repositories", () => {
  it("no specs, no model: Spec Check skipped, as-built model attached, Product Check still runs", async () => {
    const files = { ...SHOP };
    delete files["specs/001-cart/spec.md"];
    delete files["architecture/workspace.dsl"];
    const dir = gitRepo(files);
    const r = await cli(["--quiet"], dir);
    expect(r.code).toBe(0);
    const byId = Object.fromEntries(r.result!.summary.steps.map((x) => [x.id, x]));
    expect(byId["spec"]?.status).toBe("skipped");
    expect(byId["architecture"]?.status).toBe("no-model");
    expect(byId["architecture"]?.reason).toMatch(/nothing was invented/);
    expect(existsSync(join(dir, "commons-report", "as-built.dsl"))).toBe(true);
    expect(byId["outcome"]?.status).toBe("skipped");
    expect(byId["product"]?.status).toBe("ok");
    expect(r.result!.summary.product?.tier).toBe("CT-T1");
  });

  it("not a git repository: Impact Check errors, the rest continues; --fail-on-error exits 4", async () => {
    const dir = tempDir(SHOP);
    const r = await cli(["--quiet"], dir);
    expect(r.code).toBe(0);
    const impact = r.result!.summary.steps.find((x) => x.id === "impact")!;
    expect(impact.status).toBe("error");
    expect(impact.reason).toMatch(/change report: .*; module graph: /);
    expect(r.result!.summary.steps.find((x) => x.id === "spec")?.status).toBe("ok");
    expect(r.result!.summary.steps.find((x) => x.id === "architecture")?.status).toBe("ok");
    expect(r.result!.summary.errors).toBe(1);
    expect((await cli(["--quiet", "--fail-on-error", "--skip", "product"], dir)).code).toBe(4);
  });

  it("--skip and --out-dir are honored", async () => {
    const dir = gitRepo(SHOP);
    const r = await cli(
      ["--skip", "product", "--skip", "outcome", "--out-dir", "out/x", "--no-branding"],
      dir
    );
    expect(r.code).toBe(0);
    expect(r.result!.summary.steps.find((x) => x.id === "product")?.reason).toBe("--skip product");
    expect(existsSync(join(dir, "out/x/SUMMARY.md"))).toBe(true);
    expect(readFileSync(join(dir, "out/x/SUMMARY.md"), "utf8")).not.toContain("crewpe.ai");
    expect(r.stderr).toContain("steps ok");
  });
});

describe("usage contract", () => {
  it("help, version, usage and input errors", async () => {
    const dir = tempDir({ "a.txt": "x" });
    const help = await cli(["--help"], dir);
    expect(help.code).toBe(0);
    expect(help.stdout).toContain("gh pr list");
    expect(help.stdout).toContain("fetch-depth: 0");
    expect((await cli(["--version"], dir)).stdout.trim()).toBe(
      (JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string })
        .version
    );
    for (const args of [
      ["--bogus"],
      ["nope"],
      ["run", "extra"],
      ["--skip", "everything"],
      ["--stage", "SOON"],
    ])
      expect((await cli(args, dir)).code, args.join(" ")).toBe(2);
    expect((await cli(["--cwd", "missing-dir"], dir)).code).toBe(3);
    expect((await cli(["--prs", "missing.json"], dir)).code).toBe(3);
  });
});
