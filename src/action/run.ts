// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 EnWithAI Technologies
/**
 * GitHub Action runner (docs/ACTION.md). Reads inputs from INPUT_* environment variables (never from shell
 * interpolation), runs Commons Check in-process, appends SUMMARY.md to the job summary and sets step outputs.
 */
import { appendFileSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { run, type CliIO } from "../cli/run.js";
import { ExitCode } from "../errors.js";
import type { RunResult } from "../run.js";

/** Environment and output seams for tests. */
export interface ActionIO {
  env: Record<string, string | undefined>;
  log: (text: string) => void;
  now?: () => Date;
}

/** True for a relative path without `..` segments. */
const insideWorkspace = (value: string): boolean => {
  const normalized = value.replace(/\\/g, "/");
  return !isAbsolute(normalized) && !normalized.split("/").includes("..");
};

/** Appends `name=value` to the step outputs file when available. */
function setOutput(io: ActionIO, name: string, value: string): void {
  const file = io.env["GITHUB_OUTPUT"];
  if (file) appendFileSync(file, `${name}=${value.replace(/[\r\n]/g, " ")}\n`);
}

/** Runs the action; returns the process exit code. */
export async function runAction(io: ActionIO): Promise<number> {
  const input = (name: string): string => io.env[`INPUT_${name}`]?.trim() ?? "";
  const workspace = io.env["GITHUB_WORKSPACE"] ?? process.cwd();
  const paths: [string, string][] = [
    ["working-directory", input("WORKING_DIRECTORY") || "."],
    ["out-dir", input("OUT_DIR") || "commons-report"],
    ["prs", input("PRS")],
    ["runs", input("RUNS")],
    ...input("SPECS")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .map((s): [string, string] => ["specs", s]),
  ];
  for (const [name, value] of paths)
    if (value !== "" && !insideWorkspace(value)) {
      io.log(`::error::Input ${name} must be a relative path inside the workspace`);
      return ExitCode.Usage;
    }
  const failOnError = input("FAIL_ON_ERROR") || "false";
  if (!["true", "false"].includes(failOnError)) {
    io.log("::error::Input fail-on-error must be true or false");
    return ExitCode.Usage;
  }

  const cwd = resolve(workspace, input("WORKING_DIRECTORY") || ".");
  const argv = ["run", "--cwd", cwd, "--out-dir", input("OUT_DIR") || "commons-report"];
  const add = (flag: string, value: string): void => {
    if (value !== "") argv.push(flag, value);
  };
  add("--stage", input("STAGE"));
  add("--base", input("BASE"));
  add("--prs", input("PRS"));
  add("--runs", input("RUNS"));
  for (const [name, value] of paths) if (name === "specs") argv.push("--specs", value);
  if (failOnError === "true") argv.push("--fail-on-error");

  let result: RunResult | null = null;
  const cli: CliIO = {
    stdout: (t) => io.log(t.trimEnd()),
    stderr: (t) => io.log(t.trimEnd()),
    cwd,
    onResult: (r) => {
      result = r;
    },
    ...(io.now ? { now: io.now } : {}),
  };
  const code = await run(argv, cli);
  const done = result as RunResult | null;
  if (done === null) {
    setOutput(io, "errors", "1");
    io.log(`::error::Commons Check did not run (exit ${code}).`);
    return code;
  }
  const summaryFile = io.env["GITHUB_STEP_SUMMARY"];
  if (summaryFile) appendFileSync(summaryFile, readFileSync(join(done.outDir, "SUMMARY.md"), "utf8"));
  setOutput(io, "out-dir", relative(workspace, done.outDir).split("\\").join("/") || ".");
  setOutput(io, "verdict", done.summary.product?.verdict ?? "none");
  setOutput(io, "errors", String(done.summary.errors));
  for (const st of done.summary.steps)
    if (st.status === "error")
      io.log(`::warning::${st.tool}: ${(st.reason ?? "error").replace(/[\r\n]/g, " ")}`);
  return code;
}
