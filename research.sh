#!/usr/bin/env bash
# ============================================================================
# research.sh — Execute research with web search, verification, and synthesis.
# ============================================================================
#
# Usage:
#   ./research.sh                                Default (standard depth)
#   ./research.sh --depth quick|standard|deep    Set research depth
#   ./research.sh --no-verify                    Skip fact verification
#   ./research.sh --verify                       Force verification (even on quick)
#   ./research.sh --timeout 900                  Custom timeout per Claude call
#
# Flow:
#   1. Load research plan from RESEARCH-PLAN.md (subtopics + context)
#   2. Apply depth profile (quick/standard/deep) → sets timeout, verify, prompt style
#   3. Subtopic loop:
#      a. For each unchecked subtopic in the plan:
#      b. Feed Claude the topic, context, prior findings, and depth instructions
#      c. Claude researches via web search, produces findings with inline citations
#      d. Output monitored via heartbeat (tracks lines written, detects stalls)
#      e. Findings appended to RESEARCH-WIP.md, subtopic checked off
#      f. On timeout: skip subtopic, continue to next
#   4. Verification pass (unless skipped):
#      a. Claude extracts all [CLAIM] tags from WIP findings
#      b. Visits each cited URL via WebFetch to confirm claims
#      c. Marks each: VERIFIED / UNVERIFIED / CONTRADICTED / SOURCE_DEAD
#      d. Produces RESEARCH-VERIFY.md with trust score
#   5. Synthesis pass:
#      a. Claude reads all findings + verification results
#      b. Organizes by theme, removes redundancy, adds executive summary
#      c. Includes evidence appendix if verification was run
#      d. Writes final document to RESEARCH-OUTPUT.md
#
# Depth profiles:
#   quick    — 2-3 searches, 3-5 claims, 5min timeout, verify off
#   standard — 5-8 searches, 5-15 claims, 20min timeout, verify on
#   deep     — 10+ searches, 10-25 claims, 30min timeout, verify on
#
# Output files:
#   RESEARCH-PLAN.md     Subtopic checklist (checked off as completed)
#   RESEARCH-WIP.md      Raw findings per subtopic with inline citations
#   RESEARCH-VERIFY.md   Verification report with trust score (if verify on)
#   RESEARCH-OUTPUT.md   Final synthesized document with evidence appendix
#
# Prev step:  ./research-plan.sh "topic"
#
# Resume:
#   Just re-run ./research.sh — it picks up from the first unchecked subtopic.
#   Already-completed findings in WIP are preserved and fed as context.
#
# Environment:
#   RESEARCH_NAME      Named session prefix (must match research-plan.sh)
#   DEPTH              Research depth: quick, standard, deep (default: standard)
#   SKIP_VERIFY        Set to 1 to skip verification (auto-set by depth)
#   RESEARCH_TIMEOUT   Timeout per Claude call in seconds (auto-set by depth)
# ============================================================================
set -euo pipefail

SCRIPT_TITLE="Research"
source ./config.sh

RESEARCH_NAME="${RESEARCH_NAME:-}"
SKIP_VERIFY=""  # tri-state: "" = auto (depth decides), "0" = force on, "1" = force off
RESEARCH_TIMEOUT="${RESEARCH_TIMEOUT:-}"
DEPTH="${DEPTH:-standard}"

# ── Parse flags ──
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-verify) SKIP_VERIFY=1; shift ;;
    --verify) SKIP_VERIFY=0; shift ;;
    --timeout)
      if [ -z "${2:-}" ]; then echo "Missing value for --timeout"; exit 1; fi
      RESEARCH_TIMEOUT="$2"; shift 2 ;;
    --depth)
      if [ -z "${2:-}" ]; then echo "Missing value for --depth"; exit 1; fi
      DEPTH="$2"; shift 2 ;;
    -*)
      echo "Usage: ./research.sh [--depth quick|standard|deep] [--no-verify|--verify] [--timeout SECONDS]"
      exit 1 ;;
    *)
      echo "Unknown argument: $1"
      exit 1 ;;
  esac
done

# ── Depth profiles ──
case "$DEPTH" in
  quick)
    DEPTH_INSTRUCTIONS="Research style: QUICK overview.
- Do 2-3 web searches maximum
- Focus on key facts and main takeaways only
- Keep findings concise — bullet points preferred over paragraphs
- Skip edge cases and deep details
- Aim for breadth, not depth"
    DEPTH_CLAIMS="3-5"
    [ -z "$RESEARCH_TIMEOUT" ] && RESEARCH_TIMEOUT=300
    [ -z "$SKIP_VERIFY" ] && SKIP_VERIFY=1  # skip verify by default for quick
    ;;
  standard)
    DEPTH_INSTRUCTIONS="Research style: STANDARD depth.
