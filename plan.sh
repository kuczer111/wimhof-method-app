#!/bin/bash

echo "📋 Ralph is reading the v3 spec and planning tasks..."

claude --dangerously-skip-permissions --print "
Read the files SPEC-v3-draft.md, REVIEW-v2.md, and TASKS.md carefully.

SPEC-v3-draft.md contains the v3 specification. TASKS.md contains the completed v1 and v2 tasks (all checked off).

Your job: create v3 tasks that fix bugs, consolidate code, and harden the existing v1+v2 codebase. Do NOT recreate work already done. The existing code is the foundation — improve it.

Rules:
- Each task must be completable in one focused coding session
- Tasks must be in logical build order (critical bug fixes first, then consolidation/refactoring, then polish)
- Each task must be testable with: npm run build
- Be specific — name the files/components involved
- Reference existing files when a task modifies them
- Aim for 20-25 tasks total
- Number tasks starting from 051 (v2 ended at 050)

Output ONLY the following markdown format, nothing else, no explanation.
Keep the completed v1 and v2 tasks at the top, then add v3 tasks below:

# Task List

- [x] 001: ... (all existing v1+v2 tasks unchanged)
...
- [ ] 051: [short name] | [one sentence of what to fix/improve]
- [ ] 052: [short name] | [one sentence of what to fix/improve]

Write this output directly to the file TASKS.md
"

echo ""
echo "✅ TASKS.md updated with v3 tasks. Review it:"
echo ""
cat TASKS.md
