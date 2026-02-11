---
name: agent-teams
description: Create and manage agent teams for parallel work. Coordinate multiple Claude Code instances working together with shared tasks, inter-agent messaging, and centralized management.
---

# Agent Teams Skill

Create and coordinate multiple Claude Code agent teammates working in parallel.

**User Request**: $ARGUMENTS

## Overview

Agent teams enable you to:
- **Parallelize work**: Multiple agents working independently on different tasks
- **Multi-perspective analysis**: Different agents examining the same problem from different angles
- **Compete hypotheses**: Agents testing different theories simultaneously
- **Collaborative problem-solving**: Agents sharing findings and challenging each other

## When to Use Agent Teams

✅ **Good Use Cases**:
- Parallel code review (security, performance, test coverage)
- Investigating bugs with competing hypotheses
- Research and comparison of multiple approaches
- Building independent modules/features simultaneously
- Cross-layer changes (frontend, backend, tests)

❌ **Avoid When**:
- Sequential or tightly coupled work
- Single file needs multiple edits
- Simple tasks with low coordination benefit
- Work requires frequent synchronization

## Quick Start

### 1. Create Team
```bash
/workspace/main/.claude/skills/agent-teams/scripts/create-team.sh <team-name>
```

Example:
```bash
/workspace/main/.claude/skills/agent-teams/scripts/create-team.sh code-review-pr142
```

### 2. Create Tasks
```bash
/workspace/main/.claude/lib/task-manager.sh create <team-name> <subject> <description>
```

Example:
```bash
/workspace/main/.claude/lib/task-manager.sh create code-review-pr142 \
  "Security review" \
  "Review authentication module for OWASP Top 10 vulnerabilities"

/workspace/main/.claude/lib/task-manager.sh create code-review-pr142 \
  "Performance review" \
  "Check for N+1 queries, memory leaks, inefficient algorithms"

/workspace/main/.claude/lib/task-manager.sh create code-review-pr142 \
  "Test coverage review" \
  "Validate test cases cover edge cases and follow project patterns"
```

### 3. Spawn Teammates
```bash
/workspace/main/.claude/skills/agent-teams/scripts/spawn-teammate.sh \
  <team-name> <role> <spawn-prompt>
```

Example:
```bash
/workspace/main/.claude/skills/agent-teams/scripts/spawn-teammate.sh \
  code-review-pr142 \
  "security-reviewer" \
  "You are a security reviewer. Review the authentication module at src/auth/ for vulnerabilities. Focus on: token handling, session management, input validation, SQL injection. Report findings with severity ratings."

/workspace/main/.claude/skills/agent-teams/scripts/spawn-teammate.sh \
  code-review-pr142 \
  "perf-reviewer" \
  "You are a performance reviewer. Analyze the codebase for performance issues. Check for: N+1 queries, memory leaks, inefficient algorithms, missing indexes. Quantify impact and suggest optimizations."
```

### 4. Monitor Progress
```bash
# View tasks
/workspace/main/.claude/lib/task-manager.sh list <team-name>

# Check messages
/workspace/main/.claude/lib/mailbox.sh read <team-name> lead

# View team status
cat ~/.claude/teams/<team-name>/config.json | jq .
```

### 5. Cleanup Team
```bash
/workspace/main/.claude/skills/agent-teams/scripts/cleanup-team.sh <team-name>
```

## Team Lead Workflow

As the team lead, you should:

1. **Decompose Work**
   - Break down complex tasks into independent units
   - Create clear acceptance criteria
   - Set up task dependencies if needed

2. **Spawn Teammates**
   - Assign clear roles (security reviewer, developer, tester)
   - Provide context and scope in spawn prompt
   - Specify success criteria

3. **Monitor Progress**
   - Check task list regularly
   - Read teammate messages
   - Identify and resolve blockers

4. **Synthesize Results**
   - Collect outputs from all teammates
   - Identify common themes and conflicts
   - Create unified summary or recommendations

