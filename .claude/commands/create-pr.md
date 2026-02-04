---
description: Custom command
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Create a GitHub Pull Request with comprehensive details including summary, related issues, test items, and deployment considerations. This command automates the PR creation process following best practices.

## Required Context (MUST read)

Read every file in:
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

## What This Command Does
- Gathers branch state and change summary for a PR.
- Generates a PR title/body template aligned with repo standards.
- Suggests test plan and deployment notes.

## Best Practices (from rules)
- Follow `/workspace/main/.claude/rules/github-pr.md` for PR/branch conventions.
- Use `/workspace/main/.claude/rules/testing.md` for test expectations.
- Apply `/workspace/main/.claude/rules/coding-rules.md` for code quality checks.

## Prerequisites

Before creating a PR, ensure you have read and understand:
- **GitHub PR Rules**: `/workspace/main/.claude/rules/github-pr.md`
- **Project Guidelines**: `/workspace/main/.claude/rules/README.md`
- **Coding Standards**: `/workspace/main/.claude/rules/coding-rules.md`

And verify:
- All changes are committed locally
- You are on the correct feature branch (not main/master)
- Remote branch is pushed or will be pushed

## Phase 0: Load PR Context

**CRITICAL**: Read PR guidelines before proceeding.

```bash
# Read required context and rules in parallel
Read /workspace/main/.claude/context/dev.md
Read /workspace/main/.claude/rules/README.md
Read /workspace/main/.claude/rules/github-pr.md
Read /workspace/main/.claude/rules/README.md
Read /workspace/main/.claude/rules/coding-rules.md
Read /workspace/main/.claude/rules/design-guide.md
Read /workspace/main/.claude/rules/planning.md
Read /workspace/main/.claude/rules/security.md
Read /workspace/main/.claude/rules/testing.md
```

**Parse and internalize:**
- PR structure and template
- Commit message conventions
- Testing requirements
- Documentation expectations
- Git safety protocols
- Review checklist

## Execution Steps

### 1. Gather Current State

Run these git commands in parallel to understand the current state:

```bash
# Get current branch name
git branch --show-current

# Check if on main/master (should NOT be)
git rev-parse --abbrev-ref HEAD

# Get remote tracking status
git status -sb

# Get list of changed files vs main
git diff --name-only main...HEAD 2>/dev/null || git diff --name-only origin/main...HEAD

# Get commit history since branching from main
git log main..HEAD --oneline 2>/dev/null || git log origin/main..HEAD --oneline

# Get detailed diff summary
git diff main...HEAD --stat 2>/dev/null || git diff origin/main...HEAD --stat
```

### 2. Validate State

**ABORT** if any of these conditions are true:
- Current branch is `main` or `master` - inform user to create a feature branch first
- No commits exist that differ from main - inform user there are no changes to submit

### 3. Analyze Changes

From the gathered information:
- Identify the **type of change**: Bug Fix, Feature, Refactor, Documentation, Hotfix, Release
- Summarize **what** changed and **why**
- List **affected components/files** grouped by area
- Identify **potential breaking changes**
- Determine **testing requirements** based on the changes

### 4. Check for Related Issues

```bash
# Check if branch name contains issue reference (e.g., feature/123-description)
git branch --show-current | grep -oE '[0-9]+'

# Check commit messages for issue references
git log main..HEAD --oneline | grep -oE '#[0-9]+' | sort -u
```

### 5. Generate PR Content

Using the analysis, generate the PR with this structure:

#### PR Title Format
Use appropriate prefix based on change type:
- `[Feature]` - New functionality
- `[Fix]` - Bug fixes
- `[Refactor]` - Code improvements without behavior change
- `[Docs]` - Documentation only changes
- `[Hotfix]` - Urgent production fixes
- `[Release]` - Release preparation
- `[Chore]` - Maintenance tasks (dependencies, configs)

Title should be concise (50-72 chars) and describe the change clearly.

#### PR Body Template

