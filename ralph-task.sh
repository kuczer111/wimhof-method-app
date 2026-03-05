#!/bin/bash

TASK="$1"
MAX_LOOPS=8
loop=0

echo ""
echo "🤖 Starting task: $TASK"
echo ""

while [ $loop -lt $MAX_LOOPS ]; do
  loop=$((loop + 1))
  echo "--- Loop $loop of $MAX_LOOPS ---"

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
"

  echo ""
  echo "🔨 Checking build..."
  npm run build 2>&1

  if [ $? -eq 0 ]; then
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
exit 1
