# SPEC-v4-draft.md — Wim Hof Method App v4

**Based on:** UX audit, design system audit, CI audit (2026-03-06)
**Theme:** Polish & Precision — no new features, only making existing ones feel right

---

## 1. Agent Role & Mindset

You are a senior frontend engineer doing a UX polish pass on a production PWA. You value:

- **Mobile-first** — every change must be verified at 375px and 320px widths
- **Minimal diff** — fix only what is scoped; do not refactor for style
- **Touch-first interactions** — every tap target, gesture, and feedback must feel native
- **Consistency over novelty** — use existing patterns, unify them, don't invent new ones

---

## 2. Technology Stack

Same as v3. No new dependencies unless replacing an existing pattern:

| Layer     | Technology                           | Notes                                                 |
| --------- | ------------------------------------ | ----------------------------------------------------- |
| Framework | Next.js 15.x (upgraded in v3)        | App Router                                            |
| UI        | React 18, Tailwind CSS 3.4           | Dark mode via `class` strategy (changed from `media`) |
| Animation | CSS keyframes + Tailwind transitions | Framer-motion removed in v3                           |
| Charts    | Recharts (lazy-loaded in v3)         | No replacement in v4                                  |
| Storage   | IndexedDB via `idb@8`                | No changes                                            |
| PWA       | Serwist (migrated in v3)             | No changes                                            |
| Language  | TypeScript strict mode               | No changes                                            |

---

## 3. Architecture Principles

Inherited from v3, plus:

1. **Design tokens over raw values** — colors, spacing, typography, and animation timing defined in `tailwind.config.ts` and consumed via class names. No hardcoded hex, px, or ms values in components.
2. **Touch target minimum** — every interactive element must be at least 44x44px. Use padding to expand small visual elements to meet this threshold.
3. **Viewport-relative sizing** — circles, modals, and large visual elements must scale with viewport width. No hardcoded pixel dimensions for layout-critical elements.

---

## 4. Design System Specification

### 4.1 Color Tokens

Extend `tailwind.config.ts` with semantic color families. All components must use these tokens instead of raw Tailwind color classes.

```
colors: {
  brand: { DEFAULT, light, dark }        // sky-500 family — primary actions, breathing theme
  cold: { DEFAULT, light, dark }          // cyan-500 family — cold exposure theme
  success: { DEFAULT, light, dark }       // emerald-500 family — completion, recovery phase
  warning: { DEFAULT, light, dark }       // amber-500 family — alerts, milestone toasts
  danger: { DEFAULT, light, dark }        // red-500 family — destructive actions
  surface: { base, raised, overlay }      // gray-950/900/800 family — backgrounds
  on-surface: { DEFAULT, muted, faint }   // white/gray-400/gray-600 — text on dark surfaces
  on-surface-light: { DEFAULT, muted }    // gray-900/gray-500 — text on light surfaces
}
```

**Migration rule:** Replace all raw color classes (e.g., `text-sky-500`, `bg-cyan-400`, `border-gray-800`) with token classes (e.g., `text-brand`, `bg-cold`, `border-surface-overlay`). Inline hex values must be eliminated entirely.

### 4.2 Typography Scale

Define consistent text styles used across the app. No ad-hoc font size combinations.

| Token             | Tailwind Classes                                         | Usage                        |
| ----------------- | -------------------------------------------------------- | ---------------------------- |
| `heading-page`    | `text-2xl font-bold`                                     | Page titles                  |
| `heading-section` | `text-sm font-semibold uppercase tracking-wider`         | Section headers              |
| `heading-card`    | `text-lg font-semibold`                                  | Card titles, modal headers   |
| `body`            | `text-sm`                                                | Default body text            |
| `body-small`      | `text-xs`                                                | Secondary text, descriptions |
| `caption`         | `text-xs text-on-surface-muted uppercase tracking-wider` | Labels above inputs          |
| `stat-large`      | `text-7xl font-bold tabular-nums`                        | Primary timer display        |
| `stat-medium`     | `text-3xl font-bold tabular-nums`                        | Summary numbers              |
| `stat-small`      | `text-xl font-semibold tabular-nums`                     | Inline stats                 |

These do not need to be Tailwind plugins — they are documentation for consistent usage. Components should match these patterns.

### 4.3 Spacing Tokens

Standardize recurring spacing patterns:

