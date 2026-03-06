# Production Readiness Review — Wim Hof Method App v2

**Review Date:** 2026-03-05
**Reviewer:** Senior Product Engineer (Claude Opus 4.6)
**Codebase:** Next.js 14.2.5 / React 18 / TypeScript / Tailwind / IndexedDB (idb) / next-pwa

---

## 1. Bug Audit

### 🔴 CRITICAL

**B-01: SafetyOnboarding bypasses onboarding flow**
`components/SafetyOnboarding.tsx:21` — When a user navigates directly to any `(app)/` route without completing onboarding, `SafetyOnboarding` fires and sets `onboardingComplete: true` + `safetyAcknowledged: true`. This completely skips the onboarding flow (profile setup, experience selection, pillar introduction). Users lose personalized defaults and educational context.

**B-02: `new_pb` milestone only fires once ever**
`lib/milestones.ts:103-104` — `unlockMilestone` checks if the type was already unlocked and returns `null` if so. Since `new_pb` is a one-shot milestone, subsequent personal bests never trigger the toast. A user who beats their PB 10 times only sees the celebration once.

**B-03: Division by zero in retention averaging**
`components/progress/Overview.tsx:83-84` and `components/WeeklySummary.tsx:148-150` — `s.retentionTimes.reduce((a, b) => a + b, 0) / s.retentionTimes.length` produces `NaN` if `retentionTimes` is an empty array. This poisons all downstream calculations (trend arrows, weekly comparison, insight card).

### 🟡 IMPORTANT

**B-04: Root page shows blank screen during initialization**
`app/page.tsx` — Renders `return null` while `initStorage()` resolves. On slow devices or cold IndexedDB opens, users see a white screen with no loading indicator. Combined with the router redirect, this can flash white for 200-500ms.

**B-05: Onboarding uses non-existent Tailwind classes**
`app/onboarding/page.tsx:124,150` — Uses `pt-safe-top` and `pb-safe-bottom` which are not standard Tailwind utilities and no plugin is configured for them. These classes are silently ignored, meaning content may be obscured behind the iOS notch/home bar on iPhones.

**B-06: CSS animations ignore `prefers-reduced-motion`**
`app/globals.css` — `animate-page-enter` and `animate-slide-up` keyframe animations have no `@media (prefers-reduced-motion: reduce)` override. While the React hook handles the breathing circle, these page-level animations still play for motion-sensitive users.

**B-07: WeeklySummary localStorage access not wrapped in try-catch**
`components/WeeklySummary.tsx:65` — Direct `localStorage.getItem` call can throw in iOS private browsing or restricted environments, crashing the component.

**B-08: MilestoneToast subscription recreated on state change**
`components/MilestoneToast.tsx:72-80` — `useEffect` depends on `current` state, causing the subscription to be torn down and recreated every time a milestone is shown/dismissed. Milestones fired between unsubscribe/re-subscribe are missed.

**B-09: Notification reminders only work while tab is open**
`lib/notifications.ts` — Uses `setTimeout` for scheduling, which stops when the tab is backgrounded or closed. Users who set a daily reminder at 8am will never receive it unless the app tab is open at that exact time.

### 🟢 NICE TO HAVE

**B-10: Cold temperature input accepts any number**
`components/cold/ColdTimer.tsx:218-220` — No bounds validation on temperature input. Users could enter 999 or -999. Should clamp to reasonable range (e.g., -5 to 50C).

**B-11: `StorageProvider` renders null (no skeleton)**
`components/StorageProvider.tsx:21` — Renders nothing while IndexedDB initializes. A loading skeleton would prevent layout shift when content appears.

---

## 2. Architecture Review

### 🔴 CRITICAL