5. **Cleanup**
   - Ensure all tasks completed
   - Shut down teammates
   - Clean up team resources

## Teammate Workflow

As a teammate, you should:

1. **Claim Task**
   ```bash
   /workspace/main/.claude/lib/task-manager.sh claim <team-name> <task-id> <your-agent-id>
   ```

2. **Execute Work**
   - Read task description and acceptance criteria
   - Implement solution following project standards
   - Test thoroughly

3. **Complete Task**
   ```bash
   /workspace/main/.claude/lib/task-manager.sh complete <team-name> <task-id>
   ```

4. **Report Results**
   ```bash
   /workspace/main/.claude/lib/mailbox.sh send <team-name> <your-id> lead \
     "Task completed" \
     "Task <task-id> finished. Summary: ..."
   ```

5. **Claim Next Task**
   - Check for newly unblocked tasks
   - Repeat cycle

## Communication

### Send Message to Specific Agent
```bash
/workspace/main/.claude/lib/mailbox.sh send <team-name> <from> <to> <subject> <body>
```

Example:
```bash
/workspace/main/.claude/lib/mailbox.sh send code-review-pr142 lead security-reviewer \
  "Focus area" \
  "Please prioritize JWT token validation in your review"
```

### Broadcast to All Teammates
```bash
/workspace/main/.claude/lib/mailbox.sh broadcast <team-name> <from> <subject> <body>
```

Example:
```bash
/workspace/main/.claude/lib/mailbox.sh broadcast code-review-pr142 lead \
  "Status update" \
  "All reviews should be completed by end of day"
```

### Read Messages
```bash
/workspace/main/.claude/lib/mailbox.sh read <team-name> <agent-id>
```

## Task Dependencies

Create dependent tasks using JSON array:

```bash
# Create blocking task
TASK1=$(/workspace/main/.claude/lib/task-manager.sh create my-team \
  "Setup database schema" \
  "Create Prisma schema for user authentication")

# Create dependent task (blocked by TASK1)
/workspace/main/.claude/lib/task-manager.sh create my-team \
  "Implement auth endpoints" \
  "Create login/logout handlers" \
  "[\"${TASK1}\"]"
```

Dependent tasks automatically unblock when blocking tasks complete.

## Display Modes

### In-Process Mode (Default)
- All teammates in main terminal
- Use Shift+Up/Down to select teammate
- Type to message selected teammate
- Press Ctrl+T to toggle task list

### Tmux Split-Pane Mode
- Each teammate in separate pane
- View all outputs simultaneously
- Click pane to interact

To enable tmux mode, set in settings.json:
```json
{
  "teammateMode": "tmux"
}
```

Or use flag:
```bash
claude --teammate-mode tmux
```

## Example Use Cases

### Parallel Code Review
```bash
# Create team
./scripts/create-team.sh code-review

# Create review tasks
task-manager.sh create code-review "Security review" "Check OWASP Top 10"
task-manager.sh create code-review "Performance review" "Find N+1 queries"
task-manager.sh create code-review "Test coverage" "Validate edge cases"

# Spawn specialized reviewers
spawn-teammate.sh code-review security-reviewer "Focus on auth vulnerabilities"
spawn-teammate.sh code-review perf-reviewer "Analyze query performance"
spawn-teammate.sh code-review test-reviewer "Check test quality"

# Monitor and synthesize results
task-manager.sh list code-review
mailbox.sh read code-review lead
```

### Investigate Bug with Competing Hypotheses
```bash
# Create team
./scripts/create-team.sh bug-investigation

# Create investigation tasks
task-manager.sh create bug-investigation "Test event loop hypothesis" "Check if handler exits without keepalive"
task-manager.sh create bug-investigation "Test exception hypothesis" "Look for unhandled exceptions"
task-manager.sh create bug-investigation "Test cleanup hypothesis" "Check if WebSocket closes prematurely"

# Spawn investigators
spawn-teammate.sh bug-investigation investigator-1 "Test event loop theory"
spawn-teammate.sh bug-investigation investigator-2 "Test exception theory"
spawn-teammate.sh bug-investigation investigator-3 "Test cleanup theory"

# Teammates debate and converge on root cause
```

