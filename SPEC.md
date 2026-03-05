# Wim Hof Method App — v2 Specification
### Production Features (Refactoring v1 into a public-ready app)

---

## Context

v1 is a working PWA with: breathing session engine (power breaths, retention hold, recovery breath), cold shower timer with logging, session history with retention charts, cold stats with streak/heatmap, settings page, presets, safety screens, dark mode, and audio tones via Web Audio API. All data is in localStorage. Stack: Next.js 14, TypeScript, Tailwind CSS, Recharts, PWA via next-pwa.

v2 refactors and extends v1 — no full rewrite. Existing components, storage layer, and routing are the foundation.

---

## Refactoring Principles

- Migrate localStorage to IndexedDB (via idb or Dexie) for scalability — keep the existing `lib/storage.ts` API surface but swap the backend
- Externalize all user-facing strings into a `lib/i18n.ts` constants file (English only for now, structured for future translation)
- Extract shared UI patterns (OptionButton, formatTime, formatDuration) into reusable utilities — these are duplicated across breathe, cold, settings, and progress pages
- Split large page components into smaller focused components where they exceed ~200 lines

---

## Module 1: Onboarding Flow

### 1.1 Welcome Screens
A swipeable 5-screen welcome flow at `app/onboarding/page.tsx`:
- Screen 1: Hero — what the method is in one sentence + visual
- Screen 2: Three pillars shown as a visual cycle (breathing, cold, mindset)
- Screen 3: What to expect physically (tingling, lightheadedness — normalize it)
- Screen 4: Safety acknowledgment — redesigned from the current text-heavy `SafetyOnboarding.tsx` into a cleaner, visual format. Still mandatory.
- Screen 5: Starting point picker — "I'm completely new" vs "I know the method"

Skippable after screen 2 (except screen 4 which remains mandatory). On completion, sets `onboardingComplete` and `safetyAcknowledged` in preferences. The current `app/page.tsx` redirect logic should route to onboarding if `onboardingComplete` is false, otherwise to `/breathe`.

### 1.2 First Session Guided Mode
A wrapper around the existing `SessionRunner` that activates once (tracked via a `firstSessionComplete` flag in preferences):
- Before power breaths: overlay with brief explanation text
- After round 1: mid-session pause with "How did that feel?" prompt + explanation of what happened physically
- After full session: enhanced debrief on `SessionComplete` screen explaining retention times and what they mean

### 1.3 Practice Profile Setup
Added to onboarding (after screen 5) or accessible from settings:
- Primary goal: stress reduction / athletic performance / immune health / curiosity / cold focus
- Available time per day: 10 min / 20 min / 30+ min
- Experience level: complete beginner / some experience / regular practitioner
- Preferred session time: morning / midday / evening

Stored in `UserPreferences`. Used to set default session config and recommend presets.

---

## Module 2: Enhanced Breathing Session

### 2.1 Per-Round Breath Count
Extend `SessionConfig` to support `breathsPerRound: number[]` (e.g., [30, 40, 40]) in addition to the current single number. `PowerBreaths` component reads the count for the current round.

### 2.2 Mindset Prompts During Retention
Optional text prompt displayed during `RetentionHold` phase. Configurable per round in session config. Stored as `mindsetPrompts?: string[]` on `SessionConfig`.

### 2.3 Retention Mode Options
Add to session config: `retentionMode: "free" | "target"`. In "target" mode, show a visual indicator when approaching personal best. Current "free" mode (tap to end) remains default.

### 2.4 Auto-Launch Cold Timer
New option in session config: `autoCold: boolean`. When true, after the last round's recovery breath, automatically transition to the cold timer instead of showing `SessionComplete`. Session data is saved first.

### 2.5 Named Custom Presets
Users can save up to 5 named custom session presets (stored in preferences). Add a "Save as Preset" button on the breathing config screen and a management UI in settings. Extends the existing preset card system.

---

## Module 3: 30-Day Beginner Program

### 3.1 Program Data Model
New types in `lib/storage.ts`:
```typescript
interface Program {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  days: ProgramDay[];
}

interface ProgramDay {
  dayNumber: number;
  label: string;
  breathingConfig?: SessionConfig;
  coldTarget?: number;
  mindsetTask?: string;
  isRestDay: boolean;
}

interface ProgramProgress {
  programId: string;
  startDate: string;
  completedDays: number[];
  paused: boolean;
  pausedDate?: string;
}
```

### 3.2 Program Screen
New route `app/(app)/program/page.tsx` with:
- Calendar view showing program progress (completed/upcoming/rest days)
- Today's session card with prescribed breathing config + cold target
- "Start Today's Session" button that launches SessionRunner with the day's config
- Pause/resume controls
- Week-by-week progression following the spec: Week 1 (2 rounds, 30 breaths), Week 2 (3/30 + cold), Week 3 (3/40 + longer cold), Week 4 (4 rounds, silence mode)

### 3.3 Navigation Update
Add a "Program" tab to `BottomNav.tsx` (between Breathe and Cold, or replacing the current 4-tab layout with a 5-tab layout).

---

## Module 4: Content and Education

### 4.1 Method Guide
New route `app/(app)/learn/page.tsx` with 8 chapters of structured text content (600-1000 words each):
1. Who is Wim Hof and why does it matter
2. The breathing technique — complete technical description
3. Cold exposure — from showers to ice baths
4. The mindset pillar
5. The science
6. Common side effects and what they mean
7. Combining all three pillars
8. Advanced practices

Content stored as static data in `lib/content.ts`. Chapters 1-3 available immediately; chapters 4-8 unlock after completing 7 days of practice (progression mechanic, not paywall).

