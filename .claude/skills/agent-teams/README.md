# Agent Teams - Parallel Claude Code Agents

Experimental implementation of agent teams for Claude Code, inspired by the official [Agent Teams documentation](https://code.claude.com/docs/en/agent-teams).

## Overview

Agent teams allow you to coordinate multiple Claude Code instances working together in parallel, with:
- **Shared task list** for work coordination
- **Inter-agent messaging** for collaboration
- **Independent context windows** for each teammate
- **File-based state management** for simplicity

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Team Lead                            │
│  - Coordinates work                                         │
│  - Spawns teammates                                         │
│  - Manages tasks                                            │
│  - Synthesizes results                                      │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──────────────┬──────────────┬──────────────┐
             │              │              │              │
      ┌──────▼─────┐ ┌─────▼──────┐ ┌────▼───────┐ ┌────▼───────┐
      │ Teammate 1 │ │ Teammate 2 │ │ Teammate 3 │ │ Teammate N │
      │ (Security) │ │ (Perf)     │ │ (Tests)    │ │ (Other)    │
      └──────┬─────┘ └─────┬──────┘ └────┬───────┘ └────┬───────┘
             │              │              │              │
             └──────────────┴──────────────┴──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
             ┌──────▼──────┐            ┌────────▼────────┐
             │  Task List  │            │    Mailbox      │
             │  (Shared)   │            │  (Messaging)    │
             └─────────────┘            └─────────────────┘
```

## Components

### Agents
- **`team-lead.md`**: Coordinates team, assigns tasks, synthesizes results
- **`team-member.md`**: Executes tasks independently, reports progress

### Utilities
- **`lib/task-manager.sh`**: Manages shared task list with file-based locking
- **`lib/mailbox.sh`**: Inter-agent messaging system

### Scripts
- **`create-team.sh`**: Initialize team infrastructure
- **`spawn-teammate.sh`**: Create and register new teammate
- **`cleanup-team.sh`**: Remove team resources

### Skill
- **`SKILL.md`**: User-facing skill definition for `/agent-teams` command

## Installation

No installation required - files are already in `.claude/` directory.

Ensure dependencies:
```bash
# Required
brew install jq

# Optional (for tmux display mode)
brew install tmux
```

## Quick Start

### 1. Create Team
```bash
cd /workspace/main/.claude/skills/agent-teams
./scripts/create-team.sh my-team
```

### 2. Create Tasks
```bash
cd /workspace/main/.claude/lib
./task-manager.sh create my-team "Review security" "Check OWASP Top 10"
./task-manager.sh create my-team "Review performance" "Find N+1 queries"
./task-manager.sh create my-team "Review tests" "Validate coverage"
```

### 3. Spawn Teammates
```bash
cd /workspace/main/.claude/skills/agent-teams
./scripts/spawn-teammate.sh my-team security-reviewer \
  "Review authentication module for security vulnerabilities"

./scripts/spawn-teammate.sh my-team perf-reviewer \
  "Analyze codebase for performance issues"
```

### 4. Start Teammate Sessions
```bash
# In separate terminals, start Claude Code with team member agent
claude --agent team-member

# Then in each session, load teammate context:
# Read the teammate .md file at ~/.claude/teams/my-team/{teammate-id}.md
# Follow the instructions to claim and execute tasks
```

### 5. Monitor Progress (as Lead)
```bash
# View tasks
./task-manager.sh list my-team

# Check messages
./mailbox.sh read my-team lead

# View team config
cat ~/.claude/teams/my-team/config.json | jq .
```

### 6. Cleanup
```bash
./scripts/cleanup-team.sh my-team
```

## Usage Examples

### Example 1: Parallel Code Review

```bash
# Create team
./scripts/create-team.sh code-review-pr142

# Create review tasks with different focuses
./task-manager.sh create code-review-pr142 \
  "Security review" \
  "Review PR #142 for OWASP Top 10 vulnerabilities. Check: SQL injection, XSS, CSRF, authentication, authorization"

./task-manager.sh create code-review-pr142 \
  "Performance review" \
  "Review PR #142 for performance issues. Check: N+1 queries, memory leaks, inefficient algorithms, missing indexes"

./task-manager.sh create code-review-pr142 \
  "Test coverage review" \
  "Review PR #142 test coverage. Verify edge cases, error handling, integration tests"

# Spawn specialized reviewers
./scripts/spawn-teammate.sh code-review-pr142 security-reviewer \
  "You are a security expert. Focus on OWASP Top 10 vulnerabilities. Rate findings as Critical/High/Medium/Low"

./scripts/spawn-teammate.sh code-review-pr142 perf-reviewer \
  "You are a performance expert. Identify bottlenecks and quantify impact. Suggest concrete optimizations"

./scripts/spawn-teammate.sh code-review-pr142 test-reviewer \
  "You are a test quality expert. Ensure tests cover edge cases and follow project patterns"

# Start teammate sessions (in separate terminals)
# Each teammate claims their task and executes review

# Monitor progress
./task-manager.sh list code-review-pr142
./mailbox.sh read code-review-pr142 lead

# Synthesize results after all reviews complete
# Create unified review document with findings from all three perspectives

# Cleanup
./scripts/cleanup-team.sh code-review-pr142
```

### Example 2: Competing Hypotheses Debugging

```bash
# Create investigation team
./scripts/create-team.sh bug-debug

# Create hypothesis testing tasks
./task-manager.sh create bug-debug \
  "Test event loop hypothesis" \
  "Hypothesis: App exits because Lambda handler doesn't keep event loop alive. Test by adding keepalive logging"

./task-manager.sh create bug-debug \
  "Test exception hypothesis" \
  "Hypothesis: Unhandled exception causes graceful shutdown. Test by adding try-catch and logging"

./task-manager.sh create bug-debug \
  "Test cleanup hypothesis" \
  "Hypothesis: WebSocket/SSE stream closes prematurely. Test by checking connection lifecycle"

# Spawn investigators
./scripts/spawn-teammate.sh bug-debug investigator-1 \
  "Test the event loop hypothesis. Add logging, run tests, collect evidence"

./scripts/spawn-teammate.sh bug-debug investigator-2 \
  "Test the exception hypothesis. Add error handling, check logs, report findings"

./scripts/spawn-teammate.sh bug-debug investigator-3 \
  "Test the cleanup hypothesis. Trace connection lifecycle, identify premature closes"

# Investigators work in parallel, share findings via mailbox
# They challenge each other's theories and converge on root cause
```

### Example 3: Parallel Feature Development

```bash
# Create team
./scripts/create-team.sh feature-auth

# Create dependent tasks
SCHEMA_TASK=$(./task-manager.sh create feature-auth \
  "Define auth schema" \
  "Create Prisma schema for User, Session, Token models")

HANDLER_TASK=$(./task-manager.sh create feature-auth \
  "Implement auth handlers" \
  "Create POST /login, POST /logout, GET /me endpoints" \
  "[\"${SCHEMA_TASK}\"]")

SERVICE_TASK=$(./task-manager.sh create feature-auth \
  "Implement auth service" \
  "Business logic: JWT generation, session management, password hashing" \
  "[\"${SCHEMA_TASK}\"]")

./task-manager.sh create feature-auth \
  "Write auth tests" \
  "Integration tests for all auth endpoints" \
  "[\"${HANDLER_TASK}\", \"${SERVICE_TASK}\"]"

# Spawn developers
./scripts/spawn-teammate.sh feature-auth backend-dev \
  "You are a backend developer. Implement auth endpoints and service following TDD"

./scripts/spawn-teammate.sh feature-auth test-engineer \
  "You are a test engineer. Write comprehensive integration tests"

# Tasks automatically unblock as dependencies complete
```

## File Structure

```
~/.claude/
├── teams/{team-name}/
│   ├── config.json              # Team configuration
│   ├── README.md                # Team-specific documentation
│   └── {teammate-id}.md         # Teammate context files
├── tasks/{team-name}/
│   ├── pending/                 # Tasks ready to claim
│   │   └── task-*.json
│   ├── in-progress/             # Tasks being worked on
│   │   └── task-*.json
│   └── completed/               # Finished tasks
│       └── task-*.json
└── mailbox/{team-name}/
    ├── inbox/{agent-id}/        # Personal messages
    │   └── msg-*.json
    ├── sent/{agent-id}/         # Sent messages
    │   └── msg-*.json
    └── broadcast/               # Team-wide messages
        └── broadcast-*.json
```

## Task Format

```json
{
  "id": "task-1707654321-12345",
  "subject": "Review security vulnerabilities",
  "description": "Detailed task description...",
  "status": "pending|in_progress|completed",
  "assignee": "teammate-id or null",
  "blockedBy": ["task-id-1", "task-id-2"],
  "createdAt": "2026-02-11T12:00:00Z",
  "updatedAt": "2026-02-11T12:00:00Z",
  "completedAt": "2026-02-11T13:00:00Z"
}
```

## Message Format

```json
{
  "id": "msg-1707654321-12345",
  "from": "lead",
  "to": "teammate-1",
  "subject": "Task assignment",
  "body": "Please review the authentication module",
  "timestamp": "2026-02-11T12:00:00Z",
  "read": false
}
```

## Display Modes

### In-Process Mode (Current Implementation)
- All teammates run independently in separate terminal sessions
- Manual coordination via shared files (tasks, mailbox)
- No automatic UI integration yet

### Tmux Split-Pane Mode (Future)
- Each teammate in separate tmux pane
- Automatic pane management
- Visual monitoring of all teammates
- Requires tmux integration script

To enable tmux mode, create `scripts/tmux-split.sh` (TODO).

## Limitations

Current implementation limitations:

1. **Manual Session Management**
   - Teammates must be started manually in separate terminals
   - No automatic spawning or shutdown

2. **No Real-Time Notifications**
   - File-based messaging requires polling
   - No push notifications for new messages or tasks

3. **Basic Locking**
   - File-based task claiming (move operation)
   - No distributed lock for race conditions

4. **No Automatic UI**
   - No tmux integration yet
   - No automatic pane splitting

5. **Single Team Per Lead**
   - Lead can only manage one team at a time

6. **No Session Resumption**
   - If teammate crashes, state is preserved but session must restart

## Roadmap

Future enhancements:

- [ ] Tmux integration for split-pane display
- [ ] iTerm2 integration as alternative
- [ ] Automatic teammate spawning via Claude Code subagents
- [ ] File watcher for real-time notifications
- [ ] Distributed locking for task claims
- [ ] Session resumption for crashed teammates
- [ ] Web UI for team monitoring
- [ ] Metrics and analytics

## Best Practices

### For Team Leads
1. Decompose work into independent, parallel tasks
2. Set clear acceptance criteria for each task
3. Size tasks appropriately (30-60 minutes)
4. Monitor progress regularly
5. Synthesize results from all teammates
6. Clean up resources after team disbands

### For Teammates
1. Claim tasks that match your assigned role
2. Work autonomously within your scope
3. Report blockers immediately
4. Share unexpected findings
5. Test thoroughly before marking complete
6. Communicate results clearly

### For Everyone
- Avoid file conflicts (different files per teammate)
- Use task dependencies for serialization
- Keep messages focused and actionable
- Follow project coding standards
- Document non-obvious decisions

## Troubleshooting

### Issue: Task won't claim
**Cause**: Task is blocked by dependencies
**Solution**: Check `blockedBy` array, wait for dependencies to complete

### Issue: Messages not visible
**Cause**: Wrong team name or agent ID
**Solution**: Verify team name matches exactly, check agent ID in config

### Issue: Cleanup fails
**Cause**: Active teammates still running
**Solution**: Shut down all teammates first, or use `--force` flag

### Issue: Permission denied
**Cause**: Scripts not executable
**Solution**: Run `chmod +x /workspace/main/.claude/skills/agent-teams/scripts/*.sh`

## Contributing

This is an experimental implementation. Improvements welcome:

1. Fork and create feature branch
2. Test thoroughly with real use cases
3. Document changes and examples
4. Submit PR with clear description

## References

- [Official Agent Teams Documentation](https://code.claude.com/docs/en/agent-teams)
- [Claude Code Documentation](https://code.claude.com/docs)
- [Tmux Manual](https://github.com/tmux/tmux/wiki)

## License

Part of the main repository. See top-level LICENSE file.

---

**Status**: Experimental - Core functionality working, UI integration pending

**Last Updated**: 2026-02-11
