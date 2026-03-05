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
$(cat "$BUILD_LOG")
---
Fix these errors. Do NOT repeat the same mistakes."
  fi

  claude --dangerously-skip-permissions --print "
You are building a Wim Hof Method PWA using Next.js 14 (app router), TypeScript, and Tailwind CSS.
Clerk is installed for auth. Target: installable PWA on iPhone home screen.

Full spec is in SPEC.md — read it for context.

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
rm -f "$BUILD_LOG"
exit 1
