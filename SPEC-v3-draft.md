# SPEC-v3-draft.md — Wim Hof Method App v3

**Based on:** REVIEW-v2.md findings (2026-03-05)

---

## 1. Agent Role & Mindset

You are a senior frontend engineer shipping a production-quality PWA. You value:

- **Correctness over speed** — every bug fix must be verified, no silent failures
- **Minimal diff** — fix only what is broken or explicitly scoped; do not refactor for style
- **Accessibility first** — WCAG 2.1 AA compliance is non-negotiable
- **Mobile-native feel** — this is primarily a phone app, every interaction must feel right at 375px

---

## 2. Technology Stack

| Layer     | Technology                               | Notes                                                       |
| --------- | ---------------------------------------- | ----------------------------------------------------------- |
| Framework | Next.js 15.x (upgrade from 14.2.5)       | App Router, RSC where possible                              |
| UI        | React 18, Tailwind CSS 3.4               | Dark mode via `media` strategy                              |
| Animation | CSS animations + `useReducedMotion` hook | Remove `framer-motion` dependency                           |
| Charts    | Lightweight replacement for `recharts`   | Consider custom SVG or `lightweight-charts` — target < 30KB |
| Storage   | IndexedDB via `idb@8`                    | In-memory cache for sync reads                              |
| PWA       | `serwist` or `@ducanh2912/next-pwa`      | Replace deprecated `next-pwa`                               |
| Language  | TypeScript strict mode                   | No `any`, no `unknown` in public APIs                       |

---

## 3. Architecture Principles

1. **Single source of truth for calculations** — streak, average retention, week boundaries, and formatting functions each exist in exactly one place under `lib/`.
2. **Business logic out of components** — components receive computed data via hooks or props. No date math, no streak counting, no averaging inside `.tsx` files.
3. **Max 150 lines per file** — split large components into focused sub-components. Split large lib modules into domain files.
4. **Consistent callback naming** — use `onComplete` for phase transitions, `onDone` for final dismissal/navigation, `onSave` for persistence actions.
5. **Error boundaries at route level** — wrap `(app)/layout.tsx` children in a React error boundary with a retry UI.

---

## 4. Code Quality Bar

- **TypeScript strict** — enable `strict: true` in tsconfig. No `as` casts except at system boundaries (IndexedDB reads). No `Record<string, unknown>`.
- **No dead code** — remove all unused exports identified in review (C-02). Delete `lib/constants.ts` entirely.
- **Schema validation** — validate data shape when loading from IndexedDB and localStorage using a lightweight runtime check (not a full validation library).
- **Consistent i18n** — all user-visible strings must go through `lib/i18n.ts`. No hardcoded English in components.
- **ESLint** — add `eslint-plugin-react-hooks` exhaustive-deps rule. Add `no-unused-vars` as error.

---

## 5. User & Problem

**Primary user:** Health-conscious adults (25-45) who practice or want to start the Wim Hof Method. They use the app on their phone, often first thing in the morning.

**Core problem:** Existing WHM apps are either too simple (just a timer) or too complex (overwhelming settings). Users need guided sessions that work offline, track progress meaningfully, and feel pleasant to use daily.

**v3 focus:** The v2 app has all major features built. v3 is about production hardening — fixing bugs, improving reliability, trimming bundle size, and ensuring every existing feature works correctly.

---

## 6. Product Scope

### In Scope (v3)

- Fix all CRITICAL and IMPORTANT bugs from REVIEW-v2.md
- Consolidate duplicated code (streak, averaging, formatting)
- Replace deprecated dependencies (next-pwa, upgrade Next.js)
- Remove heavy dependencies (framer-motion, consider recharts)
- Accessibility fixes (zoom, reduced motion, ARIA)
- Add error boundary and loading states
- Add privacy policy page
- Add basic error tracking

### Out of Scope (v3)

