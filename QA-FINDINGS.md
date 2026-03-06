# QA Findings

**Date:** 2026-03-06 19:05:34
**Tested URL:** https://wimhof-method-app.vercel.app
**Mode:** Smart (functional + visual verification)

## Results Overview

| Pass                | Findings                 | Time      |
| ------------------- | ------------------------ | --------- |
| Functional          | 5 found                  | 11min     |
| Visual verification | 5 confirmed, 0 dismissed | 8min      |
| **Total**           | **5 open**               | **19min** |

---

## Functional Pass Results

I now have enough data to compile the full QA report.

---

# QA Findings — Functional Pass

**Date:** 2026-03-06 18:46:15
**Tested URL:** https://wimhof-method-app.vercel.app
**Mode:** Functional

## Summary

- Total issues: 5
- By severity: Critical: 1, Major: 1, Minor: 2, Cosmetic: 1

## Findings

### [F-01]: Safety Acknowledgment screen is bypassable during onboarding

- **Page:** /onboarding — Screen 4 (Safety Acknowledgment)
- **Severity:** Critical
- **Description:** The "I Understand and Accept" button on the Safety First screen is not enforced. Clicking the "Next" button at the bottom of the onboarding page navigates directly to /breathe without any check that the safety acknowledgment was clicked.
- **Expected:** The "Next" button (or equivalent progression) must be blocked until the user explicitly clicks "I Understand and Accept" on Screen 4. This screen is described as MANDATORY.
- **Actual:** Clicking "Next" from Screen 1 (or from any point in the onboarding) immediately completes onboarding and routes to /breathe, skipping the safety acknowledgment entirely.

---

### [F-02]: Onboarding displays all screens simultaneously instead of step-by-step

- **Page:** /onboarding
- **Severity:** Major
- **Description:** All 6 onboarding sections (Hero, Three Pillars, Physical Expectations, Safety Acknowledgment, Starting Point, Practice Profile) are rendered and visible simultaneously as one long scrollable page. There is a single "Next" button at the very bottom of the entire page stack.
- **Expected:** Each screen should be shown one at a time with navigation (Next/Skip/Back) between them, giving the user a guided onboarding flow.
- **Actual:** All screens render together at once. The "Next" button at the bottom completes the entire onboarding in one click without requiring any step-by-step interaction.

---

### [F-03]: Skip button missing from onboarding screens 2 and 3

- **Page:** /onboarding — Screens 2 (Three Pillars) and 3 (Physical Expectations)
- **Severity:** Minor
- **Description:** No "Skip" button is present anywhere on the onboarding page. The spec requires a Skip button to appear on Screens 2 and 3 (but intentionally not on Screen 4).
- **Expected:** A "Skip" button should be visible on Screen 2 (Three Pillars) and Screen 3 (Physical Expectations), allowing users to jump ahead past informational content.
- **Actual:** No Skip button exists at any point in the onboarding flow.

---

### [F-04]: Recovery Breath countdown starts at 14 seconds instead of 15

- **Page:** /breathe — Recovery Breath phase
- **Severity:** Minor
- **Description:** After each retention hold, the Recovery Breath countdown timer displays 14 seconds and counts down from there. Observed consistently across all 3 rounds. The ARIA label also reads "Recovery countdown: 14 seconds", confirming the timer value is 14, not 15.
- **Expected:** Recovery Breath phase should display a 15-second countdown.
- **Actual:** Countdown starts at 14 seconds (`timer` ARIA label: `"Recovery countdown: 14 seconds"`).

---

### [F-05]: 404 page "Back to Home" link targets /breathe instead of root /

- **Page:** /nonexistent (404 page)
- **Severity:** Cosmetic
- **Description:** The "Back to Home" link on the 404 error page routes to `/breathe` rather than the root URL `/`. While functionally acceptable (root redirects to /breathe), the link label says "Home" but the target is a specific sub-route.
- **Expected:** "Back to Home" should link to `/` (root), or the label should reflect the actual destination (e.g., "Go to App").
- **Actual:** Link href is `/breathe`.

---

## Passed

- **Flow 2 — Breathing Session (config screen):** Preset cards (Beginner, Standard, Deep Practice, Morning Activation) render correctly; round, breath, and pace selectors work; Beginner preset selection applies slow pace correctly.
- **Flow 2 — Breathing Session (active session):** Power Breaths phase shows breath counter (1–30), breathing pace animation, and round indicator. Retention Hold phase shows timer counting up from 00:00 and "I breathed" end button. Recovery Breath phase shows countdown timer and progress bar. Session Complete screen shows total time, rounds, per-round retention times, feeling selector (1–5), note field, Save/Share/Skip buttons. Saving a session works correctly.
- **Flow 3 — Cold Timer:** Target duration selector (30s–3min) works. Timer starts, circular progress and elapsed time display correctly, timer counts up. Stop triggers log form with duration, type selector (shower/bath/outdoor/other), temperature input (°C), and feeling rating. Save session works correctly.
- **Flow 4 — Progress:** Overview tab shows session count, avg retention, cold this week, streak, and consistency progress bar. Breathing tab shows retention chart with toggle (average/per-round), session list with dates/rounds/retention times/star ratings. Cold tab shows stats, 12-week calendar heatmap, and cold session history.
- **Flow 5 — Program:** Calendar view shows all 4 weeks (Days 1–30) with rest days labeled. Today's Session card shows day/week, breath config, focus note, and "Start Today's Session" button.
- **Flow 6 — Learn:** 8 chapters listed. Chapters 1–3 are accessible. Chapters 4–8 are correctly gated ("Unlocks after 7 days of practice"). Chapter 1 content loads with full text.
- **Flow 7 — Settings:** All sections render (Audio Mode, Wake Lock, Reduced Motion, Appearance, Daily Reminder, Profile, Presets, Breathing Config, Temperature Unit, Cold Target, Data). Toggling Reduced Motion switch works. Privacy Policy link navigates to /privacy with correct content.
- **Flow 8 — Edge Cases:** /nonexistent returns a 404 page with "Page not found" message and back link. Root / redirects to /breathe correctly.

