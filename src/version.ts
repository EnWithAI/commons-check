// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 EnWithAI Technologies
/**
 * Versions: Commons Check's own (from package.json, which is one level up from both src/ and dist/) and those of
 * the pinned tools (from their published package.json exports).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const versionOf = (path: string): string => {
  const parsed = JSON.parse(readFileSync(path, "utf8")) as { version?: unknown };
  return typeof parsed.version === "string" ? parsed.version : "0.0.0";
};

/** Commons Check package version. */
export const TOOL_VERSION: string = versionOf(fileURLToPath(new URL("../package.json", import.meta.url)));

/** The five tools, in run order. */
export const TOOLS = [
  "spec-check",
  "impact-check",
  "architecture-check",
  "outcome-check",
  "product-check",
] as const;
export type ToolName = (typeof TOOLS)[number];

/** Installed version of each pinned tool. */
export function toolVersions(): Record<ToolName, string> {
  const out = {} as Record<ToolName, string>;
  for (const tool of TOOLS) out[tool] = versionOf(require.resolve(`@enwithai/${tool}/package.json`));
  return out;
}
