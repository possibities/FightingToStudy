---
name: code-orchestrator
description: Coordinate complex coding work in Claude Code by combining codebase exploration, planning, local editing, verification, progress tracking, and subagent delegation when explicitly authorized. Use when the user asks to handle a large feature, multi-file refactor, difficult bug, long-running coding objective, parallel agent coordination, or otherwise orchestrate a large coding task across tools and agents.
---

# Code Orchestrator

## Core Rules

- Keep the main agent responsible for the objective, final integration, verification, and final answer.
- Read the codebase before committing to an implementation plan. Use Grep/Glob for search and batch independent Read calls in a single message.
- Track substantial multi-step work with the todo/task tools; keep exactly one item in progress and update statuses as work advances.
- Use subagent delegation (the Agent tool) only when the user explicitly asks for agents, delegation, or parallel agent work.
- Delegate sidecar tasks that can run independently; keep immediate blockers and tightly coupled decisions local.
- Assign subagents concrete, bounded ownership and disjoint write scopes. Tell workers they are not alone in the codebase and must not revert others' edits.
- Edit with the Edit/Write tools; preserve user changes and avoid unrelated refactors.
- Verify with the repo's existing test, build, lint, typecheck, and runtime workflows. If verification cannot run, state why.
- Collect each subagent's result before building on it; continue a previously spawned agent instead of respawning when its context matters.

## Operating Loop

1. Establish the objective.
   - Restate the concrete deliverable.
   - Clarify only when the missing answer cannot be inferred safely.

2. Build working context.
   - Inspect files, tests, package/config files, and local conventions.
   - Identify the smallest ownership boundary that can satisfy the request.
   - Note risk areas: public APIs, shared modules, migrations, security, data loss, UI behavior, or generated files.

3. Plan the work.
   - Create todos/tasks for substantial multi-step work.
   - Separate critical-path work from sidecar work.
   - Choose verification commands before editing when possible.
   - Route specialized work to a more focused skill when one exists, such as backend-security-review or frontend-verification.

4. Execute locally.
   - Make narrow edits that follow existing patterns.
   - Use deterministic tools for search, tests, formatting, and builds.
   - Keep the user informed during long-running work.

5. Delegate only when authorized.
   - Spawn explorer subagents for independent codebase questions.
   - Spawn worker subagents for bounded implementation slices with disjoint files or modules; use worktree isolation when workers mutate files in parallel.
   - Continue useful local work while agents run; wait only when the next step needs their result.
   - Review returned changes or findings before integrating them.

6. Verify and harden.
   - Run targeted checks first, then broader checks when risk justifies them.
   - Add or update tests for changed behavior.
   - For frontend or visual work, invoke the frontend-verification skill when available.
   - For security-sensitive backend work, invoke the backend-security-review skill when available.

7. Finish cleanly.
   - Mark todos/tasks completed only when the objective is actually achieved.
   - Summarize files changed, verification run, and any residual risk.

## Delegation Template

Use this structure when authorized to spawn a worker:

```text
Task: <bounded deliverable>
Ownership: <files/modules the worker may edit>
Context: <minimum useful facts and commands>
Constraints: Do not revert edits made by others. Follow existing patterns. Report changed files and verification.
Output: <patch in isolated worktree or concise findings>
```

Use this structure when authorized to spawn an explorer:

```text
Question: <specific codebase question>
Scope: <directories/files to inspect>
Output: <facts with file references and uncertainty>
```

## Tool Selection

- Use Grep/Glob for fast search; batch independent Read and tool calls in one message.
- Use Bash for deterministic local checks. If a permission prompt denies a command, adjust the approach or ask the user — do not retry verbatim.
- Use web search/fetch only when the answer depends on current, external, or primary-source information.
- Use Read on screenshots or images when visual inspection affects correctness.
- Use skill references instead of memory when exact local policies or tool rules matter.

## Skill Routing

Invoke specialist skills via the Skill tool:

- backend-security-review for backend auth, data, API, dependency, config, secret, or server-side vulnerability review.
- frontend-verification for UI rendering, responsive layout, browser runtime, visual asset, and interaction verification.
- pr-comment-resolver for pull request or merge request review comments, requested changes, inline comments, and reviewer feedback.
- Stack-specific skills when the user names a recurring framework or tool and such a skill exists.
- Keep this skill as the coordinator; avoid duplicating the full specialist workflow here.

## Failure Handling

- If a required tool is unavailable, fall back to the closest safe local method and report the gap.
- If a command fails, inspect the error before changing code.
- If unrelated user changes appear, work around them and do not revert them.
- If the same blocker repeats across attempts, stop and surface it to the user instead of retrying.

## Output Contract

```text
Output: the completed coding objective plus a final summary of files changed, verification run, and residual risk.
Must preserve: unrelated user changes and existing patterns; never revert another agent's or the user's edits.
Must verify: the repo's own test/build/lint/typecheck workflows, or state why verification could not run.
Must not: spawn subagents without explicit user authorization, do broad unrelated refactors, or claim completion of unachieved work.
```

## References

Read `references/orchestration-patterns.md` when coordinating multiple agents, choosing between planning and delegation, designing a verification matrix, or running a large coding task with several independent workstreams.
