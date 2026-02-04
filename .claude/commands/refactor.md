# /refactor Command

Refactor safely with tests and small steps.

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
- Guides a refactor plan and execution checklist.
- Preserves behavior unless explicitly requested otherwise.

## Best Practices (from rules)
- Use `/workspace/main/.claude/rules/testing.md` for TDD and test grouping.
- Follow `/workspace/main/.claude/rules/coding-rules.md` for safe, readable changes.

Rules:
- Keep behavior the same unless explicitly requested.
- Add or update tests first when possible.
- Run `bun run check` after changes.
