#!/usr/bin/env bash
# ============================================================================
# ralph.sh — Task runner. Loops through TASKS.md, executes each via Claude.
# ============================================================================
#
# Usage:
#   ./ralph.sh spec       Execute feature tasks (commits with "feat:" prefix)
#   ./ralph.sh fix        Execute bug fix tasks (commits with "fix:" prefix)
#
# Flow:
#   1. Read TASKS.md, find first unchecked task: - [ ] NNN: description
#   2. Delegate to ralph-task.sh with mode + task description
#   3. On success:
#      a. Mark task as done in TASKS.md: - [x]
#      b. git add -u (tracked files only for safety)
#      c. Safety check: abort if >100 files staged
#      d. git commit -m "feat/fix: task description"
#      e. git push
#      f. Log to ralph.log and terminal, send notification with elapsed time
#   4. On failure: stop, notify, log — user fixes manually then re-runs
#   5. Repeat until all tasks done or one fails
#
# Calls:      ./ralph-task.sh (one invocation per task)
# Prev step:  ./plan.sh spec  or  ./plan.sh fix
#
# Inputs:
#   TASKS.md (must exist — run ./plan.sh first)
#
# Output:
#   Git commits (one per task), ralph.log (append-only task log)
#
# Resume:
#   Just re-run ./ralph.sh — it picks up from the first unchecked task
# ============================================================================
set -euo pipefail

SCRIPT_TITLE="Ralph"
source ./config.sh

MODE="${1:-spec}"

case "$MODE" in
  spec) COMMIT_PREFIX="feat" ;;
  fix)  COMMIT_PREFIX="fix" ;;
  *)
    echo "Usage: ./ralph.sh [spec|fix]"
    echo ""
    echo "  spec  — Execute feature tasks from a spec (default)"
    echo "  fix   — Execute bug fix tasks from QA findings"
    exit 1
    ;;
esac

if [ ! -f TASKS.md ]; then
  echo "No TASKS.md found. Run ./plan.sh first."
  exit 1
fi

START_TIME=$(date +%s)
TASK_COUNT=0

log "Ralph is starting in ${MODE} mode..."
notify "Ralph started (${MODE})"

while true; do
  NEXT=$(grep -m 1 "^- \[ \]" TASKS.md) || true

  if [ -z "$NEXT" ]; then
    TOTAL_TIME=$(fmt_elapsed $(( $(date +%s) - START_TIME )))
    log "All tasks complete! $TASK_COUNT tasks in ${TOTAL_TIME}."
    notify "All done! $TASK_COUNT tasks in ${TOTAL_TIME}"
    exit 0
  fi

  TASK=$(echo "$NEXT" | sed 's/^- \[ \] //')
  TASK_COUNT=$((TASK_COUNT + 1))
  TASK_START=$(date +%s)

  echo ""
  echo "========================================="
  log "Task $TASK_COUNT ($MODE): $TASK"
  echo "========================================="

  ./ralph-task.sh "$MODE" "$TASK" && rc=0 || rc=$?

  if [ $rc -eq 0 ]; then
    TASK_TIME=$(fmt_elapsed $(( $(date +%s) - TASK_START )))

    # Mark done — use index() for literal matching (safe with special chars)
    awk -v task="- [ ] $TASK" '{if (!done && index($0, task) == 1) {sub(/^- \[ \]/, "- [x]"); done=1} print}' TASKS.md > TASKS.md.tmp && mv TASKS.md.tmp TASKS.md

    # Stage tracked files only (safer than git add .)
    git add -u

    # Safety check — catch accidental bulk file commits
    FILE_COUNT=$(git diff --cached --name-only | wc -l | tr -d ' ')
    if [ "$FILE_COUNT" -gt 100 ]; then
      git restore --staged .
      notify "Suspiciously large commit ($FILE_COUNT files) on task $TASK_COUNT — stopping"
      log "Too many files staged ($FILE_COUNT). Check .gitignore before continuing."
      exit 1
    fi

    git commit -m "${COMMIT_PREFIX}: $TASK"
    git push || { notify "Push failed on task $TASK_COUNT"; exit 1; }

    # Log to both terminal (via log()) and ralph.log file
    log "Task $TASK_COUNT done (${TASK_TIME}): $TASK" | tee -a ralph.log
    notify "Done ($TASK_COUNT, ${TASK_TIME}): $TASK"
    sleep 2  # brief pause between tasks to avoid API rate limits
  else
    log "FAILED Task $TASK_COUNT: $TASK" | tee -a ralph.log
    notify "Stuck on task $TASK_COUNT: $TASK — needs you"
    echo ""
    log "Fix manually then re-run ./ralph.sh $MODE"
    exit 1
  fi
done
