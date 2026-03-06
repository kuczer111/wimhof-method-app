#!/bin/bash

echo "📋 Ralph is reading the v4 spec and planning tasks..."

claude --dangerously-skip-permissions --print "
Read the files SPEC-v4-draft.md and TASKS.md carefully.

SPEC-v4-draft.md contains the v4 specification. TASKS.md contains the completed v1, v2, and v3 tasks (all checked off).

Your job: create v4 tasks that polish UX, implement design tokens, and improve CI/testing for the existing codebase. Do NOT recreate work already done. The existing code is the foundation — improve it.

Rules:
- Each task must be completable in one focused coding session
- Tasks must be in logical build order (design tokens first, then interaction fixes, then theme/animation, then CI/testing last)
- Each task must be testable with: npm run build
- Be specific — name the files/components involved
- Reference existing files when a task modifies them
- Aim for 20-25 tasks total
- Number tasks starting from 077 (v3 ended at 076)

Output ONLY the following markdown format, nothing else, no explanation.
Keep the completed v1, v2, and v3 tasks at the top, then add v4 tasks below:

# Task List

- [x] 001: ... (all existing v1+v2+v3 tasks unchanged)
...
- [ ] 077: [short name] | [one sentence of what to fix/improve]
- [ ] 078: [short name] | [one sentence of what to fix/improve]

Write this output directly to the file TASKS.md
"

echo ""
echo "✅ TASKS.md updated with v4 tasks. Review it:"
echo ""
cat TASKS.md
