# Skill Design Templates

## Contents

- Output contract template
- Stack-specific coding skill template
- Artifact-specific skill template
- Trigger eval template
- Merge decision rules

## Output Contract Template

Use this for skills that produce or verify concrete artifacts:

```text
Output:
- <primary artifact or answer shape>

Must include:
- <required files, sections, evidence, citations, commands, or screenshots>

Must preserve:
- <formatting, template, public API, data model, visual style, existing behavior, user changes>

Must verify:
- <tests, build, lint, typecheck, screenshot, schema validation, manual check>

Must not:
- <unsupported claims, unrelated refactors, destructive actions, hidden policy changes>
```

Examples:

- PDF/DOCX/XLSX/PPTX skills should preserve format, template, metadata, formulas, comments, and user-provided content unless asked to change them.
- Frontend skills should preserve the app's design system and verify responsive UI behavior.
- Review skills should return findings with evidence and avoid broad best-practice advice without local impact.

## Stack-Specific Coding Skill Template

Create a stack-specific skill only when the stack is named and recurring. Do not make a generic "best practices" coding skill.

```yaml
---
name: <stack>-<workflow>
description: <Workflow> for <stack/framework/tool> projects. Use when the user asks to <specific repeated task> in <stack>, including <synonyms>. Do not use for unrelated stacks or generic coding tasks.
---
```

Suggested sections:

- `## Core Rules`: local conventions, version constraints, common pitfalls.
- `## Project Discovery`: files and commands that identify the stack.
- `## Workflow`: stack-specific implementation steps.
- `## Commands`: build, test, lint, typecheck, dev server, codegen, migration.
- `## Verification`: checks that prove the stack-specific behavior works.
- `## Failure Handling`: missing tools, version mismatch, generated files, network restrictions.
- `## References`: official docs, local schemas, examples, migration notes.

Good stack-specific candidates:

- `go-gin-api-workflow`
- `react-vite-frontend`
- `nextjs-app-router`
- `expo-react-native`
- `python-fastapi-service`
- `n8n-workflow-builder`

## Artifact-Specific Skill Template

Use when the artifact has strict format or validation rules:

```text
Artifact:
- <file type or output type>

Read first:
- <existing template, schema, style guide, examples>

Edit rules:
- <what must be preserved>
- <what can change>

Validation:
- <tool, parser, build, viewer, screenshot, schema, round-trip check>

Failure path:
- <what to do if the artifact cannot be parsed, rendered, or validated>
```

## Trigger Eval Template

Use at least:

| Prompt | Expected | Why |
| --- | --- | --- |
| Common valid request | Trigger | Direct workflow match |
| Edge valid request | Trigger | Uses synonym or partial context |
| Nearby unrelated request | No trigger | Different workflow |
| Missing required file/tool | Failure path | Skill should state limitation |

## Merge Decision Rules

Merge into an existing skill when:

- The new guidance is a reusable method used by that skill's existing workflow.
- The trigger conditions are the same.
- The body stays short and the extra detail can live in references.

Create a separate skill when:

- The trigger phrase, artifact, tool, domain, or verification method is distinct.
- The workflow has its own output contract.
- The skill would otherwise cause accidental invocation.
- The reference material would dominate the original skill.

Do not merge:

- Backend security review into a generic coding orchestrator.
- Frontend visual verification into generic build/test instructions.
- Stack-specific rules into generic coding advice before the stack is known.
