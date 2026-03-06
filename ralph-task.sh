#!/bin/bash
set -euo pipefail

MODE="${1:-spec}"
TASK="${2:-}"
SPEC_FILE="${SPEC_FILE:-SPEC-v4-draft.md}"
MAX_LOOPS=8
loop=0
BUILD_LOG=$(mktemp)
trap 'rm -f "$BUILD_LOG"' EXIT INT TERM HUP

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
echo "🤖 Starting task ($MODE): $TASK"
echo ""

while [ $loop -lt $MAX_LOOPS ]; do
  loop=$((loop + 1))
  echo "--- Loop $loop of $MAX_LOOPS ---"

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

  echo ""
  echo "🔨 Checking build..."
  set +eo pipefail
  npm run build 2>&1 | tee "$BUILD_LOG"
  BUILD_EXIT=${PIPESTATUS[0]}
  set -eo pipefail

  if [ $BUILD_EXIT -eq 0 ]; then
    echo ""
    echo "✅ Build passed!"
    exit 0
  else
    echo ""
    echo "❌ Build failed — sending errors back to Claude..."
  fi

done

echo ""
echo "⚠️  Max loops hit. Task needs manual attention: $TASK"
git checkout .
exit 1