| Token          | Value                                         | Usage                        |
| -------------- | --------------------------------------------- | ---------------------------- |
| `page-x`       | `px-4` (16px)                                 | Horizontal page padding      |
| `page-top`     | `pt-8` (32px)                                 | Top padding below status bar |
| `page-bottom`  | `pb-[calc(5rem+env(safe-area-inset-bottom))]` | Bottom padding above nav     |
| `section-gap`  | `gap-6` (24px)                                | Between major page sections  |
| `item-gap`     | `gap-3` (12px)                                | Between items in a list/grid |
| `card-padding` | `p-4` (16px)                                  | Internal card padding        |

**Migration rule:** Replace all per-page `pb-20`, `pb-24`, `pb-28` with the unified `page-bottom` token. Remove the `pb-20` from `AppShell.tsx` and apply `page-bottom` in each page's container instead, so pages own their own scroll padding.

### 4.4 Animation Timing

Define three timing tiers:

| Token    | Duration | Easing      | Usage                               |
| -------- | -------- | ----------- | ----------------------------------- |
| `fast`   | 150ms    | ease-out    | Hover/focus feedback, color changes |
| `normal` | 250ms    | ease-out    | Page transitions, component mount   |
| `slow`   | 400ms    | ease-in-out | Modal open/close, breathing circle  |

Add these as Tailwind `transitionDuration` and `animation` extensions. All `transition-*` and `animate-*` classes should use these tokens.

---

## 5. Features & Acceptance Criteria

### F-01: Implement design color tokens

**Problem:** 15+ color families used across components with no central definition. `sky-500`, `cyan-500`, `cyan-400`, `emerald-500`, `amber-500`, `blue-500`, `green-400`, `yellow-400`, `orange-400`, `purple-700` all used directly.
**Fix:** Add semantic color tokens to `tailwind.config.ts` per section 4.1. Replace all raw color classes across all components.
**AC:**

- [ ] All semantic color families defined in `tailwind.config.ts`
- [ ] Zero raw Tailwind color classes (sky-_, cyan-_, emerald-\*, etc.) remain in component files
- [ ] Zero inline hex values remain in component files
- [ ] Visual appearance unchanged (colors map to same values)
- [ ] Dark mode variants work correctly with new tokens

### F-02: Implement typography consistency

**Problem:** Ad-hoc font sizes — `text-4xl font-bold` in SessionComplete, `text-2xl` in some pages, `text-xl` in others for the same role. Labels use `text-xs` in some places, `text-sm` in others.
**Fix:** Audit all text styling and align to the type scale in section 4.2.
**AC:**

- [ ] All page titles use `heading-page` pattern
- [ ] All section headers use `heading-section` pattern
- [ ] All timer/stat displays use appropriate `stat-*` pattern
- [ ] No orphaned font-size combinations that don't match the scale

### F-03: Standardize spacing and page layout

**Problem:** Bottom padding varies per page (`pb-20` in AppShell, `pb-24` in breathe/cold/progress, `pb-28` in settings). Bottom nav height + safe area not consistently accounted for. Content sometimes hidden behind nav.
**Fix:** Apply unified `page-bottom` spacing per section 4.3. Remove `pb-20` from `AppShell.tsx`. Each page container uses the standard page padding pattern.
**AC:**

- [ ] No content hidden behind bottom nav on any page
- [ ] Consistent bottom padding across all pages
- [ ] Safe area inset respected on all pages (not just BottomNav)
- [ ] Verified on iPhone SE (320px), iPhone 15 (393px), and iPhone 15 Pro Max (430px) viewports

### F-04: Retention hold interaction redesign

**Problem:** Single `onClick` on the "End breath hold" button in `RetentionHold.tsx`. One accidental tap during a 3-minute retention immediately ends it. No undo, no confirmation, no protection.
**Fix:** Replace single-tap with a **long-press gesture** (hold for 500ms to end). Show a circular fill animation around the button during the press to indicate progress. If the user lifts early, nothing happens. Also support double-tap as an alternative (two taps within 400ms).
**AC:**

- [ ] Tapping the button once does nothing (no accidental end)
- [ ] Holding the button for 500ms ends retention with haptic feedback
- [ ] Visual fill indicator shows hold progress
- [ ] Double-tap (two taps within 400ms) also ends retention as alternative
- [ ] Screen reader users can still end retention via single tap with aria instructions

### F-05: Increase all touch targets to 44x44px minimum

