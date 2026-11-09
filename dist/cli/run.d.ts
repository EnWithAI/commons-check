import { type RunResult } from "../run.js";
/** Where output goes; injectable for tests and the Action. */
export interface CliIO {
    stdout: (text: string) => void;
    stderr: (text: string) => void;
    cwd: string;
    now?: () => Date;
    /** Receives the run result (used by the Action). */
    onResult?: (result: RunResult) => void;
}
/** Runs the CLI and returns the exit code. */
export declare function run(argv: string[], io: CliIO): Promise<number>;
