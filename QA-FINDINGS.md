# QA Findings

**Date:** 2026-03-06
**Tested URL:** https://wimhof-method-app.vercel.app
**Mode:** Smart (functional + visual verification)

---

## Functional Pass Results

All flows tested. Compiling the full QA report.

---

# QA Findings — Functional Pass

**Date:** 2026-03-06
**Tested URL:** https://wimhof-method-app.vercel.app
**Mode:** Functional

## Summary

- Total issues: 8
- By severity: Critical: 1, Major: 2, Minor: 5, Cosmetic: 0

## Findings

### [F-01]: Safety Acknowledgment bypassed by "Next" button on Onboarding

- **Page:** /onboarding
- **Severity:** Critical
- **Description:** The "Next" button at the bottom of the onboarding page is not gated behind the "I Understand and Accept" safety acknowledgment. Clicking "Next" without ever clicking "I Understand and Accept" successfully completes onboarding and navigates to `/breathe`.
- **Expected:** The "Next" button (or forward navigation) should be blocked until the user explicitly clicks "I Understand and Accept" on the Safety Acknowledgment screen. This screen is described as MANDATORY.
- **Actual:** "Next" button is always enabled and clickable regardless of whether the safety acknowledgment has been clicked. The acknowledgment is effectively optional.

---

### [F-02]: Onboarding renders all screens simultaneously instead of step-by-step

- **Page:** /onboarding
- **Severity:** Major
- **Description:** All six onboarding sections (Hero, Three Pillars, Physical Expectations, Safety Acknowledgment, Starting Point, Practice Profile) are rendered simultaneously in a single scrollable page. There is no step-by-step wizard with individual screens, no step counter/indicator, and no per-screen navigation.
- **Expected:** A paginated wizard experience where Screen 1 shows, user clicks Next to advance to Screen 2, etc.
- **Actual:** All content is visible at once in one long page with a single "Next" button at the very bottom that sends the user to `/breathe`.

---

### [F-03]: "Skip" button absent from Three Pillars screen (Screen 2)

- **Page:** /onboarding — Three Pillars section
- **Severity:** Major
- **Description:** The Three Pillars section (Breathing, Cold Exposure, Mindset) contains no "Skip" button. The entire onboarding page has no per-section skip controls at all.
- **Expected:** A "Skip" button should appear on Screen 2 (Three Pillars) per the onboarding flow specification.
- **Actual:** No "Skip" button exists anywhere on the onboarding page except "Skip for Now" inside the Practice Profile section at the very bottom.

---

### [F-04]: Recovery breath countdown starts at 14 seconds, not 15

- **Page:** /breathe — Recovery Breath phase
- **Severity:** Minor
- **Description:** After ending a retention hold, the recovery breath countdown timer reads 14 seconds (aria-label: "Recovery countdown: 14 seconds"). Observed consistently across all three rounds of a session.
- **Expected:** 15-second recovery breath countdown.
- **Actual:** 14-second recovery breath countdown.

---

### [F-05]: Cold tab "Total minutes" stat shows "0" for sub-minute sessions

- **Page:** /progress — Cold tab
- **Severity:** Minor
- **Description:** The Cold Exposure Stats card shows "0" for "Total minutes" after logging a 15-second cold session. The value is silently truncated/rounded down to zero with no indication that sub-minute time was recorded.
- **Expected:** Display should show a non-zero value (e.g., "< 1 min", "0.25", or "15s") for sessions shorter than one minute, rather than showing "0" which falsely implies no time was logged.
- **Actual:** "0 Total minutes" displayed.

---

### [F-06]: Today's date absent from 12-week calendar heatmap on Cold tab

- **Page:** /progress — Cold tab
- **Severity:** Minor
- **Description:** The "Last 12 weeks" heatmap calendar on the Cold tab ends on 2026-03-05 (yesterday). Today's date, 2026-03-06, is not rendered in the calendar despite a cold session having been logged today.
- **Expected:** The calendar should include today's date and reflect today's completed session.
- **Actual:** The last date shown is 2026-03-05; today (2026-03-06) and its session are absent from the heatmap.

---

### [F-07]: 404 error page provides no navigation path back to the app

- **Page:** /nonexistent (404)
- **Severity:** Minor
- **Description:** The 404 page renders "404 — This page could not be found." but contains no navigation links, no bottom nav bar, and no "Go Home" or "Back to App" button. A user who lands on a broken URL has no in-page way to return to the application.
- **Expected:** A link or button to return to the home/main page of the app (e.g., `/breathe` or `/`).
- **Actual:** Only the 404 heading text is shown. No navigation elements are present.