**Problem:** Multiple interactive elements below WCAG minimum: `OptionButton` (sm) at 24x20px, preset delete button at ~14x14px, cold type buttons at 32x28px, `Button` (sm) at 24x20px.
**Fix:** Increase padding on all small interactive elements. Replace text "Delete" button for presets with a 44x44px icon button. Audit every `onClick`/`onPress`/`button` element.
**AC:**

- [ ] Every interactive element is at least 44x44px (including padding)
- [ ] `OptionButton` (sm) removed or increased to minimum
- [ ] Preset delete uses icon button with `aria-label`
- [ ] Verified with browser DevTools element inspector on all pages

### F-06: Responsive breathing circle

**Problem:** `BreathingCircle.tsx` uses hardcoded `width: 200, height: 200` (pixels). On iPhone SE (320px) this is 62% of usable width. CSS animation expansion (to 1.6x scale in v3) may cause layout shift.
**Fix:** Replace hardcoded dimensions with viewport-relative sizing: `min(200px, 45vw)`. Ensure animation scale stays within container bounds. Apply same fix to the reduced-motion progress bar variant.
**AC:**

- [ ] Circle scales proportionally on 320px, 375px, 393px, and 430px viewports
- [ ] Animation does not cause horizontal overflow or layout shift
- [ ] Circle remains visually centered at all sizes
- [ ] Reduced-motion progress bar also responsive

### F-07: Responsive cold timer circle

**Problem:** `ColdTimer.tsx` `CircularProgress` uses hardcoded `radius = 110` (220px diameter). On 320px phones, this is 69% of viewport width.
**Fix:** Make radius viewport-relative. Use a container query or `min(110, 17.5vw * 2)` approach. Timer text inside the circle must also scale.
**AC:**

- [ ] Cold timer circle scales on all viewport widths
- [ ] Timer text remains readable at smallest size
- [ ] SVG stroke proportions maintained

### F-08: Phase transition animations

**Problem:** Breathing session phase transitions (PowerBreaths -> RetentionHold -> RecoveryBreath) are abrupt component swaps with no visual continuity. Users may not notice the phase changed if distracted.
**Fix:** Add a 250ms crossfade transition between phases in `SessionRunner.tsx`. Use the existing `animate-page-enter` keyframe or a new `animate-phase-fade` keyframe. Phase name announcement via `aria-live` should fire after the transition completes.
**AC:**

- [ ] Smooth visual transition between all phases
- [ ] No layout jump during transition
- [ ] `aria-live` announcement fires after transition, not during
- [ ] Respects reduced motion preference (instant swap if reduced motion)

### F-09: Modal and overlay mobile safety

**Problem:** `Modal.tsx` has no `max-height` constraint. On short phones (iPhone SE in landscape, or with keyboard open), modals can overflow the viewport with no scroll.
**Fix:** Add `max-h-[calc(100vh-2rem)]` and `overflow-y-auto` to modal content. Apply same fix to `GuidedOverlay`, `WeeklySummary`, and `MilestoneToast` overlays.
**AC:**

- [ ] All modals scrollable when content exceeds viewport height
- [ ] Modal content not obscured by keyboard on input focus
- [ ] Close/dismiss button always visible (sticky at top or bottom)

### F-10: Settings preset delete layout fix

**Problem:** "Delete" text button in settings custom preset list overflows on 320px phones. Button and preset name compete for horizontal space.
**Fix:** Replace text "Delete" button with a 44x44px trash icon button with `aria-label="Delete {preset name}"`. Alternatively, implement swipe-to-delete.
**AC:**

- [ ] Delete action accessible on all viewport widths
- [ ] Touch target is 44x44px minimum
- [ ] Accessible label includes preset name for screen readers

### F-11: Dark mode user toggle

**Problem:** Dark mode is system-preference only (`darkMode: "media"` in Tailwind config). Users who want dark mode during daytime or light mode at night have no control.
**Fix:** Switch Tailwind to `darkMode: "class"` strategy. Add a three-way toggle in settings: System / Light / Dark. Store preference in IndexedDB preferences. Apply the `dark` class to `<html>` element based on preference (system = follow `prefers-color-scheme`, light = never, dark = always). Initialize from stored preference before first paint to prevent flash.
**AC:**

