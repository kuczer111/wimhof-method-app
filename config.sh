#!/usr/bin/env bash
# ============================================================================
# config.sh — Shared configuration and utilities for all automation scripts.
# ============================================================================
#
# Usage:
#   SCRIPT_TITLE="MyScript"
#   source ./config.sh
#
# Provides:
#   notify(msg)                          Push notification via ntfy.sh, macOS fallback
#   log(msg)                             Timestamped echo: [HH:MM:SS] msg
#   fmt_elapsed(secs)                    Human-readable duration: "45s" or "1min 30s"
#   start_heartbeat(label)               Background log every 60s (blind countdown)
#   start_monitored_heartbeat(label,file) Background log every 60s watching file growth
#   stop_heartbeat()                     Kill active heartbeat process
#   detect_spec_file()                   Find highest-versioned SPEC-v*.md
#   ensure_timeout()                     Set up timeout command (macOS portability)
#
# All scripts source this file. NTFY_TOPIC env var controls push notification
# routing. SCRIPT_TITLE controls the macOS notification title.
#
# Environment:
#   NTFY_TOPIC  — ntfy.sh topic for push notifications (required for notifications)
# ============================================================================

# cd to the directory containing the calling script so relative paths work
cd "$(dirname "${BASH_SOURCE[1]:-${BASH_SOURCE[0]}}")" || exit 1

# Load .env if present (gitignored — contains NTFY_TOPIC and other secrets)
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

NTFY_TOPIC="${NTFY_TOPIC:-}"
HEARTBEAT_PID=""

notify() {
  # Send push notification via ntfy.sh, fall back to macOS notification center
  if [ -n "$NTFY_TOPIC" ]; then
    if curl -s --connect-timeout 5 --max-time 10 -o /dev/null -w "%{http_code}" \
      -d "$1" "https://ntfy.sh/$NTFY_TOPIC" | grep -q "^200$"; then
      return
    fi
  fi
  local title="${SCRIPT_TITLE:-Automation}"
  # Escape single quotes for AppleScript
  local safe_msg="${1//\'/\\\'}"
  local safe_title="${title//\'/\\\'}"
  osascript -e "display notification '${safe_msg}' with title '${safe_title}'" 2>/dev/null || true
}

fmt_elapsed() {
  local secs="${1:-0}"
  if ! [[ "$secs" =~ ^[0-9]+$ ]]; then
    echo "?"
    return
  fi
  if [ "$secs" -lt 60 ]; then
    echo "${secs}s"
  elif [ $(( secs % 60 )) -eq 0 ]; then
    echo "$(( secs / 60 ))min"
  else
    echo "$(( secs / 60 ))min $(( secs % 60 ))s"
  fi
}

log() {
  echo "[$(date +%H:%M:%S)] $*"
}

# Auto-detect the highest-versioned SPEC-v*.md file.
# Sets SPEC_FILE if not already set via env var. Exits if not found.
detect_spec_file() {
  if [ -n "${SPEC_FILE:-}" ]; then
    return
  fi
  SPEC_FILE=$(printf '%s\n' SPEC-v*.md 2>/dev/null | sort -t'v' -k2 -n | tail -1) || true
  if [ -z "${SPEC_FILE:-}" ] || [ "$SPEC_FILE" = 'SPEC-v*.md' ]; then
    SPEC_FILE=""
    echo "No SPEC-v*.md files found. Create one (e.g., SPEC-v1.md) or set SPEC_FILE env var."
    exit 1
  fi
}

# macOS timeout portability — provides timeout() if not available.
# Note: only handles simple `timeout SECONDS command...` invocations.
ensure_timeout() {
  if command -v timeout &>/dev/null; then
    return
  fi
  if command -v gtimeout &>/dev/null; then
    timeout() { gtimeout "$@"; }
  else
    echo "WARNING: No timeout command found (install coreutils: brew install coreutils)."
    echo "         Commands will run without timeout protection."
    timeout() { shift; "$@"; }
  fi
}

start_heartbeat() {
  local label="$1"
  local start_ts
  start_ts=$(date +%s)
  (
    trap 'exit 0' TERM
    while true; do
      sleep 60 &
      wait $! 2>/dev/null || exit 0
      elapsed=$(( ($(date +%s) - start_ts) / 60 ))
      log "${label} still running... (${elapsed}min elapsed)"
    done
  ) &
  HEARTBEAT_PID=$!
}

# Enhanced heartbeat that monitors a file for output growth.
# Reports lines written so far and warns if output has stalled (3+ min).
start_monitored_heartbeat() {
  local label="$1"
  local watch_file="$2"
  local start_ts
  start_ts=$(date +%s)
  (
    trap 'exit 0' TERM
    prev_size=0
    stall_count=0
    while true; do
      sleep 60 &
      wait $! 2>/dev/null || exit 0
      elapsed=$(( ($(date +%s) - start_ts) / 60 ))
      cur_size=0
      cur_lines=0
      if [ -f "$watch_file" ]; then
        cur_size=$(wc -c < "$watch_file" | tr -d ' ')
        cur_lines=$(wc -l < "$watch_file" | tr -d ' ')
      fi
      if [ "$cur_size" -eq "$prev_size" ]; then
        stall_count=$((stall_count + 1))
        if [ "$stall_count" -ge 3 ]; then
          log "${label} STALLED — no output for ${stall_count}min (${cur_lines} lines, ${elapsed}min elapsed)"
        else
          log "${label} still running... (${cur_lines} lines, ${elapsed}min elapsed, no new output for ${stall_count}min)"
        fi
      else
        stall_count=0
        log "${label} still running... (${cur_lines} lines, ${elapsed}min elapsed)"
      fi
      prev_size=$cur_size
    done
  ) &
  HEARTBEAT_PID=$!
}

stop_heartbeat() {
  if [ -n "$HEARTBEAT_PID" ]; then
    kill "$HEARTBEAT_PID" 2>/dev/null || true
    wait "$HEARTBEAT_PID" 2>/dev/null || true
    HEARTBEAT_PID=""
  fi
}
