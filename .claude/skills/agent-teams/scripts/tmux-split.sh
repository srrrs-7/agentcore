#!/usr/bin/env bash
# Tmux Split-Pane Mode for Agent Teams
# Creates split panes for team lead and teammates

set -euo pipefail

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(dirname "$(dirname "$(dirname "${SCRIPT_DIR}")")")"
# shellcheck source=../../../lib/common.sh
source "${CLAUDE_DIR}/lib/common.sh"

# Main function
setup_tmux_team() {
    ensure_tmux
    ensure_jq

    local team_name="${1:-}"

    if [[ -z "${team_name}" ]]; then
        cat <<EOF
Usage: tmux-split.sh <team-name>

Creates a tmux session with split panes for team lead and teammates.

Layout:
  ┌─────────────────────────────────┐
  │         Team Lead               │
  ├──────────────┬──────────────────┤
  │ Teammate 1   │   Teammate 2     │
  ├──────────────┼──────────────────┤
  │ Teammate 3   │   Teammate 4     │
  └──────────────┴──────────────────┘

Example:
  tmux-split.sh code-review-pr142

After setup, attach to session:
  tmux attach-session -t ${team_name}

Navigate panes:
  Ctrl+b + arrow keys
EOF
        exit 1
    fi

    local team_dir="${TEAMS_DIR}/${team_name}"
    local config_file="${team_dir}/config.json"

    validate_team_exists "${team_name}" || exit 1

    # Read team config
    local member_count=$(jq '.members | length' "${config_file}")

    log_info "Setting up tmux session for team: ${team_name}"
    log_info "Team members: ${member_count}"

    # Create new tmux session (detached)
    local session_name="${team_name}"

    if tmux has-session -t "${session_name}" 2>/dev/null; then
        log_warn "Tmux session '${session_name}' already exists"
        echo "Attach with: tmux attach-session -t ${session_name}"
        exit 0
    fi

    # Create session with lead pane
    tmux new-session -d -s "${session_name}" -n "team"

    # Set lead pane title
    tmux send-keys -t "${session_name}:0.0" "echo 'Team Lead - ${team_name}'" C-m
    tmux send-keys -t "${session_name}:0.0" "# This is the team lead pane" C-m
    tmux send-keys -t "${session_name}:0.0" "# Use /workspace/main/.claude/lib/task-manager.sh and mailbox.sh" C-m
    tmux send-keys -t "${session_name}:0.0" "" C-m

    # Create panes for teammates
    if [[ "${member_count}" -gt 0 ]]; then
        # Split horizontally for first teammate
        tmux split-window -h -t "${session_name}:0"
        tmux send-keys -t "${session_name}:0.1" "echo 'Teammate 1'" C-m

        if [[ "${member_count}" -gt 1 ]]; then
            # Split first pane vertically for second teammate
            tmux split-window -v -t "${session_name}:0.0"
            tmux send-keys -t "${session_name}:0.2" "echo 'Teammate 2'" C-m
        fi

        if [[ "${member_count}" -gt 2 ]]; then
            # Split second pane vertically for third teammate
            tmux split-window -v -t "${session_name}:0.1"
            tmux send-keys -t "${session_name}:0.3" "echo 'Teammate 3'" C-m
        fi

        if [[ "${member_count}" -gt 3 ]]; then
            log_warn "More than 3 teammates - additional panes will be cramped"
            # Add more splits as needed
            for i in $(seq 4 "${member_count}"); do
                tmux split-window -h -t "${session_name}:0"
                tmux send-keys -t "${session_name}:0.$((i))" "echo 'Teammate $i'" C-m
            done
        fi

        # Balance panes
        tmux select-layout -t "${session_name}:0" tiled
    fi

    # Select lead pane
    tmux select-pane -t "${session_name}:0.0"

    log_success "Tmux session '${session_name}' created"
    echo ""
    echo "To attach to the session:"
    echo "  tmux attach-session -t ${session_name}"
    echo ""
    echo "Tmux navigation:"
    echo "  Ctrl+b + arrow keys: Navigate panes"
    echo "  Ctrl+b + z: Toggle pane zoom"
    echo "  Ctrl+b + d: Detach from session"
    echo ""
    echo "To kill the session:"
    echo "  tmux kill-session -t ${session_name}"
}

setup_tmux_team "$@"
