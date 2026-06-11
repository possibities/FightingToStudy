# Trigger Evals — backend-security-review

Design/test artifact to validate trigger precision. Not loaded at runtime.

| Prompt | Expected | Why |
| --- | --- | --- |
| "Security review this PR touching auth middleware." | Trigger | Threat-focused review of server-side change |
| "Check this API diff for SSRF or injection." | Trigger | Backend vulnerability categories |
| "Risk review of the new file-upload endpoint." | Trigger | Server-side data path |
| "Review secrets/logging in this config change." | Trigger | Secret exposure surface |
| "Is this deserialization path exploitable?" | Trigger | Injection/deserialization |
| "Verify this React component's responsive layout." | No trigger | Frontend → frontend-verification |
| "General code-style review of this file." | No trigger | Not security-focused |
| "Explain how OAuth refresh tokens work." | No trigger | Concept question, no diff |
| User asks "is my backend secure?" with no diff/files. | Failure path | Review provided scope only; state the limitation |
| Reviewer wants an exploit run against production. | Failure path | Refuse without explicit approval; no destructive/external actions |
