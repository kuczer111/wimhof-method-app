# QA Findings

**Date:** 2026-03-06
**Tested URL:** https://wimhof-method-app.vercel.app
**Scope:** Onboarding flow (partial)

## Findings

### [F-01]: Profile Setup — "Save Profile" button and "Skip for Now" link cut off at bottom of viewport
- **Page:** /onboarding (Screen 6 — Profile Setup)
- **Severity:** Major
- **Description:** On the Profile Setup screen (the final onboarding step), the "Save Profile" button is partially clipped at the bottom of the viewport, showing only its top edge with no readable text. The "Skip for Now" link beneath it is completely invisible, rendered entirely below the viewport boundary.
- **Expected:** The "Save Profile" button and "Skip for Now" link should be fully visible and accessible. The content area should scroll naturally if it exceeds the viewport height.
- **Actual:** The onboarding container has a fixed height that does not accommodate all the content on this screen. The page does not scroll with mouse wheel or trackpad gestures. Users on shorter viewports cannot reach the submit button without resorting to workarounds (e.g., tabbing to the button). `scrollIntoView` via JS does work, confirming the content exists but is simply clipped by an `overflow: hidden` or similar constraint on a parent container.

### [F-02]: Profile Setup — No visible title or heading on the screen
- **Page:** /onboarding (Screen 6 — Profile Setup)
- **Severity:** Minor
- **Description:** Unlike all other onboarding screens which have a clear title (e.g., "Wim Hof Method", "Three Pillars", "What to Expect", "Safety First", "Your Starting Point"), the Profile Setup screen has no visible heading. It jumps straight into "Primary Goal" options.
- **Expected:** A title like "Set Up Your Profile" or similar to maintain consistency with the other onboarding screens.
- **Actual:** No heading is displayed. The screen begins directly with the "Primary Goal" label, which can feel abrupt.

### [F-03]: "Save Profile" button appears disabled/muted before all fields are selected
- **Page:** /onboarding (Screen 6 — Profile Setup)
- **Severity:** Cosmetic
- **Description:** Before selecting a Primary Goal, the "Save Profile" button is rendered in a very light, washed-out blue that looks nearly disabled. There is no tooltip, validation message, or visual cue indicating which field is missing. After all four categories are selected, the button becomes a more saturated blue.
- **Expected:** Either clearly style the button as disabled with a hint about what's missing, or keep the button visually active and show validation on click.
- **Actual:** The button looks almost disabled but has no explanation, which may confuse users into thinking it's broken.

### [F-04]: Three Pillars shown as vertical cards instead of a cycle diagram
- **Page:** /onboarding (Screen 2 — Three Pillars)
- **Severity:** Cosmetic
- **Description:** The spec describes the three pillars (Breathing, Cold Exposure, Mindset) as being shown "as a cycle." The current implementation renders them as three vertically stacked cards.
- **Expected:** A circular or triangular cycle diagram connecting the three pillars to convey their interconnected nature.
- **Actual:** Three separate cards in a vertical list. Functional and readable, but does not convey the cyclical relationship.

### [F-05]: Skip button on Screen 3 only advances one screen — does not actually skip ahead
- **Page:** /onboarding (Screen 3 — What to Expect)
- **Severity:** Minor
- **Description:** The "Skip" button appears starting on Screen 3 (What to Expect). Clicking it advances to Screen 4 (Safety First), which is the mandatory next screen. The Skip button does not skip multiple screens — it behaves identically to the "Next" button on this screen.
- **Expected:** If the Skip button is meant to jump past informational screens to the Safety acknowledgment, it should skip from Screen 3 directly to Screen 4 (which it does, but only because they're adjacent). If Skip is meant to be a shortcut past all non-mandatory screens, it should jump further ahead (e.g., to Screen 5 or 6 after Safety is already acknowledged).
- **Actual:** Skip on Screen 3 advances to Screen 4 — identical to clicking Next. The skip functionality is effectively a no-op on this screen.

### [F-06]: Progress dots count is 6, not 5
- **Page:** /onboarding (all screens)
- **Severity:** Cosmetic
- **Description:** The progress indicator at the top shows 6 dots. The spec describes 5 onboarding screens. The 6th dot corresponds to the Profile Setup form, which is an additional step not listed in the original 5-screen description.
- **Expected:** Either 5 dots (if Profile Setup is considered post-onboarding) or documentation should be updated to reflect 6 screens.
- **Actual:** 6 progress dots are displayed across all onboarding screens.

## Positive Observations

- Text is readable and well-sized on all screens
- Buttons are large, high-contrast, and easy to tap/click
- Nothing is cut off at the top (notch area) on Screens 1-5
- Safety screen (Screen 4) correctly cannot be skipped — no Skip button is shown
- Safety acknowledgment is mandatory before proceeding
- Post-onboarding lands on `/breathe` with a "Before You Begin" safety reminder modal — good reinforcement
- Bottom navigation bar is visible on the main app after onboarding completes
- Selected options on Profile Setup highlight clearly in blue

## Not Yet Tested
- Breathing session flow
- Cold timer
- Progress/analytics pages
- Settings page
- Program page
- Learn/education page
- Privacy policy page