- Do 5-8 web searches per subtopic
- Cover the topic thoroughly with specific examples and data
- Include both mainstream views and notable alternatives
- Balance breadth and depth"
    DEPTH_CLAIMS="5-15"
    [ -z "$RESEARCH_TIMEOUT" ] && RESEARCH_TIMEOUT=1200
    ;;
  deep)
    DEPTH_INSTRUCTIONS="Research style: DEEP and exhaustive.
- Do 10+ web searches, cross-reference multiple sources for each claim
- Seek primary sources: official docs, academic papers, original blog posts over summaries
- Challenge assumptions — look for counterarguments and edge cases
- Include historical context and evolution of the topic
- Note disagreements between sources with specific citations
- Prefer quantitative data over qualitative statements"
    DEPTH_CLAIMS="10-25"
    [ -z "$RESEARCH_TIMEOUT" ] && RESEARCH_TIMEOUT=1800
    ;;
  *)
    echo "Unknown depth: $DEPTH (use quick, standard, or deep)"
    exit 1
    ;;
esac

# Resolve SKIP_VERIFY auto default (standard/deep enable verify)
[ -z "$SKIP_VERIFY" ] && SKIP_VERIFY=0

# ── File naming ──
if [ -n "$RESEARCH_NAME" ]; then
  PLAN_FILE="RESEARCH-${RESEARCH_NAME}-PLAN.md"
  WIP_FILE="RESEARCH-${RESEARCH_NAME}-WIP.md"
  OUTPUT_FILE="RESEARCH-${RESEARCH_NAME}-OUTPUT.md"
  VERIFY_FILE="RESEARCH-${RESEARCH_NAME}-VERIFY.md"
else
  PLAN_FILE="RESEARCH-PLAN.md"
  WIP_FILE="RESEARCH-WIP.md"
  OUTPUT_FILE="RESEARCH-OUTPUT.md"
  VERIFY_FILE="RESEARCH-VERIFY.md"
fi

ensure_timeout

if [ ! -f "$PLAN_FILE" ]; then
  echo "No ${PLAN_FILE} found. Run ./research-plan.sh first."
  exit 1
fi

# ── Allowed tools: web search, web fetch, read local files ──
RESEARCH_TOOLS="WebSearch,WebFetch,Read,Grep,Glob"

CLAUDE_OUTPUT=$(mktemp /tmp/research-output-XXXXXX)
trap 'stop_heartbeat; rm -f "$CLAUDE_OUTPUT"' EXIT INT TERM HUP

# ── Extract topic and context from plan file ──
TOPIC=$(sed -n 's/^\*\*Topic:\*\* //p' "$PLAN_FILE" | head -1)
if [ -z "$TOPIC" ]; then
  log "FATAL: Could not extract topic from ${PLAN_FILE}. Check the file format."
  exit 1
fi
CONTEXT=$(sed -n '/^## Context$/,/^## Subtopics$/{ /^## Context$/d; /^## Subtopics$/d; p; }' "$PLAN_FILE") || true

REMAINING=$(grep -c "^- \[ \]" "$PLAN_FILE" 2>/dev/null) || true
ALREADY_DONE=$(grep -c "^- \[x\]" "$PLAN_FILE" 2>/dev/null) || true
TOTAL=$((REMAINING + ALREADY_DONE))
DONE=$ALREADY_DONE
START_TIME=$(date +%s)

log "Starting research: ${TOPIC}"
log "Depth: ${DEPTH} | Timeout: ${RESEARCH_TIMEOUT}s | Verify: $([ "$SKIP_VERIFY" = "1" ] && echo "off" || echo "on")"
log "Subtopics: ${REMAINING} remaining (${TOTAL} total)"
log "Output: ${OUTPUT_FILE}"
echo ""
notify "Research started: ${TOPIC}"

# ── Initialize WIP file if it doesn't exist ──
if [ ! -f "$WIP_FILE" ]; then
  cat > "$WIP_FILE" <<EOF
# Research Working Notes

**Topic:** ${TOPIC}
**Started:** $(date '+%Y-%m-%d %H:%M:%S')

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
  > "$CLAUDE_OUTPUT"
  start_monitored_heartbeat "Subtopic ${DONE}/${TOTAL}" "$CLAUDE_OUTPUT"

  set +eo pipefail
  timeout "$RESEARCH_TIMEOUT" claude --dangerously-skip-permissions --print \
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

## Research depth
${DEPTH_INSTRUCTIONS}

## Instructions
- Research this subtopic using web search and any available tools
- Only read local files within the current project directory if relevant
- Build on prior findings — do not repeat what has already been covered
- Be specific: include names, numbers, examples, and sources where possible
- If you find conflicting information, note the disagreement
- For every factual claim, include an inline citation: [SOURCE: URL]
- If a claim comes from general knowledge with no specific source, mark it: [SOURCE: general knowledge]