- New features (no new screens, no new capabilities)
- Cloud sync / accounts
- Multi-language support (i18n structure exists but only English)
- Social features
- Biometric integration (Apple Health / Google Fit)
- Voice guidance audio mode

---

## 7. Features & Acceptance Criteria

### F-01: Fix SafetyOnboarding bypass (B-01) 🔴

**Problem:** `SafetyOnboarding` in `AppShell` sets `onboardingComplete: true` for users who haven't gone through onboarding.
**Fix:** Remove `onboardingComplete: true` from `SafetyOnboarding.handleAcknowledge()`. Instead, only set `safetyAcknowledged: true`. Add a redirect to `/onboarding` in `AppShell` or `(app)/layout.tsx` when `onboardingComplete` is false.
**AC:**

- [ ] User who hasn't completed onboarding and navigates to `/breathe` is redirected to `/onboarding`
- [ ] Safety acknowledgment in `SafetyOnboarding` no longer sets `onboardingComplete`
- [ ] Existing users with `onboardingComplete: true` are not affected

### F-02: Fix milestone `new_pb` re-triggering (B-02) 🔴

**Problem:** `new_pb` milestone only fires once because `unlockMilestone` prevents duplicate types.
**Fix:** Make `new_pb` a repeatable milestone. Either skip the duplicate check for `new_pb`, or store it with a unique ID per occurrence.
**AC:**

- [ ] Each new personal best triggers the milestone toast
- [ ] Toast shows the new time and previous best
- [ ] Milestone history shows all PB achievements

### F-03: Fix division by zero in retention averaging (B-03) 🔴

**Problem:** `retentionTimes.reduce / retentionTimes.length` produces `NaN` for empty arrays.
**Fix:** Guard all retention averaging with a length check. Extract to a shared `safeAvgRetention()` utility.
**AC:**

- [ ] `safeAvgRetention([])` returns `0`
- [ ] Overview, WeeklySummary, and InsightCard all use the shared utility
- [ ] No `NaN` appears in any UI regardless of session data

### F-04: Consolidate streak calculation (A-01) 🔴

**Problem:** 5 independent streak implementations with subtle differences.
**Fix:** Create `lib/analytics.ts` with a single `calculateStreak(sessions: {date: string}[]): number` function. Replace all 5 implementations.
**AC:**

- [ ] Single streak function in `lib/analytics.ts`
- [ ] All consumers import from `lib/analytics.ts`
- [ ] Streak results are identical across Overview, ColdHistory, WeeklySummary, milestones, and share cards
- [ ] Function handles edge cases: empty array, future dates, timezone boundaries

### F-05: Add loading state to root and StorageProvider (B-04, B-11) 🟡

**Fix:** Show a branded loading spinner/skeleton in `StorageProvider` and `app/page.tsx` while IndexedDB initializes.
**AC:**

- [ ] Users see a centered loading indicator (not blank white) during init
- [ ] Loading state matches app theme (dark mode aware)
- [ ] Typical display time < 300ms

### F-06: Fix onboarding safe area padding (B-05, M-03) 🟡

**Fix:** Replace `pt-safe-top` / `pb-safe-bottom` with standard `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` via Tailwind arbitrary values or inline styles.
**AC:**

- [ ] Onboarding content is not obscured by notch/dynamic island on iPhone
- [ ] Bottom controls are not obscured by home indicator
- [ ] Verified on iPhone 15 Pro Max (simulated) viewport

### F-07: Add reduced-motion CSS overrides (B-06, X-02) 🟡

**Fix:** Add `@media (prefers-reduced-motion: reduce)` block in `globals.css` that disables `page-enter` and `slide-up` animations.
**AC:**

- [ ] With OS-level reduced motion enabled, no CSS animations play
- [ ] Milestone toast appears instantly without slide-up
- [ ] Page transitions are instant without fade

### F-08: Fix WeeklySummary localStorage access (B-07) 🟡

**Fix:** Wrap `localStorage.getItem` in try-catch in `WeeklySummary.tsx`.
**AC:**

