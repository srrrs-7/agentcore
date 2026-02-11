#!/usr/bin/env bash
# Spawn Teammate
# Creates a new team member and registers it in team config

set -euo pipefail

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(dirname "$(dirname "$(dirname "${SCRIPT_DIR}")")")"
# shellcheck source=../../../lib/common.sh
source "${CLAUDE_DIR}/lib/common.sh"

# Main function
spawn_teammate() {
    ensure_jq

    local team_name="${1:-}"
    local role="${2:-}"
    local spawn_prompt="${3:-}"

    if [[ -z "${team_name}" || -z "${role}" || -z "${spawn_prompt}" ]]; then
        cat <<EOF
Usage: spawn-teammate.sh <team-name> <role> <spawn-prompt>

Examples:
  spawn-teammate.sh my-team "security-reviewer" "Review auth module for vulnerabilities"
  spawn-teammate.sh my-team "perf-analyst" "Analyze database query performance"
  spawn-teammate.sh my-team "test-engineer" "Write integration tests for API endpoints"
EOF
        exit 1
    fi

    local team_dir="${TEAMS_DIR}/${team_name}"
    local config_file="${team_dir}/config.json"

    # Check if team exists
    validate_team_exists "${team_name}" || exit 1

    log_info "Spawning teammate: ${role}"

    # Generate teammate ID
    local teammate_id="${role}-$(get_unix_timestamp)"

    # Add teammate to config
    local updated_config=$(jq --arg id "${teammate_id}" \
                               --arg role "${role}" \
                               --arg prompt "${spawn_prompt}" \
                               --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
                               '.members += [{
                                   "agentId": $id,
                                   "role": $role,
                                   "agentType": "team-member",
                                   "spawnPrompt": $prompt,
                                   "status": "spawned",
                                   "spawnedAt": $timestamp
                               }]' "${config_file}")

    echo "${updated_config}" > "${config_file}"

    log_success "Teammate '${teammate_id}' added to team config"

    # Create teammate session info
    cat > "${team_dir}/${teammate_id}.md" <<EOF
# Teammate: ${teammate_id}

**Role**: ${role}
**Team**: ${team_name}
**Spawned**: $(date -u +%Y-%m-%d)

## Spawn Prompt

${spawn_prompt}

## Instructions

You are a team member with role: **${role}**

Your responsibilities:
1. Check task list: \`task-manager.sh list ${team_name} pending\`
2. Claim available tasks: \`task-manager.sh claim ${team_name} <task-id> ${teammate_id}\`
3. Execute work according to task requirements
4. Report completion: \`task-manager.sh complete ${team_name} <task-id}\`
5. Communicate with team: \`mailbox.sh send ${team_name} ${teammate_id} lead <subject> <body>\`

Follow the team-member agent guidelines in \`.claude/agents/team-member.md\`.

## Task Workflow

\`\`\`bash
# 1. List available tasks
${CLAUDE_DIR}/lib/task-manager.sh list ${team_name} pending

# 2. Claim a task
${CLAUDE_DIR}/lib/task-manager.sh claim ${team_name} <task-id> ${teammate_id}

# 3. Complete task
${CLAUDE_DIR}/lib/task-manager.sh complete ${team_name} <task-id}

# 4. Send completion message
${CLAUDE_DIR}/lib/mailbox.sh send ${team_name} ${teammate_id} lead "Task completed" "Task <task-id> finished"
\`\`\`

## Communication

\`\`\`bash
# Check messages
${CLAUDE_DIR}/lib/mailbox.sh read ${team_name} ${teammate_id}

# Send message to lead
${CLAUDE_DIR}/lib/mailbox.sh send ${team_name} ${teammate_id} lead <subject> <body>

# Send message to another teammate
${CLAUDE_DIR}/lib/mailbox.sh send ${team_name} ${teammate_id} <other-teammate-id> <subject> <body>
\`\`\`
EOF

    echo ""
    echo "✅ Teammate '${teammate_id}' spawned successfully!"
    echo ""
    echo "📝 Teammate info: ${team_dir}/${teammate_id}.md"
    echo "🎯 Role: ${role}"
    echo "📋 Spawn prompt: ${spawn_prompt}"
    echo ""
    echo "Next steps:"
    echo "  1. Create tasks for this teammate"
    echo "  2. Teammate claims and executes tasks"
    echo "  3. Monitor progress via task list and mailbox"
    echo ""

    log_warn "Manual Action Required:"
    echo "  Start a new Claude Code session and load teammate context:"
    echo "  claude --agent team-member --context ${team_dir}/${teammate_id}.md"
}

spawn_teammate "$@"
