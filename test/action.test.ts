// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 EnWithAI Technologies
/**
 * The GitHub Action runner, in-process: inputs from the environment, job summary, step outputs, path checks.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runAction } from "../src/action/run.js";
import { gitRepo, NOW, SHOP } from "./helpers.js";

describe("GitHub Action", () => {
  it("runs from INPUT_* variables, appends the job summary and sets outputs", async () => {
    const dir = gitRepo(SHOP);
    const summary = join(dir, "..", `summary-${Date.now()}.md`);
    const output = join(dir, "..", `output-${Date.now()}.txt`);
    writeFileSync(summary, "");
    writeFileSync(output, "");
    const logs: string[] = [];
    const code = await runAction({
      env: {
        GITHUB_WORKSPACE: dir,
        GITHUB_STEP_SUMMARY: summary,
        GITHUB_OUTPUT: output,
        INPUT_STAGE: "PRE_LAUNCH",
        INPUT_SPECS: "specs\n",
        INPUT_PRS: "ops/prs.json",
        INPUT_OUT_DIR: "commons-report",
        INPUT_FAIL_ON_ERROR: "true",
      },
      log: (t) => logs.push(t),
      now: () => NOW,
    });
    expect(code).toBe(0);
    expect(readFileSync(summary, "utf8")).toContain("# Engineering Commons check");
    const outputs = readFileSync(output, "utf8");
    expect(outputs).toContain("out-dir=commons-report\n");
    expect(outputs).toMatch(/verdict=(READY|READY_WITH_CONDITIONS|NOT_READY|INCONCLUSIVE)\n/);
    expect(outputs).toContain("errors=0\n");
  });

  it("rejects paths outside the workspace and bad booleans", async () => {
    const dir = gitRepo(SHOP);
    for (const env of [{ INPUT_OUT_DIR: "../x" }, { INPUT_SPECS: "/etc" }, { INPUT_FAIL_ON_ERROR: "yes" }]) {
      const logs: string[] = [];
      const code = await runAction({ env: { GITHUB_WORKSPACE: dir, ...env }, log: (t) => logs.push(t) });
      expect(code, JSON.stringify(env)).toBe(2);
      expect(logs.join("\n")).toMatch(/::error::/);
    }
  });
});
