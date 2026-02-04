# GitHub PR Rules

Guidelines for branching, committing, and creating pull requests.

## Branch Naming

```
<type>/<short-description>
```

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New features | `feat/user-authentication` |
| `fix/` | Bug fixes | `fix/login-redirect-loop` |
| `refactor/` | Code improvements | `refactor/task-service` |
| `test/` | Test additions/fixes | `test/add-task-api-tests` |
| `docs/` | Documentation | `docs/api-readme` |
| `chore/` | Maintenance | `chore/update-dependencies` |
| `perf/` | Performance | `perf/optimize-query` |

## Commit Messages

### Conventional Commits Format
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change (no feature/fix)
- `test`: Adding/updating tests
- `docs`: Documentation only
- `chore`: Maintenance tasks
- `perf`: Performance improvement
- `style`: Formatting (no code change)

### Examples
```bash
# Feature
feat(auth): add logout functionality

# Bug fix
fix(tasks): prevent duplicate creation on double-click

# With body
refactor(api): extract validation to middleware

Move validation logic from individual handlers to shared middleware.
This reduces duplication and ensures consistent error responses.

# Breaking change
feat(api)!: change task response format

BREAKING CHANGE: task.dueDate renamed to task.dueAt
```

### Guidelines
- Subject: imperative mood, no period, max 50 chars
- Body: explain what and why (not how)
- One logical change per commit
- Include related tests in the same commit

## Pull Request Guidelines

### Before Creating PR
```bash
# Ensure all checks pass
bun run check

# Run tests
bun run test:run

# Rebase on latest main
git fetch origin
git rebase origin/main
```

### PR Title
Follow commit message format:
```
feat(auth): add user authentication flow
fix(tasks): resolve duplicate creation issue
```

### PR Description Template
```markdown
## Summary
Brief description of what this PR does.

## Changes
- Change 1
- Change 2
- Change 3

## Type of Change
- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if UI changes)
Before | After
--- | ---
![before](url) | ![after](url)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] `bun run check` passes
- [ ] Tests pass locally
- [ ] Documentation updated (if needed)

## Notes for Reviewers
Any specific areas to focus on or context needed.
```

### Special Cases

#### Schema Changes
```markdown
## Database Migration
- Migration file: `20240115_add_user_roles.sql`
- Rollback plan: Drop `roles` column

## Steps to Apply
1. Run `bun run db:migrate:dev`
2. Seed with `bun run db:seed`
```

#### Infrastructure Changes
```markdown
## Infrastructure Changes
- New S3 bucket for file uploads
- IAM policy updates for ECS task role

## Terraform Plan
<details>
<summary>Plan output</summary>

```
+ aws_s3_bucket.uploads
+ aws_iam_role_policy.ecs_task_s3
```
</details>
```

#### Environment Variables
```markdown
## New Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `S3_BUCKET` | Upload bucket name | Yes |
| `S3_REGION` | AWS region | Yes |
```

## Code Review Guidelines

### For Authors
- Keep PRs small (< 400 lines ideal)
- Self-review before requesting review
- Respond to feedback promptly
- Resolve conversations after addressing

### For Reviewers
- Review within 24 hours
- Be constructive and specific
- Approve when confident, not perfect
- Use suggestions for minor changes

### Review Checklist
- [ ] Code is readable and maintainable
- [ ] Tests cover new functionality
- [ ] No security concerns
- [ ] No performance regressions
- [ ] Documentation is adequate

## Merge Strategy

### Squash and Merge (Default)
- Use for feature branches
- Results in clean linear history
- PR title becomes commit message

### Rebase and Merge
- Use for small, well-organized commits
- Preserves individual commit history

### Merge Commit
- Avoid unless necessary for history tracking

## After Merge

1. Delete the feature branch
2. Pull latest main locally
3. Verify deployment (if applicable)
4. Close related issues
