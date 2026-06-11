# Trigger Evals — write-effective-skills

Design/test artifact to validate trigger precision. Not loaded at runtime.

| Prompt | Expected | Why |
| --- | --- | --- |
| "How do I write a good Claude Code skill?" | Trigger | Skill authoring |
| "Create a new skill for our deploy workflow." | Trigger | New skill creation |
| "Improve / review this existing SKILL.md." | Trigger | Skill review/optimization |
| "Reduce the token cost of our skill library." | Trigger | Library optimization |
| "Add evals so this skill triggers correctly." | Trigger | Skill eval design |
| "Write a Python function to parse this file." | No trigger | Ordinary coding, not a skill |
| "Explain what an LLM agent is." | No trigger | Concept question |
| "Build the React dashboard." | No trigger | App build, not skill authoring |
| A public skill ships scripts with network/credential/exec behavior. | Failure path | Quarantine until scripts/deps/side-effects are reviewed |
| A skill body instructs bypassing system/approval/security rules. | Failure path | Flag and refuse; do not encode rule-bypass guidance |
