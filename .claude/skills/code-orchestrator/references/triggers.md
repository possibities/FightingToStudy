# Trigger Evals — code-orchestrator

Design/test artifact to validate trigger precision. Not loaded at runtime.

| Prompt | Expected | Why |
| --- | --- | --- |
| "Handle this large multi-file refactor end to end." | Trigger | Multi-step coding coordination |
| "Coordinate parallel agents to build this feature." | Trigger | Explicit delegation request |
| "Use your full toolset to ship this difficult bug fix." | Trigger | Explicit full-capability ask |
| "Keep working on this long migration until it's done." | Trigger | Long-running objective |
| "Orchestrate exploration, edit, and verify for this feature." | Trigger | Cross-tool coordination |
| "Fix this one-line typo." | No trigger | Trivial; no orchestration needed |
| "Security review my auth change." | No trigger | Specialist → backend-security-review |
| "Translate my paper abstract." | No trigger | Not a coding task |
| User says "use agents" but subagent tools are unavailable. | Failure path | State the limitation; orchestrate locally |
| Required test/build tool is unavailable. | Failure path | Fall back to closest safe local method and report the gap |
