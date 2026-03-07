#!/usr/bin/env bash
# ============================================================================
# ralph-plan.sh — Generate task lists from specs or QA findings.
# ============================================================================
#
# Usage:
#   ./ralph-plan.sh spec        Generate feature tasks from latest SPEC-v*.md
#   ./ralph-plan.sh fix         Generate fix tasks from QA-FINDINGS.md
#
# Flow:
#   1. Auto-detect latest SPEC-v*.md (or use SPEC_FILE env var)
#   2. Find next task number from TASKS.md (auto-increment)
#   3. Call Claude to read spec/findings + existing tasks
#   4. Claude appends new tasks to TASKS.md (preserving existing ones)
#   5. Report task count and elapsed time via log + notification
#
# Inputs:
#   spec mode -> SPEC-v*.md + TASKS.md
#   fix mode  -> QA-FINDINGS.md + TASKS.md
#
# Output:
#   TASKS.md (updated in place with new unchecked tasks)
#
# Next step:  ./ralph.sh spec  or  ./ralph.sh fix
#
# Environment:
#   SPEC_FILE  — Override spec file (default: auto-detect highest version)
# ============================================================================
set -euo pipefail

SCRIPT_TITLE="Plan"
source ./config.sh

MODE="${1:-spec}"

# ── Auto-detect latest spec file (SPEC_FILE env var overrides) ──
detect_spec_file

# ── Resolve next task number from TASKS.md ──
if [ -f TASKS.md ]; then
  LAST_NUM=$(grep -E '^\- \[.\] [0-9]+' TASKS.md | sed 's/^- \[.\] \([0-9]*\).*/\1/' | sort -n | tail -1) || true
  # Guard against non-numeric values
  if ! [[ "${LAST_NUM:-}" =~ ^[0-9]+$ ]]; then LAST_NUM=0; fi
  NEXT_NUM=$(printf "%03d" $((10#${LAST_NUM:-0} + 1)))
else
  NEXT_NUM="001"
fi

PLAN_START=$(date +%s)
notify "Planning started (${MODE})"

case "$MODE" in
  spec)
    if [ ! -f "$SPEC_FILE" ]; then
      log "Spec file not found: $SPEC_FILE"
      notify "FATAL: Spec file not found: $SPEC_FILE"
      exit 1
    fi
    log "Planning tasks from spec: $SPEC_FILE (starting at $NEXT_NUM)..."

    claude --dangerously-skip-permissions --print "
Read the files ${SPEC_FILE} and TASKS.md carefully.

${SPEC_FILE} contains the specification. TASKS.md contains all previous tasks (checked off).

Your job: create tasks that implement the spec. Do NOT recreate work already done. The existing code is the foundation — improve it.

Rules:
- Each task must be completable in one focused coding session
- Tasks must be in logical build order (foundations first, then features, then polish)
- Each task must be testable with: npm run build
- Be specific — name the files/components involved
- Reference existing files when a task modifies them
- Aim for 20-25 tasks total
- Number tasks starting from ${NEXT_NUM}

Output ONLY the following markdown format, nothing else, no explanation.
Keep all existing tasks at the top unchanged, then add new tasks below:

# Task List

- [x] 001: ... (all existing tasks unchanged)
...
- [ ] ${NEXT_NUM}: [short name] | [one sentence of what to do]

Write this output directly to the file TASKS.md
"
    ;;

  fix)
    if [ ! -f QA-FINDINGS.md ]; then
      log "QA-FINDINGS.md not found. Run ./qa.sh first."
      notify "FATAL: QA-FINDINGS.md not found"
      exit 1
    fi
    log "Planning fix tasks from QA-FINDINGS.md (starting at $NEXT_NUM)..."

    claude --dangerously-skip-permissions --print "
Read the files QA-FINDINGS.md and TASKS.md carefully.

QA-FINDINGS.md contains bug reports from QA testing. TASKS.md contains all previous tasks.

Your job: create fix tasks for every confirmed issue in QA-FINDINGS.md. Ignore any findings marked as DISMISSED.

Rules:
- One task per confirmed finding (or group tightly related findings into one task)
- Order by severity: Critical first, then Major, Minor, Cosmetic last
- Each task must be completable in one focused coding session
- Each task must be testable with: npm run build
- Be specific — name the files/components to fix
- Reference the finding ID (e.g. F-03) in each task
- Number tasks starting from ${NEXT_NUM}

Output ONLY the following markdown format, nothing else, no explanation.
Keep all existing tasks at the top unchanged, then add new tasks below:

# Task List

- [x] 001: ... (all existing tasks unchanged)
...
- [ ] ${NEXT_NUM}: Fix F-XX: [short description] | [what to change]

Write this output directly to the file TASKS.md
"
    ;;

  *)
    echo "Usage: ./ralph-plan.sh [spec|fix]"
    echo ""
    echo "  spec  — Generate tasks from a spec file (default)"
    echo "  fix   — Generate fix tasks from QA-FINDINGS.md"
    echo ""
    echo "Environment variables:"
    echo "  SPEC_FILE  — Override spec file (default: auto-detect highest SPEC-v*.md)"
    exit 1
    ;;
esac

TASK_COUNT=$(grep -c "^- \[ \]" TASKS.md 2>/dev/null || echo 0)
PLAN_TIME=$(fmt_elapsed $(( $(date +%s) - PLAN_START )))
log "Planning done (${MODE}, ${PLAN_TIME}): ${TASK_COUNT} open tasks"
notify "Planning done (${MODE}, ${PLAN_TIME}): ${TASK_COUNT} open tasks in TASKS.md"

echo ""
log "TASKS.md updated. Review it:"
echo ""
[ -f TASKS.md ] && cat TASKS.md
