#!/bin/bash

# ── CONFIG — change this to your ntfy topic ──
NTFY_TOPIC="bzhshhs-773737377-oeuuueue"
# ─────────────────────────────────────────────

notify() {
  if curl -s -o /dev/null -w "%{http_code}" -d "$1" "https://ntfy.sh/$NTFY_TOPIC" | grep -q "^200$"; then
    return
  fi
  osascript -e "display notification \"$1\" with title \"Ralph 🤖\""
}

if [ ! -f TASKS.md ]; then
  echo "❌ No TASKS.md found. Run ./plan.sh first."
  exit 1
fi

START_TIME=$(date +%s)
TASK_COUNT=0

echo "🚀 Ralph is starting..."
notify "Ralph started 🚀"

while true; do
  NEXT=$(grep -m 1 "^- \[ \]" TASKS.md)

  if [ -z "$NEXT" ]; then
    ELAPSED=$(( ($(date +%s) - START_TIME) / 60 ))
    echo ""
    echo "🎉 All tasks complete! $TASK_COUNT tasks in ${ELAPSED} minutes."
    notify "🎉 All done! $TASK_COUNT tasks in ${ELAPSED}min"
    exit 0
  fi

  TASK=$(echo "$NEXT" | sed 's/^- \[ \] //')
  TASK_COUNT=$((TASK_COUNT + 1))
  TASK_START=$(date +%s)

  echo ""
  echo "========================================="
  echo "📌 Task $TASK_COUNT: $TASK"
  echo "========================================="

  ./ralph-task.sh "$TASK"

  if [ $? -eq 0 ]; then
    TASK_ELAPSED=$(( ($(date +%s) - TASK_START) / 60 ))

    # Mark done — awk handles special chars in task names (/, [], etc.)
    awk -v task="$TASK" '{if (!done && $0 == "- [ ] " task) {print "- [x] " task; done=1} else print}' TASKS.md > TASKS.md.tmp && mv TASKS.md.tmp TASKS.md

    git add .

    # Safety check — catch accidental node_modules or bulk file commits
    FILE_COUNT=$(git diff --cached --name-only | wc -l)
    if [ "$FILE_COUNT" -gt 100 ]; then
      git reset HEAD
      notify "⚠️ Suspiciously large commit ($FILE_COUNT files) on task $TASK_COUNT — stopping"
      echo "⚠️ Too many files staged ($FILE_COUNT). Check .gitignore before continuing."
      exit 1
    fi

    git commit -m "refactor: $TASK"
    git push || { notify "⚠️ Push failed on task $TASK_COUNT"; exit 1; }

    echo "$(date): ✅ Task $TASK_COUNT (${TASK_ELAPSED}min): $TASK" >> ralph.log
    notify "✅ Done ($TASK_COUNT, ${TASK_ELAPSED}min): $TASK"
    sleep 2
  else
    echo "$(date): ❌ FAILED Task $TASK_COUNT: $TASK" >> ralph.log
    notify "🛑 Stuck on task $TASK_COUNT: $TASK — needs you"
    echo ""
    echo "Fix manually then re-run ./ralph.sh"
    exit 1
  fi
done