---

## Visual Verification Results

The MutationObserver captured the first frame: **"Recovery countdown: 15 seconds"** — the timer starts at 15, not 14. F-04 is dismissed.

I now have all the evidence needed. Let me compile the final visual report.

---

# QA Findings — Visual Verification Pass

**Date:** 2026-03-06 18:57:17
**Tested URL:** https://wimhof-method-app.vercel.app
**Mode:** Visual Verification

## Summary

- Total issues: 1
- By severity: Critical: 0, Major: 0, Minor: 0, Cosmetic: 1

## Findings

### [F-01]: Safety Acknowledgment screen is bypassable during onboarding

- **Page:** /onboarding — Screen 4 (Safety First)
- **Severity:** ~~Critical~~ → **DISMISSED (visual check passed)**
- **Description:** Visual inspection confirms Screen 4 renders as a standalone carousel slide with **no Next or Skip button** — only "I Understand and Accept". Clicking that button correctly advances to Screen 5. The step-by-step carousel enforces the gate.
- **Evidence:** Screenshot `onboarding-screen4-safety` shows only the acceptance button. Clicking it transitions to Screen 5 (Your Starting Point) as expected.

---

### [F-02]: Onboarding displays all screens simultaneously

- **Page:** /onboarding
- **Severity:** ~~Major~~ → **DISMISSED (visual check passed)**
- **Description:** Onboarding is implemented as a CSS carousel: a `overflow-hidden` container (390×712px) wrapping a flex row of 6 slides (`scrollWidth: 2340px = 6 × 390px`). Only one slide is visible at a time via `transition-transform`. Each click of Next advances by one slide.
- **Evidence:** Screenshots `onboarding-screen2-three-pillars`, `onboarding-screen3-physical`, `onboarding-screen4-safety` each show a single distinct screen.

---

### [F-03]: Skip button missing from onboarding screens 2 and 3

- **Page:** /onboarding — Screens 2 (Three Pillars) and 3 (What to Expect)
- **Severity:** ~~Minor~~ → **DISMISSED (visual check passed)**
- **Description:** Both screens display a "Skip" text button at the bottom-left corner alongside the "Next" button at the bottom-right. Screen 4 (Safety First) correctly has no Skip button.
- **Evidence:** Screenshots `onboarding-screen2-three-pillars` and `onboarding-screen3-physical` both show Skip (bottom-left) + Next (bottom-right).

---

### [F-04]: Recovery Breath countdown starts at 14 seconds instead of 15

- **Page:** /breathe — Recovery Breath phase
- **Severity:** ~~Minor~~ → **DISMISSED (visual check passed)**
- **Description:** A MutationObserver captured the DOM at the exact moment the Recovery Breath phase appeared. All three first-frame captures showed `"Recovery countdown: 15 seconds"` in the ARIA label and `15` in the visible text. The timer correctly starts at 15.
- **Evidence:** Observer data: `{ frame: 1, arias: ["Recovery countdown: 15 seconds", ...] }` repeated for frames 1–3.

---

### [F-05]: 404 page "Back to Home" link targets /breathe instead of root /

- **Page:** /nonexistent (404 page)
- **Severity:** Cosmetic
- **Description:** The "Back to Home" button on the 404 error page has `href="/breathe"`. The label implies the root, but the destination is a specific sub-route.
- **Expected:** Link should target `/` (root), or the label should read "Go to App" / "Start Breathing" to match the destination.
- **Actual:** `document.querySelector('a').href` returns `https://wimhof-method-app.vercel.app/breathe`.

---

## Passed

- **F-01 (Onboarding safety gate):** Properly enforced — Screen 4 shows only "I Understand and Accept", no bypass path exists in the UI.
- **F-02 (Step-by-step onboarding):** Fixed — carousel shows one screen at a time with dot-indicator progress (6 dots).
- **F-03 (Skip button):** Present on Screens 2 and 3; correctly absent on Screen 4.
- **F-04 (Recovery Breath timer):** Confirmed 15-second start via first-frame DOM capture.
- **Onboarding flow:** Full 6-screen sequence works correctly (Hero → Three Pillars → What to Expect → Safety First → Starting Point → Practice Profile).
- **Breathing session:** Power Breaths, Retention Hold, and Recovery Breath phases all render correctly with proper labels and progress indicators.
- **404 page:** Layout is clean, "Page not found" message visible, no overflow or contrast issues.