- [ ] App does not crash in iOS private browsing mode
- [ ] WeeklySummary gracefully falls back to showing the summary

### F-09: Fix MilestoneToast subscription leak (B-08) 🟡

**Fix:** Remove `current` from useEffect dependency array. Use a ref to track current display state instead.
**AC:**

- [ ] Multiple milestones earned in quick succession are all displayed sequentially
- [ ] No milestone is silently dropped

### F-10: Replace `next-pwa` with maintained alternative (S-01, M-02) 🟡

**Fix:** Migrate to `serwist` or `@ducanh2912/next-pwa`. Update `next.config.mjs`.
**AC:**

- [ ] Service worker generates correctly on build
- [ ] Offline fallback page works
- [ ] Precaching includes all app routes
- [ ] No deprecation warnings during build

### F-11: Upgrade Next.js to 15.x (S-02) 🟡

**Fix:** Upgrade `next` package and fix any breaking changes.
**AC:**

- [ ] `npm run build` succeeds with zero errors
- [ ] `npx tsc --noEmit` passes
- [ ] All existing functionality works after upgrade

### F-12: Remove `userScalable: false` (X-01, S-05) 🟡

**Fix:** Remove `userScalable: false` and `maximumScale: 1` from viewport config in `app/layout.tsx`.
**AC:**

- [ ] Users can pinch-to-zoom on all pages
- [ ] During active breathing sessions, zoom does not interfere with the UI (test on mobile)

### F-13: Add IndexedDB data validation (S-03) 🟡

**Fix:** When loading from IndexedDB in `loadCache()`, validate that loaded data matches expected shapes. Fall back to defaults for invalid data.
**AC:**

- [ ] Corrupted preferences in IndexedDB don't crash the app
- [ ] Missing required fields are filled with defaults
- [ ] Invalid session records are skipped (not loaded into cache)

### F-14: Extract shared analytics utilities (A-03, A-04) 🟡

**Fix:** Create `lib/analytics.ts` containing:

- `calculateStreak(sessions)`
- `safeAvgRetention(sessions)`
- `getWeekStart(date)`
- `formatSeconds(seconds)` (or use existing `formatDuration`)
- `getWeeklyComparison(sessions, referenceDate)`

Remove all duplicate implementations from components.
**AC:**

- [ ] No date math or statistical calculations remain in `.tsx` files
- [ ] All analytics functions have consistent behavior
- [ ] Existing UI behavior is unchanged

### F-15: Split oversized files (A-02) 🟡

**Fix:** Split the 8 files exceeding 150 lines:

- `BreathingConfig.tsx` -> extract `PresetGrid`, `PerRoundConfig`, `MindsetPrompts`
- `settings/page.tsx` -> extract `AudioSettings`, `BreathingDefaults`, `DataManagement`
- `BreathingHistory.tsx` -> extract `RetentionChart` to own file
- `ColdTimer.tsx` -> extract `ColdSessionLog`
- `program/page.tsx` -> extract `TodayCard`, `CalendarView` to own files

**AC:**

- [ ] No component file exceeds 150 lines
- [ ] No behavioral changes
- [ ] All imports updated correctly

### F-16: Remove heavy dependencies (P-01, P-02) 🟡

**Fix:**

- Replace `framer-motion` breathing circle with CSS keyframe animation
- Evaluate replacing `recharts` with custom SVG chart or lighter library

**AC:**

- [ ] `framer-motion` removed from `package.json`
- [ ] Breathing circle animation looks identical (or better)
- [ ] JS bundle size reduced by at least 100KB (gzipped)

### F-17: Fix manifest.json completeness (M-01) 🟡

**Fix:** Add `id`, `categories`, and maskable icon variant.
**AC:**

- [ ] `manifest.json` includes `id: "/"`, `categories: ["health", "fitness"]`
- [ ] Maskable 512px icon added to `/public/icons/`
- [ ] Lighthouse PWA audit passes

