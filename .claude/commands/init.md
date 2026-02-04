# /init Command

Initial project orientation.

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
- Summarizes the repository structure and key modules.
- Lists core scripts and development workflows.
- Calls out required env vars and DB prerequisites.

## Best Practices (from rules)
- Use `/workspace/main/.claude/rules/README.md` for architecture conventions.
- Follow `/workspace/main/.claude/rules/security.md` for env/secret handling.

Do:
- Summarize repo structure.
- List key scripts (`bun run dev`, `bun run check`).
- Call out required env vars and DB prerequisites.
