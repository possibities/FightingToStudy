# Orchestration Patterns

## Contents

- Tool decision table
- Specialist skill routing
- Multi-agent patterns
- Long-running objectives
- Coding workstream patterns
- Verification matrix
- Anti-patterns
- Example prompts

## Tool Decision Table

| Situation | Preferred action |
| --- | --- |
| Multi-step local coding task | Track with the todo/task tools; keep one step in progress. |
| Long-running objective the user wants tracked | Keep the task list current across the whole effort; mark items completed only when truly done. |
| Independent file reads or searches | Batch independent Read/Grep/Glob calls in a single message. |
| Manual code edits | Use Edit/Write. |
| Mechanical formatting or tests | Use Bash. |
| A permission prompt denies a required command | Adjust the approach or ask the user; do not retry verbatim. |
| User explicitly requests parallel agents or delegation | Use the Agent tool for bounded sidecar tasks; use worktree isolation for parallel writers. |
| Current facts, external docs, or primary sources are required | Use web search/fetch or the relevant docs skill/source. |

## Specialist Skill Routing

Use specialist skills (via the Skill tool) when the task has a distinct quality contract:

| Task signal | Route |
| --- | --- |
| Pull request or merge request review comments, requested changes, reviewer feedback, inline comments | pr-comment-resolver |
| Backend auth, authorization, secrets, API exposure, config, dependency risk, SSRF, injection, or vulnerability review | backend-security-review |
| UI rendering, browser runtime, responsive layout, visual overlap, asset loading, interaction states, screenshots | frontend-verification |
| Creating, updating, reviewing, or optimizing a skill | write-effective-skills |
| Test-first feature or bug work | tdd when the user wants TDD or the repo workflow calls for it |
| Named recurring stack or framework workflow | Use a stack-specific skill if one exists; otherwise follow local project conventions and avoid inventing broad stack rules |

When routing, keep orchestration local:

- Use the specialist skill for the quality bar and checks.
- Keep the main agent responsible for integration, final verification, and final answer.
- Do not load specialist references unless the task actually needs them.

## Multi-Agent Patterns

Use subagents for parallelism only after explicit authorization.

Good explorer tasks:

- Identify where a behavior is implemented.
- Compare two similar modules.
- Find tests that cover a feature.
- Summarize a config or dependency pattern.

Good worker tasks:

- Implement one isolated adapter.
- Update tests for one module.
- Apply the same migration pattern to one directory.
- Fix one independent bug with a bounded write scope.

Avoid delegating:

- The immediate next blocker.
- Ambiguous architecture decisions.
- Tasks that need constant coordination with local edits.
- Broad reviews with no concrete output.
- Overlapping file ownership.

After delegation:

- Keep working locally on non-overlapping critical-path work.
- Wait only when integration needs the result.
- Review subagent changes before relying on them.
- Collect each agent's final output before moving on; continue an existing agent instead of respawning when its context matters.

## Long-Running Objectives

Use persistent task tracking only when the user explicitly asks for it. Examples:

- "Keep working on this migration until it is finished."
- "Track this as a long-running objective."
- "Work through this checklist over the session."

Do not create heavyweight tracking for ordinary requests such as:

- "Fix this bug."
- "Build this feature."
- "Refactor this module."

When tracking exists:

- Use it to preserve the objective across long work.
- Do not mark items complete until all required work is done.
- Do not declare the objective blocked just because work is hard, incomplete, or needs more time.
- If the same blocker repeats across attempts, surface it to the user with what was tried.

## Coding Workstream Patterns

For feature work:

1. Locate the public interface and user-facing behavior.
2. Add or update tests for the behavior when risk warrants it.
3. Implement the smallest coherent slice.
4. Run targeted checks.
5. Broaden verification for shared surfaces.

For bug fixes:

1. Reproduce or identify the failing behavior.
2. Find the smallest responsible path.
3. Add a regression check when practical.
4. Patch the cause, not just the symptom.
5. Verify the failing path and adjacent behavior.

For refactors:

1. Define the invariant behavior that must not change.
2. Inspect tests before editing.
3. Change one boundary at a time.
4. Run checks after each meaningful step.
5. Avoid broad style churn.

For frontend work:

1. Match the existing design system and interaction patterns.
2. Build the actual usable screen, not a marketing shell.
3. Verify responsive layout and text fitting.
4. Run build/lint checks.
5. Start a dev server when needed and provide the URL.

## Verification Matrix

| Risk | Checks |
| --- | --- |
| Pure logic | Unit or focused integration tests. |
| Shared API or module | Existing affected test suites plus targeted new tests. |
| Database or migration | Migration dry run or schema checks when available. |
| General security-sensitive path | Identify the affected trust boundary and add negative tests where practical. |
| Backend security-sensitive path | The backend-security-review skill, negative tests, auth/authz review, secret/logging checks. |
| Frontend behavior | The frontend-verification skill, build, lint/typecheck, browser/screenshot inspection. |
| Dependency or config change | Lockfile/config review and smoke test. |
| Generated output | Deterministic regeneration or fixture comparison. |

## Anti-Patterns

- Spawning agents because the task is large without explicit user authorization.
- Waiting on subagents while no local progress is blocked.
- Giving workers overlapping write scopes.
- Letting subagents make architectural decisions that the main agent must integrate.
- Creating heavyweight task tracking for normal one-turn tasks.
- Declaring completion because the effort ran long, rather than because the work is done.
- Running broad destructive commands to "clean up" a worktree.
- Editing files before reading local patterns.
- Finishing without verification or without explaining why verification was skipped.

## Example Prompts

Trigger examples:

| Prompt | Expected |
| --- | --- |
| "Use your full toolset to implement this multi-module feature." | Trigger |
| "Coordinate multiple agents to refactor these independent packages." | Trigger |
| "Keep working on this migration until it is finished." | Trigger |
| "Plan and execute this large bug fix with verification." | Trigger |
| "Split this coding task into parallel agent workstreams." | Trigger |

Non-trigger examples:

| Prompt | Expected |
| --- | --- |
| "What does this function do?" | No trigger |
| "Run the tests." | No trigger |
| "Fix this typo in one file." | No trigger |

Failure-mode examples:

| Prompt | Expected |
| --- | --- |
| "Use three agents" when subagent tools are unavailable | State the limitation and do the best local orchestration. |
| "Track progress" when a task list already exists | Update the existing list; do not create a duplicate. |
