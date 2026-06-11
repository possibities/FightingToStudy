---
name: write-effective-skills
description: Create, update, review, or optimize Claude Code agent skills using research-backed patterns for concise instructions, progressive disclosure, reusable resources, validation, skill-library retrieval, and security. Use when the user asks how to write a skill, create a new skill, improve an existing skill, design a skill library, reduce skill token cost, add evals for skills, or turn repeated workflows/tool sequences into reusable agent skills.
---

# Write Effective Skills

## Core Rules

- Treat a skill as operational context for another agent, not as user-facing documentation.
- Put trigger conditions in the YAML `description`; the body loads only after the skill triggers.
- Keep `SKILL.md` short, procedural, and specific. Move detailed references, schemas, variants, examples, and research notes into `references/`.
- Add scripts only when deterministic execution, fragile operations, or repeated code would improve reliability or token cost.
- Add assets only when the skill must reuse templates, images, fonts, fixtures, or boilerplate.
- Do not create auxiliary docs such as `README.md`, changelogs, installation guides, or quick references inside the skill.
- Prefer the repo's existing skill layout and local helper scripts. If the repo provides a skill scaffold or init script, use it before manual edits.

## Creation Workflow

1. Define the narrow job the skill should make easier.
   - Name the repeated workflow, domain, file type, tool, or decision process.
   - Write at least 5 realistic user requests that should trigger the skill.
   - List at least 3 nearby requests that should not trigger it.
   - Include 2 failure-mode examples such as missing files, unavailable tools, or ambiguous user intent.

2. Choose the smallest useful skill shape.
   - Use only `SKILL.md` for short procedural guidance.
   - Add `references/` for long examples, domain rules, schemas, provider variants, or research notes.
   - Add `scripts/` for deterministic parsing, conversion, generation, validation, or API/tool wrappers.
   - Add `assets/` for templates or files that should be copied or modified as output resources.

3. Write the frontmatter.
   - Use lowercase hyphen-case for `name`.
   - Include `name` and `description`; add optional Claude Code fields (`argument-hint`, `disable-model-invocation`, `metadata`) only when the skill needs them.
   - Make `description` explicit about both capability and trigger contexts.
   - Include synonyms users are likely to use, but avoid broad terms that would cause accidental invocation.

4. Write the body as an execution protocol.
   - Start with 5-8 non-obvious rules.
   - Give the normal workflow in imperative steps.
   - Define the output contract: what artifact the skill must produce, required quality bars, and unacceptable outputs.
   - Include decision points, validation requirements, and failure handling.
   - Link directly to each reference file and state when to read it.
   - Prefer concise examples over general explanations.

5. Add resources.
   - Keep reference files one level from `SKILL.md`.
   - Give long reference files a table of contents.
   - Test any script that the skill introduces.
   - Avoid duplicating the same facts in `SKILL.md` and references.

6. Validate and iterate.
   - Run the local skill validator if available.
   - Forward-test complex skills on realistic tasks without leaking expected answers.
   - Record whether the skill improved success rate, token use, tool calls, latency, or consistency.
   - Tighten the skill when it triggers too often, causes wrong behavior, or adds context without action value.

## Review Workflow

When reviewing an existing skill, check in this order:

1. Trigger precision.
   - Confirm the `description` says what the skill does and exactly when to use it.
   - Identify likely false positives and missing trigger phrases.

2. Context efficiency.
   - Remove background, motivation, repeated advice, and examples that do not change behavior.
   - Move long rationale, variants, and eval details into `references/`.

3. Resource fit.
   - Keep only resource directories the skill actually needs.
   - Move deterministic repeated logic into `scripts/` only when it is worth testing and maintaining.

4. Metadata consistency.
   - Confirm the frontmatter `name` matches the skill directory name.
   - Confirm optional fields (`argument-hint`, `disable-model-invocation`) still match how the skill is meant to be invoked.

5. Validation.
   - Run the local validator if available.
   - Report any residual risk that cannot be checked locally.

## Library Optimization

When optimizing many skills, work from an inventory before editing:

- Record each skill's name, trigger description, intended workflow, likely false positives, `SKILL.md` length, resources, scripts, origin, and overlap group.
- Tighten broad descriptions before changing bodies.
- Compress long bodies by moving examples, variants, schemas, and rationale into references.
- Merge true duplicate workflows; split only when trigger conditions differ.
- Quarantine public skills with scripts until scripts, dependencies, network behavior, and side effects are reviewed.
- Use a trigger-eval set to check that description changes reduce false positives without missing valid requests.

## Degree Of Freedom

- Use high freedom instructions when many approaches are valid and context decides the answer.
- Use medium freedom pseudocode, templates, or checklists when a preferred pattern exists but inputs vary.
- Use low freedom scripts when the operation is repetitive, fragile, security-sensitive, or easy to get subtly wrong.

## Example Set Format

Use this compact format when designing or reviewing triggers:

| Prompt | Expected | Why |
| --- | --- | --- |
| Realistic user request | Trigger / no trigger / failure path | One short reason |

## Output Contract

Add an output contract when a skill creates, edits, reviews, or verifies an artifact:

```text
Output: <file, patch, review, report, test, UI, dataset, or other artifact>
Must include: <required sections, files, commands, or evidence>
Must preserve: <format, template, public API, behavior, style, data integrity>
Must verify: <tests, build, screenshot, schema check, manual review, or reason skipped>
Must not: <unsafe action, broad rewrite, unsupported claim, unrelated churn>
```

For detailed templates, read `references/skill-design-templates.md`.

## Evaluation Checklist

Before finalizing a skill, check:

- The `description` alone tells another agent when to use the skill.
- `SKILL.md` contains no unfinished template text or broad background essays.
- Every bundled file has a clear purpose and is referenced from `SKILL.md` when needed.
- The frontmatter `name` matches the skill directory, and optional fields match the intended invocation.
- The skill has at least 5 realistic trigger examples and 3 non-trigger examples.
- The skill has 2 failure-mode examples when missing files, tools, permissions, or ambiguous intent are plausible.
- Artifact-producing or artifact-reviewing skills define an output contract.
- New scripts have been run or a reason is given for not running them.
- The skill does not instruct the agent to bypass system, developer, security, or approval rules.
- The skill has a failure path for missing files, missing tools, network restrictions, or ambiguous user intent.

## Optimization Patterns

- Compress repeated explanations into short commands, checklists, or reusable scripts.
- Replace repeated tool-call sequences with a deterministic script or meta-tool when the sequence is stable.
- Split large multi-domain skills into focused skills or reference files.
- For large skill libraries, rely on precise names, specific descriptions, and dependency/relevance notes instead of loading every skill.
- Remove content that does not change agent behavior on a realistic task.

## References

Read `references/research-principles.md` when the user asks for the evidence behind a skill design choice, wants to optimize a skill library, or needs an evaluation/security framework for skills.

Read `references/skill-design-templates.md` when creating artifact-specific skills, stack-specific coding skills, output contracts, or trigger eval sets.
