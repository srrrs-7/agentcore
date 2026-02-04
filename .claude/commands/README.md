# Commands Documentation

This folder defines reusable Claude commands for this repo. Each command document should be short, explicit, and safe to follow in an automated or semi-automated workflow.

## Required Context (MUST read)

Every command must instruct the assistant to read all files in these directories at execution time:
- /workspace/main/.claude/context
- /workspace/main/.claude/rules

Minimum set for this repo:
- /workspace/main/.claude/context/dev.md
- /workspace/main/.claude/rules/README.md
- /workspace/main/.claude/rules/coding-rules.md
- /workspace/main/.claude/rules/design-guide.md
- /workspace/main/.claude/rules/github-pr.md
- /workspace/main/.claude/rules/planning.md
- /workspace/main/.claude/rules/security.md
- /workspace/main/.claude/rules/testing.md

## Commands (What they do)

- `/create-pr`
  - Purpose: Generate a complete PR summary, checklist, and test plan for the current branch.
  - Best practices: Follow `.claude/rules/github-pr.md` for PR structure, `.claude/rules/testing.md` for test expectations, and `.claude/rules/coding-rules.md` for coding standards.

- `/git-commit`
  - Purpose: Create a git commit following Conventional Commits format with proper validation and safety checks.
  - Best practices: Follow `.claude/rules/github-pr.md` for commit conventions, `.claude/rules/security.md` to avoid committing secrets.

- `/design`
  - Purpose: Produce a short design note before UI work (problem statement, states, data deps, risks).
  - Best practices: Apply `.claude/rules/design-guide.md` for UX guidance and `.claude/rules/coding-rules.md` for performance‑aware implementation considerations.

- `/init`
  - Purpose: Provide initial project orientation (structure, scripts, envs).
  - Best practices: Reference `.claude/rules/README.md` for architectural rules and `.claude/rules/security.md` for env/secret handling.

- `/plan-impl`
  - Purpose: Create an implementation plan for non‑trivial changes with TDD checkpoints.
  - Best practices: Use `.claude/rules/planning.md` and enforce the TDD cycle (test → implement → refactor).

- `/refactor`
  - Purpose: Guide a safe refactor with tests and minimal behavior change.
  - Best practices: Follow `.claude/rules/testing.md` for TDD, `.claude/rules/coding-rules.md` for code quality, and keep behavior unchanged unless requested.

- `/review`
  - Purpose: Perform a code review focused on bugs, regressions, and test gaps.
  - Best practices: Use `.claude/rules/testing.md` for coverage expectations and `.claude/rules/security.md` for sensitive data checks.

## Best Practices for Command Docs

- Declare the purpose in one or two sentences near the top.
- Explicitly list required inputs (e.g., $ARGUMENTS) and how they affect behavior.
- Separate “Prerequisites” from “Execution Steps”.
- Use numbered phases/steps with clear success/abort criteria.
- Prefer smallest safe commands first; avoid destructive actions unless requested.
- Include a test plan or verification step when changes are expected.
- Keep file references absolute when possible for clarity.
- Avoid repetition; extract shared requirements to the Required Context section.

## Suggested Template

```markdown
# /command-name Command

Short purpose statement.

## Required Context (MUST read)
- /workspace/main/.claude/context
- /workspace/main/.claude/rules
- (List minimum set for this repo)

## What This Command Does
- Bullet list of intended outcomes

## Best Practices (from rules)
- Reference relevant files in /workspace/main/.claude/rules

## Inputs
- $ARGUMENTS: describe how they are interpreted

## Prerequisites
- Preconditions to check before proceeding

## Execution Steps
1. Step with command(s)
2. Step with validation

## Output
- Describe expected deliverable or report

## Verification
- Tests or checks to run
```
