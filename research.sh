#!/bin/bash
set -euo pipefail

SCRIPT_TITLE="Research"
source ./config.sh

RESEARCH_NAME="${RESEARCH_NAME:-}"

# ── File naming ──
if [ -n "$RESEARCH_NAME" ]; then
  PLAN_FILE="RESEARCH-${RESEARCH_NAME}-PLAN.md"
  WIP_FILE="RESEARCH-${RESEARCH_NAME}-WIP.md"
  OUTPUT_FILE="RESEARCH-${RESEARCH_NAME}-OUTPUT.md"
else
  PLAN_FILE="RESEARCH-PLAN.md"
  WIP_FILE="RESEARCH-WIP.md"
  OUTPUT_FILE="RESEARCH-OUTPUT.md"
fi

if [ ! -f "$PLAN_FILE" ]; then
  echo "No ${PLAN_FILE} found. Run ./research-plan.sh first."
  exit 1
fi

# ── Allowed tools: web search, web fetch, read local files ──
RESEARCH_TOOLS="WebSearch,WebFetch,Read,Grep,Glob"

trap 'stop_heartbeat' EXIT INT TERM HUP

# ── Extract topic and context from plan file ──
TOPIC=$(sed -n 's/^\*\*Topic:\*\* //p' "$PLAN_FILE" | head -1)
CONTEXT=$(sed -n '/^## Context$/,/^## Subtopics$/{ /^## Context$/d; /^## Subtopics$/d; p; }' "$PLAN_FILE") || true

REMAINING=$(grep -c "^- \[ \]" "$PLAN_FILE" 2>/dev/null) || true
ALREADY_DONE=$(grep -c "^- \[x\]" "$PLAN_FILE" 2>/dev/null) || true
TOTAL=$((REMAINING + ALREADY_DONE))
DONE=$ALREADY_DONE
START_TIME=$(date +%s)

log "Starting research: ${TOPIC}"
log "Subtopics: ${REMAINING} remaining (${TOTAL} total)"
log "Output: ${OUTPUT_FILE}"
echo ""
notify "Research started: ${TOPIC}"

# ── Initialize WIP file if it doesn't exist ──
if [ ! -f "$WIP_FILE" ]; then
  cat > "$WIP_FILE" <<EOF
# Research Working Notes

**Topic:** ${TOPIC}
**Started:** $(date +%Y-%m-%d)

---

EOF
fi

# ── Loop through subtopics ──
while true; do
  NEXT=$(grep -m 1 "^- \[ \]" "$PLAN_FILE") || true

  if [ -z "$NEXT" ]; then
    break
  fi

  SUBTOPIC=$(echo "$NEXT" | sed 's/^- \[ \] [0-9]*: //')
  NUM=$(echo "$NEXT" | sed 's/^- \[ \] \([0-9]*\):.*/\1/')
  DONE=$((DONE + 1))

  echo "========================================="
  log "Subtopic ${DONE}/${TOTAL}: ${SUBTOPIC}"
  echo "========================================="

  # Read prior findings for context (truncate if very large)
  PRIOR_FINDINGS=""
  if [ -f "$WIP_FILE" ]; then
    WIP_LINES=$(wc -l < "$WIP_FILE" | tr -d ' ')
    if [ "$WIP_LINES" -gt 500 ]; then
      PRIOR_FINDINGS="[Prior findings truncated to last 500 lines for context]