```markdown
## Summary
<!-- 1-3 bullet points describing what this PR does and why -->

- [Main change description]
- [Secondary change if applicable]
- [Impact or benefit]

## Related Issues
<!-- Link related issues using GitHub keywords for auto-closing -->

- Closes #[issue_number]
- Related to #[issue_number]

## Changes
<!-- Categorized list of changes made -->

### Added
- [New features or files]

### Changed
- [Modifications to existing functionality]

### Removed
- [Deleted features or files]

### Fixed
- [Bug fixes]

## Test Plan
<!-- Checklist of testing that was performed or should be performed -->

### Automated Tests
- [ ] Unit tests pass (`bun run test:run`)
- [ ] Type check passes (`bun run check:type`)
- [ ] Lint check passes (`bun run check:biome`)

### Manual Testing
- [ ] [Specific test scenario 1]
- [ ] [Specific test scenario 2]
- [ ] [Edge case or error scenario]

### Test Commands
```bash
bun run test:run
bun run check
```

## Screenshots / Recordings
<!-- If applicable, add screenshots or recordings for UI changes -->

N/A (or add images)

## Deployment Notes
<!-- Any special considerations for deployment -->

- [ ] No database migrations required
- [ ] No environment variable changes required
- [ ] No breaking changes to API
- [ ] Backwards compatible

## Checklist
<!-- Verify these items before requesting review -->

- [ ] Code follows project coding standards
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if applicable)
- [ ] No console.log or debug code left
- [ ] No sensitive data exposed (.env, credentials)

---

Generated with [Claude Code](https://claude.ai/code)
```

### 6. Push Branch (if needed)

If the branch is not pushed to remote:

```bash
git push -u origin $(git branch --show-current)
```

### 7. Create PR

Use `gh` CLI to create the PR:

```bash
gh pr create --title "[Type] Title here" --body "$(cat <<'EOF'
[Generated PR body from step 5]
EOF
)"
```

**Options to consider:**
- `--draft` - Create as draft PR if work is in progress
- `--assignee @me` - Assign to yourself
- `--reviewer username` - Request specific reviewers
- `--label label-name` - Add labels

### 8. Report Completion

Output:
- PR URL
- Summary of the PR created
- Reminder to fill in any placeholder sections (screenshots, specific test scenarios)

## Interactive Mode

If `$ARGUMENTS` is empty or contains `--interactive`:

Ask the user for:
1. **PR Title** - Suggest based on branch name and commits
2. **Related Issues** - Any issue numbers to link
3. **Additional Test Scenarios** - Project-specific tests to include
4. **Draft status** - Whether to create as draft

Use the `AskUserQuestion` tool with structured options.

## Quick Mode

If `$ARGUMENTS` contains `--quick` or `-q`:
- Skip interactive questions
- Generate PR with sensible defaults from git history
- Use commit messages to derive summary
- Create as non-draft

## Examples

```bash
# Interactive mode (default)
/create-pr

# Quick mode with auto-generated content
/create-pr --quick

# With specific title
/create-pr "Add user authentication feature"

# As draft
/create-pr --draft "WIP: Implement caching layer"

# With issue reference
/create-pr --issue 123 "Fix login validation"
```

## Best Practices Enforced

1. **Complete Information**: All sections are filled or explicitly marked N/A
2. **Linked Issues**: Encourages linking related issues for traceability
3. **Test Documentation**: Requires explicit test plan before review
4. **Change Categorization**: Uses semantic categorization (Added/Changed/Removed/Fixed)
5. **Small PRs**: If diff is large (>500 lines), suggest breaking into smaller PRs
6. **Self-Review Checklist**: Ensures basic quality before requesting review
7. **Deployment Awareness**: Documents deployment considerations upfront

## Error Handling

- **Not on feature branch**: Prompt to create one
- **Uncommitted changes**: Warn and suggest committing first
- **No remote**: Help set up remote tracking
- **gh CLI not installed**: Provide installation instructions
- **No GitHub auth**: Guide through `gh auth login`
