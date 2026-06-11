# Trigger Evals — handoff

Design/test artifact to validate trigger precision. Not loaded at runtime.

| Prompt | Expected | Why |
| --- | --- | --- |
| "Write a handoff doc for the next session." | Trigger | Explicit handoff |
| "Compact this conversation so another agent can continue." | Trigger | Continuation summary |
| "Hand this off — next session will finish the migration." | Trigger | Handoff with focus arg |
| "Summarise where we are so I can resume tomorrow." | Trigger | Resume document |
| "Prepare a context dump for a fresh agent." | Trigger | Fresh-agent brief |
| "Summarise this article." | No trigger | Content summary, not session handoff |
| "Save the session to my session-data dir." | No trigger | → save-session tooling |
| "Write the PRD." | No trigger | Different artifact |
| Conversation contains API keys / PII. | Failure path | Redact before writing the doc |
| Content already lives in a PRD/plan/ADR/commit. | Failure path | Reference by path/URL; do not duplicate |
