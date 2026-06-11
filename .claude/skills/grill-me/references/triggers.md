# Trigger Evals — grill-me

Design/test artifact to validate trigger precision against `grill-with-docs`. Not loaded at runtime.

| Prompt | Expected | Why |
| --- | --- | --- |
| "Grill me on this plan." | Trigger | Explicit phrase |
| "Stress-test my design, ask hard questions." | Trigger | Doc-free design interrogation |
| "Interrogate my approach until we agree." | Trigger | Shared-understanding interview |
| "Poke holes in this rollout plan." | Trigger | Plan stress-test |
| "Challenge my assumptions one by one." | Trigger | Decision-tree resolution |
| "Grill my plan against our CONTEXT.md / ADRs." | No trigger | Doc-grounded → grill-with-docs |
| "Just implement the feature." | No trigger | Build, not interrogation |
| "Review this finished PR." | No trigger | → pr-comment-resolver |
| User asks for grilling but a question is answerable from the codebase. | Failure path | Explore the codebase instead of asking |
| User wants terminology/ADRs updated as decisions land. | Failure path | Redirect to grill-with-docs |
