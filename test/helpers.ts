// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 EnWithAI Technologies
/**
 * Test helpers: synthetic repositories (tests may start git; src/ may not) and an in-process CLI runner.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { run } from "../src/cli/run.js";
import type { RunResult } from "../src/run.js";

export const NOW = new Date("2026-10-28T12:00:00.000Z");

/** Writes files into a fresh temporary directory. */
export function tempDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "commons-check-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

/** Runs git with a fixed identity. */
export function git(dir: string, ...args: string[]): string {
  return execFileSync("git", ["-c", "user.name=T", "-c", "user.email=t@example.invalid", ...args], {
    cwd: dir,
    encoding: "utf8",
  });
}

/** Creates a git repository: `base` committed on main, then `change` written to the working tree. */
export function gitRepo(base: Record<string, string>, change: Record<string, string> = {}): string {
  const dir = tempDir(base);
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "base");
  for (const [path, content] of Object.entries(change)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

/** CLI result. */
export interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
  result: RunResult | null;
}

/** Runs the CLI in-process with a fixed clock. */
export async function cli(args: string[], cwd: string): Promise<CliResult> {
  let stdout = "";
  let stderr = "";
  let result: RunResult | null = null;
  const code = await run(args, {
    stdout: (t) => (stdout += t),
    stderr: (t) => (stderr += t),
    cwd,
    now: () => NOW,
    onResult: (r) => (result = r),
  });
  return { code, stdout, stderr, result };
}

/** A small product repository with a spec, a model, code, tests and PR exports. */
export const SHOP: Record<string, string> = {
  "package.json": JSON.stringify(
    { name: "shop", version: "1.0.0", scripts: { test: "vitest run" } },
    null,
    2
  ),
  "README.md": "# Shop\n\nRun `npm ci` then `npm test`.\n",
  ".gitignore": "node_modules\n.env*\ncommons-report/\n",
  "src/index.ts":
    'import { total } from "./cart/total.js";\nexport const run = (): number => total([1, 2]);\n',
  "src/cart/total.ts": "export const total = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);\n",
  "src/cart/total.test.ts": "test('total', () => {});\n",
  "specs/001-cart/spec.md": [
    "# Feature: Cart total",
    "",
    "## User Scenarios & Testing",
    "",
    "### User Story 1 - See the total (Priority: P1)",
    "",
    "A shopper sees the cart total.",
    "",
    "## Requirements",
    "",
    "- **FR-001**: System MUST show the total [NEEDS CLARIFICATION: tax included?]",
    "",
    "## Success Criteria",
    "",
    "- **SC-001**: The page is fast.",
    "",
  ].join("\n"),
  "architecture/workspace.dsl": [
    'workspace "Shop" {',
    "    !identifiers hierarchical",
    "    model {",
    '        shop = softwareSystem "Shop" {',
    '            app = container "Shop app" "" "Node.js" {',
    "                properties {",
    '                    "commons.source" "."',
    "                }",
    "            }",
    "        }",
    "    }",
    "}",
    "",
  ].join("\n"),
  "ops/junit.xml":
    '<testsuites><testsuite name="unit"><testcase name="total"/><testcase name="empty"/></testsuite></testsuites>\n',
  "ops/prs.json": JSON.stringify(
    [1, 2, 3].map((n) => ({
      number: n,
      title: `PR ${n}`,
      state: "MERGED",
      isDraft: false,
      createdAt: `2026-10-0${n}T10:00:00Z`,
      closedAt: `2026-10-0${n}T12:00:00Z`,
      mergedAt: `2026-10-0${n}T12:00:00Z`,
      author: { login: "dev" },
      labels: [],
      additions: 10,
      deletions: 2,
      reviews: [],
      commits: [{ oid: `abc${n}` }],
    })),
    null,
    2
  ),
};
