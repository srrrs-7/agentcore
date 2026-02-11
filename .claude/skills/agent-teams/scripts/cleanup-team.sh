#!/usr/bin/env bash
# Cleanup Agent Team
# Removes team resources (config, tasks, mailbox)

set -euo pipefail

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(dirname "$(dirname "$(dirname "${SCRIPT_DIR}")")")"
# shellcheck source=../../../lib/common.sh
source "${CLAUDE_DIR}/lib/common.sh"

TASK_MANAGER="${CLAUDE_DIR}/lib/task-manager.sh"
MAILBOX="${CLAUDE_DIR}/lib/mailbox.sh"

# Main function
cleanup_team() {
    ensure_jq

    local team_name="${1:-}"
    local force="${2:-false}"

    if [[ -z "${team_name}" ]]; then
        cat <<EOF
Usage: cleanup-team.sh <team-name> [--force]

Options:
  --force    Skip confirmation prompt

Examples:
  cleanup-team.sh my-team
  cleanup-team.sh my-team --force
EOF
        exit 1
    fi

    local team_dir="${TEAMS_DIR}/${team_name}"
    local config_file="${team_dir}/config.json"

    # Check if team exists
    validate_team_exists "${team_name}" || exit 1

    # Check for active teammates
    if [[ -f "${config_file}" ]]; then
        local active_count=$(jq '[.members[] | select(.status == "spawned" or .status == "active")] | length' "${config_file}")
        if [[ "${active_count}" -gt 0 ]]; then
            log_warn "Team has ${active_count} active teammates"
            log_warn "Shut down all teammates before cleanup"

            echo ""
            echo "Active teammates:"
            jq -r '.members[] | select(.status == "spawned" or .status == "active") | "  - \(.agentId) (\(.role))"' "${config_file}"
            echo ""

            if [[ "${force}" != "--force" ]]; then
                log_error "Cleanup aborted. Use --force to override"
                exit 1
            fi
        fi
    fi

    # Confirmation
    if [[ "${force}" != "--force" ]]; then
        echo ""
        echo "⚠️  This will delete all resources for team: ${team_name}"
        echo ""
        echo "  - Team config: ${team_dir}"
        echo "  - Tasks: ${TASKS_DIR}/${team_name}"
        echo "  - Mailbox: ${MAILBOX_DIR}/${team_name}"
        echo ""

        if ! confirm "Are you sure?"; then
            echo "Cleanup cancelled"
            exit 0
        fi
    fi

    log_info "Cleaning up team: ${team_name}"

    # Remove tasks
    if safe_rm "${TASKS_DIR}/${team_name}"; then
        log_success "Removed tasks directory"
    fi

    # Remove mailbox
    if safe_rm "${MAILBOX_DIR}/${team_name}"; then
        log_success "Removed mailbox directory"
    fi

    # Remove team directory
    if safe_rm "${team_dir}"; then
        log_success "Removed team directory"
    fi

    echo ""
    echo "✅ Team '${team_name}' cleaned up successfully!"
}

cleanup_team "$@"
