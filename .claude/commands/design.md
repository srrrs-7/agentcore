# /design Command

Use this command to produce a short design note before UI work.

## Required Context (MUST read)

Read every file in:
- /workspace/main/.claude/context
- /workspace/main/.claude/rules

Minimum set for this repo:
- /workspace/main/.claude/context/dev.md
- /workspace/main/.claude/rules/README.md
- /workspace/main/.claude/rules/coding-rules.md
- /workspace/main/.claude/rules/design-guide.md
- /workspace/main/.claude/rules/planning.md
- /workspace/main/.claude/rules/security.md
- /workspace/main/.claude/rules/testing.md

## What This Command Does
- Produces a concise UI/UX design note before implementation.
- Clarifies screens/states, data dependencies, and open questions.

## Best Practices (from rules)
- Follow `/workspace/main/.claude/rules/design-guide.md` for UX, accessibility, and interaction guidance.
- Apply `/workspace/main/.claude/rules/coding-rules.md` for performance‑aware implementation notes.

Include:
- Problem statement.
- Key screens/states.
- Data dependencies and API endpoints.
- Risks and open questions.
