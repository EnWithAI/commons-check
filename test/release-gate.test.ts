// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 EnWithAI Technologies
/**
 * Product Check's release gate (docs/SPEC.md §4 step 5, §5): Commons Check reads an existing release-gate.json,
 * reports its decision unchanged, and says whether it describes the commit that was just assessed. It never
 * evaluates the gate itself and never starts Product Check's workflow (tests may start processes; src/ may not).
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cli, git, gitRepo, SHOP } from "./helpers.js";

const require = createRequire(import.meta.url);
const PRODUCT_CLI = join(
  require.resolve("@enwithai/product-check/package.json"),
  "..",
  "dist",
  "cli",
  "main.js"
);
const ONLY_PRODUCT = ["--skip", "spec", "--skip", "impact", "--skip", "architecture", "--skip", "outcome"];

/** A repository whose owner has run Product Check's assurance workflow (run → register → assure). */
function assuredRepo(): string {
  const dir = gitRepo({ ...SHOP, ".gitignore": `${SHOP[".gitignore"]}.product-check/\n` });
  const pc = (...args: string[]): string =>
    execFileSync(process.execPath, [PRODUCT_CLI, ...args], { cwd: dir, encoding: "utf8" });
  pc("run", "--repo", ".", "--out-dir", ".product-check", "--quiet");
  pc("register", "--repo", ".");
  pc("assure");
  return dir;
}

const gateOf = (dir: string): { decision: string; head_sha: string; product_verdict: string } =>
  JSON.parse(readFileSync(join(dir, ".product-check", "release-gate.json"), "utf8")) as {
    decision: string;
    head_sha: string;
    product_verdict: string;
  };

describe("Product Check release gate", () => {
  it("reports a recorded gate unchanged and confirms it describes the assessed commit", async () => {
    const dir = assuredRepo();
    const gate = gateOf(dir);
    const r = await cli([...ONLY_PRODUCT, "--quiet"], dir);
    expect(r.code).toBe(0);
    const g = r.result!.summary.release_gate;
    expect(g).toMatchObject({
      file: ".product-check/release-gate.json",
      status: "read",
      reason: null,
      decision: gate.decision,
      product_verdict: gate.product_verdict,
      gate_commit: gate.head_sha,
      scanned_commit: gate.head_sha,
      current: true,
    });
    const md = readFileSync(join(dir, "commons-report", "SUMMARY.md"), "utf8");
    expect(md).toContain(`## Product Check release gate: ${gate.decision}`);
    expect(md).toContain("not re-evaluated");
  });

  it("flags a gate recorded for an older commit", async () => {
    const dir = assuredRepo();
    const gate = gateOf(dir);
    writeFileSync(join(dir, "src", "extra.ts"), "export const extra = 1;\n");
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", "later");
    const r = await cli([...ONLY_PRODUCT, "--quiet"], dir);
    const g = r.result!.summary.release_gate!;
    expect(g.gate_commit).toBe(gate.head_sha);
    expect(g.scanned_commit).not.toBe(gate.head_sha);
    expect(g.current).toBe(false);
    const md = readFileSync(join(dir, "commons-report", "SUMMARY.md"), "utf8");
    expect(md).toContain("describes an older commit");
  });

  it("reports an invalid gate file without failing the run; no file means no gate section", async () => {
    const dir = gitRepo({
      ...SHOP,
      "ops/gate.json": JSON.stringify({ kind: "release-gate", decision: "GO" }),
    });
    const r = await cli([...ONLY_PRODUCT, "--release-gate", "ops/gate.json", "--quiet"], dir);
    expect(r.code).toBe(0);
    const g = r.result!.summary.release_gate!;
    expect(g.status).toBe("invalid");
    expect(g.decision).toBeNull();
    expect(g.reason).toMatch(/schema/i);

    const plain = gitRepo(SHOP);
    const p = await cli([...ONLY_PRODUCT, "--quiet"], plain);
    expect(p.result!.summary.release_gate).toBeNull();
    expect(readFileSync(join(plain, "commons-report", "SUMMARY.md"), "utf8")).not.toContain("release gate");

    const missing = await cli(["--release-gate", "ops/none.json", "--quiet"], plain);
    expect(missing.code).toBe(3);
  });
});
