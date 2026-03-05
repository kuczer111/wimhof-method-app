#!/bin/bash

echo "📋 Ralph is reading the v2 spec and planning tasks..."

claude --dangerously-skip-permissions --print "
Read the files SPEC.md and TASKS.md carefully.

SPEC.md contains the v2 specification. TASKS.md contains the completed v1 tasks (all checked off).

Your job: create v2 tasks that refactor and extend the existing v1 codebase. Do NOT recreate work already done in v1. The v1 code is the foundation — build on it.

Rules:
- Each task must be completable in one focused coding session
- Tasks must be in logical build order (foundation/refactoring first, then new features, then polish)
- Each task must be testable with: npm run build
- Be specific — name the files/components involved
- Reference existing v1 files when a task modifies them
- Aim for 20-25 tasks total
- Number tasks starting from 026 (v1 ended at 025)

Output ONLY the following markdown format, nothing else, no explanation.
Keep the completed v1 tasks at the top, then add v2 tasks below:

# Task List

- [x] 001: ... (all existing v1 tasks unchanged)
...
- [ ] 026: [short name] | [one sentence of what to build]
- [ ] 027: [short name] | [one sentence of what to build]

Write this output directly to the file TASKS.md
"

echo ""
echo "✅ TASKS.md updated with v2 tasks. Review it:"
echo ""
cat TASKS.md
