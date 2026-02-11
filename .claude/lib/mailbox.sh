#!/usr/bin/env bash
# Mailbox Utility for Agent Teams
# Manages message passing between agents

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

# Initialize team mailbox
mailbox_init() {
    local team_name="$1"
    local mailbox_dir="${MAILBOX_DIR}/${team_name}"

    safe_mkdir "${mailbox_dir}/inbox" || return 1
    safe_mkdir "${mailbox_dir}/sent" || return 1
    safe_mkdir "${mailbox_dir}/broadcast" || return 1

    log_success "Initialized mailbox for team: ${team_name}"
}

# Send message to specific agent
mailbox_send() {
    ensure_jq

    local team_name="$1"
    local from_agent="$2"
    local to_agent="$3"
    local subject="$4"
    local body="$5"

    local mailbox_dir="${MAILBOX_DIR}/${team_name}"
    local msg_id="msg-$(date +%s)-$$"
    local inbox_file="${mailbox_dir}/inbox/${to_agent}/${msg_id}.json"
    local sent_file="${mailbox_dir}/sent/${from_agent}/${msg_id}.json"

    if [[ ! -d "${mailbox_dir}" ]]; then
        log_error "Team '${team_name}' mailbox not initialized"
        return 1
    fi

    # Create inbox directory for recipient if not exists
    mkdir -p "${mailbox_dir}/inbox/${to_agent}"
    mkdir -p "${mailbox_dir}/sent/${from_agent}"

    # Create message JSON
    local message=$(cat <<EOF
{
  "id": "${msg_id}",
  "from": "${from_agent}",
  "to": "${to_agent}",
  "subject": "${subject}",
  "body": "${body}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "read": false
}
EOF
)

    # Save to recipient's inbox
    echo "${message}" | jq '.' > "${inbox_file}"

    # Save to sender's sent folder
    echo "${message}" | jq '.' > "${sent_file}"

    log_success "Message sent from ${from_agent} to ${to_agent}"
    echo "${msg_id}"
}

