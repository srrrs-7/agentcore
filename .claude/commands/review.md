# /review Command

Perform a review focused on bugs, regressions, and test gaps.

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
- Reviews code for bugs, regressions, and missing tests.
- Produces findings ordered by severity with file references.

## Best Practices (from rules)
- Apply `/workspace/main/.claude/rules/testing.md` for test expectations.
- Apply `/workspace/main/.claude/rules/security.md` for sensitive data and auth checks.

Output order:
1. Findings by severity with file references.
2. Assumptions and open questions.
3. Test gaps and suggested follow-ups.