**A-01: Streak calculation duplicated 5 times**
Independently implemented in: `lib/milestones.ts:122-151`, `lib/shareCard.ts:23-42`, `components/WeeklySummary.tsx:30-58`, `components/progress/Overview.tsx:33-56`, `components/progress/ColdHistory.tsx:27-38`. Each implementation has subtle differences (some check yesterday, some don't; different date handling). This is a correctness hazard.

### 🟡 IMPORTANT

**A-02: 8 files exceed 150 lines, 4 exceed 300**
| File | Lines | Recommendation |
|------|-------|----------------|
| `BreathingConfig.tsx` | 367 | Split preset management, per-round config, and mindset prompts into sub-components |
| `settings/page.tsx` | 305 | Extract setting sections into individual components |
| `BreathingHistory.tsx` | 358 | Extract `RetentionChart` to its own file |
| `program/page.tsx` | 275 | Extract `TodayCard`, `CalendarView` to separate files |
| `onboarding/page.tsx` | 265 | Already has sub-components but they should be separate files |
| `ColdTimer.tsx` | 275 | Extract log form into `ColdSessionLog.tsx` |
| `storage.ts` | 397 | Extract program progress to its own module |
| `i18n.ts` | 397 | Split into domain-specific string files |

**A-03: Business logic in UI components**
- Streak calculations in `Overview.tsx`, `ColdHistory.tsx`, `WeeklySummary.tsx`
- Week-over-week comparison logic in `WeeklySummary.tsx`
- Average retention calculations in `Overview.tsx`, `InsightCard.tsx`
- Session data preparation in `SessionComplete.tsx`

These should be extracted to `lib/analytics.ts` or similar.

**A-04: Duplicated utility functions**
- `formatSeconds()` — duplicated in `WeeklySummary.tsx` and `Overview.tsx` (identical to `formatDuration` in `lib/format.ts`)
- `getMondayOfWeek()`/`startOfWeek()`/`getWeekStart()` — 3 different names for the same function in 3 files
- `avgRetention()` calculation — duplicated in 3 components
- Feeling rating button UI — duplicated between `SessionComplete.tsx` and `ColdTimer.tsx`

### 🟢 NICE TO HAVE

**A-05: No React error boundary**
The app has no error boundary. Any unhandled render error crashes the entire app with no recovery path.

---

## 3. Code Quality

### 🟡 IMPORTANT

**C-01: TypeScript weaknesses**
- `lib/db.ts:37` — `preferences` store typed as `value: unknown` instead of `UserPreferences`
- `lib/db.ts:65` — milestones `data` typed as `unknown`
- `lib/storage.ts:84` — `normalizeSessionConfig` accepts `Record<string, unknown>` and uses unsafe cast at line 104
- DB schema for `breathing_sessions.breathsPerRound` is `number` but `SessionConfig.breathsPerRound` is `number[]` — schema drift

**C-02: Dead/unused exports**
- `lib/constants.ts` — Entire file is dead code. `colors`, `spacing`, `radii`, `animation` are never imported
- `lib/format.ts:38` — `fromStorageCelsius` never imported
- `lib/storage.ts:306,322` — `deleteBreathingSession`, `deleteColdSession` never called
- `lib/program.ts:144,150` — `getProgramById`, `getAllPrograms` never called

**C-03: Inconsistent callback naming**
- `onDone` (ColdTimer, SessionComplete)
- `onFinish` (SessionRunner)
- `onComplete` (PowerBreaths, RetentionHold, RecoveryBreath)
- `onProceed` (SafetyReminder)
- `onContinue` (GuidedOverlay)

These should follow a consistent convention.

### 🟢 NICE TO HAVE

**C-04: Hardcoded string in settings**
`app/(app)/settings/page.tsx:155-158` — "Reduced Motion" label and description are hardcoded English strings instead of using the `strings` i18n object.

**C-05: No console.log/debug code found** (pass)

---

## 4. Security

### 🟡 IMPORTANT

**S-01: Deprecated dependency — `next-pwa@5.6.0`**
`next-pwa` is unmaintained (last publish ~2023). It has known issues and no security patches. Should migrate to `@ducanh2912/next-pwa` or `serwist`.

**S-02: `next@14.2.5` is outdated**
Released mid-2024, likely missing security patches from the past ~18 months.

**S-03: No IndexedDB data validation on load**
`lib/storage.ts:270-275` — Data from IndexedDB is loaded and spread over defaults without schema validation. Corrupted or tampered data could cause runtime errors throughout the app.

**S-04: localStorage JSON parsing without validation**
`lib/notifications.ts:27` — `JSON.parse(raw)` result is spread directly into the settings object with no schema check.

### 🟢 NICE TO HAVE

**S-05: `userScalable: false` is an accessibility anti-pattern**
`app/layout.tsx:26` — Prevents pinch-to-zoom, which is a WCAG failure (1.4.4). Some app stores may reject this.

**S-06: No hardcoded secrets found** (pass)
**S-07: No XSS vectors found** (pass — all user content rendered as text nodes)

---

## 5. Performance

### 🟡 IMPORTANT

**P-01: `recharts` is a heavy bundle dependency**
`recharts@^2.12.0` adds ~200-400KB to the JS bundle for a single chart component (`BreathingHistory.tsx`). Consider a lighter alternative (e.g., lightweight canvas chart, custom SVG, or `chart.js` with tree-shaking).

**P-02: `framer-motion` loaded for a single animation**
`framer-motion@^11.0.0` adds ~100KB+ for the breathing circle pulse animation only (`BreathingCircle.tsx`). This could be replaced with a CSS animation or a small `useSpring` hook.

**P-03: `getPreferences()` called during render in list items**
`components/progress/ColdHistory.tsx:119` — Calls `getPreferences()` for every cold session in the list to get temperature unit. Should be called once at the component level.

### 🟢 NICE TO HAVE

**P-04: No image optimization needed**
Only two PNG icons exist (192px, 512px). No photos or large images.

**P-05: Web Audio nodes not pooled**
`lib/audio.ts` creates new oscillator/gain nodes for every tone. For rapid breathing, this creates many short-lived nodes. Not a practical problem at current breath rates but could be optimized.

---

## 6. PWA & Mobile

### 🟡 IMPORTANT

**M-01: manifest.json missing fields**
- No `id` field (recommended for stable PWA identity)
- No `maskable` icon variant (Android adaptive icons will crop incorrectly)
- Only 2 icon sizes (192, 512) — should include 48, 72, 96, 128, 144, 256 for better cross-platform support
- No `categories` field

**M-02: `next-pwa` is deprecated**
Service worker generation depends on an unmaintained package. Migration to `serwist` or `@ducanh2912/next-pwa` is necessary for continued maintenance.

**M-03: Onboarding safe area padding broken**
`app/onboarding/page.tsx:124,150` — `pt-safe-top` and `pb-safe-bottom` are not valid Tailwind classes. Content may be hidden behind the notch/dynamic island on iPhones.

### 🟢 NICE TO HAVE

**M-04: Bottom nav touch targets may be undersized**
`components/BottomNav.tsx:83` — Nav link padding is `px-3 py-2` with 6 items. On narrow screens (375px), each item gets ~62px width which is fine, but the vertical touch target (~32px + icon) may be under the 44px minimum.

**M-05: No splash screen configuration**
No `apple-launch-image` or splash screen assets configured for iOS PWA.

---

## 7. Accessibility

### 🟡 IMPORTANT

**X-01: `userScalable: false` blocks pinch-to-zoom**
`app/layout.tsx:26` — WCAG 2.1 Level AA failure (Success Criterion 1.4.4). Users with low vision cannot zoom.

**X-02: CSS animations don't respect reduced motion**
`app/globals.css` — `page-enter` and `slide-up` animations play regardless of user preference.

**X-03: Missing `aria-label` on cold timer feeling buttons**
`components/cold/ColdTimer.tsx:239-249` — Rating buttons have no `aria-label` (unlike `SessionComplete.tsx` which does have them).

### 🟢 NICE TO HAVE

**X-04: Color contrast borderline**
`text-gray-400` on `bg-gray-100` in light mode may not meet 4.5:1 ratio. Affects section labels and muted text throughout.

**X-05: Breathing circle has proper ARIA** (pass)
**X-06: Charts have text alternatives** (pass — sr-only descriptions present)

---

## 8. Legal & Compliance

### 🟡 IMPORTANT

**L-01: No privacy policy**
The app stores personal practice data (session history, health-adjacent data like cold exposure duration, subjective feeling ratings). Even with local-only storage, a privacy policy is advisable and may be required by app store guidelines.

**L-02: No open source license file**
The project has no `LICENSE` file. Dependencies are MIT/BSD, but the project's own licensing is undefined.

### 🟢 NICE TO HAVE

**L-03: GDPR considerations**
While all data is stored locally (IndexedDB/localStorage), the "Export Data" feature and potential future cloud sync should be covered by a privacy policy. The existing "Clear All Data" function serves as a basic data deletion mechanism.

---

## 9. Production Readiness

### 🟡 IMPORTANT

**R-01: No error tracking**
No Sentry, LogRocket, or similar. Production errors will be invisible.

**R-02: No SEO open graph image**
`app/layout.tsx` has title and description but no `og:image`. Social sharing will show a generic link card.

**R-03: No lint or type-check in pre-commit**
CI runs type-check and build, but there's no pre-commit hook. Broken code can be committed to main.

### 🟢 NICE TO HAVE

**R-04: No sitemap.xml or robots.txt**
Minor for a PWA, but good practice for discoverability.

**R-05: No test suite**
Zero unit, integration, or e2e tests. CI only runs `tsc --noEmit` and `next build`.

**R-06: Version string is hardcoded**
`lib/i18n.ts:6` — `version: "Wim Hof Method App v0.1.0"` is hardcoded rather than pulled from `package.json`.

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 4 |
| 🟡 IMPORTANT | 20 |
| 🟢 NICE TO HAVE | 14 |

**Top 5 priorities for v3:**
1. Fix SafetyOnboarding bypassing onboarding flow (B-01)
2. Consolidate streak calculation into a single shared utility (A-01)
3. Fix division-by-zero in retention averaging (B-03)
4. Replace deprecated `next-pwa` and upgrade Next.js (S-01, S-02)
5. Remove `userScalable: false` and add reduced-motion CSS overrides (X-01, X-02)
