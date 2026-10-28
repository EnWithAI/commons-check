// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 EnWithAI Technologies
/**
 * Markdown escaping for repository-derived text in SUMMARY.md: no HTML, links, emphasis, code spans or table breaks
 * can be injected, and the text stays on one line.
 */

/** Escapes text for inline Markdown (also inside table cells and code spans' surroundings). */
export function escapeMd(text: string): string {
  return text
    .replace(/[\r\n\u2028\u2029]+/g, " ")
    .replace(/[\\`*_{}[\]<>|~]/g, (c) => `\\${c}`)
    .replace(/&/g, "&amp;")
    .slice(0, 500);
}

/** A code span for paths and identifiers: backticks and line breaks removed, `|` escaped for tables. */
export function code(text: string): string {
  return `\`${text
    .replace(/[`\r\n\u2028\u2029]+/g, " ")
    .replace(/\|/g, "\\|")
    .slice(0, 300)}\``;
}
