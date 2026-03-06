#!/bin/bash
set -euo pipefail

# ── CONFIG ──
APP_URL="${APP_URL:-https://wimhof-method-app.vercel.app}"
QA_FILE="${QA_FILE:-QA-FINDINGS.md}"
MODE="${1:-smart}"  # "smart" (default), "functional", or "visual"
TIMEOUT="${QA_TIMEOUT:-600}"  # seconds per claude call (default 10 min)
QA_MODEL="${QA_MODEL:-claude-sonnet-4-6}"
# ─────────────

# ── macOS TIMEOUT PORTABILITY ──
if ! command -v timeout &>/dev/null; then
  if command -v gtimeout &>/dev/null; then
    timeout() { gtimeout "$@"; }
  else
    echo "WARNING: No timeout command found (install coreutils: brew install coreutils)."
    echo "         Claude calls will run without timeout protection."
    timeout() { shift; "$@"; }
  fi
fi

# ── TEMP FILES & CLEANUP ──
FUNCTIONAL_FILE=$(mktemp /tmp/qa-functional-XXXXXX)
VISUAL_FILE=$(mktemp /tmp/qa-visual-XXXXXX)
trap 'rm -f "$FUNCTIONAL_FILE" "$VISUAL_FILE"' EXIT INT TERM HUP

# ── ALLOWED TOOLS (security: restrict to browser MCP only) ──
PLAYWRIGHT_TOOLS="mcp__playwright__browser_navigate,mcp__playwright__browser_screenshot,mcp__playwright__browser_click,mcp__playwright__browser_type,mcp__playwright__browser_snapshot,mcp__playwright__browser_wait,mcp__playwright__browser_tab_list,mcp__playwright__browser_tab_new,mcp__playwright__browser_tab_select,mcp__playwright__browser_tab_close,mcp__playwright__browser_select_option,mcp__playwright__browser_hover,mcp__playwright__browser_drag,mcp__playwright__browser_press_key,mcp__playwright__browser_resize,mcp__playwright__browser_handle_dialog,mcp__playwright__browser_file_upload,mcp__playwright__browser_pdf_save,mcp__playwright__browser_close,mcp__playwright__browser_console_messages,mcp__playwright__browser_network_requests"
PUPPETEER_TOOLS="mcp__puppeteer__puppeteer_navigate,mcp__puppeteer__puppeteer_screenshot,mcp__puppeteer__puppeteer_click,mcp__puppeteer__puppeteer_fill,mcp__puppeteer__puppeteer_select,mcp__puppeteer__puppeteer_hover,mcp__puppeteer__puppeteer_evaluate"

# ── PREFLIGHT CHECKS (zero tokens — config file based) ──
preflight() {
  if ! command -v claude &>/dev/null; then
    echo "FATAL: claude CLI not found. Install it first."
    exit 1
  fi

  # Check all known MCP config locations
  local config_files=(.mcp.json ~/.claude.json ~/.claude/.mcp.json ~/.claude/projects/*/settings.local.json)

  check_mcp() {
    local name="$1"
    grep -ql "\"${name}\"" "${config_files[@]}" 2>/dev/null
  }

  case "$MODE" in
    functional)
      if ! check_mcp "playwright"; then
        echo "FATAL: Playwright MCP not configured."
        echo "  Run: npx @anthropic-ai/claude-code mcp add playwright -- npx -y @playwright/mcp --no-vision"
        exit 1
      fi
      ;;
    visual)
      if ! check_mcp "puppeteer"; then
        echo "FATAL: Puppeteer MCP not configured."
        echo "  Run: npx @anthropic-ai/claude-code mcp add puppeteer -- npx -y @modelcontextprotocol/server-puppeteer"
        exit 1
      fi
      ;;
    smart)
      local missing=""
      if ! check_mcp "playwright"; then
        missing="playwright"
      fi
      if ! check_mcp "puppeteer"; then
        missing="${missing:+$missing, }puppeteer"
      fi
      if [ -n "$missing" ]; then
        echo "FATAL: Missing MCP configuration: ${missing}"
        [[ "$missing" == *playwright* ]] && echo "  Run: npx @anthropic-ai/claude-code mcp add playwright -- npx -y @playwright/mcp --no-vision"
        [[ "$missing" == *puppeteer* ]] && echo "  Run: npx @anthropic-ai/claude-code mcp add puppeteer -- npx -y @modelcontextprotocol/server-puppeteer"
        exit 1
      fi
      ;;
  esac

  echo "Preflight OK: claude CLI found, MCP config present for ${MODE} mode."
}

# ── TEST PROMPT ──
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
  local allowed_tools="$4"

  echo "Running: ${label}..."

  local rc=0
  timeout "${TIMEOUT}" \
    claude --model "$QA_MODEL" --dangerously-skip-permissions --print \
    --allowedTools "$allowed_tools" \
    "$prompt" \
    > "$output_file" 2>/dev/null || rc=$?

  if [ "$rc" -ne 0 ]; then
    if [ "$rc" -eq 124 ]; then
      echo "FATAL: ${label} timed out after ${TIMEOUT}s."
    else
      echo "FATAL: ${label} failed (exit code ${rc})."
    fi
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
Use Playwright tools. Use accessibility snapshots, NOT screenshots.
For each screen: check text is visible, buttons work, navigation is correct, no errors.

${instructions}" "$out" "Functional pass" "$PLAYWRIGHT_TOOLS"
}

run_visual_full() {
  local out="$1"
  local instructions
  instructions=$(report_instructions "Visual")

  run_claude "${TEST_PROMPT}

## Instructions
Use Puppeteer tools. Take a screenshot at every screen.
For each screen: check layout, spacing, colors, overlapping elements, text readability.

${instructions}" "$out" "Visual pass (full)" "$PUPPETEER_TOOLS"
}

run_visual_targeted() {
  local findings_file="$1"
  local out="$2"
  local findings
  findings=$(cat "$findings_file")
  local instructions
  instructions=$(report_instructions "Visual Verification")

  run_claude "You are a QA tester doing a VISUAL verification of issues found in a previous functional test.
Use Puppeteer tools. Take a screenshot of each flagged screen.

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

${instructions}" "$out" "Visual pass (targeted)" "$PUPPETEER_TOOLS"
}

# ── SMART MODE HELPERS ──
has_issues() {
  local file="$1"
  # Check for our sentinel value
  if grep -q "ZERO_ISSUES_FOUND" "$file" 2>/dev/null; then
    return 1  # no issues
  fi
  # Check for at least one finding header
  if grep -q "^### \[F-" "$file" 2>/dev/null; then
    return 0  # has issues
  fi
  # Ambiguous — assume issues to be safe
  echo "WARNING: Could not determine issue count from functional pass. Proceeding with visual verification."
  return 0
}

issue_count() {
  local count
  count=$(grep -c "^### \[F-" "$1" 2>/dev/null) || true
  echo "${count:-0}"
}

# ── MERGE (bash-only, no Claude call) ──
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
echo "Model: ${QA_MODEL}"
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
    echo "  APP_URL            - Override target URL (default: https://wimhof-method-app.vercel.app)"
    echo "  QA_FILE            - Override output file (default: QA-FINDINGS.md)"
    echo "  QA_TIMEOUT         - Timeout per pass in seconds (default: 600)"
    echo "  QA_MODEL           - Override Claude model (default: claude-sonnet-4-6)"
    echo "  QA_SKIP_PREFLIGHT  - Set to 1 to skip MCP availability check"
    exit 1
    ;;
esac
