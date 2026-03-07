#!/usr/bin/env bash
# ============================================================================
# research-plan.sh — Plan a research session with dynamic context questions.
# ============================================================================
#
# Usage:
#   ./research-plan.sh "your research topic"
#   ./research-plan.sh --quick "topic"          Skip context questions
#   ./research-plan.sh --file TOPIC.md          Read topic from file
#
# Flow:
#   1. Parse topic from argument or --file
#   2. Pass 1 — Context questions (unless --quick):
#      a. Claude generates 5 tailored questions about the topic
#      b. Questions are presented interactively (user answers via terminal)
#      c. Answers are collected into a context block
#   3. Pass 2 — Subtopic generation:
#      a. Claude receives topic + context answers
#      b. Produces 5-10 focused, ordered subtopics
#      c. Writes checklist to RESEARCH-PLAN.md (or RESEARCH-{name}-PLAN.md)
#
# Output:
#   RESEARCH-PLAN.md (or RESEARCH-{name}-PLAN.md with RESEARCH_NAME env var)
#   Contains: topic, date, context answers, subtopic checklist
#
# Next step:  ./research.sh
#
# Environment:
#   RESEARCH_NAME  — Prefix for named sessions (e.g., RESEARCH_NAME=streaks)
#                    Must match between research-plan.sh and research.sh
# ============================================================================
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
  # Context questions require interactive terminal
  if [ ! -t 0 ]; then
    echo "Non-interactive shell detected. Use --quick to skip context questions."
    exit 1
  fi
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
- Create as many subtopics as the topic genuinely requires — no more, no less
- A narrow or well-defined topic might need only 2-3 subtopics
- A broad or complex topic might need 8-12
- Do NOT pad with filler subtopics just to reach a number — every subtopic must add unique value
- If two potential subtopics overlap significantly, merge them into one
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

# Verify Claude created the plan file
if [ ! -f "$PLAN_FILE" ]; then
  log "FATAL: Claude did not create ${PLAN_FILE}"
  notify "FATAL: Research planning failed — no output file"
  exit 1
fi

SUBTOPIC_COUNT=$(grep -c "^- \[ \]" "$PLAN_FILE" 2>/dev/null || echo 0)
PLAN_TIME=$(fmt_elapsed $(( $(date +%s) - PLAN_START )))

echo ""
log "Done: ${PLAN_FILE} (${SUBTOPIC_COUNT:-0} subtopics, ${PLAN_TIME})"
notify "Research planned (${PLAN_TIME}): ${SUBTOPIC_COUNT:-0} subtopics in ${PLAN_FILE}"
echo ""
cat "$PLAN_FILE"
echo ""
echo "Planning completed in ${PLAN_TIME}."
