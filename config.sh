#!/bin/bash
# Shared configuration and utilities for all automation scripts.
# Source this file: source ./config.sh

NTFY_TOPIC="bzhshhs-773737377-oeuuueue"
HEARTBEAT_PID=""

notify() {
  if curl -s -o /dev/null -w "%{http_code}" -d "$1" "https://ntfy.sh/$NTFY_TOPIC" | grep -q "^200$"; then
    return
  fi
  local title="${SCRIPT_TITLE:-Automation}"
  osascript -e "display notification \"$1\" with title \"${title}\"" 2>/dev/null || true
}

fmt_elapsed() {
  local secs="$1"
  if [ "$secs" -lt 60 ]; then
    echo "${secs}s"
  else
    echo "$(( secs / 60 ))min"
  fi
}

log() {
  echo "[$(date +%H:%M:%S)] $*"
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
      local elapsed=$(( ($(date +%s) - start_ts) / 60 ))
      log "${label} still running... (${elapsed}min elapsed)"
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
