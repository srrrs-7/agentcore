# /git-commit Command

Create a git commit following Conventional Commits format and project best practices.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Required Context (MUST read)

Read before proceeding:
- /workspace/main/.claude/rules/github-pr.md (commit conventions)
- /workspace/main/.claude/rules/security.md (secrets handling)

## What This Command Does

- Analyzes staged and unstaged changes
- Generates a commit message following Conventional Commits
- Validates no secrets or sensitive files are included
- Creates the commit with proper formatting and co-author attribution

## Best Practices (from rules)

- Follow `/workspace/main/.claude/rules/github-pr.md` for Conventional Commits format
- Apply `/workspace/main/.claude/rules/security.md` to avoid committing secrets

## Git Safety Protocol

**CRITICAL - MUST follow these rules:**

1. **NEVER** update git config
2. **NEVER** run destructive commands (push --force, reset --hard, checkout ., clean -f) unless explicitly requested
3. **NEVER** skip hooks (--no-verify) unless explicitly requested
4. **NEVER** use --amend unless explicitly requested (creates NEW commits after hook failures)
5. **NEVER** commit files that may contain secrets (.env, credentials.json, *.pem, *.key)
6. **ALWAYS** stage specific files rather than using `git add -A` or `git add .`

## Conventional Commits Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add logout button` |
| `fix` | Bug fix | `fix(tasks): prevent duplicate creation` |
| `refactor` | Code change (no feature/fix) | `refactor(api): extract validation logic` |
| `test` | Adding/updating tests | `test(tasks): add unit tests for service` |
| `docs` | Documentation only | `docs(readme): update setup instructions` |
| `chore` | Maintenance tasks | `chore(deps): update dependencies` |
| `perf` | Performance improvement | `perf(query): add database index` |
| `style` | Formatting (no code change) | `style(lint): fix biome warnings` |

### Rules

- **Subject**: Imperative mood, no period, max 50 characters
- **Body**: Explain what and why (not how), wrap at 72 characters
- **Scope**: Optional, indicates area of change (e.g., auth, tasks, api, web)

## Execution Steps

### Phase 1: Gather State (Parallel)

Run these commands in parallel:

```bash
# View all untracked and modified files
git status

# View staged changes
git diff --cached

# View unstaged changes
git diff

# Get recent commit messages for style reference
git log --oneline -10
```

### Phase 2: Validate

**ABORT** if any of these conditions:

1. No changes to commit (working tree clean)
2. Sensitive files detected in staged changes:
   - `.env`, `.env.*` (except `.env.example`)
   - `credentials.json`, `secrets.json`
   - `*.pem`, `*.key`, `*.p12`
   - Files containing API keys, tokens, or passwords

If sensitive files detected, **WARN** the user and ask for confirmation.

### Phase 3: Analyze Changes

From the diff output, determine:

1. **Type**: What kind of change is this?
   - New functionality → `feat`
   - Bug fix → `fix`
   - Code improvement → `refactor`
   - Test changes → `test`
   - Documentation → `docs`
   - Dependencies/config → `chore`
   - Performance → `perf`
   - Formatting → `style`

2. **Scope**: What area is affected?
   - Look at file paths to determine scope
   - Common scopes: `api`, `web`, `auth`, `tasks`, `db`, `ci`

3. **Subject**: Summarize the change in imperative mood
   - "add feature" not "added feature"
   - "fix bug" not "fixes bug"

4. **Body**: If changes are complex, explain why

### Phase 4: Stage Files

If there are unstaged changes that should be included:

```bash
# Stage specific files (NEVER use git add -A or git add .)
git add path/to/file1 path/to/file2
```

**Ask the user** which files to stage if unclear.

### Phase 5: Create Commit

Use HEREDOC format for proper message formatting:

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <subject>

<body if needed>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Phase 6: Verify

```bash
# Confirm commit was created
git log -1 --pretty=format:"%h %s"

# Show current status
git status
```

## Interactive Mode (Default)

If `$ARGUMENTS` is empty, use `AskUserQuestion` to confirm:

1. **Commit Type**: Suggest based on analysis, let user override
2. **Scope**: Suggest based on file paths, let user override or skip
3. **Subject**: Suggest based on changes, let user edit
4. **Files to Stage**: If unstaged changes exist, ask which to include

## Quick Mode

If `$ARGUMENTS` contains `--quick` or `-q`:

- Skip interactive questions
- Auto-detect type and scope from changes
- Generate subject from primary change
- Only commit already-staged files

## Custom Message Mode

If `$ARGUMENTS` contains a quoted message:

```bash
/git-commit "feat(auth): add logout functionality"
```

- Use the provided message directly
- Validate it follows Conventional Commits format
- Add Co-Authored-By footer

## Examples

```bash
# Interactive mode (default)
/git-commit

# Quick mode with auto-generated message
/git-commit --quick

# With custom message
/git-commit "fix(tasks): prevent duplicate creation on double-click"

# With custom message and body
/git-commit "refactor(api): extract validation to middleware" --body "Move validation logic from handlers to shared middleware for consistency"

# Commit specific files
/git-commit --files "src/auth.ts,src/auth.test.ts" "feat(auth): add login validation"
```

## Pre-Commit Hook Failure

If the commit fails due to pre-commit hooks:

1. **DO NOT** use `--no-verify` to bypass
2. **DO NOT** use `--amend` (the commit didn't happen)
3. **FIX** the issues reported by the hook
4. **RE-STAGE** the fixed files
5. **CREATE** a new commit attempt

## Output

After successful commit:

```
✓ Commit created: <hash>
  <type>(<scope>): <subject>

  Files committed:
  - path/to/file1
  - path/to/file2

  Run `git push` to push changes to remote.
```

## Error Handling

| Error | Action |
|-------|--------|
| No changes | Inform user, exit |
| Secrets detected | Warn, ask confirmation |
| Hook failure | Fix issues, re-commit (no amend) |
| Invalid message format | Suggest correction |
