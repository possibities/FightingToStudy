# Trigger Evals — grill-with-docs

Design/test artifact to validate trigger precision against `grill-me`. Not loaded at runtime.

| Prompt | Expected | Why |
| --- | --- | --- |
| "Grill my plan against our domain model and ADRs." | Trigger | Doc-grounded interrogation |
| "Stress-test this design and update CONTEXT.md as we go." | Trigger | Inline doc maintenance |
| "Challenge my terminology against the project glossary." | Trigger | Term sharpening |
| "Pressure-test my plan against documented decisions." | Trigger | Decisions-aware grilling |
| "Interview me and capture new ADRs where needed." | Trigger | ADR capture |
| "Just grill me quickly, no project docs involved." | No trigger | Doc-free → grill-me |
| "Write the CONTEXT.md for me from scratch." | No trigger | Authoring task, not a grilling session |
| "Implement the feature now." | No trigger | Build, not interrogation |
| No `CONTEXT.md` / `docs/adr/` exists yet. | Failure path | Create lazily — only when the first term/ADR is resolved |
| A decision fails the 3-part ADR test (reversible / unsurprising / no real trade-off). | Failure path | Skip the ADR |