Output your findings in this exact markdown format, nothing else:

## ${NUM}: [Subtopic title]

[Your detailed findings here — use subheadings, bullet points, and examples as needed.
Every factual claim MUST have an inline [SOURCE: URL] or [SOURCE: general knowledge] tag.]

**Key claims:**
- [CLAIM]: \"exact factual statement\" [SOURCE: URL] [CONFIDENCE: high/medium/low]
- [CLAIM]: \"exact factual statement\" [SOURCE: URL] [CONFIDENCE: high/medium/low]
(list ALL verifiable claims made in the findings above, ${DEPTH_CLAIMS} per subtopic)

**Key takeaways:**
- [2-4 bullet points summarizing the most important insights]
" 2>&1 | tee "$CLAUDE_OUTPUT"
  CLAUDE_RC=${PIPESTATUS[0]}
  set -eo pipefail

  stop_heartbeat

  if [ "$CLAUDE_RC" -eq 124 ]; then
    log "WARNING: Subtopic ${NUM} timed out after ${RESEARCH_TIMEOUT}s. Stopping — re-run to retry."
    notify "WARNING: Subtopic ${NUM} timed out — stopped"
    break
  elif [ ! -s "$CLAUDE_OUTPUT" ]; then
    log "WARNING: Empty findings for subtopic ${NUM}. Stopping — re-run to retry."
    notify "WARNING: Empty findings for subtopic ${NUM} — stopped"
    break
  else
    # Append to WIP file
    printf "\n%s\n\n---\n" "$(cat "$CLAUDE_OUTPUT")" >> "$WIP_FILE"
    echo ""
    log "Findings appended to ${WIP_FILE}"

    # Check off subtopic only on success
    awk -v num="$NUM" '{
      if (!done && match($0, "^- \\[ \\] " num ":")) {
        sub(/^- \[ \]/, "- [x]")
        done=1
      }
      print
    }' "$PLAN_FILE" > "${PLAN_FILE}.tmp" && mv "${PLAN_FILE}.tmp" "$PLAN_FILE"
  fi

  notify "Research (${DONE}/${TOTAL}): ${SUBTOPIC}"
  echo ""
done

# ── Verification pass ──
if [ "$SKIP_VERIFY" != "1" ]; then
  echo "========================================="
  log "Verifying claims from research findings..."
  echo "========================================="
  echo ""

  notify "Verification pass started..."
  > "$CLAUDE_OUTPUT"
  start_monitored_heartbeat "Verification" "$CLAUDE_OUTPUT"

  # Extract claims from WIP file
  WIP_FOR_VERIFY=$(cat "$WIP_FILE")
  if [ "$(wc -l < "$WIP_FILE" | tr -d ' ')" -gt 1500 ]; then
    WIP_FOR_VERIFY="[Truncated — last 1500 lines]
$(tail -1500 "$WIP_FILE")"
  fi

  set +eo pipefail
  timeout "$RESEARCH_TIMEOUT" claude --dangerously-skip-permissions --print \
    --allowedTools "$RESEARCH_TOOLS" \
    -- "
You are a fact-checker verifying claims from a research document.

## Research findings to verify
${WIP_FOR_VERIFY}

