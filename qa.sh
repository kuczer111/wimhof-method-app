#!/bin/bash

# ── CONFIG ──
APP_URL="https://wimhof-method-app.vercel.app"
QA_FILE="QA-FINDINGS.md"
MODE="${1:-functional}"  # "functional" (default, cheap) or "visual" (screenshots)
# ─────────────

if [ "$MODE" = "visual" ]; then
  TOOL_HINT="Use Puppeteer tools (mcp__puppeteer). Take a screenshot at every screen."
  COST_NOTE="Visual mode — using screenshots (~1,500 tokens/step)"
else
  TOOL_HINT="Use Playwright tools (mcp__playwright). Use accessibility snapshots, NOT screenshots."
  COST_NOTE="Functional mode — using DOM/accessibility tree (~400 tokens/step)"
fi

echo "🧪 QA Runner — $COST_NOTE"
echo "📍 Testing: $APP_URL"
echo ""

CLAUDE_MODEL=claude-sonnet-4-6 claude --dangerously-skip-permissions --print "
You are a QA tester for a Wim Hof Method PWA at $APP_URL.
$TOOL_HINT

## Instructions

Test ALL of the following flows in order. For each screen:
- Check that all text is visible and readable
- Check that all buttons/links are tappable and lead to the right place
- Check for missing content, broken layouts, or error states
- Note any accessibility issues (missing labels, unclear navigation)

## Test Flows

### Flow 1: Onboarding ($APP_URL/onboarding)
1. Screen 1 (Hero) — verify intro text and Next button
2. Screen 2 (Three Pillars) — verify breathing/cold/mindset content, Skip button should appear
3. Screen 3 (Physical Expectations) — verify safety info
4. Screen 4 (Safety Acknowledgment) — MANDATORY, Skip should NOT work here. Click Acknowledge.
5. Screen 5 (Starting Point) — pick 'completely new'
6. Profile setup — fill in any options and complete

### Flow 2: Breathing Session ($APP_URL/breathe)
1. Config screen — verify preset cards (Beginner, Standard, Deep, Morning), round/breath/pace selectors
2. Select Beginner preset, start session
3. Power Breaths phase — verify breath counter, animation
4. Retention Hold phase — verify timer counting up, end button visible
5. End retention (click/tap the end button)
6. Recovery Breath phase — verify 15s countdown
7. Let it complete (or end early if possible)
8. Session Complete screen — verify stats, feeling selector, save button

### Flow 3: Cold Timer ($APP_URL/cold)
1. Verify target duration selector
2. Start timer — verify circular progress, elapsed time
3. Stop timer
4. Log form — verify duration, temperature input, type selector, rating
5. Save the session

### Flow 4: Progress ($APP_URL/progress)
1. Overview tab — verify stats cards (sessions, retention, streaks)
2. Breathing tab — verify session list and chart (may be empty)
3. Cold tab — verify cold stats and history

### Flow 5: Program ($APP_URL/program)
1. Verify calendar view
2. Verify today's session card
3. Check Start button works

### Flow 6: Learn ($APP_URL/learn)
1. Verify chapter list (8 chapters)
2. Open chapter 1 — verify content loads
3. Check if chapters 4-8 are gated (should require 7 days practice)

### Flow 7: Settings ($APP_URL/settings)
1. Verify all sections render (audio mode, breathing defaults, cold defaults, notifications, reduced motion, data export, privacy link)
2. Toggle a setting and verify it changes
3. Check privacy policy link

### Flow 8: Edge Cases
1. Navigate to a non-existent route (e.g., $APP_URL/nonexistent) — verify error handling
2. Go back to home ($APP_URL) — verify redirect to appropriate page

## Reporting

After ALL tests, write your findings to $QA_FILE using this format:

# QA Findings

**Date:** $(date +%Y-%m-%d)
**Tested URL:** $APP_URL
**Mode:** $MODE
**Scope:** Full test suite

## Summary
- Total screens tested: [count]
- Issues found: [count by severity]

## Findings

### [F-XX]: [Short title]
- **Page:** [URL or screen name]
- **Severity:** Critical / Major / Minor / Cosmetic
- **Description:** What is wrong
- **Expected:** What should happen
- **Actual:** What actually happens

## Passed
[List flows/screens that had no issues]

## Not Testable
[List anything that could not be tested and why]

Include EVERY issue, no matter how small. Be specific about element locations.
"

echo ""
echo "✅ QA complete. Results in $QA_FILE"
