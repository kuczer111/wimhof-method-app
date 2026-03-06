#!/bin/bash
set -euo pipefail

# ── CONFIG ──
APP_URL="${APP_URL:-https://wimhof-method-app.vercel.app}"
QA_FILE="${QA_FILE:-QA-FINDINGS.md}"
MODE="${1:-smart}"  # "smart" (default), "functional", or "visual"
TIMEOUT="${QA_TIMEOUT:-600}"  # seconds per claude call (default 10 min)
# ─────────────

# ── TEMP FILES & CLEANUP ──
FUNCTIONAL_FILE=$(mktemp /tmp/qa-functional-XXXXXX.md)
VISUAL_FILE=$(mktemp /tmp/qa-visual-XXXXXX.md)
trap 'rm -f "$FUNCTIONAL_FILE" "$VISUAL_FILE"' EXIT

# ── PREFLIGHT CHECKS ──
preflight() {
  if ! command -v claude &>/dev/null; then
    echo "FATAL: claude CLI not found. Install it first."
    exit 1
  fi

  case "$MODE" in
    functional|smart)
      if ! claude --dangerously-skip-permissions --print "List your available MCP tools that start with mcp__playwright. Reply ONLY with the tool names, one per line. If none, reply NONE." 2>/dev/null | grep -q "mcp__playwright"; then
        echo "FATAL: Playwright MCP not configured. Run: npx @anthropic-ai/claude-code mcp add playwright -- npx -y @anthropic-ai/mcp-playwright --no-vision"
        exit 1
      fi
      ;;&  # fall through to also check puppeteer for smart mode
    visual)
      if ! claude --dangerously-skip-permissions --print "List your available MCP tools that start with mcp__puppeteer. Reply ONLY with the tool names, one per line. If none, reply NONE." 2>/dev/null | grep -q "mcp__puppeteer"; then
        echo "FATAL: Puppeteer MCP not configured. Run: npx @anthropic-ai/claude-code mcp add puppeteer -- npx -y @anthropic-ai/mcp-puppeteer"
        exit 1
      fi
      ;;
  esac

  echo "Preflight OK: claude CLI found, MCP tools available."
}

# ── TEST PROMPT (heredoc for safe quoting) ──
read -r -d '' TEST_PROMPT <<PROMPT || true
You are a QA tester for a Wim Hof Method PWA at ${APP_URL}.

## Test Flows

### Flow 1: Onboarding (${APP_URL}/onboarding)
1. Screen 1 (Hero) — verify intro text and Next button
2. Screen 2 (Three Pillars) — breathing/cold/mindset content, Skip button should appear
3. Screen 3 (Physical Expectations) — safety info
4. Screen 4 (Safety Acknowledgment) — MANDATORY, Skip should NOT work here. Click Acknowledge.
5. Screen 5 (Starting Point) — pick "completely new"
6. Profile setup — fill in any options and complete

### Flow 2: Breathing Session (${APP_URL}/breathe)
1. Config screen — verify preset cards (Beginner, Standard, Deep, Morning), round/breath/pace selectors
2. Select Beginner preset, start session
3. Power Breaths phase — verify breath counter, animation
4. Retention Hold phase — verify timer counting up, end button visible
5. End retention
6. Recovery Breath phase — verify 15s countdown
7. Let it complete
8. Session Complete screen — verify stats, feeling selector, save button

### Flow 3: Cold Timer (${APP_URL}/cold)
1. Verify target duration selector
2. Start timer — verify circular progress, elapsed time
3. Stop timer
4. Log form — verify duration, temperature input, type selector, rating
5. Save the session

### Flow 4: Progress (${APP_URL}/progress)
1. Overview tab — verify stats cards
2. Breathing tab — verify session list and chart
3. Cold tab — verify cold stats and history

### Flow 5: Program (${APP_URL}/program)
1. Verify calendar view
2. Verify today's session card
3. Check Start button

### Flow 6: Learn (${APP_URL}/learn)
1. Verify chapter list (8 chapters)
2. Open chapter 1 — verify content loads
3. Check if chapters 4-8 are gated

### Flow 7: Settings (${APP_URL}/settings)
1. Verify all sections render
2. Toggle a setting
3. Check privacy policy link

### Flow 8: Edge Cases
1. Navigate to ${APP_URL}/nonexistent — verify error handling
2. Go back to ${APP_URL} — verify redirect
PROMPT

# ── REPORT TEMPLATE ──
report_instructions() {
  local mode="$1"
  cat <<EOF
Output your findings as a markdown report in EXACTLY this format:

# QA Findings — ${mode} Pass

**Date:** $(date +%Y-%m-%d)
**Tested URL:** ${APP_URL}
**Mode:** ${mode}

## Summary
- Total issues: [count]
- By severity: [Critical: X, Major: X, Minor: X, Cosmetic: X]

## Findings

### [F-01]: [Short title]
- **Page:** [URL or screen name]
- **Severity:** Critical / Major / Minor / Cosmetic
- **Description:** What is wrong
- **Expected:** What should happen
- **Actual:** What actually happens

(repeat for each finding, incrementing F-XX)

## Passed
[List flows/screens that had no issues]

If there are ZERO issues, write ONLY this under Findings:
ZERO_ISSUES_FOUND

Include EVERY issue no matter how small.
EOF
}