---

### [F-08]: Breathing progress chart not present/accessible

- **Page:** /progress — Breathing tab
- **Severity:** Minor
- **Description:** The Breathing tab shows the session list entry correctly, but no chart element (graph of retention times over time, or similar) is present in the accessibility tree. Only the single session entry is rendered.
- **Expected:** A chart visualising breathing session data (e.g., retention times) should appear on the Breathing tab.
- **Actual:** No chart or graph element is detectable via the accessibility snapshot. This may indicate the chart is missing, or that it is rendered as a non-accessible `<canvas>` element with no ARIA role or label.

---

## Passed

- **Flow 2 — Breathing Session:** Config screen (all 4 presets present, rounds/breaths/pace selectors functional), Beginner preset selection, session start, Power Breaths phase (breath counter and animation present), Retention Hold (timer counts up, end button functional via double-tap), Recovery Breath phase, Session Complete screen (stats, retention times per round, feeling selector 1–5, note field, Save Session button all functional).
- **Flow 3 — Cold Timer:** Target duration selector (5 options), timer starts with elapsed time and target displayed, Stop button functional, log form (duration, temperature °C input, type selector shower/bath/outdoor/other, 1–5 rating), Save Session functional.
- **Flow 4 — Progress Overview tab:** Stats cards (This Week, Avg Retention, Cold This Week, Breathing Streak, Cold Streak, Consistency with progress bar) all render with correct data.
- **Flow 4 — Progress Breathing tab:** Session list entry renders correctly with date, rounds, retention times, total time, and feeling rating.
- **Flow 5 — Program:** Calendar view (4-week breakdown, 30 days), today's session card (Day 1 details, breaths, focus note), and Start Today's Session button all functional after program is initiated.
- **Flow 6 — Learn:** All 8 chapters listed; chapters 1–3 are accessible (buttons); chapters 4–8 are correctly gated ("Unlocks after 7 days of practice"); Chapter 1 content loads fully with complete text.
- **Flow 7 — Settings:** All sections render (Audio Mode, Screen Wake Lock, Reduced Motion, Appearance, Daily Reminder, Practice Profile, Custom Presets, Default Breathing Config, Temperature Unit, Default Cold Target, Data export/clear); switch toggle functions correctly; Privacy Policy link navigates to `/privacy` with full content.
- **Flow 8 — Root URL redirect:** Navigating to `https://wimhof-method-app.vercel.app` shows a brief "Loading…" screen then redirects to `/breathe` as expected.

---

## Visual Verification Results

The "\*\*\*\*" are literal asterisks in the HTML, not star symbols. That's a new cosmetic find. I now have enough evidence for all 8 issues. Let me compile the final report.

---

# QA Findings — Visual Verification Pass

**Date:** 2026-03-06
**Tested URL:** https://wimhof-method-app.vercel.app
**Mode:** Visual Verification

## Summary

- Total issues: 6
- By severity: Critical: 0, Major: 1, Minor: 4, Cosmetic: 1

## Findings

### [F-01]: DISMISSED (visual check passed) — Safety Acknowledgment bypass

- **Page:** /onboarding — Safety First screen (Screen 4)
- **Severity:** ~~Critical~~ → **DISMISSED**
- **Description:** Visually, on Screen 4 (Safety First), the "Next" button at the bottom navigation is **completely absent**. The only interactive element is the "I Understand and Accept" button. The user has no path forward without clicking it. DOM inspection confirmed: `disabled` state is not needed because the Next button is not rendered at all on this screen. The functional report's claim that Next bypasses safety acknowledgment is **not reproducible visually**.

---

### [F-02]: DISMISSED (visual check passed) — Onboarding renders all screens simultaneously

- **Page:** /onboarding
- **Severity:** ~~Major~~ → **DISMISSED**
- **Description:** The onboarding is a proper 6-step paginated wizard. Each screen is displayed one at a time with a 6-dot step indicator at the top reflecting the current position. A CSS `translateX` slider advances through screens. All 6 screens (Hero → Three Pillars → What to Expect → Safety First → Starting Point → Practice Profile) were navigated sequentially with no simultaneous rendering visible.

---

### [F-03]: No "Skip" button on Three Pillars screen (Screen 2)

- **Page:** /onboarding — Three Pillars screen
- **Severity:** Major
- **Description:** Screen 2 (Three Pillars) has no Skip button. Screens 3, 5, and 6 all have a "Skip" control in the bottom-left navigation area, but Screen 2 is the only step-content screen without one.
- **Expected:** A "Skip" button should be present on Screen 2 per the onboarding flow spec.
- **Actual:** No Skip button on Screen 2. Only a "Next" button in the bottom-right corner.

