---
name: backend-security-review
description: Review backend service code, pull requests, diffs, or branches for concrete security risks in APIs, authentication, authorization, secrets, data handling, logging, dependency changes, configuration, SSRF, injection, deserialization, and infrastructure-adjacent backend code. Use when the user asks for a backend security review, secure code review, vulnerability review, threat-focused PR review, or risk review of server-side changes.
---

# Backend Security Review

## Core Rules

- Treat this as a code-review pass over concrete changes, not a generic security lecture.
- Lead with findings ordered by severity. If no issues are found, say that clearly and list residual risk.
- Require an attack path, impacted asset, affected boundary, and file/line evidence for every finding.
- Distinguish confirmed vulnerabilities from hardening suggestions.
- Inspect the diff first, then surrounding call paths, tests, config, and deployment assumptions.
- Do not run destructive commands or access external systems without explicit approval.
- Avoid broad dependency, framework, or compliance claims unless verified from local evidence or current primary sources.

## Review Workflow

1. Identify the review scope.
   - Determine changed files, base/head if available, touched APIs, config, auth paths, data paths, and dependencies.
   - If scope is missing, review the provided diff/files and state the limitation.

2. Map trust boundaries.
   - Identify callers, identities, authorization checks, user-controlled input, network calls, storage, queues, logs, and third-party services.

3. Check high-risk categories.
   - Authentication and session handling.
   - Authorization and tenancy boundaries.
   - Input validation, injection, unsafe parsing, and deserialization.
   - SSRF, path traversal, file access, command execution, and outbound requests.
   - Secrets, credentials, tokens, logging, and error leakage.
   - Dependency, config, CORS, TLS, rate limiting, and insecure defaults.

4. Verify tests and negative cases.
   - Look for tests that prove forbidden access fails.
   - Prefer regression or integration tests for changed security behavior.

5. Report findings.
   - Use the finding format below.
   - Include test gaps and concrete remediation.

## Finding Format

```text
Severity: Critical | High | Medium | Low
Location: path/to/file.ext:line
Issue: <specific vulnerable behavior>
Attack path: <attacker capability -> vulnerable path -> impact>
Impact: <asset/data/control affected>
Fix: <concrete remediation>
Test gap: <missing negative or regression test>
```

## Severity Guide

- Critical: unauthenticated or low-privilege path to system compromise, mass data exposure, credential theft, or remote code execution.
- High: privilege escalation, cross-tenant data access, exploitable injection, SSRF to sensitive resources, or sensitive secret exposure.
- Medium: meaningful security control bypass with narrower conditions or reduced impact.
- Low: hardening issue, defense-in-depth gap, or risky pattern without a confirmed exploit path.

## Output Contract

```text
Output: findings ordered by severity (using the Finding Format), or a clear "no issues found" with residual risk.
Must include: per finding — severity, file:line evidence, attack path, impact, fix, and test gap.
Must distinguish: confirmed vulnerabilities from hardening suggestions.
Must not: emit generic best-practice advice without local evidence, make unverified dependency/framework/compliance claims, or run destructive commands / access external systems without explicit approval.
```

## References

Read `references/backend-risk-checklist.md` for a fuller category checklist, severity cues, and review prompts when the change touches auth, data boundaries, networking, dependencies, or deployment config.