- [ ] Three-way toggle in settings (System / Light / Dark)
- [ ] "System" follows OS preference (default)
- [ ] "Light" forces light mode regardless of OS setting
- [ ] "Dark" forces dark mode regardless of OS setting
- [ ] Preference persists across sessions
- [ ] No flash of wrong theme on load (inline script in `<head>`)
- [ ] All existing `dark:` classes continue to work

### F-12: Unify animation system

**Problem:** After v3 removes framer-motion, two animation approaches remain: CSS keyframes in `globals.css` and scattered Tailwind `transition-*` classes with inconsistent durations.
**Fix:** Define animation timing tokens in `tailwind.config.ts` per section 4.4. Replace all hardcoded durations (`duration-300`, `duration-200`, custom ms values) with token-based classes. Ensure all animations respect `prefers-reduced-motion`.
**AC:**

- [ ] Animation timing tokens defined in Tailwind config
- [ ] No hardcoded duration values in component classes
- [ ] All animations disabled when reduced motion is preferred
- [ ] Breathing circle, cold timer, page transitions, toasts all use token durations

### F-13: Icon consistency pass

**Problem:** Icons are a mix of inline SVG (BottomNav, BreathingConfig delete), emoji (MilestoneToast: lungs, snowflake, fire, trophy, medal), and HTML entities. No consistent sizing or approach.
**Fix:** Standardize on inline SVG for all icons. Create small SVG icon components or a shared `Icon.tsx` wrapper with size props (sm: 16px, md: 24px, lg: 32px). Replace emoji in `MilestoneToast.tsx` with SVG icons for cross-platform rendering consistency.
**AC:**

- [ ] All icons are inline SVG (no emoji, no HTML entities in UI)
- [ ] Consistent sizing: 16px inline, 24px standalone, 32px nav
- [ ] Icons use `currentColor` for theme-aware coloring
- [ ] MilestoneToast renders identically on iOS and Android

### F-14: Bottom nav safe area and height fix

**Problem:** `BottomNav.tsx` uses `pb-[env(safe-area-inset-bottom)]` but the nav's total height isn't communicated to page content. Pages guess with different `pb-*` values.
**Fix:** Give BottomNav a CSS custom property for its height. Pages reference this for their bottom padding. Ensure the nav height includes safe area inset.
**AC:**

- [ ] BottomNav height is a single source of truth
- [ ] All pages use the same bottom padding calculation
- [ ] No content hidden behind nav on any device
- [ ] Dynamic Island and home indicator both accounted for

### F-15: Add ESLint to CI pipeline

**Problem:** ESLint is configured (`.eslintrc.json`) but not run in `.github/workflows/ci.yml`. Lint errors can be committed without detection.
**Fix:** Add `npm run lint` step to CI workflow after type-check and before build. Enhance ESLint config with `eslint-plugin-react-hooks` exhaustive-deps rule and `no-unused-vars` as error.
**AC:**

- [ ] CI runs `npm run lint` on every push and PR
- [ ] `eslint-plugin-react-hooks` exhaustive-deps rule enabled
- [ ] `no-unused-vars` set to error
- [ ] CI fails on lint errors

### F-16: Add Prettier for code formatting

**Problem:** No code formatter configured. Formatting is inconsistent across files (spacing, quote style, trailing commas vary).
**Fix:** Add Prettier with a `.prettierrc` config. Add `format` and `format:check` scripts to `package.json`. Add `format:check` to CI.
**AC:**

- [ ] `.prettierrc` config file exists
- [ ] `npm run format:check` passes on entire codebase
- [ ] CI runs format check
- [ ] One-time format commit applied to codebase

### F-17: Add Vitest for unit testing

**Problem:** Zero tests exist. Critical business logic (streak calculation, retention averaging, milestone detection, data validation) has no test coverage.
**Fix:** Install Vitest. Add `test` and `test:coverage` scripts. Write tests for `lib/analytics.ts` (streak, averaging, week boundaries), `lib/milestones.ts` (detection logic, repeatable milestones), and `lib/storage.ts` (data validation, migration). Add test step to CI.
**AC:**

- [ ] Vitest configured with TypeScript support
- [ ] Tests exist for all functions in `lib/analytics.ts`
- [ ] Tests exist for milestone detection in `lib/milestones.ts`
- [ ] Tests exist for data validation in `lib/storage.ts`
- [ ] `npm test` runs in CI
- [ ] Minimum 80% coverage on `lib/` directory

### F-18: Add pre-commit hooks