### F-18: Add ARIA labels to cold timer rating (X-03) 🟡

**Fix:** Add `aria-label` to feeling rating buttons in `ColdTimer.tsx` matching the pattern in `SessionComplete.tsx`.
**AC:**

- [ ] Each rating button has `aria-label="{value} - {label}"`
- [ ] Screen reader announces rating options correctly

### F-19: Add privacy policy page 🟡

**Fix:** Create `app/(app)/privacy/page.tsx` with a basic privacy policy. Link from settings.
**AC:**

- [ ] Privacy policy page accessible from settings
- [ ] States that all data is stored locally
- [ ] Describes what data is collected and how to delete it

### F-20: Add error boundary (A-05) 🟡

**Fix:** Add a React error boundary wrapping children in `app/(app)/layout.tsx` with a retry button.
**AC:**

- [ ] Component render errors show a friendly error screen instead of blank page
- [ ] "Try again" button reloads the route
- [ ] Error boundary does not catch errors in other layout segments

### F-21: Clean up dead code (C-02) 🟡

**Fix:** Remove:

- `lib/constants.ts` (entire file)
- `fromStorageCelsius` from `lib/format.ts`
- `deleteBreathingSession`, `deleteColdSession` from `lib/storage.ts`
- `getProgramById`, `getAllPrograms` from `lib/program.ts`

**AC:**

- [ ] No unused exports remain
- [ ] Build succeeds with no errors

### F-22: Fix TypeScript types in DB schema (C-01) 🟡

**Fix:** Type `preferences` store value properly in `db.ts`. Type `milestones.data` as `Record<string, unknown>` instead of bare `unknown`.
**AC:**

- [ ] `lib/db.ts` has no `unknown` in store value types
- [ ] Type-safe access to preferences from IndexedDB

### F-23: Add hardcoded settings strings to i18n (C-04) 🟡

**Fix:** Move "Reduced Motion" title and description from `settings/page.tsx` to `lib/i18n.ts`.
**AC:**

- [ ] All user-visible text in settings comes from `strings` object

---

## 8. Design & UX Guidelines

- **Dark mode first** — test all changes in dark mode as the primary context
- **Touch targets** — minimum 44x44px for all interactive elements
- **Loading states** — every async operation must have a visible loading indicator
- **Error states** — every data-dependent view must handle empty/error states gracefully
- **Animations** — all animations must respect `prefers-reduced-motion` via CSS media query AND the app toggle
- **Typography** — maintain existing font scale; no new font weights or sizes without justification

---

## 9. Performance Budget

| Metric                   | Target  | Current (estimated)               |
| ------------------------ | ------- | --------------------------------- |
| First Contentful Paint   | < 1.5s  | ~1.2s                             |
| JS bundle (gzipped)      | < 150KB | ~250KB (recharts + framer-motion) |
| Largest Contentful Paint | < 2.5s  | ~2.0s                             |
| Total Blocking Time      | < 200ms | ~150ms                            |
| Lighthouse Performance   | > 90    | ~80                               |
| Lighthouse PWA           | Pass    | Partial (manifest issues)         |

Removing `framer-motion` (~100KB gzip) and potentially `recharts` (~150KB gzip) should bring the JS bundle well under 150KB.

---

## 10. Data & Storage

### Storage Architecture (unchanged)

- **IndexedDB** (`whm-app`, version 1) — primary storage for sessions, preferences, milestones, program progress
- **In-memory cache** — synchronous reads during render, async writes
- **localStorage** — only for `whm_reminder_settings` and `whm_weekly_summary_dismissed`

### Migration

- v1 localStorage -> IndexedDB migration already exists and works
- No new migrations needed for v3
- If DB schema changes are needed (e.g., fixing types), bump `DB_VERSION` to 2 and add upgrade handler

### Data Validation (new in v3)

