#!/usr/bin/env bash
# Task Manager Utility for Agent Teams
# Manages shared task list with file-based locking

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

# Initialize team task directory
task_init() {
    local team_name="$1"
    local team_dir="${TASKS_DIR}/${team_name}"

    safe_mkdir "${team_dir}/pending" || return 1
    safe_mkdir "${team_dir}/in-progress" || return 1
    safe_mkdir "${team_dir}/completed" || return 1

    log_success "Initialized task directories for team: ${team_name}"
}

# Create new task
task_create() {
    ensure_jq

    local team_name="$1"
    local subject="$2"
    local description="$3"
    local blocked_by="${4:-[]}"  # Optional: JSON array of task IDs

    local team_dir="${TASKS_DIR}/${team_name}"
    local task_id="task-$(date +%s)-$$"
    local task_file="${team_dir}/pending/${task_id}.json"

    if [[ ! -d "${team_dir}" ]]; then
        log_error "Team '${team_name}' not initialized. Run: task_init ${team_name}"
        return 1
    fi

    # Create task JSON
    cat > "${task_file}" <<EOF
{
  "id": "${task_id}",
  "subject": "${subject}",
  "description": "${description}",
  "status": "pending",
  "assignee": null,
  "blockedBy": ${blocked_by},
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    log_success "Created task: ${task_id}"
    echo "${task_id}"
}

# List tasks by status
task_list() {
    ensure_jq

    local team_name="$1"
    local status="${2:-all}"  # pending, in-progress, completed, all
    local team_dir="${TASKS_DIR}/${team_name}"

    if [[ ! -d "${team_dir}" ]]; then
        log_error "Team '${team_name}' not found"
        return 1
    fi

    echo "📋 Tasks for team: ${team_name}"
    echo ""

    if [[ "${status}" == "all" || "${status}" == "pending" ]]; then
        echo "⏳ PENDING:"
        if compgen -G "${team_dir}/pending/*.json" > /dev/null; then
            for task_file in "${team_dir}/pending"/*.json; do
                local task_id=$(jq -r '.id' "${task_file}")
                local subject=$(jq -r '.subject' "${task_file}")
                local blocked_by=$(jq -r '.blockedBy | length' "${task_file}")
                if [[ "${blocked_by}" -gt 0 ]]; then
                    echo "  🔒 ${task_id}: ${subject} (blocked)"
                else
                    echo "  ✅ ${task_id}: ${subject}"
                fi
            done
        else
            echo "  (none)"
        fi
        echo ""
    fi

    if [[ "${status}" == "all" || "${status}" == "in-progress" ]]; then
        echo "🔄 IN PROGRESS:"
        if compgen -G "${team_dir}/in-progress/*.json" > /dev/null; then
            for task_file in "${team_dir}/in-progress"/*.json; do
                local task_id=$(jq -r '.id' "${task_file}")
                local subject=$(jq -r '.subject' "${task_file}")
                local assignee=$(jq -r '.assignee // "unassigned"' "${task_file}")
                echo "  ⚙️  ${task_id}: ${subject} (${assignee})"
            done
        else
            echo "  (none)"
        fi
        echo ""
    fi

    if [[ "${status}" == "all" || "${status}" == "completed" ]]; then
        echo "✅ COMPLETED:"
        if compgen -G "${team_dir}/completed/*.json" > /dev/null; then
            for task_file in "${team_dir}/completed"/*.json; do
                local task_id=$(jq -r '.id' "${task_file}")
                local subject=$(jq -r '.subject' "${task_file}")
                echo "  ✔️  ${task_id}: ${subject}"
            done
        else
            echo "  (none)"
        fi
    fi
}

# Claim task (move from pending to in-progress)
task_claim() {
    ensure_jq

    local team_name="$1"
    local task_id="$2"
    local assignee="$3"
    local team_dir="${TASKS_DIR}/${team_name}"
    local pending_file="${team_dir}/pending/${task_id}.json"
    local progress_file="${team_dir}/in-progress/${task_id}.json"

    if [[ ! -f "${pending_file}" ]]; then
        log_error "Task ${task_id} not found in pending"
        return 1
    fi

    # Check if task is blocked
    local blocked_count=$(jq -r '.blockedBy | length' "${pending_file}")
    if [[ "${blocked_count}" -gt 0 ]]; then
        log_error "Task ${task_id} is blocked by other tasks"
        return 1
    fi

    # Move to in-progress and update
    jq --arg assignee "${assignee}" \
       --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '.status = "in_progress" | .assignee = $assignee | .updatedAt = $timestamp' \
       "${pending_file}" > "${progress_file}"

    rm "${pending_file}"

    log_success "Task ${task_id} claimed by ${assignee}"
}

# Complete task (move from in-progress to completed)
task_complete() {
    ensure_jq

    local team_name="$1"
    local task_id="$2"
    local team_dir="${TASKS_DIR}/${team_name}"
    local progress_file="${team_dir}/in-progress/${task_id}.json"
    local completed_file="${team_dir}/completed/${task_id}.json"

    if [[ ! -f "${progress_file}" ]]; then
        log_error "Task ${task_id} not found in in-progress"
        return 1
    fi

    # Move to completed and update
    jq --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '.status = "completed" | .completedAt = $timestamp | .updatedAt = $timestamp' \
       "${progress_file}" > "${completed_file}"

    rm "${progress_file}"

    log_success "Task ${task_id} marked as completed"

    # Unblock dependent tasks
    task_unblock_dependents "${team_name}" "${task_id}"
}

# Unblock tasks that depend on completed task
task_unblock_dependents() {
    ensure_jq

    local team_name="$1"
    local completed_task_id="$2"
    local team_dir="${TASKS_DIR}/${team_name}"

    # Find all pending tasks blocked by this task
    if compgen -G "${team_dir}/pending/*.json" > /dev/null; then
        for task_file in "${team_dir}/pending"/*.json; do
            # Remove completed task from blockedBy array
            local updated=$(jq --arg id "${completed_task_id}" \
                '.blockedBy = (.blockedBy - [$id])' \
                "${task_file}")
            echo "${updated}" > "${task_file}"
        done
    fi
}

# Get task details
task_get() {
    ensure_jq

    local team_name="$1"
    local task_id="$2"
    local team_dir="${TASKS_DIR}/${team_name}"

    # Search in all status directories
    for status_dir in pending in-progress completed; do
        local task_file="${team_dir}/${status_dir}/${task_id}.json"
        if [[ -f "${task_file}" ]]; then
            jq '.' "${task_file}"
            return 0
        fi
    done

    log_error "Task ${task_id} not found"
    return 1
}

# Main CLI
main() {
    local command="${1:-help}"
    shift || true

    case "${command}" in
        init)
            task_init "$@"
            ;;
        create)
            task_create "$@"
            ;;
        list)
            task_list "$@"
            ;;
        claim)
            task_claim "$@"
            ;;
        complete)
            task_complete "$@"
            ;;
        get)
            task_get "$@"
            ;;
        help|--help|-h)
            cat <<EOF
Task Manager for Agent Teams

USAGE:
    task-manager.sh <command> [arguments]

COMMANDS:
    init <team-name>
        Initialize task directories for a team

    create <team-name> <subject> <description> [blocked-by-json]
        Create a new task
        Example: create my-team "Add tests" "Write unit tests for auth module"

    list <team-name> [status]
        List tasks (status: pending, in-progress, completed, all)
        Example: list my-team pending

    claim <team-name> <task-id> <assignee>
        Claim a pending task
        Example: claim my-team task-123 teammate-1

    complete <team-name> <task-id>
        Mark task as completed
        Example: complete my-team task-123

    get <team-name> <task-id>
        Get task details in JSON format
        Example: get my-team task-123

    help
        Show this help message

EXAMPLES:
    # Initialize team
    task-manager.sh init my-team

    # Create tasks
    task-manager.sh create my-team "Security review" "Review auth for vulnerabilities"
    task-manager.sh create my-team "Performance review" "Check for N+1 queries"

    # List pending tasks
    task-manager.sh list my-team pending

    # Claim and complete a task
    task-manager.sh claim my-team task-123 teammate-1
    task-manager.sh complete my-team task-123
EOF
            ;;
        *)
            log_error "Unknown command: ${command}"
            echo "Run 'task-manager.sh help' for usage"
            exit 1
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