**Problem:** No pre-commit validation. Developers (and Ralph) can commit code that fails lint or type-check.
**Fix:** Install Husky and lint-staged. Pre-commit hook runs: lint-staged (Prettier + ESLint on staged files) and `tsc --noEmit`.
**AC:**

- [ ] Husky installed and configured
- [ ] Pre-commit hook runs Prettier and ESLint on staged files
- [ ] Pre-commit hook runs type-check
- [ ] Hook can be bypassed with `--no-verify` for emergencies only

---

## 6. Design & UX Guidelines

### Mobile Viewports to Test

| Device            | Width | Notes                                 |
| ----------------- | ----- | ------------------------------------- |
| iPhone SE         | 320px | Smallest target. Everything must fit. |
| iPhone 13 mini    | 375px | Common small phone                    |
| iPhone 15         | 393px | Current mainstream                    |
| iPhone 15 Pro Max | 430px | Largest common phone                  |

All features must be verified at 320px minimum. No horizontal scroll on any page.

### Touch Interaction Rules

- **Minimum target:** 44x44px for all interactive elements (WCAG 2.5.5)
- **Destructive actions:** require confirmation (long-press, swipe, or modal)
- **During active sessions:** protect against accidental taps (retention hold, cold timer)
- **Haptic feedback:** on all phase transitions, milestones, and session completion

### Animation Rules

- All animations must respect `prefers-reduced-motion` AND the app's reduced motion toggle
- Phase transitions: 250ms crossfade (or instant if reduced motion)
- Interactive feedback: 150ms (hover, focus, press states)
- Modal/overlay: 250ms ease-out open, 200ms ease-in close
- No animation should exceed 400ms

---

## 7. Performance Budget

Same as v3 targets (should be met after v3 dependency cleanup):

| Metric                   | Target  |
| ------------------------ | ------- |
| First Contentful Paint   | < 1.5s  |
| JS bundle (gzipped)      | < 150KB |
| Largest Contentful Paint | < 2.5s  |
| Lighthouse Performance   | > 90    |
| Lighthouse PWA           | Pass    |
| Lighthouse Accessibility | > 95    |

v4 should not increase bundle size. Design token migration is zero-runtime. Vitest is dev-only.

---

## 8. Task Ordering Strategy

Tasks should be ordered for Ralph execution:

1. **Design tokens first** (F-01, F-02, F-03) — establishes the foundation all other tasks build on
2. **Interaction fixes** (F-04, F-05, F-06, F-07, F-08, F-09, F-10) — uses new tokens
3. **Theme and animation** (F-11, F-12, F-13, F-14) — builds on token system
4. **CI and testing last** (F-15, F-16, F-17, F-18) — validates everything

CI tasks (F-15 through F-18) modify the development workflow. Ralph should handle F-15 and F-16 (adding config files and CI steps). F-17 (writing tests) is ralph-compatible but may need manual review. F-18 (pre-commit hooks) will affect Ralph's own commits — the `ralph.sh` script should be updated to use `--no-verify` if hooks block automated commits, or hooks should be configured to pass on Ralph's typical changes.

---

## 9. Ralph Script Considerations

### Pre-commit hooks (F-18) interaction with Ralph

If Husky pre-commit hooks are added, `ralph.sh` will trigger them on every `git commit`. This is **desirable** — it catches lint/type errors before they're pushed. However, if a hook fails, Ralph's current retry logic (in `ralph-task.sh`) only retries the build, not the commit. Consider:

- Option A: Let hooks run. If commit fails, Ralph's task fails and notifies. Manual fix needed.
- Option B: Add `|| true` to the lint-staged step so hooks warn but don't block.
- Option C: Skip hooks in ralph.sh with `--no-verify` (loses the safety benefit).

**Recommendation:** Option A. Ralph should respect the same quality bar as manual commits.

### Prettier formatting (F-16)

The initial Prettier formatting commit will touch many files. This should be done as a standalone task, not mixed with logic changes. Ralph can handle this — the task just runs `npx prettier --write .` and commits.

---

## 10. Out of Scope (v4)

- New features, screens, or capabilities
- Cloud sync, accounts, authentication
- Multi-language translations
- E2E tests (Playwright/Cypress) — defer to v5
- Storybook or component documentation site
- New chart library or chart redesign
- Service worker changes
- Data model or IndexedDB schema changes (except dark mode preference)
