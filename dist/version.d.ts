/** Commons Check package version. */
export declare const TOOL_VERSION: string;
/** The six tools, in run order. */
export declare const TOOLS: readonly ["spec-check", "impact-check", "architecture-check", "outcome-check", "product-check", "blueprint-check"];
export type ToolName = (typeof TOOLS)[number];
/** Installed version of each pinned tool. */
export declare function toolVersions(): Record<ToolName, string>;
