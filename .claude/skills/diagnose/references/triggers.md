# Trigger Evals — diagnose

Design/test artifact to validate trigger precision. Not loaded at runtime.

| Prompt | Expected | Why |
| --- | --- | --- |
| "Diagnose this — the checkout 500s intermittently." | Trigger | Hard/flaky bug |
| "This test is failing and I can't see why." | Trigger | Unexpected failure |
| "Requests got 3x slower after the last deploy." | Trigger | Performance regression |
| "Something's throwing in the worker, debug it." | Trigger | Reported breakage |
| "It works locally but breaks in CI sometimes." | Trigger | Non-deterministic bug |
| "Add a new endpoint to the API." | No trigger | Feature work, not debugging |
| "Review this PR for security." | No trigger | → backend-security-review |
| "Explain how the event loop works." | No trigger | Concept question |
| Bug only reproduces in an environment the agent can't access. | Failure path | Stop; request access/artifact/instrumentation, don't hypothesise without a loop |
| No correct test seam exists for the regression test. | Failure path | Document the missing seam as the finding |
