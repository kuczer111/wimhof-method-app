#!/bin/bash

echo "📋 Ralph is reading the spec and planning tasks..."

claude --dangerously-skip-permissions --print "
Read the file SPEC.md carefully.

Break this PWA app into small, self-contained development tasks.

Rules:
- Each task must be completable in one focused coding session
- Tasks must be in logical build order (foundation first)
- Each task must be testable with: npm run build
- Be specific — name the files/components involved
- Start with config/setup, then core features, then polish
- Aim for 15-25 tasks total

Output ONLY the following markdown format, nothing else, no explanation:

# Task List

- [ ] 001: [short name] | [one sentence of what to build]
- [ ] 002: [short name] | [one sentence of what to build]

Write this output directly to the file TASKS.md
"

echo ""
echo "✅ TASKS.md generated. Review it:"
echo ""
cat TASKS.md
