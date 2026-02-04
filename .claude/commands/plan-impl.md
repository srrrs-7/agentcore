# /plan-impl Command

Create an implementation plan for non-trivial changes.

## Required Context (MUST read)

Read every file in:
- /workspace/main/.claude/context
- /workspace/main/.claude/rules

Minimum set for this repo:
- /workspace/main/.claude/context/dev.md
- /workspace/main/.claude/rules/README.md
- /workspace/main/.claude/rules/coding-rules.md
- /workspace/main/.claude/rules/planning.md
- /workspace/main/.claude/rules/security.md
- /workspace/main/.claude/rules/testing.md

## What This Command Does
- Produces a scoped implementation plan with checkpoints.
- Defines risks and a TDD‑aligned test plan.

## Best Practices (from rules)
- Follow `/workspace/main/.claude/rules/planning.md` and enforce test → implement → refactor.
- Use `/workspace/main/.claude/rules/testing.md` for test structure and expectations.

Output:
- Scope and assumptions.
- Step list with checkpoints.
- Test plan organized by HTTP status where applicable.
