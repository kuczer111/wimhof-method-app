#!/bin/bash
set -euo pipefail

MODE="${1:-spec}"
SPEC_FILE="${SPEC_FILE:-SPEC-v4-draft.md}"

# ── Resolve next task number from TASKS.md ──
if [ -f TASKS.md ]; then
  LAST_NUM=$(grep -E '^\- \[.\] [0-9]+' TASKS.md | sed 's/^- \[.\] \([0-9]*\).*/\1/' | sort -n | tail -1) || true
  NEXT_NUM=$(printf "%03d" $((10#${LAST_NUM:-0} + 1)))
else
  NEXT_NUM="001"
fi

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

echo ""
echo "✅ TASKS.md updated. Review it:"
echo ""
cat TASKS.md
