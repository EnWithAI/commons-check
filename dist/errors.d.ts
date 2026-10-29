/**
 * Exit codes and the error type of Commons Check (docs/SPEC.md §3). Findings never change the exit code.
 */
/** Exit codes. */
export declare const ExitCode: {
    readonly Ok: 0;
    readonly Internal: 1;
    readonly Usage: 2;
    readonly Input: 3;
    readonly StepError: 4;
};
export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode];
/** An error with the exit code it maps to and an optional hint. */
export declare class CommonsCheckError extends Error {
    readonly exitCode: ExitCodeValue;
    readonly hint: string | undefined;
    constructor(message: string, exitCode: ExitCodeValue, hint?: string);
}
/** A usage error (exit 2). */
export declare const usageError: (message: string, hint?: string) => CommonsCheckError;
/** An input error (exit 3). */
export declare const inputError: (message: string, hint?: string) => CommonsCheckError;