# ── RUNNER ──
run_claude() {
  local prompt="$1"
  local output_file="$2"
  local label="$3"

  echo "Running: ${label}..."

  if ! timeout "${TIMEOUT}" \
    env CLAUDE_MODEL=claude-sonnet-4-6 claude --dangerously-skip-permissions --print "$prompt" \
    > "$output_file" 2>/dev/null; then
    echo "FATAL: ${label} failed (exit code $? — timeout after ${TIMEOUT}s or claude error)."
    exit 1
  fi

  # Validate output is non-empty and looks like a report
  if [ ! -s "$output_file" ]; then
    echo "FATAL: ${label} produced empty output."
    exit 1
  fi

  if ! grep -q "## Findings" "$output_file"; then
    echo "WARNING: ${label} output doesn't contain expected report structure. Results may be unreliable."
  fi

  echo "Done: ${label} ($(wc -l < "$output_file") lines)"
}

# ── PASS FUNCTIONS ──
run_functional() {
  local out="$1"
  local instructions
  instructions=$(report_instructions "Functional")

  run_claude "${TEST_PROMPT}

## Instructions
Use Playwright tools (mcp__playwright). Use accessibility snapshots, NOT screenshots.
For each screen: check text is visible, buttons work, navigation is correct, no errors.

${instructions}" "$out" "Functional pass"
}

run_visual_full() {
  local out="$1"
  local instructions
  instructions=$(report_instructions "Visual")

  run_claude "${TEST_PROMPT}

## Instructions
Use Puppeteer tools (mcp__puppeteer). Take a screenshot at every screen.
For each screen: check layout, spacing, colors, overlapping elements, text readability.

${instructions}" "$out" "Visual pass (full)"
}

run_visual_targeted() {
  local findings_file="$1"
  local out="$2"
  local findings
  findings=$(cat "$findings_file")
  local instructions
  instructions=$(report_instructions "Visual Verification")

  run_claude "You are a QA tester doing a VISUAL verification of issues found in a previous functional test.
Use Puppeteer tools (mcp__puppeteer). Take a screenshot of each flagged screen.

## Issues from functional pass

${findings}

## Instructions
For each issue listed above:
1. Navigate to the page mentioned
2. Take a screenshot
3. Confirm or dismiss the issue based on visual evidence
4. Check for additional visual problems: layout overflow, overlapping elements, cut-off text, color contrast, spacing

For the final report:
- Keep issues that are CONFIRMED visually
- Mark issues that look fine visually as: DISMISSED (visual check passed)
- Add any NEW visual issues you spot

${instructions}" "$out" "Visual pass (targeted)"
}

# ── SMART MODE: check if issues were found ──
has_issues() {
  local file="$1"
  # Check for our sentinel value — more reliable than string matching
  if grep -q "ZERO_ISSUES_FOUND" "$file" 2>/dev/null; then
    return 1  # no issues
  fi
  # Also check for at least one finding header
  if grep -q "^### \[F-" "$file" 2>/dev/null; then
    return 0  # has issues
  fi
  # Ambiguous — assume issues to be safe
  echo "WARNING: Could not determine issue count from functional pass. Proceeding with visual verification."
  return 0
}

issue_count() {
  grep -c "^### \[F-" "$1" 2>/dev/null || echo "0"
}

# ── MERGE (bash-only, no extra Claude call) ──
merge_reports() {
  local func_file="$1"
  local vis_file="$2"
  local out="$3"

  cat > "$out" <<EOF
# QA Findings

**Date:** $(date +%Y-%m-%d)
**Tested URL:** ${APP_URL}
**Mode:** Smart (functional + visual verification)

---

## Functional Pass Results

$(cat "$func_file")

---

## Visual Verification Results

$(cat "$vis_file")
EOF

  echo "Reports merged into ${out}"
}

# ── MAIN ──
echo "======================================"
echo "QA Runner — Mode: ${MODE}"
echo "Target: ${APP_URL}"
echo "======================================"
echo ""

# Preflight (skip with QA_SKIP_PREFLIGHT=1 for speed)
if [ "${QA_SKIP_PREFLIGHT:-0}" != "1" ]; then
  preflight
fi
echo ""

case "$MODE" in
  functional)
    run_functional "$QA_FILE"
    echo ""
    echo "Functional QA complete. Results in ${QA_FILE}"
    ;;

  visual)
    run_visual_full "$QA_FILE"
    echo ""
    echo "Visual QA complete. Results in ${QA_FILE}"
    ;;

  smart)
    # Pass 1: Cheap functional scan
    run_functional "$FUNCTIONAL_FILE"
    echo ""

    # Check results
    if has_issues "$FUNCTIONAL_FILE"; then
      COUNT=$(issue_count "$FUNCTIONAL_FILE")
      echo "Found ${COUNT} issue(s). Running targeted visual verification..."
      echo ""

      # Pass 2: Visual verification of flagged screens only
      run_visual_targeted "$FUNCTIONAL_FILE" "$VISUAL_FILE"
      echo ""

      # Merge both reports (bash only — no extra Claude call)
      merge_reports "$FUNCTIONAL_FILE" "$VISUAL_FILE" "$QA_FILE"
    else
      echo "No issues found in functional pass. Skipping visual."
      cp "$FUNCTIONAL_FILE" "$QA_FILE"
    fi

    echo ""
    echo "Smart QA complete. Results in ${QA_FILE}"
    ;;

  *)
    echo "Usage: ./qa.sh [smart|functional|visual]"
    echo ""
    echo "Modes:"
    echo "  smart       - Functional scan first, visual only on failures (default)"
    echo "  functional  - DOM/accessibility scan only (cheapest)"
    echo "  visual      - Full screenshot scan (most thorough)"
    echo ""
    echo "Environment variables:"
    echo "  APP_URL          - Override target URL (default: https://wimhof-method-app.vercel.app)"
    echo "  QA_FILE          - Override output file (default: QA-FINDINGS.md)"
    echo "  QA_TIMEOUT       - Timeout per pass in seconds (default: 600)"
    echo "  QA_SKIP_PREFLIGHT - Set to 1 to skip MCP availability check"
    exit 1
    ;;
esac