---

### [F-04]: DISMISSED (visual check passed) — Recovery breath countdown starts at 14 seconds

- **Page:** /breathe — Recovery Breath phase
- **Severity:** ~~Minor~~ → **DISMISSED**
- **Description:** A MutationObserver was attached to capture the very first rendered value of the recovery countdown timer. The first value recorded was `"15"` with `aria-label="Recovery countdown: 15 seconds"`. The countdown correctly starts at 15 seconds and counts down from there.

---

### [F-05]: Cold tab "Total minutes" stat shows "0" for sub-minute sessions

- **Page:** /progress — Cold tab
- **Severity:** Minor
- **Description:** The Cold Exposure Stats card shows "0" for "Total minutes" after a 15-second cold session was logged. The session entry in the list below correctly shows "15s", but the summary stat is silently truncated to zero.
- **Expected:** A non-zero indicator (e.g., `< 1 min`, `0.25`, or `15s`) for sessions shorter than one minute.
- **Actual:** "0 Total minutes" — visually implies no time was ever logged, contradicting the visible session entry.

---

### [F-06]: Today's date (2026-03-06) absent from 12-week calendar heatmap

- **Page:** /progress — Cold tab
- **Severity:** Minor
- **Description:** The "Last 12 weeks" heatmap calendar contains exactly 84 cells. DOM inspection of `title` attributes confirms the last cell is dated `"2026-03-05"`. Today's date (`2026-03-06`) is not rendered at all. The cold session logged today is visible in the session list below but produces no highlighted cell because today is not part of the calendar's date range.
- **Expected:** The calendar should include today's date and highlight it to reflect the completed session.
- **Actual:** Calendar ends on 2026-03-05; today is entirely absent. The heatmap shows all 84 cells in the same gray (inactive) colour.

---

### [F-07]: 404 page provides no navigation path back to the app

- **Page:** /nonexistent (404)
- **Severity:** Minor
- **Description:** The 404 page renders only the default Next.js error — a "404" heading on the left separated by a vertical rule from "This page could not be found." on the right. The page is centered on a fully white viewport with no nav bar, no links, and no buttons of any kind.
- **Expected:** A link or button to return to the main app (e.g., `/breathe` or `/`).
- **Actual:** Bare Next.js 404 text only. Zero navigation affordance.

---

### [F-08]: No breathing progress chart on Breathing tab

- **Page:** /progress — Breathing tab
- **Severity:** Minor
- **Description:** The Breathing tab displays only the session list (date, round count, per-round retention tags, total time, feeling rating). No chart or graph element is present. The entire tab content above the session card is empty white space.
- **Expected:** A chart visualising retention times over sessions should appear above the session list.
- **Actual:** No chart rendered. Only the single session entry card is visible.

---

### [F-09]: Feeling rating displayed as asterisks instead of star symbols

- **Page:** /progress — Breathing tab, session card
- **Severity:** Cosmetic
- **Description:** The feeling rating in the breathing session card is rendered using ASCII asterisk characters (`****`) rather than star symbols (★). DOM inspection confirms the element HTML is literally `<span aria-label="Feeling rating: 4 out of 5">****</span>`. At `text-lg` size, asterisks render as small, ambiguous glyphs that do not clearly communicate a star rating to users.
- **Expected:** Star characters (★★★★☆) or equivalent visual star icons.
- **Actual:** Four asterisk characters (`****`) that render as small dots/crosses, visually unclear as a rating display.

---

## Passed

- **F-01 (Safety bypass):** DISMISSED — Next button is absent on the Safety screen; user must click "I Understand and Accept" to advance.
- **F-02 (All screens at once):** DISMISSED — Proper 6-step paginated wizard with dot indicators confirmed.
- **F-04 (Recovery breath starts at 14s):** DISMISSED — MutationObserver captured first rendered value as `15` with `aria-label="Recovery countdown: 15 seconds"`.
- **Onboarding Screens 1, 3, 4, 5, 6:** All render correctly with proper layout, readable text, and functional controls.
- **Progress Overview tab:** Stats cards (This Week, Avg Retention, Cold This Week, Breathing Streak, Cold Streak, Consistency) all render with correct data.
- **404 page layout:** No overflow, no cut-off text, no contrast issues — the only problem is the missing navigation (F-07).
- **Cold tab session list entry:** Date, duration, target, temperature, and rating all display correctly.
- **Breathing tab session entry:** Date, round count, per-round retention times, total duration, and feeling rating label all present and correct (rating display style flagged separately as F-09).
