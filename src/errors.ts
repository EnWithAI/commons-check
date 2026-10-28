// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 EnWithAI Technologies
/**
 * Exit codes and the error type of Commons Check (docs/SPEC.md §3). Findings never change the exit code.
 */

/** Exit codes. */
export const ExitCode = {
  Ok: 0,
  Internal: 1,
  Usage: 2,
  Input: 3,
  StepError: 4,
} as const;
export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode];

/** An error with the exit code it maps to and an optional hint. */
export class CommonsCheckError extends Error {
  readonly exitCode: ExitCodeValue;
  readonly hint: string | undefined;
  constructor(message: string, exitCode: ExitCodeValue, hint?: string) {
    super(message);
    this.name = "CommonsCheckError";
    this.exitCode = exitCode;
    this.hint = hint;
  }
}

/** A usage error (exit 2). */
export const usageError = (message: string, hint?: string): CommonsCheckError =>
  new CommonsCheckError(message, ExitCode.Usage, hint);

/** An input error (exit 3). */
export const inputError = (message: string, hint?: string): CommonsCheckError =>
  new CommonsCheckError(message, ExitCode.Input, hint);
