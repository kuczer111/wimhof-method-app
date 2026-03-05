#!/bin/bash

# ── CONFIG — change this to your ntfy topic ──
NTFY_TOPIC="bzhshhs-773737377-oeuuueue"
# ─────────────────────────────────────────────

notify() {
  osascript -e "display notification \"$1\" with title \"Ralph 🤖\""
}

if [ ! -f TASKS.md ]; then
  echo "❌ No TASKS.md found. Run ./plan.sh first."
  exit 1
fi

echo "🚀 Ralph is starting..."
notify "Ralph started on wimhof app 🚀"

while true; do

  NEXT=$(grep -m 1 "^- \[ \]" TASKS.md)

  if [ -z "$NEXT" ]; then
    echo ""
    echo "🎉 All tasks complete!"
    notify "🎉 All done! Wimhof app is built."
    exit 0
  fi

  TASK=$(echo "$NEXT" | sed 's/^- \[ \] //')

  echo ""
  echo "========================================="
  echo "📌 $TASK"
  echo "========================================="

  ./ralph-task.sh "$TASK"

  if [ $? -eq 0 ]; then
    # Mark done
    sed -i '' "s/^- \[ \] $(echo "$TASK" | sed 's/[[\.*^$()+?{|]/\\&/g')/- [x] $TASK/" TASKS.md

    # Commit and push
    git add .
    git commit -m "feat: $TASK"
    git push

    notify "✅ Done: $TASK"

    sleep 2

  else
    notify "🛑 Stuck on: $TASK — needs you"
    echo ""
    echo "Fix manually then re-run ./ralph.sh"
    exit 1
  fi

done
