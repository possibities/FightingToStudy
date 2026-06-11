# Trigger Evals — pr-comment-resolver

Design/test artifact to validate trigger precision. Not loaded at runtime.

| Prompt | Expected | Why |
| --- | --- | --- |
| "Address the review comments on PR #412." | Trigger | PR comment resolution |
| "Resolve the requested changes on this MR." | Trigger | Merge-request feedback |
| "Here are the inline review comments — fix them." | Trigger | Pasted review threads |
| "Go through the reviewer feedback on my branch." | Trigger | Branch review items |
| "Apply the suggestions from the code review." | Trigger | Reviewer suggestions |
| "Do a fresh security review of this PR." | No trigger | New review → backend-security-review |
| "Open a new PR for this branch." | No trigger | PR creation, not comment resolution |
| "Explain what a draft PR is." | No trigger | Concept question |
| Remote PR API is unavailable. | Failure path | Work from local diff + pasted comments; state the limitation |
| A comment demands an unclear permission-model change. | Failure path | Prepare a plan but ask before assuming role/tenant/policy semantics |
