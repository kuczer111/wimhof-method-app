# QA Findings

**Date:** 2026-03-06
**Tested URL:** https://wimhof-method-app.vercel.app
**Mode:** Smart (functional + visual verification)

---

## Functional Pass Results

Now I have enough data to compile the full report. Let me write it up.

---

# QA Findings — Functional Pass

**Date:** 2026-03-06
**Tested URL:** https://wimhof-method-app.vercel.app
**Mode:** Functional

## Summary

- Total issues: 4
- By severity: Critical: 0, Major: 1, Minor: 3, Cosmetic: 0

---

## Findings

### [F-01]: Onboarding Displays All Screens Simultaneously — Safety Acknowledgment Is Bypassable

- **Page:** `/onboarding`
- **Severity:** Major
- **Description:** All six onboarding sections (Hero, Three Pillars, Physical Expectations, Safety Acknowledgment, Starting Point, Profile Setup) are rendered simultaneously on a single scrollable page. A global "Next" button at the bottom of the page completes the onboarding and navigates to `/breathe`. A user can skip directly to "Next" without ever clicking "I Understand and Accept" on the Safety Acknowledgment screen (Screen 4).
- **Expected:** Each screen should be shown as a discrete, sequential step. Screen 4 (Safety Acknowledgment) must be mandatory — the onboarding flow should not permit progression past it until the user explicitly clicks "I Understand and Accept".
- **Actual:** All screens are visible simultaneously. The safety acknowledgment button is present but not enforced. Clicking the global "Next" button at the bottom completes the onboarding regardless of whether any intermediate screens were interacted with.

---

### [F-02]: No "Skip" Button on Onboarding Screen 2 (Three Pillars) or Screen 3 (Physical Expectations)

- **Page:** `/onboarding`
- **Severity:** Minor
- **Description:** Onboarding Screen 2 (Three Pillars — Breathing, Cold Exposure, Mindset) and Screen 3 (Physical Expectations — "What to Expect") have no "Skip" button. The only skip affordance in the entire onboarding is "Skip for Now" inside the Profile Setup section.
- **Expected:** A "Skip" button should appear on the informational screens (2 and 3), allowing users to advance past non-mandatory content. Skip should NOT appear on Screen 4 (Safety Acknowledgment), which is correct — but the absence of Skip on screens 2–3 means there is no consistent navigation pattern.
- **Actual:** No "Skip" button rendered on Screen 2 or Screen 3.

---

### [F-03]: 404 Page Missing Bottom Navigation Bar

- **Page:** `/nonexistent` (404 error page)
- **Severity:** Minor
- **Description:** The custom 404 page displays a "404" heading, "Page not found" text, and a "Back to Home" link pointing to `/breathe`. However, the bottom navigation bar present on every other page of the app is absent from this page.
- **Expected:** The 404 page should include the bottom navigation bar or at minimum consistent minimal branding, in addition to the "Back to Home" link, so users can navigate to any section of the app — not just the home page.
- **Actual:** Only the "Back to Home" link is shown. No navigation bar, no other navigation options.

---

### [F-04]: Retention Hold "I breathed" Button Does Not Respond to Single Click

- **Page:** `/breathe` — Retention Hold phase
- **Severity:** Minor
- **Description:** The button to end the breath-hold phase is labelled "End breath hold. Hold for half a second or double-tap to end." A standard single mouse click does not trigger the action — the timer continues running and the phase does not end. Only a double-click (or a sustained pointer-down ≥ 500 ms) activates it.
- **Expected:** While requiring a deliberate gesture to prevent accidental activation on touchscreens is understandable, in a desktop browser environment the button should respond to a standard single click, or provide a clearly visible alternative single-click affordance (e.g., a separate "End Hold" button).
- **Actual:** Single left-click produces no visible effect. The button must be double-clicked to end the hold. This is unintuitive on desktop and may cause confusion or accessibility issues for keyboard/switch users.

---

## Passed