### 4.2 Session Preparation Tips
Contextual tips shown on the breathing config screen before starting a session. Based on time of day and recent activity:
- Morning: "You're breathing on an empty stomach — retention times tend to be longer"
- After recent cold session: "Your nervous system is already activated"
- Evening: "Evening sessions tend to be calming — focus on slower pace"

Implemented as a small `components/SessionTip.tsx` component using current time and recent session data from storage.

---

## Module 5: Advanced Analytics

### 5.1 Combined Dashboard
Refactor `app/(app)/progress/page.tsx` to add a third tab: "Overview" (shown first) with:
- Weekly summary: sessions this week vs last week
- Average retention time trend (up/down/flat arrow)
- Cold exposure total minutes this week
- Current streaks (breathing + cold)
- Consistency score (sessions / 7 as percentage)

### 5.2 Weekly Insights Card
After 2 weeks of data, show a smart insight card on the progress overview:
- Retention time patterns (morning vs evening)
- Progression suggestions ("Try adding a 4th round")
- Streak analysis

### 5.3 Enhanced Retention Chart
Add to existing `RetentionChart`:
- Per-round breakdown view (toggle)
- Weekly average overlay
- Trend line

---

## Module 6: Notifications and Engagement

### 6.1 Daily Reminder System
Implement using the Notification API (with permission request):
- One reminder per day at user's preferred practice time (from practice profile)
- Skip if user practiced within last 2 hours
- Configurable in settings (on/off + time picker)

### 6.2 Milestone Notifications
In-app milestone celebrations (toast/modal):
- First retention over 2 minutes
- First full cold shower (3+ minutes)
- 7-day, 30-day, 100-day streaks
- Personal best retention broken
- Program day/week completed

### 6.3 Weekly Summary
In-app weekly summary card shown on Monday (or first app open after Monday):
- Sessions last week vs week before
- Average retention trend
- Cold exposure total
- Current streak
- One actionable suggestion

---

## Module 7: Shareable Session Cards

### 7.1 Post-Session Share Card
After session completion, add a "Share" button on `SessionComplete` that generates a shareable image using `html2canvas` or Canvas API:
- Session type and duration
- Retention time visualization (bar chart, not raw numbers)
- Day streak badge
- App name/logo (subtle, bottom corner)
- Designed for Instagram Stories (9:16) and square (1:1)

### 7.2 Progress Share
On the progress page, add an "Export" button that generates a shareable image of:
- Retention time graph
- Cold streak calendar
- Key stats

---

## Module 8: Accessibility

### 8.1 Screen Reader Support
- Add ARIA labels to all interactive elements (breathing circle, timer, option buttons)
- Announce phase transitions during breathing session via `aria-live` regions
- Ensure all charts have text alternatives

### 8.2 Vestibular-Safe Mode
- Setting to disable the expanding/contracting `BreathingCircle` animation
- Replace with a simple color shift or progress bar
- Respect `prefers-reduced-motion` media query

### 8.3 Haptic-Only Mode
- Full session guided through vibration patterns alone (for deaf users or silent practice)
- Distinct vibration patterns for inhale, exhale, hold start, hold end, countdown
- Added as an audio mode option: "tone" | "silent" | "haptic"

---

## Module 9: Settings Enhancements

### 9.1 Temperature Unit Toggle
Add Celsius / Fahrenheit toggle in settings. Apply to cold session temperature input and display.

### 9.2 Notification Settings
On/off toggle for daily reminder + time picker for preferred reminder time.

### 9.3 Practice Profile Access
Link to edit practice profile from settings.

### 9.4 Data Export
Export all session data as JSON file (GDPR compliance).

### 9.5 Wake Lock
Keep screen on during active breathing and cold sessions using the Screen Wake Lock API. Add a toggle in settings.

---

## Module 10: Session Reliability

### 10.1 Wake Lock During Sessions
Use the Screen Wake Lock API to prevent screen dimming during active breathing and cold sessions. Release on session end.

### 10.2 Background Audio
Ensure audio tones continue when app is backgrounded (PWA limitation — document this and use audio element workaround if needed).

### 10.3 Session Recovery
If the app is closed mid-session, save session state to storage. On next open, offer to resume or discard the interrupted session.

---

## Storage Migration Plan

Current localStorage structure stays as the read API but IndexedDB becomes the backend:
- `whm_breathing_sessions` → IndexedDB `breathing_sessions` store
- `whm_cold_sessions` → IndexedDB `cold_sessions` store
- `whm_preferences` → IndexedDB `preferences` store
- New stores: `program_progress`, `custom_presets`, `milestones`

Migration: on first load after v2 update, copy existing localStorage data to IndexedDB, then clear localStorage keys. The `lib/storage.ts` exports remain identical — callers don't change.

---

## Technical Notes

| Area | v1 | v2 |
|---|---|---|
| Storage | localStorage | IndexedDB (via idb) |
| Strings | Hardcoded | Externalized in `lib/i18n.ts` |
| Audio modes | tone / silent | tone / silent / haptic |
| Session config | Fixed breath count | Per-round breath counts, mindset prompts, retention modes |
| Navigation | 4 tabs | 5 tabs (+ Program) |
| Notifications | None | Notification API + in-app |
| Sharing | None | Canvas-based image generation |
| Accessibility | Basic | ARIA labels, reduced motion, haptic mode |

---

## Out of Scope for v2

These features from the production spec are deferred to v3+:
- Video library (requires hosting infrastructure)
- Community features (feed, challenges, groups, accountability partners)
- Subscription/payment system
- Apple Watch / Wear OS app
- Biometric integration (HealthKit, SpO2, Oura, Garmin)
- Referral program
- Full internationalization (actual translations beyond string externalization)
- Additional programs beyond the 30-day beginner program
- Website / landing page
- Account system / authentication
