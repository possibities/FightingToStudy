# Trigger Evals — caveman

Design/test artifact to validate trigger precision. Not loaded at runtime.

| Prompt | Expected | Why |
| --- | --- | --- |
| "caveman mode" | Trigger | Explicit activation phrase |
| "talk like caveman" | Trigger | Explicit activation phrase |
| "use less tokens from now on" | Trigger | Persistent brevity intent |
| "/caveman" | Trigger | Slash invocation |
| "keep replies terse from now on" | Trigger | Persistent brevity request |
| "explain this in detail" | No trigger | User wants verbosity |
| "write a polished blog post" | No trigger | Prose quality matters |
| "be brief" on a single question | No trigger | One-off brevity; answer briefly, no mode switch |
| "stop caveman / normal mode" | No trigger | Deactivation, not activation |
| Active caveman + a destructive `DROP TABLE` confirmation is needed. | Failure path | Drop terse mode for the warning, then resume |
| Active caveman + user repeats a question (didn't understand). | Failure path | Answer in full clarity, then resume |
