#!/bin/bash
set -euo pipefail

MODE="${1:-spec}"
NTFY_TOPIC="bzhshhs-773737377-oeuuueue"

notify() {
  if curl -s -o /dev/null -w "%{http_code}" -d "$1" "https://ntfy.sh/$NTFY_TOPIC" | grep -q "^200$"; then
    return
  fi
  osascript -e "display notification \"$1\" with title \"Plan\"" 2>/dev/null || true
}

# ── Auto-detect latest spec file (SPEC_FILE env var overrides) ──
if [ -z "${SPEC_FILE:-}" ]; then
  SPEC_FILE=$(ls -1 SPEC-v*.md 2>/dev/null | sort -t'v' -k2 -n | tail -1) || true
fi
if [ -z "${SPEC_FILE:-}" ]; then
  echo "No SPEC-v*.md files found. Create one (e.g., SPEC-v1.md) or set SPEC_FILE env var."
  exit 1
fi

# ── Resolve next task number from TASKS.md ──
if [ -f TASKS.md ]; then
  LAST_NUM=$(grep -E '^\- \[.\] [0-9]+' TASKS.md | sed 's/^- \[.\] \([0-9]*\).*/\1/' | sort -n | tail -1) || true
  NEXT_NUM=$(printf "%03d" $((10#${LAST_NUM:-0} + 1)))
else
  NEXT_NUM="001"
fi

PLAN_START=$(date +%s)

case "$MODE" in
  spec)
    if [ ! -f "$SPEC_FILE" ]; then
      echo "❌ Spec file not found: $SPEC_FILE"
      exit 1
    fi
    echo "📋 Planning tasks from spec: $SPEC_FILE (starting at $NEXT_NUM)..."

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
      echo "❌ QA-FINDINGS.md not found. Run ./qa.sh first."
      exit 1
    fi
    echo "📋 Planning fix tasks from QA-FINDINGS.md (starting at $NEXT_NUM)..."

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
    echo "Usage: ./plan.sh [spec|fix]"
    echo ""
    echo "  spec  — Generate tasks from a spec file (default)"
    echo "  fix   — Generate fix tasks from QA-FINDINGS.md"
    echo ""
    echo "Environment variables:"
    echo "  SPEC_FILE  — Override spec file (default: SPEC-v4-draft.md)"
    exit 1
    ;;
esac

TASK_COUNT=$(grep -c "^- \[ \]" TASKS.md 2>/dev/null) || true
PLAN_SECS=$(( $(date +%s) - PLAN_START ))
if [ "$PLAN_SECS" -lt 60 ]; then PLAN_TIME="${PLAN_SECS}s"; else PLAN_TIME="$(( PLAN_SECS / 60 ))min"; fi
notify "Planning done (${MODE}, ${PLAN_TIME}): ${TASK_COUNT:-0} open tasks in TASKS.md"

echo ""
echo "✅ TASKS.md updated. Review it:"
echo ""
cat TASKS.md
