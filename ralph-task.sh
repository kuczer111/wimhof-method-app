#!/bin/bash
set -euo pipefail

SCRIPT_TITLE="Ralph Task"
source ./config.sh

MODE="${1:-spec}"
TASK="${2:-}"
# ── Auto-detect latest spec file (SPEC_FILE env var overrides) ──
if [ -z "${SPEC_FILE:-}" ]; then
  SPEC_FILE=$(ls -1 SPEC-v*.md 2>/dev/null | sort -t'v' -k2 -n | tail -1) || true
fi
if [ -z "${SPEC_FILE:-}" ]; then
  echo "No SPEC-v*.md files found. Create one (e.g., SPEC-v1.md) or set SPEC_FILE env var."
  exit 1
fi
MAX_LOOPS=8
loop=0
BUILD_LOG=$(mktemp)
TASK_START=$(date +%s)
trap 'stop_heartbeat; rm -f "$BUILD_LOG"' EXIT INT TERM HUP

if [ -z "$TASK" ]; then
  echo "Usage: ./ralph-task.sh [spec|fix] \"task description\""
  exit 1
fi

# ── Mode-specific context ──
case "$MODE" in
  spec)
    CONTEXT="Full spec is in ${SPEC_FILE} — read it for context.

Your ONLY job right now is this task:
$TASK"
    ;;
  fix)
    CONTEXT="QA-FINDINGS.md contains the bug reports — read it for context on the issue.

Your ONLY job right now is to fix this bug:
$TASK

Rules specific to bug fixes:
- Do NOT add features or refactor unrelated code
- Fix only what the bug report describes
- If the finding references a specific page/component, start there"
    ;;
  *)
    echo "Unknown mode: $MODE"
    exit 1
    ;;
esac

echo ""
log "Starting task ($MODE): $TASK"
echo ""

while [ $loop -lt $MAX_LOOPS ]; do
  loop=$((loop + 1))
  log "Loop $loop of $MAX_LOOPS"

  if [ $loop -eq 1 ]; then
    ERRORS_CONTEXT=""
  else
    ERRORS_CONTEXT="

IMPORTANT: The previous attempt FAILED to build. Here are the build errors you must fix:
---
$(tail -80 "$BUILD_LOG")
---
Fix these errors. Do NOT repeat the same mistakes."
  fi

  start_heartbeat "Claude (loop $loop)"

  claude --dangerously-skip-permissions --print "
You are working on a Wim Hof Method PWA using Next.js (app router), TypeScript, and Tailwind CSS.
All data is stored locally in IndexedDB — there is no auth or backend. Target: installable PWA on iPhone home screen.

${CONTEXT}

Rules:
- Read existing files before creating anything
- Only touch files relevant to this task
- Keep changes small and focused
- After finishing, output exactly: TASK_COMPLETE
- Fix any TypeScript or build errors before stopping
$ERRORS_CONTEXT
"

  stop_heartbeat

  log "Checking build..."
  set +eo pipefail
  npm run build 2>&1 | tee "$BUILD_LOG"
  BUILD_EXIT=${PIPESTATUS[0]}
  set -eo pipefail

  if [ $BUILD_EXIT -eq 0 ]; then
    TASK_TIME=$(fmt_elapsed $(( $(date +%s) - TASK_START )))
    log "Build passed! (${TASK_TIME} total)"
    exit 0
  else
    log "Build failed — sending errors back to Claude..."
  fi

done

log "Max loops hit. Task needs manual attention: $TASK"
notify "Max loops hit on: $TASK"
git checkout .
exit 1
