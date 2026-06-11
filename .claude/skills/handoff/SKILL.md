---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

Include a "suggested skills" section in the document, which suggests skills that the agent should invoke.

Do not duplicate content already captured in other artifacts (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

## Output Contract

```text
Output: a handoff document saved to the OS temporary directory (not the workspace).
Must include: current state, what's done, what's next, open questions, and a "suggested skills" section.
Must preserve: pointers (path/URL) to existing artifacts (PRDs, plans, ADRs, issues, commits, diffs) instead of duplicating them.
Must not: write into the current workspace, or include unredacted secrets, credentials, or PII.
```
