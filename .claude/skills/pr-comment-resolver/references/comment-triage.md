# PR Comment Triage

## Contents

- Triage categories
- Decision rules
- Verification mapping
- Reporting templates

## Triage Categories

Bug:

- Reviewer identifies incorrect behavior, missing edge case, race, regression, or broken contract.
- Prefer a code fix plus regression test when practical.

Test gap:

- Reviewer asks for coverage or negative cases.
- Add behavior-focused tests that survive refactors.

Design disagreement:

- Reviewer questions API shape, architecture, naming, product behavior, or ownership.
- Do not make broad changes without confirming intent when the tradeoff is unclear.

Security:

- Reviewer raises auth, authorization, secrets, injection, data exposure, dependency, or config risk.
- Route to security review patterns and require concrete risk analysis.

Style or maintainability:

- Reviewer requests local simplification, naming, comments, formatting, or idiomatic code.
- Fix narrowly unless the comment implies a wider pattern.

Docs:

- Reviewer asks for README, inline docs, API docs, changelog, examples, or comments.
- Update only docs directly tied to the change unless asked otherwise.

Question:

- Reviewer asks for explanation, rationale, or clarification.
- If no code change is required, prepare a response but do not post it remotely without approval.

## Decision Rules

Address directly when:

- The comment is clear, local, low-risk, and has an obvious fix.
- Tests can verify the change.
- It does not conflict with user instructions or existing architecture.

Ask before changing when:

- The comment changes public API, data model, product behavior, security posture, or migration strategy.
- Multiple reviewer comments conflict.
- The change would require broad refactoring or external system access.

Defer or reject with reason when:

- The comment is incorrect based on local evidence.
- The requested change violates constraints.
- The fix belongs in a different PR or requires unavailable context.

## Verification Mapping

| Comment type | Verification |
| --- | --- |
| Bug | Targeted regression test or reproduction path |
| Test gap | New/updated test showing behavior |
| Security | Negative tests, boundary review, secret/logging check |
| Style | Formatting/lint or local code review |
| Docs | Render or link check when available |
| Frontend visual | Browser/screenshot and interaction check |
| Dependency/config | Build, lockfile/config review, smoke test |

## Reporting Templates

Addressed:

```text
Comment #<n>: <summary>
Change: <files/functions changed>
Verification: <commands or checks>
```

Not addressed:

```text
Comment #<n>: <summary>
Reason: <needs user decision | incorrect | out of scope | blocked>
Next step: <ask/recommendation>
```