- **Flow 2 — Breathing Session:** Config screen rendered correctly with all four preset cards (Beginner, Standard, Deep Practice, Morning Activation), round/breath/pace selectors, per-round breath counts, retention mode, and mindset prompts. Power Breaths phase showed breath counter and animation correctly. Retention Hold showed timer counting up and end button. Recovery Breath showed 15 s countdown with progress bar. Session Complete screen showed total time, round count, per-round retention times (with PB marker), feeling selector (1–5), note field, and Save/Share/Skip buttons. Session saved successfully.
- **Flow 3 — Cold Timer:** Target duration selector rendered (30 s, 1 min, 1.5 min, 2 min, 3 min). Timer ran with elapsed time updating. Stop button triggered log form with duration, type selector (shower/bath/outdoor/other), temperature input (°C), feeling rating, and Save button. Session saved successfully.
- **Flow 4 — Progress:** Overview tab displayed all stats cards (This Week, Avg Retention, Cold This Week, Breathing Streak, Cold Streak, Consistency). Breathing tab showed retention chart (2 sessions, average and PR displayed) and session list with star ratings (★★★★☆). Cold tab showed stats, 12-week heatmap with today's date (2026-03-06) as the final cell, and session history.
- **Flow 5 — Program:** 30-day calendar rendered across 4 weeks. Today's session card (Day 1) showed correct round/breath count and motivational prompt. "Start Today's Session" button launched a breathing session correctly.
- **Flow 6 — Learn:** All 8 chapters listed. Chapters 1–3 are accessible buttons. Chapters 4–8 are gated with "Unlocks after 7 days of practice (1/7)" messaging. Chapter 1 content loaded fully with rich text content.
- **Flow 7 — Settings:** All sections rendered (Audio Mode, Screen Wake Lock, Reduced Motion, Appearance, Daily Reminder, Practice Profile, Custom Presets, Default Breathing Config, Temperature Unit, Default Cold Target, Data, Privacy Policy, version). Daily Reminder toggle responded correctly (surfaced browser notification blocked message). Privacy Policy link navigated to `/privacy` with full, correct content.
- **Flow 8 — Edge Cases:** `/nonexistent` returned a custom 404 page with correct heading, message, and working "Back to Home" link to `/breathe`. Root URL `/` briefly showed "Loading…" then redirected to `/breathe` as expected.

---

## Visual Verification Results

Single click confirmed not working — the timer continued from 00:33 to 00:38, still on Retention Hold. F-04 confirmed. I now have all the evidence needed for the report.

---

# QA Findings — Visual Verification Pass

**Date:** 2026-03-06
**Tested URL:** https://wimhof-method-app.vercel.app
**Mode:** Visual Verification

## Summary

- Total issues: 2
- By severity: Critical: 0, Major: 0, Minor: 2, Cosmetic: 0

## Findings

### [F-01]: 404 Page Missing Bottom Navigation Bar

- **Page:** `/nonexistent`
- **Severity:** Minor
- **Description:** The 404 page renders only a large blue "404" heading, a grey "Page not found" subtitle, and a centred "Back to Home" button. The bottom navigation bar (Breathe / Program / Cold / Progress / Learn / Settings) present on every other page is absent.
- **Expected:** The bottom navigation bar should be present so users can navigate to any section of the app without being limited to the single "Back to Home" affordance.
- **Actual:** No navigation bar rendered. The page is completely bare outside the three centred elements. Screenshot confirms. _(Originally reported as F-03.)_

---

### [F-02]: Retention Hold "I breathed" Button Does Not Respond to Single Click

- **Page:** `/breathe` — Retention Hold phase
- **Severity:** Minor
- **Description:** The "I breathed" button (aria-label: _"End breath hold. Hold for half a second or double-tap to end."_) does not advance the phase on a standard single click. The timer continued counting up after a Puppeteer click was fired (timer jumped from 00:33 → 00:38 with no phase change). Additionally, the required gesture is communicated only via the `aria-label` attribute — there is no visible on-screen instruction explaining that a hold or double-tap is needed; to a sighted user the button appears non-functional.
- **Expected:** Either respond to a single click on desktop, or display a visible hint adjacent to the button (e.g. "Hold to end" / "Double-tap to end") so users understand the required interaction.
- **Actual:** Single click produces no visible effect. Timer continues. No on-screen gesture instruction is present. _(Originally reported as F-04.)_

---

## Passed

- **F-01 (original) — Onboarding all screens simultaneously / safety bypassable:** DISMISSED (visual check passed). The onboarding is now a proper step-by-step carousel (one screen visible at a time, overflow-hidden). Screen 4 (Safety First) presents only "I Understand and Accept" with no "Next" button in the DOM or viewport; progression past it requires explicit acknowledgment.
- **F-02 (original) — No Skip button on screens 2–3:** DISMISSED (visual check passed). Both screen 2 (Three Pillars) and screen 3 (What to Expect / Physical Expectations) render a "Skip" link at the bottom-left alongside the "Next" button at the bottom-right.
- **Breathing session config screen:** All four preset cards, round/breath/pace selectors, Retention Mode, Mindset Prompts, and Start Session button rendered correctly with the bottom nav bar present.
- **Retention Hold phase (general layout):** Timer display, "RETENTION HOLD" label, and "I breathed" button are clearly visible with no layout overflow, cut-off text, or contrast issues.
- **404 page (content):** "404" heading, "Page not found" text, and "Back to Home" button all render without visual defects. Text is legible, contrast is adequate.
