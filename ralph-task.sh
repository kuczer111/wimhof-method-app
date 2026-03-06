#!/bin/bash

TASK="$1"
MAX_LOOPS=8
loop=0
BUILD_LOG=$(mktemp)

echo ""
echo "🤖 Starting task: $TASK"
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
You are building a Wim Hof Method PWA using Next.js (app router), TypeScript, and Tailwind CSS.
All data is stored locally in IndexedDB — there is no auth or backend. Target: installable PWA on iPhone home screen.

Full spec is in SPEC-v4-draft.md — read it for context, especially the design token definitions in section 4.

Your ONLY job right now is this task:
$TASK

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
  npm run build 2>&1 | tee "$BUILD_LOG"

  if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo "✅ Build passed!"
    rm -f "$BUILD_LOG"
    exit 0
  else
    echo ""
    echo "❌ Build failed — sending errors back to Claude..."
  fi

done

echo ""
echo "⚠️  Max loops hit. Task needs manual attention: $TASK"
git checkout .
rm -f "$BUILD_LOG"
exit 1