- Add shape validation when loading from IndexedDB
- Invalid records: skip and log (don't crash)
- Missing preference fields: fill with defaults from `DEFAULT_PREFERENCES`

---

## 11. Error Handling

### Strategy

1. **Render errors** — caught by React error boundary at `(app)/layout.tsx` level. Show friendly retry UI.
2. **IndexedDB errors** — caught in `lib/storage.ts` and `lib/db.ts`. Fall back to in-memory defaults. Log to console (and error tracker when added).
3. **localStorage errors** — wrap all access in try-catch. Fall back gracefully.
4. **Audio errors** — already handled (silent failure). No changes needed.
5. **Wake Lock errors** — already handled. No changes needed.
6. **Network errors** — service worker provides offline fallback. No changes needed.

### Error Tracking (new in v3)

- Add minimal error tracking (e.g., Sentry browser SDK with lazy loading)
- Track: unhandled promise rejections, error boundary catches, IndexedDB failures
- Do NOT track: user behavior, session data, personal information

---

## 12. v2 Foundation

### What exists and works well (preserve)

- Core breathing session flow (PowerBreaths -> Retention -> Recovery -> Complete)
- Cold timer with circular progress
- IndexedDB storage with in-memory cache pattern
- Web Audio tone generation with haptic fallback
- Onboarding flow with safety acknowledgment
- 30-day beginner program with calendar view
- Educational content (8 chapters, practice-gated)
- Milestone system with toast notifications
- Weekly summary overlay
- Share card canvas rendering
- Retention chart with trend line and per-round view
- Wake Lock API integration
- Reduced motion support (React hook + settings toggle)
- Bottom navigation with 6 tabs

### What needs refactoring

- **Streak calculation** — consolidate 5 implementations into 1
- **Analytics utilities** — extract from components into `lib/analytics.ts`
- **Large files** — split 8 files exceeding 150 lines
- **Component callbacks** — standardize naming convention
- **DB types** — fix `unknown` types and schema drift

### What should be deleted

- `lib/constants.ts` — entirely unused
- `fromStorageCelsius` — unused export
- `deleteBreathingSession`, `deleteColdSession` — unused (can re-add when delete UI is built)
- `getProgramById`, `getAllPrograms` — unused

### What should be replaced

- `next-pwa@5.6.0` -> `serwist` or `@ducanh2912/next-pwa`
- `framer-motion` -> CSS animation
- `next@14.2.5` -> `next@15.x`
- Consider `recharts` -> lighter chart solution

---

## 13. Open Questions

1. **Should we keep `recharts` or replace it?** The retention chart is feature-rich (trend line, per-round view, weekly averages, PR dots). Replacing it with custom SVG is significant work. Option: keep recharts but lazy-load it (dynamic import) so it only loads on the Progress tab.

2. **Should notifications use service worker push instead of setTimeout?** The current setTimeout approach doesn't work when the tab is closed. Service worker push requires a backend. Is this worth building for v3, or should we document the limitation and defer?

3. **Should we add tests in v3?** There are zero tests. Adding tests for the analytics utilities (streak, averaging) and storage layer would catch regressions. E2e tests for the breathing flow would be ideal but heavier to set up.

4. **Is upgrading to Next.js 15 safe with next-pwa replacement?** The PWA migration and Next.js upgrade should happen together since next-pwa may not support Next.js 15. Verify `serwist` or the maintained fork supports Next.js 15.

5. **Should deleted utility functions (deleteSession, etc.) be kept for future use?** They have correct implementations. Removing them is cleaner, but they'll need to be re-implemented when session deletion UI is built. Decision: remove now, re-add when needed.

6. **Privacy policy: static page or external link?** A simple static page within the app is easiest to maintain. Alternatively, host on a subdomain for SEO and app store compliance.

7. **Error tracking: Sentry free tier or simpler?** Sentry's free tier (5K events/month) is likely sufficient. Alternative: simple `window.onerror` + `navigator.sendBeacon` to a logging endpoint. Decision depends on whether the team wants an error tracking dashboard.