# Broadcast message to all team members
mailbox_broadcast() {
    ensure_jq

    local team_name="$1"
    local from_agent="$2"
    local subject="$3"
    local body="$4"

    local mailbox_dir="${MAILBOX_DIR}/${team_name}"
    local msg_id="broadcast-$(date +%s)-$$"
    local broadcast_file="${mailbox_dir}/broadcast/${msg_id}.json"

    if [[ ! -d "${mailbox_dir}" ]]; then
        log_error "Team '${team_name}' mailbox not initialized"
        return 1
    fi

    mkdir -p "${mailbox_dir}/broadcast"

    # Create broadcast message
    cat > "${broadcast_file}" <<EOF
{
  "id": "${msg_id}",
  "from": "${from_agent}",
  "to": "all",
  "subject": "${subject}",
  "body": "${body}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    log_success "Broadcast message sent from ${from_agent}"
    echo "${msg_id}"
}

# Read messages for an agent
mailbox_read() {
    ensure_jq

    local team_name="$1"
    local agent_id="$2"
    local mailbox_dir="${MAILBOX_DIR}/${team_name}"
    local inbox_dir="${mailbox_dir}/inbox/${agent_id}"

    if [[ ! -d "${mailbox_dir}" ]]; then
        log_error "Team '${team_name}' mailbox not found"
        return 1
    fi

    echo "📬 Inbox for ${agent_id}:"
    echo ""

    # Personal messages
    if [[ -d "${inbox_dir}" ]] && compgen -G "${inbox_dir}/*.json" > /dev/null; then
        for msg_file in "${inbox_dir}"/*.json; do
            local from=$(jq -r '.from' "${msg_file}")
            local subject=$(jq -r '.subject' "${msg_file}")
            local timestamp=$(jq -r '.timestamp' "${msg_file}")
            local read_status=$(jq -r '.read' "${msg_file}")

            if [[ "${read_status}" == "false" ]]; then
                echo "  ✉️  [UNREAD] From: ${from}"
            else
                echo "  📧 [READ] From: ${from}"
            fi
            echo "      Subject: ${subject}"
            echo "      Time: ${timestamp}"
            echo ""
        done
    else
        echo "  (no personal messages)"
        echo ""
    fi

    # Broadcast messages
    if compgen -G "${mailbox_dir}/broadcast/*.json" > /dev/null; then
        echo "📣 Broadcast messages:"
        for msg_file in "${mailbox_dir}/broadcast"/*.json; do
            local from=$(jq -r '.from' "${msg_file}")
            local subject=$(jq -r '.subject' "${msg_file}")
            local timestamp=$(jq -r '.timestamp' "${msg_file}")

            echo "  📢 From: ${from}"
            echo "      Subject: ${subject}"
            echo "      Time: ${timestamp}"
            echo ""
        done
    fi
}

# Get specific message
mailbox_get() {
    ensure_jq

    local team_name="$1"
    local agent_id="$2"
    local msg_id="$3"
    local mailbox_dir="${MAILBOX_DIR}/${team_name}"
    local msg_file="${mailbox_dir}/inbox/${agent_id}/${msg_id}.json"

    if [[ ! -f "${msg_file}" ]]; then
        # Try broadcast
        msg_file="${mailbox_dir}/broadcast/${msg_id}.json"
        if [[ ! -f "${msg_file}" ]]; then
            log_error "Message ${msg_id} not found"
            return 1
        fi
    fi

    # Mark as read
    jq '.read = true' "${msg_file}" > "${msg_file}.tmp"
    mv "${msg_file}.tmp" "${msg_file}"

    # Display message
    jq '.' "${msg_file}"
}

# Count unread messages
mailbox_unread_count() {
    ensure_jq

    local team_name="$1"
    local agent_id="$2"
    local mailbox_dir="${MAILBOX_DIR}/${team_name}"
    local inbox_dir="${mailbox_dir}/inbox/${agent_id}"

    if [[ ! -d "${inbox_dir}" ]]; then
        echo "0"
        return 0
    fi

    local count=0
    if compgen -G "${inbox_dir}/*.json" > /dev/null; then
        for msg_file in "${inbox_dir}"/*.json; do
            local read_status=$(jq -r '.read' "${msg_file}")
            if [[ "${read_status}" == "false" ]]; then
                ((count++))
            fi
        done
    fi

    echo "${count}"
}

# Clean up mailbox for team
mailbox_cleanup() {
    local team_name="$1"
    local mailbox_dir="${MAILBOX_DIR}/${team_name}"

    if [[ ! -d "${mailbox_dir}" ]]; then
        log_warn "Team '${team_name}' mailbox not found"
        return 0
    fi

    rm -rf "${mailbox_dir}"
    log_success "Cleaned up mailbox for team: ${team_name}"
}

# Main CLI
main() {
    local command="${1:-help}"
    shift || true

    case "${command}" in
        init)
            mailbox_init "$@"
            ;;
        send)
            mailbox_send "$@"
            ;;
        broadcast)
            mailbox_broadcast "$@"
            ;;
        read)
            mailbox_read "$@"
            ;;
        get)
            mailbox_get "$@"
            ;;
        unread-count)
            mailbox_unread_count "$@"
            ;;
        cleanup)
            mailbox_cleanup "$@"
            ;;
        help|--help|-h)
            cat <<EOF
Mailbox Manager for Agent Teams

USAGE:
    mailbox.sh <command> [arguments]

COMMANDS:
    init <team-name>
        Initialize mailbox for a team

    send <team-name> <from-agent> <to-agent> <subject> <body>
        Send message to specific agent
        Example: send my-team lead teammate-1 "Task update" "Task completed"

    broadcast <team-name> <from-agent> <subject> <body>
        Send message to all team members
        Example: broadcast my-team lead "Standup" "Team standup in 5 minutes"

    read <team-name> <agent-id>
        Show all messages for an agent
        Example: read my-team teammate-1

    get <team-name> <agent-id> <msg-id>
        Get specific message (marks as read)
        Example: get my-team teammate-1 msg-123

    unread-count <team-name> <agent-id>
        Get count of unread messages
        Example: unread-count my-team teammate-1

    cleanup <team-name>
        Remove all messages for a team
        Example: cleanup my-team

    help
        Show this help message

EXAMPLES:
    # Initialize mailbox
    mailbox.sh init my-team

    # Send message from lead to teammate
    mailbox.sh send my-team lead teammate-1 "Task assignment" "Please review PR #123"

    # Broadcast to all
    mailbox.sh broadcast my-team lead "Status update" "Team meeting in 10 minutes"

    # Check messages
    mailbox.sh read my-team teammate-1
    mailbox.sh unread-count my-team teammate-1
EOF
            ;;
        *)
            log_error "Unknown command: ${command}"
            echo "Run 'mailbox.sh help' for usage"
            exit 1
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
