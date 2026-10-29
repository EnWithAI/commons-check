/** Library entry point. */
export { runCommons, STAGES, STEPS, type RunOptions, type RunResult, type StepId, type StepResult, } from "./run.js";
export { buildSummary, renderSummaryMarkdown, type Summary } from "./summary.js";
export { CommonsCheckError, ExitCode } from "./errors.js";
export { run as runCli } from "./cli/run.js";
export { TOOL_VERSION, toolVersions } from "./version.js";
