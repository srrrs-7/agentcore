#!/usr/bin/env bash
# Create Agent Team
# Initializes team infrastructure: config, tasks, mailbox

set -euo pipefail

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(dirname "$(dirname "$(dirname "${SCRIPT_DIR}")")")"
# shellcheck source=../../../lib/common.sh
source "${CLAUDE_DIR}/lib/common.sh"

TASK_MANAGER="${CLAUDE_DIR}/lib/task-manager.sh"
MAILBOX="${CLAUDE_DIR}/lib/mailbox.sh"

# Main function
create_team() {
    local team_name="${1:-}"

    if [[ -z "${team_name}" ]]; then
        echo "Usage: create-team.sh <team-name>"
        exit 1
    fi

    local team_dir="${TEAMS_DIR}/${team_name}"

    # Check if team already exists
    validate_team_not_exists "${team_name}" || exit 1

    log_info "Creating agent team: ${team_name}"

    # Create team directory
    safe_mkdir "${team_dir}" || exit 1

    # Create team config
    cat > "${team_dir}/config.json" <<EOF
{
  "name": "${team_name}",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "lead": {
    "agentId": "lead",
    "agentType": "team-lead",
    "status": "active"
  },
  "members": [],
  "displayMode": "in-process",
  "status": "active"
}
EOF

    log_success "Created team config: ${team_dir}/config.json"

    # Initialize task system
    "${TASK_MANAGER}" init "${team_name}"

    # Initialize mailbox
    "${MAILBOX}" init "${team_name}"

    # Create team README
    cat > "${team_dir}/README.md" <<EOF
# Agent Team: ${team_name}

Created: $(date -u +%Y-%m-%d)

## Team Structure

- **Lead**: Coordinates work and manages team
- **Members**: (to be added)

## Directories

- \`config.json\`: Team configuration
- Tasks: \`~/.claude/tasks/${team_name}/\`
- Mailbox: \`~/.claude/mailbox/${team_name}/\`

## Commands

### Spawn Teammate
\`\`\`bash
${CLAUDE_DIR}/skills/agent-teams/scripts/spawn-teammate.sh ${team_name} <role> <prompt>
\`\`\`

### Send Message
\`\`\`bash
${CLAUDE_DIR}/lib/mailbox.sh send ${team_name} <from> <to> <subject> <body>
\`\`\`

### Manage Tasks
\`\`\`bash
${CLAUDE_DIR}/lib/task-manager.sh create ${team_name} <subject> <description>
${CLAUDE_DIR}/lib/task-manager.sh list ${team_name}
\`\`\`

### Cleanup Team
\`\`\`bash
${CLAUDE_DIR}/skills/agent-teams/scripts/cleanup-team.sh ${team_name}
\`\`\`
EOF

    log_success "Created team README: ${team_dir}/README.md"

    echo ""
    echo "✅ Agent team '${team_name}' created successfully!"
    echo ""
    echo "📁 Team directory: ${team_dir}"
    echo "📋 Tasks: ~/.claude/tasks/${team_name}/"
    echo "📬 Mailbox: ~/.claude/mailbox/${team_name}/"
    echo ""
    echo "Next steps:"
    echo "  1. Spawn teammates: spawn-teammate.sh ${team_name} <role> <prompt>"
    echo "  2. Create tasks: task-manager.sh create ${team_name} <subject> <description>"
    echo "  3. Start collaboration!"
}

create_team "$@"
