#!/bin/bash

# ── CONFIG ──
APP_URL="https://wimhof-method-app.vercel.app"
QA_FILE="QA-FINDINGS.md"
FUNCTIONAL_FILE=$(mktemp /tmp/qa-functional-XXXXXX.md)
VISUAL_FILE=$(mktemp /tmp/qa-visual-XXXXXX.md)
MODE="${1:-smart}"  # "smart" (default), "functional", or "visual"
# ─────────────

TEST_PROMPT='You are a QA tester for a Wim Hof Method PWA at '"$APP_URL"'.

## Test Flows

### Flow 1: Onboarding ('"$APP_URL"'/onboarding)
1. Screen 1 (Hero) — verify intro text and Next button
2. Screen 2 (Three Pillars) — breathing/cold/mindset content, Skip button should appear
3. Screen 3 (Physical Expectations) — safety info
4. Screen 4 (Safety Acknowledgment) — MANDATORY, Skip should NOT work here. Click Acknowledge.
5. Screen 5 (Starting Point) — pick "completely new"
6. Profile setup — fill in any options and complete

### Flow 2: Breathing Session ('"$APP_URL"'/breathe)
1. Config screen — verify preset cards (Beginner, Standard, Deep, Morning), round/breath/pace selectors
2. Select Beginner preset, start session
3. Power Breaths phase — verify breath counter, animation
4. Retention Hold phase — verify timer counting up, end button visible
5. End retention
6. Recovery Breath phase — verify 15s countdown
7. Let it complete
8. Session Complete screen — verify stats, feeling selector, save button

### Flow 3: Cold Timer ('"$APP_URL"'/cold)
1. Verify target duration selector
2. Start timer — verify circular progress, elapsed time
3. Stop timer
4. Log form — verify duration, temperature input, type selector, rating
5. Save the session

### Flow 4: Progress ('"$APP_URL"'/progress)
1. Overview tab — verify stats cards
2. Breathing tab — verify session list and chart
3. Cold tab — verify cold stats and history

### Flow 5: Program ('"$APP_URL"'/program)
1. Verify calendar view
2. Verify today'"'"'s session card
3. Check Start button

### Flow 6: Learn ('"$APP_URL"'/learn)
1. Verify chapter list (8 chapters)
2. Open chapter 1 — verify content loads
3. Check if chapters 4-8 are gated

### Flow 7: Settings ('"$APP_URL"'/settings)
1. Verify all sections render
2. Toggle a setting
3. Check privacy policy link

### Flow 8: Edge Cases
1. Navigate to '"$APP_URL"'/nonexistent — verify error handling
2. Go back to '"$APP_URL"' — verify redirect'

# ── REPORT FORMAT ──
REPORT_FORMAT='Write findings to FILE_PLACEHOLDER using this format:

# QA Findings — MODE_PLACEHOLDER Pass

**Date:** '"$(date +%Y-%m-%d)"'
**Tested URL:** '"$APP_URL"'
**Mode:** MODE_PLACEHOLDER

## Findings

### [F-XX]: [Short title]
- **Page:** [URL or screen name]
- **Severity:** Critical / Major / Minor / Cosmetic
- **Description:** What is wrong
- **Expected:** What should happen
- **Actual:** What actually happens

## Passed
[List flows/screens that had no issues]

If there are ZERO issues, write "No issues found" under Findings.
Include EVERY issue no matter how small.'

run_functional() {
  echo "🔍 Pass 1: Functional test (DOM/accessibility tree)..."
  echo ""

  local report
  report=$(echo "$REPORT_FORMAT" | sed "s|FILE_PLACEHOLDER|$1|g" | sed "s|MODE_PLACEHOLDER|Functional|g")

  CLAUDE_MODEL=claude-sonnet-4-6 claude --dangerously-skip-permissions --print "
$TEST_PROMPT

## Instructions
Use Playwright tools (mcp__playwright). Use accessibility snapshots, NOT screenshots.
For each screen: check text is visible, buttons work, navigation is correct, no errors.

$report
"
}

run_visual() {
  local targets="$1"
  local output="$2"
  echo "📸 Pass 2: Visual test (screenshots) on flagged screens..."
  echo ""

  local report
  report=$(echo "$REPORT_FORMAT" | sed "s|FILE_PLACEHOLDER|$output|g" | sed "s|MODE_PLACEHOLDER|Visual|g")

  CLAUDE_MODEL=claude-sonnet-4-6 claude --dangerously-skip-permissions --print "
You are a QA tester doing a VISUAL verification of specific issues found in a previous functional test.
Use Puppeteer tools (mcp__puppeteer). Take a screenshot of each flagged screen.

## Issues to verify visually

$(cat "$targets")

## Instructions
For each issue listed above:
1. Navigate to the page mentioned
2. Take a screenshot
3. Confirm or dismiss the issue based on visual evidence
4. Check for additional visual problems: layout overflow, overlapping elements, cut-off text, color contrast, spacing issues

$report
"
}

merge_reports() {
  echo "📋 Merging reports..."
  CLAUDE_MODEL=claude-sonnet-4-6 claude --dangerously-skip-permissions --print "
Read the files $FUNCTIONAL_FILE and $VISUAL_FILE.

Merge them into a single QA report and write it to $QA_FILE using this format:

# QA Findings

**Date:** $(date +%Y-%m-%d)
**Tested URL:** $APP_URL
**Mode:** Smart (functional + visual verification)

## Summary
- Total issues: [count]
- Confirmed visually: [count]
- Functional only: [count]
- By severity: [Critical: X, Major: X, Minor: X, Cosmetic: X]

## Findings

### [F-XX]: [Short title]
- **Page:** [URL or screen name]
- **Severity:** Critical / Major / Minor / Cosmetic
- **Verified:** Functional only / Visually confirmed
- **Description:** What is wrong
- **Expected:** What should happen
- **Actual:** What actually happens

## Passed
[List flows/screens that had no issues in either pass]

Deduplicate issues. If visual pass dismissed a functional finding, mark it as 'Dismissed — visual check passed'.
"
}

# ── MAIN ──
case "$MODE" in
  functional)
    run_functional "$QA_FILE"
    echo "✅ Functional QA complete. Results in $QA_FILE"
    ;;
  visual)
    run_visual <(echo "Test ALL flows listed below with screenshots.

$TEST_PROMPT") "$QA_FILE"
    echo "✅ Visual QA complete. Results in $QA_FILE"
    ;;
  smart)
    # Pass 1: Cheap functional scan
    run_functional "$FUNCTIONAL_FILE"

    # Check if any issues were found
    if grep -q "No issues found" "$FUNCTIONAL_FILE" 2>/dev/null; then
      echo ""
      echo "✅ No issues found in functional pass. Skipping visual."
      cp "$FUNCTIONAL_FILE" "$QA_FILE"
    else
      ISSUE_COUNT=$(grep -c "^### \[F-" "$FUNCTIONAL_FILE" 2>/dev/null || echo "0")
      echo ""
      echo "⚠️  Found $ISSUE_COUNT issue(s). Running visual verification..."
      echo ""

      # Pass 2: Visual verification of flagged issues only
      run_visual "$FUNCTIONAL_FILE" "$VISUAL_FILE"

      # Pass 3: Merge reports
      merge_reports
    fi

    echo "✅ Smart QA complete. Results in $QA_FILE"
    ;;
  *)
    echo "Usage: ./qa.sh [smart|functional|visual]"
    exit 1
    ;;
esac

# Cleanup
rm -f "$FUNCTIONAL_FILE" "$VISUAL_FILE"
