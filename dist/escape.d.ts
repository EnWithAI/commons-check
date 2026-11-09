/**
 * Markdown escaping for repository-derived text in SUMMARY.md: no HTML, links, emphasis, code spans or table breaks
 * can be injected, and the text stays on one line.
 */
/** Escapes text for inline Markdown (also inside table cells and code spans' surroundings). */
export declare function escapeMd(text: string): string;
/** A code span for paths and identifiers: backticks and line breaks removed, `|` escaped for tables. */
export declare function code(text: string): string;
