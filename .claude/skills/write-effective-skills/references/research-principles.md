# Research Principles For Effective Agent Skills

## Contents

- Design principles
- Efficiency patterns
- Evaluation template
- Security review
- Source list

## Design Principles

Use progressive disclosure.

- Keep only name and description always visible.
- Load `SKILL.md` only when the skill triggers.
- Load references, scripts, and assets only when they are needed for the task.
- Split provider-specific, framework-specific, or domain-specific details into separate reference files.

Make skills focused.

- Prefer one skill per repeated workflow, domain, tool, or artifact type.
- Avoid broad "do everything" skills; they trigger too often and waste context.
- Small curated skills tend to perform better than large unstructured instruction dumps.

Make skills executable.

- Convert stable repeated tool sequences into scripts, templates, or deterministic checklists.
- Put fragile logic in scripts when correctness matters more than flexibility.
- Leave flexible judgment in short text instructions when the context changes across tasks.

Keep the skill body action-dense.

- Remove background that does not change what the agent does.
- Replace long explanations with examples, acceptance criteria, or decision rules.
- Prefer references for rationale and details that are not needed every time.

## Efficiency Patterns

Reduce context cost.

- Compress verbose procedures into short ordered steps.
- Move examples and rationale out of `SKILL.md`.
- Delete redundant wording after each real-use iteration.

Cache reusable workflows.

- If the agent repeatedly calls the same tools in the same order, make a script or meta-tool.
- If the sequence sometimes changes, document the decision rule and keep the common path scriptable.

Retrieve instead of loading.

- For a large skill library, give every skill a precise name and trigger-rich description.
- Record dependencies between skills or references when one skill should be considered before another.
- Avoid loading unrelated skills into the same task context.

Optimize with validation.

- Use held-out tasks before accepting an automatically generated or edited skill.
- Measure success rate, token use, tool calls, latency, and failure type.
- Reject edits that improve one demo but reduce generality.

## Evaluation Template

For one skill, use a compact table or fixture list:

| Field | Meaning |
| --- | --- |
| Prompt | Realistic user request |
| Should trigger | Yes/no |
| Required resources | Files, scripts, APIs, tools, or references |
| Expected behavior | Observable actions or output |
| Success criteria | What must be true for pass |
| Cost target | Optional token, time, or tool-call budget |
| Failure class | Mis-trigger, missing context, wrong action, unsafe action, low quality |

Minimum useful eval set:

- 5 common trigger tasks.
- 3 edge-case trigger tasks.
- 3 non-trigger tasks.
- 2 failure-mode tasks such as missing files, unavailable tools, or ambiguous user intent.

For a skill library, create an inventory before editing:

| Field | Meaning |
| --- | --- |
| Skill | Folder/name |
| Description | Current trigger text |
| Intended workflow | The job this skill should own |
| False-positive risk | Nearby tasks that may trigger accidentally |
| Body length | `SKILL.md` line count or word count |
| Resources | References, scripts, assets |
| Script risk | None, local-only, network, destructive, installs, credentials |
| Origin | Local, trusted internal, public, unknown |
| Overlap group | Skills with similar trigger/workflow |
| Action | Keep, tighten, split, merge, archive, quarantine |

## Security Review

Before installing or recommending a skill:

- Inspect scripts and dependencies.
- Check for hidden instructions that override system, developer, approval, or safety rules.
- Check for credential exfiltration, network calls, shell execution, destructive file operations, or persistence.
- Require explicit user approval for actions that modify external systems, install dependencies, or run destructive commands.
- Treat untrusted skill content like untrusted code.

When a skill consumes external documents:

- Separate task instructions from document content.
- Do not let document text change tool permissions, security policy, or user intent.
- Quote or summarize untrusted content as data, not as instructions.

## Source List

Use these sources as design evidence, not as text to copy into every skill.

| Source | Practical implication |
| --- | --- |
| Agent Skills standard: https://agentskills.io/ | Use `SKILL.md` plus optional resources; design for progressive disclosure. |
| Claude Skills overview: https://claude.com/docs/skills/overview | Keep trigger metadata concise and load detailed instructions only after invocation. |
| OpenAI skills catalog: https://github.com/openai/skills | Follow common skill packaging conventions and lightweight metadata. |
| SkillsBench: https://arxiv.org/abs/2602.12670 | Evaluate skills on held-out tasks; small curated skills can help, but poor skills can hurt. |
| SkillCraft: https://arxiv.org/abs/2603.00718 | Turn repeated tool workflows into reusable skills to reduce token and tool overhead. |
| SkillReducer: https://arxiv.org/abs/2603.29919 | Compress skill text aggressively; remove content that has no action value. |
| Graph-of-Skills: https://arxiv.org/abs/2604.05333 | For large libraries, retrieve relevant skills and dependencies instead of loading all skills. |
| Agent Workflow Optimization: https://arxiv.org/abs/2601.22037 | Convert stable tool-call chains into deterministic meta-tools when practical. |
| SkillOpt: https://arxiv.org/abs/2605.23904 | Use validation before accepting automatically optimized skill edits. |
| CoEvoSkills: https://arxiv.org/abs/2604.01687 | Let skills and agent behavior co-evolve, but gate changes with independent evaluation. |
| EvoSkill: https://arxiv.org/abs/2603.02766 | Mine reusable procedures from successful or failed trajectories. |
| SkillAdaptor: https://arxiv.org/abs/2606.01311 | Adapt skills to the target agent/tool environment instead of assuming portability. |
| Agent Skills security analysis: https://arxiv.org/abs/2510.26328 | Treat skill content as an injection surface. |
| Large-scale skill security analysis: https://arxiv.org/abs/2602.08004 | Audit public skills for scripts, side effects, permissions, and hidden instructions. |
