# Security policy

## Supported versions

Only the latest `0.x` release receives fixes.

## Reporting a vulnerability

Security contact: **Koushik Ramani** ([@aiwithrk](https://github.com/aiwithrk)), maintainer, EnWithAI Technologies ·
[hello@enwithai.com](mailto:hello@enwithai.com) (if you cannot use GitHub's private reporting).

Please **do not open a public issue**. Use GitHub's private vulnerability reporting ("Report a vulnerability" on the
Security tab). Include the Commons Check version, the command and a minimal synthetic repository. Never include real
secrets or proprietary code. We aim to acknowledge within 5 business days. A vulnerability in one of the five tools
belongs to that tool's repository; we will route it if you report it here.

## Security properties Commons Check is designed to keep

- It starts no processes, opens no network connections, evaluates no code and has no telemetry. The five tools are
  called in-process through their published APIs. No model or paid API is used.
- It never passes a URL or a network authorization to Product Check, so no request is sent to any application.
- It never calls GitHub or any other API: Outcome Check reads files you export yourself.
- It writes only inside the output directory (default `commons-report/`).
- Repository-derived text in `SUMMARY.md` is escaped; the tools' own reports keep their own escaping and redaction.
- The GitHub Action takes inputs through environment variables (never shell interpolation), rejects absolute and
  `..` paths, needs only `contents: read` and must not be used with `pull_request_target`.

The five tools keep their own security properties (see their SECURITY.md files). Impact Check reads the git history
of the repository it analyzes. A violation of any property above is a security bug.
