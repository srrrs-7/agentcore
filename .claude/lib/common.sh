#!/usr/bin/env bash
# Common utility functions for Claude agent scripts
# Source this file in other scripts: source "${SCRIPT_DIR}/../lib/common.sh"

set -euo pipefail

# Configuration constants
export CLAUDE_HOME="${CLAUDE_HOME:-${HOME}/.claude}"
export TEAMS_DIR="${CLAUDE_HOME}/teams"
export TASKS_DIR="${CLAUDE_HOME}/tasks"
export MAILBOX_DIR="${CLAUDE_HOME}/mailbox"

# Colors for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[0;33m'
export BLUE='\033[0;34m'
export NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

log_debug() {
    if [[ "${DEBUG:-0}" == "1" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $*" >&2
    fi
}

# Dependency checks
ensure_jq() {
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed"
        echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)" >&2
        return 1
    fi
}

ensure_tmux() {
    if ! command -v tmux &> /dev/null; then
        log_error "tmux is required but not installed"
        echo "Install with: brew install tmux (macOS) or apt-get install tmux (Linux)" >&2
        return 1
    fi
}

# Team validation
validate_team_exists() {
    local team_name="$1"
    local team_dir="${TEAMS_DIR}/${team_name}"

    if [[ ! -d "${team_dir}" ]]; then
        log_error "Team '${team_name}' not found"
        log_info "Create team first: create-team.sh ${team_name}"
        return 1
    fi

    return 0
}

validate_team_not_exists() {
    local team_name="$1"
    local team_dir="${TEAMS_DIR}/${team_name}"

    if [[ -d "${team_dir}" ]]; then
        log_error "Team '${team_name}' already exists"
        return 1
    fi

    return 0
}

# File operations with error handling
safe_mkdir() {
    local dir="$1"
    if ! mkdir -p "${dir}" 2>/dev/null; then
        log_error "Failed to create directory: ${dir}"
        return 1
    fi
    log_debug "Created directory: ${dir}"
    return 0
}

safe_rm() {
    local path="$1"
    if [[ -e "${path}" ]]; then
        if ! rm -rf "${path}" 2>/dev/null; then
            log_error "Failed to remove: ${path}"
            return 1
        fi
        log_debug "Removed: ${path}"
    fi
    return 0
}

# JSON operations
json_get() {
    local file="$1"
    local query="$2"

    ensure_jq || return 1

    if [[ ! -f "${file}" ]]; then
        log_error "File not found: ${file}"
        return 1
    fi

    jq -r "${query}" "${file}" 2>/dev/null || {
        log_error "Failed to parse JSON from ${file}"
        return 1
    }
}

json_update() {
    local file="$1"
    local query="$2"

    ensure_jq || return 1

    if [[ ! -f "${file}" ]]; then
        log_error "File not found: ${file}"
        return 1
    fi

    local temp_file="${file}.tmp"
    if ! jq "${query}" "${file}" > "${temp_file}" 2>/dev/null; then
        log_error "Failed to update JSON in ${file}"
        rm -f "${temp_file}"
        return 1
    fi

    mv "${temp_file}" "${file}"
    return 0
}

# Timestamp generation
get_timestamp() {
    date -u +%Y-%m-%dT%H:%M:%SZ
}

get_unix_timestamp() {
    date +%s
}

# Usage message helper
show_usage() {
    local script_name="$1"
    local usage_text="$2"

    cat <<EOF
Usage: ${script_name} ${usage_text}

Run with --help for detailed information.
EOF
}

# Confirmation prompt
confirm() {
    local prompt="$1"
    local response

    read -p "${prompt} (yes/no): " response
    [[ "${response}" == "yes" ]]
}

# Export all functions
export -f log_info log_success log_warn log_error log_debug
export -f ensure_jq ensure_tmux
export -f validate_team_exists validate_team_not_exists
export -f safe_mkdir safe_rm
export -f json_get json_update
export -f get_timestamp get_unix_timestamp
export -f show_usage confirm