$(tail -500 "$WIP_FILE")"
    else
      PRIOR_FINDINGS=$(cat "$WIP_FILE")
    fi
  fi

  # Research this subtopic
  start_heartbeat "Subtopic ${DONE}/${TOTAL}"

  FINDINGS=$(claude --dangerously-skip-permissions --print \
    --allowedTools "$RESEARCH_TOOLS" \
    -- "
You are a thorough research assistant investigating a specific subtopic.

## Overall Topic
${TOPIC}

## Context from the researcher
${CONTEXT}

## Your current subtopic
${SUBTOPIC}

## Prior findings (what has been researched so far)
${PRIOR_FINDINGS}

## Instructions
- Research this subtopic thoroughly using web search and any available tools
- Only read local files within the current project directory if relevant
- Build on prior findings — do not repeat what has already been covered
- Be specific: include names, numbers, examples, and sources where possible
- If you find conflicting information, note the disagreement

Output your findings in this exact markdown format, nothing else:

## ${NUM}: [Subtopic title]

[Your detailed findings here — use subheadings, bullet points, and examples as needed]

**Key takeaways:**
- [2-4 bullet points summarizing the most important insights]

**Sources:**
- [List URLs or references you consulted]
") && true

  stop_heartbeat

  # Validate output is non-empty
  if [ -z "$FINDINGS" ]; then
    log "WARNING: Empty findings for subtopic ${NUM}. Skipping."
    notify "WARNING: Empty findings for subtopic ${NUM}"
  else
    # Append to WIP file
    printf "\n%s\n\n---\n" "$FINDINGS" >> "$WIP_FILE"
    echo ""
    log "Findings appended to ${WIP_FILE}"
  fi

  # Check off subtopic
  awk -v num="$NUM" '{
    if (!done && match($0, "^- \\[ \\] " num ":")) {
      sub(/^- \[ \]/, "- [x]")
      done=1
    }
    print
  }' "$PLAN_FILE" > "${PLAN_FILE}.tmp" && mv "${PLAN_FILE}.tmp" "$PLAN_FILE"

  notify "Research (${DONE}/${TOTAL}): ${SUBTOPIC}"
  echo ""
done

# ── Final synthesis pass ──
echo "========================================="
log "Synthesizing findings into ${OUTPUT_FILE}..."
echo "========================================="
echo ""

notify "Synthesizing research findings..."
start_heartbeat "Synthesis"

WIP_LINES=$(wc -l < "$WIP_FILE" | tr -d ' ')
if [ "$WIP_LINES" -gt 2000 ]; then
  log "WIP file is large (${WIP_LINES} lines). Truncating to last 2000 lines for synthesis."
  WIP_CONTENT="[Truncated — showing last 2000 lines of ${WIP_LINES} total]
$(tail -2000 "$WIP_FILE")"
else
  WIP_CONTENT=$(cat "$WIP_FILE")
fi

claude --dangerously-skip-permissions --print \
  --allowedTools "$RESEARCH_TOOLS" \
  -- "
You are a research analyst producing a final, polished research document.

## Topic
${TOPIC}

## Context from the researcher
${CONTEXT}

## Raw findings
${WIP_CONTENT}

## Instructions
Synthesize all the raw findings above into a well-structured, polished research document.

Rules:
- Organize by theme, not by subtopic order — group related insights together
- Remove redundancy — if multiple subtopics covered the same point, merge them
- Lead with the most important and actionable insights
- Include an executive summary at the top (3-5 sentences)
- Include a recommendations section at the end with concrete, actionable next steps
- Preserve specific examples, numbers, and sources from the raw findings
- Write for the audience described in the context

Write the complete document directly to the file ${OUTPUT_FILE}. The document should start with:

# Research: ${TOPIC}

**Date:** $(date +%Y-%m-%d)

## Executive Summary
...
"

stop_heartbeat

RESEARCH_TIME=$(fmt_elapsed $(( $(date +%s) - START_TIME )))

notify "Research complete (${RESEARCH_TIME}): ${DONE} subtopics in ${OUTPUT_FILE}"

echo ""
log "Research complete! ${DONE} subtopics in ${RESEARCH_TIME}."
echo ""
echo "Files:"
echo "  Plan:    ${PLAN_FILE}"
echo "  Notes:   ${WIP_FILE}"
echo "  Output:  ${OUTPUT_FILE}"