### Build Feature Modules in Parallel
```bash
# Create team
./scripts/create-team.sh feature-auth

# Create module tasks
task-manager.sh create feature-auth "Auth handler" "Implement login/logout endpoints"
task-manager.sh create feature-auth "Auth service" "Implement business logic with JWT"
task-manager.sh create feature-auth "Auth tests" "Write integration tests"

# Spawn developers
spawn-teammate.sh feature-auth backend-dev "Implement auth endpoints and service"
spawn-teammate.sh feature-auth test-engineer "Write comprehensive tests"
```

## File Structure

```
~/.claude/
├── teams/
│   └── {team-name}/
│       ├── config.json          # Team configuration
│       ├── README.md            # Team documentation
│       └── {teammate-id}.md     # Teammate context files
├── tasks/
│   └── {team-name}/
│       ├── pending/             # Tasks ready to claim
│       ├── in-progress/         # Tasks being worked on
│       └── completed/           # Finished tasks
└── mailbox/
    └── {team-name}/
        ├── inbox/
        │   └── {agent-id}/      # Personal messages
        ├── sent/
        │   └── {agent-id}/      # Sent messages
        └── broadcast/           # Team-wide messages
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `create-team.sh <name>` | Create new team |
| `spawn-teammate.sh <team> <role> <prompt>` | Spawn teammate |
| `cleanup-team.sh <team>` | Remove team resources |
| `task-manager.sh create <team> <subject> <desc>` | Create task |
| `task-manager.sh list <team>` | List tasks |
| `task-manager.sh claim <team> <task-id> <agent>` | Claim task |
| `task-manager.sh complete <team> <task-id>` | Complete task |
| `mailbox.sh send <team> <from> <to> <subj> <body>` | Send message |
| `mailbox.sh broadcast <team> <from> <subj> <body>` | Broadcast |
| `mailbox.sh read <team> <agent>` | Read messages |

## Best Practices

### Task Sizing
- **Too small**: Coordination overhead exceeds value
- **Too large**: Too long without check-ins
- **Just right**: 30-60 minute self-contained units

### Avoid File Conflicts
- Assign different files/directories to different teammates
- Use task dependencies to serialize overlapping work

### Communication
- Report blockers immediately
- Share unexpected findings
- Challenge hypotheses constructively
- Keep messages focused and actionable

### Quality
- Define clear acceptance criteria
- Test thoroughly before marking complete
- Self-review before completion
- Document non-obvious decisions

## Limitations

- No automatic session resumption for teammates
- Manual teammate process management (no auto-spawn yet)
- File-based messaging (no real-time push notifications)
- Basic task locking (file-based, not distributed lock)
- One team per lead session
- No nested teams (teammates can't spawn sub-teams)

## Troubleshooting

### Teammate not claiming tasks
- Check if task is blocked: `task-manager.sh get <team> <task-id>`
- Verify teammate has access to team directory
- Ensure task is in pending state

### Messages not delivered
- Check mailbox exists: `mailbox.sh read <team> <agent-id>`
- Verify team name matches exactly
- Check file permissions in ~/.claude/mailbox/

### Team cleanup fails
- Shut down all active teammates first
- Use `--force` flag to override active teammate check
- Manually remove directories if needed

## Next Steps

1. **Create your first team** for a real task
2. **Experiment with different roles** and responsibilities
3. **Refine task decomposition** based on results
4. **Share findings** and iterate on the workflow

---

**Remember**: Agent teams multiply productivity through effective coordination. Decompose work well, communicate clearly, and let teammates work independently.
