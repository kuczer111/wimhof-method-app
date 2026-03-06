#!/bin/bash
set -euo pipefail

SCRIPT_TITLE="Research Plan"
source ./config.sh

TOPIC=""
QUICK=false
RESEARCH_NAME="${RESEARCH_NAME:-}"

# ── Parse flags ──
while [[ $# -gt 0 ]]; do
  case "$1" in
    --quick) QUICK=true; shift ;;
    --file)
      if [ -z "${2:-}" ] || [ ! -f "$2" ]; then
        echo "File not found: ${2:-}"
        exit 1
      fi
      TOPIC=$(cat "$2")
      shift 2
      ;;
    -*)
      echo "Unknown flag: $1"
      exit 1
      ;;
    *)
      TOPIC="$1"
      shift
      ;;
  esac
done

if [ -z "$TOPIC" ]; then
  echo "Usage: ./research-plan.sh [--quick] [--file topic.md] \"your research topic\""
  echo ""
  echo "  --quick  Skip context questions, generate subtopics directly"
  echo "  --file   Read topic from a file instead of argument"
  echo ""
  echo "Environment variables:"
  echo "  RESEARCH_NAME  — Prefix for output files (e.g., RESEARCH_NAME=streaks)"
  exit 1
fi

# ── File naming ──
if [ -n "$RESEARCH_NAME" ]; then
  PLAN_FILE="RESEARCH-${RESEARCH_NAME}-PLAN.md"
else
  PLAN_FILE="RESEARCH-PLAN.md"
fi

PLAN_START=$(date +%s)

# ── Pass 1: Dynamic context questions ──
CONTEXT_BLOCK=""

if [ "$QUICK" = false ]; then
  log "Generating context questions for your topic..."
  echo ""

  QUESTIONS=$(claude --dangerously-skip-permissions --print -- "
You are a research assistant preparing to deeply investigate a topic.

Topic: ${TOPIC}

Generate exactly 5 short context questions that would help you produce better research on this topic. Each question should sharpen the research focus — things like: goal/purpose, target audience, scope boundaries, current knowledge level, specific areas of interest or exclusion.

Output ONLY the questions, one per line, numbered 1-5. Each question should have a short parenthetical hint of example answers. No preamble, no explanation.

Example format:
1. What is the goal of this research? (Benchmarking competitors, redesigning a feature, general learning?)
2. ...
")

  echo "Before I research this, a few questions to sharpen the focus:"
  echo ""

  ANSWERS=""
  while IFS= read -r question; do
    # Skip empty lines
    [ -z "$question" ] && continue

    echo "$question"
    printf "   > "
    read -r answer </dev/tty

    if [ -n "$answer" ]; then
      # Extract just the question text (strip number prefix)
      q_text=$(echo "$question" | sed 's/^[0-9]*\. *//')
      ANSWERS="${ANSWERS}- **${q_text}** ${answer}
"
    fi
    echo ""
  done <<< "$QUESTIONS"

  if [ -n "$ANSWERS" ]; then
    CONTEXT_BLOCK="## Context

${ANSWERS}"
  fi
fi

# ── Pass 2: Generate subtopics ──
log "Planning subtopics..."

CONTEXT_PROMPT=""
if [ -n "$CONTEXT_BLOCK" ]; then
  CONTEXT_PROMPT="
The user provided additional context to guide the research:

${CONTEXT_BLOCK}

Use this context to focus and prioritize the subtopics."
fi

claude --dangerously-skip-permissions --print -- "
You are a research planner. Break down a research topic into focused subtopics.

Topic: ${TOPIC}
${CONTEXT_PROMPT}

Rules:
- Create 5-10 subtopics that together cover the topic comprehensively
- Order from foundational/definitional to specific/applied
- Each subtopic should be researchable in a single focused session
- Be specific — vague subtopics produce vague research
- If the user's context mentions reading the codebase, include a subtopic for that

Output the following markdown EXACTLY, writing it directly to the file ${PLAN_FILE}:

# Research Plan

**Topic:** ${TOPIC}
**Date:** $(date +%Y-%m-%d)

${CONTEXT_BLOCK}
## Subtopics

- [ ] 01: [Subtopic title] | [One sentence describing what to investigate]
- [ ] 02: [Subtopic title] | [One sentence describing what to investigate]
...

Write this output directly to the file ${PLAN_FILE}. Nothing else.
"

SUBTOPIC_COUNT=$(grep -c "^- \[ \]" "$PLAN_FILE" 2>/dev/null) || true
PLAN_TIME=$(fmt_elapsed $(( $(date +%s) - PLAN_START )))

echo ""
log "Done: ${PLAN_FILE} (${SUBTOPIC_COUNT:-0} subtopics, ${PLAN_TIME})"
notify "Research planned (${PLAN_TIME}): ${SUBTOPIC_COUNT:-0} subtopics in ${PLAN_FILE}"
echo ""
cat "$PLAN_FILE"