## Instructions
1. Extract every claim tagged with [CLAIM] from the findings above
2. For each claim that has a [SOURCE: URL]:
   - Visit the URL using WebFetch
   - Check if the source actually supports the claim
   - Mark it: VERIFIED (source confirms), UNVERIFIED (source doesn't mention it), CONTRADICTED (source says opposite), or SOURCE_DEAD (URL broken/404)
3. For claims with [SOURCE: general knowledge]:
   - Do a quick web search to find a supporting source
   - If found, mark VERIFIED with the new URL
   - If not found, mark UNVERIFIED
4. Note any claims that appear to conflict with each other

Output EXACTLY this markdown format, writing directly to the file ${VERIFY_FILE}:

# Verification Report

**Date:** $(date '+%Y-%m-%d %H:%M:%S')
**Topic:** ${TOPIC}

## Summary
- Total claims checked: [count]
- Verified: [count]
- Unverified: [count]
- Contradicted: [count]
- Source dead: [count]
- Trust score: [verified / total as percentage]

## Verified Claims
| # | Claim | Original Source | Status | Notes |
|---|-------|----------------|--------|-------|
| 1 | ... | ... | VERIFIED | Source confirms: [brief quote or summary] |
(list all claims with their verification status)

## Flagged Issues
[List any contradictions, dead sources, or suspicious claims that need human review]

Write this output directly to the file ${VERIFY_FILE}. Nothing else.
" 2>&1 | tee "$CLAUDE_OUTPUT"
  VERIFY_RC=${PIPESTATUS[0]}
  set -eo pipefail

  stop_heartbeat

  if [ "$VERIFY_RC" -eq 124 ]; then
    log "WARNING: Verification timed out after ${RESEARCH_TIMEOUT}s. Skipping."
    notify "WARNING: Verification timed out"
  elif [ -f "$VERIFY_FILE" ]; then
    VERIFIED_COUNT=$(grep -c "| VERIFIED |" "$VERIFY_FILE" 2>/dev/null) || true
    TOTAL_CLAIMS=$(grep -c "^| [0-9]" "$VERIFY_FILE" 2>/dev/null) || true
    log "Verification done: ${VERIFIED_COUNT:-0} verified out of ${TOTAL_CLAIMS:-0} claims"
    notify "Verification done: ${VERIFIED_COUNT:-0} verified claims"
  else
    log "WARNING: Verification produced no output file"
  fi
  echo ""
else
  log "Skipping verification (SKIP_VERIFY=1)"
fi

# ── Final synthesis pass ──
echo "========================================="
log "Synthesizing findings into ${OUTPUT_FILE}..."
echo "========================================="
echo ""

notify "Synthesizing research findings..."
> "$CLAUDE_OUTPUT"
start_monitored_heartbeat "Synthesis" "$CLAUDE_OUTPUT"

WIP_LINES=$(wc -l < "$WIP_FILE" | tr -d ' ')
if [ "$WIP_LINES" -gt 2000 ]; then
  log "WIP file is large (${WIP_LINES} lines). Truncating to last 2000 lines for synthesis."
  WIP_CONTENT="[Truncated — showing last 2000 lines of ${WIP_LINES} total]
$(tail -2000 "$WIP_FILE")"
else
  WIP_CONTENT=$(cat "$WIP_FILE")
fi

# Read verification results if available (truncate if large)
VERIFY_CONTENT=""
if [ -f "$VERIFY_FILE" ]; then
  VERIFY_LINES=$(wc -l < "$VERIFY_FILE" | tr -d ' ')
  if [ "$VERIFY_LINES" -gt 500 ]; then
    VERIFY_CONTENT="[Truncated — last 500 lines of ${VERIFY_LINES} total]
$(tail -500 "$VERIFY_FILE")"
  else
    VERIFY_CONTENT=$(cat "$VERIFY_FILE")
  fi
fi

VERIFY_INSTRUCTIONS=""
if [ -n "$VERIFY_CONTENT" ]; then
  VERIFY_INSTRUCTIONS="
## Verification results
${VERIFY_CONTENT}

Additional synthesis rules for verified research:
- Prioritize VERIFIED claims over UNVERIFIED ones
- Flag any CONTRADICTED claims with a warning note
- Remove or clearly mark claims from dead sources
- Include the trust score in the executive summary
- Add an Evidence Appendix at the end of the document with the verification table
"
fi

set +eo pipefail
timeout "$RESEARCH_TIMEOUT" claude --dangerously-skip-permissions --print \
  --allowedTools "$RESEARCH_TOOLS" \
  -- "
You are a research analyst producing a final, polished research document.

## Topic
${TOPIC}

## Context from the researcher
${CONTEXT}

## Raw findings
${WIP_CONTENT}
${VERIFY_INSTRUCTIONS}

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
- Include inline citations [SOURCE: URL] for key claims in the final document
- If verification data is available, add an Evidence Appendix at the end

Write the complete document directly to the file ${OUTPUT_FILE}. The document should start with:

# Research: ${TOPIC}

**Date:** $(date +%Y-%m-%d)

## Executive Summary
...
" 2>&1 | tee "$CLAUDE_OUTPUT"
SYNTHESIS_RC=${PIPESTATUS[0]}
set -eo pipefail

stop_heartbeat

if [ "$SYNTHESIS_RC" -eq 124 ]; then
  log "WARNING: Synthesis timed out after ${RESEARCH_TIMEOUT}s."
  notify "WARNING: Synthesis timed out"
elif [ "$SYNTHESIS_RC" -ne 0 ]; then
  log "WARNING: Synthesis failed (exit code ${SYNTHESIS_RC})."
  notify "WARNING: Synthesis failed"
fi

RESEARCH_TIME=$(fmt_elapsed $(( $(date +%s) - START_TIME )))

notify "Research complete (${RESEARCH_TIME}): ${DONE} subtopics in ${OUTPUT_FILE}"

echo ""
log "Research complete! ${DONE} subtopics in ${RESEARCH_TIME}."
echo ""
echo "Files:"
echo "  Plan:     ${PLAN_FILE}"
echo "  Notes:    ${WIP_FILE}"
[ -f "$VERIFY_FILE" ] && echo "  Verified: ${VERIFY_FILE}"
echo "  Output:   ${OUTPUT_FILE}"
