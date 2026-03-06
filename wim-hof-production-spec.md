# Wim Hof Method App — Production Feature Specification

### For Public Release (Post-MVP)

---

## Overview

The MVP covers the core loop: breathing sessions, cold timer, retention tracking, safety screens. This document specifies everything needed to take the app to a wider audience — onboarding for complete strangers, content depth, community, monetization, and platform polish. The assumption is the breathing engine is solid and this is now a product, not a personal tool.

---

## 1. Onboarding and New User Experience

The biggest gap between a personal tool and a public app is that strangers arrive with zero context. Onboarding must educate, build trust, and get someone to their first real session within 5 minutes.

### 1.1 Interactive Welcome Flow

A swipeable 5-screen intro (skippable after screen 2) that covers:

- What the method is in one sentence with a striking visual
- The three pillars shown visually (not as a list — as a cycle)
- What they will feel during their first breathing session (tingling, lightheadedness — normalize it immediately or users will stop and think something is wrong)
- Safety acknowledgment screen — still mandatory, but now designed, not just a wall of text
- Choose their starting point: "I'm completely new" / "I know the method, I want to track"

### 1.2 First Session Guided Mode

A special version of the breathing session that plays the first time only:

- Before power breaths: short audio/text explanation of what the user is about to do
- After round 1 completes: a mid-session pause with a "How did that feel?" prompt and a brief explanation of what just happened physically (the tingling, the hold, the ease of it)
- After full session: a detailed debrief screen explaining their retention times and what they mean

### 1.3 Beginner Progression Path

A structured 30-day program visible from day one:

- Week 1: 2 rounds, 30 breaths, no pressure on retention times — focus on learning the breath
- Week 2: 3 rounds, 30 breaths, begin cold shower protocol
- Week 3: 3 rounds, 40 breaths, extend cold exposure
- Week 4: 4 rounds, introduce silence mode, optional ice bath guidance
- Each day has a specific assigned session. User marks it complete. Progress is displayed on a calendar.
- Program can be paused and resumed — not everyone practices daily

---

## 2. Content and Education Layer

For a general audience, the method needs explanation. Without this, people practice incorrectly, feel nothing, and churn.

### 2.1 Video Library

Short-form videos (2–5 minutes each) covering:

- The science of the breathing technique (with simple animated diagrams of CO₂/O₂ dynamics)
- Cold exposure beginner guide: what to expect, how to stand, how to breathe through it
- Common mistakes: exhaling too hard, breathing too fast, panic during the hold
- Advanced topics: combining breathing and cold, the mindset pillar, visualization during retention
- "Why it works" series: alkalosis, adrenaline, brown fat, immune modulation — each a standalone 3-minute explainer

Videos are hosted as short MP4s, playable offline after download. No streaming dependency for core content.

### 2.2 The Method Guide (Text)

A structured reading library with 8 chapters:

1. Who is Wim Hof and why does it matter
2. The breathing technique — complete technical description
3. Cold exposure — from showers to ice baths, step by step
4. The mindset pillar — focus, commitment, stillness
5. The science — what peer-reviewed research shows
6. Common side effects and what they mean
7. Combining all three pillars into a daily practice
8. Advanced practices and edge cases

Each chapter is 600–1,000 words, structured with headers, readable in 4 minutes. Chapters unlock as users complete the first week of practice — this is a progression mechanic, not a paywall.

### 2.3 Session Preparation Guides

Short contextual tips that appear before a session based on context:

- Morning session: "You're breathing on an empty stomach — retention times tend to be longer"
- After exercise: "Your CO₂ baseline is elevated — the first hold may feel shorter"
- Before cold exposure: "Finish your breathing session first. You'll enter the cold with elevated adrenaline."

---

## 3. Programs and Structured Courses

Beyond the 30-day beginner path, offer structured programs as the main content vehicle.

### 3.1 Program Structure

Each program has:

- A title, goal description, and duration (e.g., "30 Days to Cold Confidence — 4 weeks")
- Daily sessions with specific configuration (breathing + cold + mindset task)
- A midpoint check-in (at the halfway point, show progress stats and ask for reflection)
- A completion certificate (shareable image)
- Rest days built in — labeled "Active Rest" with a light guided body scan

### 3.2 Program Library

**Foundation (Free)**
30-day program. The core beginner path described above. Goal: establish the habit.

**Cold Mastery (Premium)**
6-week program. Focuses on cold exposure progression from cold shower to ice bath. Includes breathing session before each cold exposure day, guided cold timers with Wim-style coaching audio, and a weekly "challenge day."

**Stress and Immune Reset (Premium)**
4-week program. Designed around inflammation reduction and stress recovery. Longer breathing sessions (4 rounds, slower pace), cold exposure at specific times of day, and daily mindset exercises. Sessions are 25–30 minutes total.

**Performance and Recovery (Premium)**
For athletes. 5-week program. Breathing sessions timed pre/post workout. Cold exposure for recovery. Integration hooks for Apple Health / Garmin / Strava data (used passively — session is logged against workout data).

**Advanced Practitioner (Premium)**
For people who have completed Foundation. 8 weeks of deeper practice, longer retention targets, more complex cold protocols, guided visualization during holds.

### 3.3 Program Progress Mechanics

- Users can only be enrolled in one program at a time
- Switching programs is allowed but requires confirmation (progress will be lost)
- Completion of any program unlocks a badge visible in the user's profile
- All programs are accessible to browse before purchase — each has a preview of the first 3 days

---

## 4. Community Features

Social features must be designed carefully for a wellness app. The goal is accountability and inspiration, not comparison or performance pressure.

### 4.1 Public Feed (Optional Participation)

- Users opt in to share sessions publicly
- A session post shows: session type, total duration, retention time chart (not raw numbers — visualized as a bar), cold exposure time if applicable, and an optional text reflection
- No like counts visible on posts. Only "resonates" (a single gentle reaction) and comments.
- Feed is curated by recency, not by engagement score — prevents virality mechanics from dominating

### 4.2 Challenges

Monthly community challenges:

- "30-day cold streak" — log cold exposure every day for 30 days
- "Retention breakthrough" — improve your average retention time by 20% over 4 weeks
- "Full commitment week" — complete all three pillars every day for 7 days
- Participation is opt-in, progress is tracked automatically against logged sessions
- A leaderboard is shown for challenges — but ranked by consistency (sessions completed / sessions required), not by performance metrics like retention time

### 4.3 Accountability Partners

- Users can connect with one other user as an "accountability partner"
- They see each other's weekly consistency scores (not detailed session data unless shared)
- Can send a "nudge" (a gentle push notification: "Your partner hasn't practiced in 2 days")
- Weekly summary sent to both partners: sessions completed, cold streak, any milestones

### 4.4 Community Groups

Topic-based groups users can join:

- Beginners
- Cold water swimmers
- Athletes and recovery
- Stress and anxiety
- Specific geographic groups (auto-suggested based on location, opt-in)
- Groups have a shared feed, a weekly challenge, and a pinned resource post
- Moderation tools: report, mute, admin role for group creator

---

## 5. Personalization and Adaptive Features

### 5.1 Practice Profile

After onboarding, the user sets:

- Primary goal (stress reduction / athletic performance / immune health / curiosity / cold exposure focus)
- Available time per day (10 min / 20 min / 30 min+)
- Experience level (complete beginner / some experience / regular practitioner)
- Preferred session time (morning / midday / evening)

The app uses these to recommend programs, set default session configs, and time notifications.

### 5.2 Adaptive Session Recommendations

After 2 weeks of data, the app begins making smart suggestions:

- "Your retention times are consistently longer on days you practice in the morning — consider shifting your session time"
- "You've completed 3 weeks of 3-round sessions. Ready to try 4 rounds?"
- "Your cold streak broke after 12 days last month. This week, a reminder is set 30 minutes earlier."
  These are surfaced as a weekly insight card, not as constant nudges.

### 5.3 Custom Session Builder (Enhanced)

Building on the MVP's basic custom builder:

- Set different breath counts per round (round 1: 30, round 2: 40, round 3: 40)
- Add a mindset prompt to any round (text displayed during retention hold)
- Choose retention mode: free hold (tap to end) OR target-based (app warns you when approaching a personal best)
- Add a post-breathing cold timer that launches automatically after the last round
- Save as named presets, share a preset via link

---

## 6. Biometric Integration (Full Implementation)

### 6.1 Apple Health / Google Fit

- Write: breathing sessions as Mindful Minutes, cold exposure as workout sessions
- Read: resting heart rate trends overlaid on retention time charts, sleep score overlaid on morning session performance
- HRV (heart rate variability) correlation: if HealthKit provides HRV data, display a weekly chart of HRV alongside practice consistency

### 6.2 Apple Watch / Wear OS

- Native watch app with the breathing session (simplified — no video, tone guidance only)
- Live heart rate displayed during session
- Haptic feedback at phase transitions (gentle for inhale, firm tap for hold end)
- Cold timer on watch face complication
- Session completion logged from watch even if phone is out of reach

### 6.3 Pulse Oximeter (SpO2)

- During retention phase, if device supports SpO2: display real-time oxygen saturation
- Log minimum SpO2 per retention hold
- Chart SpO2 over time — watching it recover as the user becomes more experienced is a powerful engagement mechanic
- Warning display if SpO2 drops below 50% (rare, but show a non-alarmist informational note)

### 6.4 Third-Party Devices

- Oura Ring: import recovery score, sleep data, HRV — display alongside session data
- Garmin / Polar: import workout data for the athlete program
- Whoop: import strain and recovery

---

## 7. Monetization

### 7.1 Model: Freemium with Subscription

**Free tier includes:**

- Full breathing engine (all configurations)
- Cold shower timer
- 30-day beginner program
- Session history (last 60 days)
- Basic retention time chart
- Community feed (read-only)

**Premium subscription includes:**

- All programs (Cold Mastery, Stress Reset, Performance, Advanced)
- Full session history (unlimited)
- Advanced analytics (all charts, HRV overlay, SpO2 logging)
- Video library (full access)
- Custom session builder (full version)
- Community participation (posting, challenges, groups)
- Watch app
- Accountability partner feature

**Pricing:**

- Monthly: $7.99/month
- Annual: $49.99/year (~$4.17/month, positioned as the recommended option)
- Lifetime: $119 one-time (available during onboarding and occasionally on sale)

### 7.2 Free Trial

- 14-day free trial of Premium on signup, no credit card required
- Trial reminder at day 10 and day 13
- If user completes the 30-day beginner program, offer a discounted annual plan (15% off) at completion

### 7.3 No Ads, Ever

The experience is incompatible with ads. Breathing sessions require focus. Cold timers require calm. There must be no advertising in any form, including "suggested content" that is paid placement. State this explicitly in marketing.

---

## 8. Notifications and Engagement

### 8.1 Smart Daily Reminder

- Default: one reminder per day at user's preferred practice time
- If the user practiced within the last 2 hours, the reminder does not fire
- Reminders rotate through 12 distinct messages (not the same "Time to practice!" every day)
- Messages are factual and grounded, not motivational-poster language: "Your retention average this week is 2:14. A session today will keep the streak."

### 8.2 Milestone Notifications

- First retention over 2 minutes
- First full cold shower (3+ minutes cold)
- 7-day streak, 30-day streak, 100-day streak
- Personal best retention time broken
- Program completion
- Each milestone has a shareable card (optional)

### 8.3 Weekly Summary (Push or In-App)

Delivered Monday morning:

- Sessions last week vs week before
- Average retention time trend (up/down/flat)
- Cold exposure total minutes
- Current streak
- One actionable suggestion ("Try adding a 4th round this week")

---

## 9. Sharing and Social Proof

### 9.1 Shareable Session Cards

After any session, generate a shareable image card with:

- Session type and duration
- Retention time visualization (not raw numbers — a clean bar chart or ring)
- Day streak badge
- App name/logo (subtle, bottom corner)
- Designed to look good in Instagram Stories format (9:16) and square (1:1)

### 9.2 Progress Screenshots

Weekly and monthly progress summaries exportable as images:

- Retention time graph
- Cold streak calendar
- Program completion badge if applicable
- Designed for sharing without exposing personal data beyond what the user chooses

### 9.3 Referral Program

- Each user gets a unique referral link
- Referred user gets 30 days of Premium free (instead of 14)
- Referring user gets 1 month of Premium free per successful conversion (someone who subscribes after the trial)
- Max referral benefit: 6 months free per year

---

## 10. Accessibility and Internationalization

### 10.1 Accessibility

- Full VoiceOver (iOS) and TalkBack (Android) support for all interactive elements
- Breathing visual animation must have an alternative mode for users with vestibular disorders (remove expanding/contracting animation, replace with simple color shift)
- All audio guidance available with on-screen text equivalent
- Minimum text size compliance (WCAG AA)
- Haptic-only mode: the full session can be guided through haptics alone (for deaf users or anyone who wants silent + no visual)

### 10.2 Languages

Launch with English. Phase 2 (within 6 months of launch):

- Dutch (Wim Hof's home country — high-affinity audience)
- German
- French
- Spanish
- Portuguese (Brazil — large wellness app market)

All UI strings must be externalized from day one even if only English is live. Do not hardcode any user-facing text.

### 10.3 Localization Beyond Translation

- Temperature units: Celsius / Fahrenheit toggle in settings
- Date format: auto-detect locale
- Subscription pricing: localized pricing in App Store / Play Store (not manual currency conversion)

---

## 11. Technical and Platform Requirements

### 11.1 Session Reliability

The breathing session is the core product. It must never fail mid-session:

- Foreground service on Android to prevent OS from killing the timer
- Background audio mode on iOS locked in
- Screen stays on during active session (wake lock)
- If app is backgrounded mid-session: audio continues, session resumes on return
- If phone call interrupts: session pauses, resumes on call end with a confirmation screen

### 11.2 Offline Mode

Every feature except community must work fully offline:

- All breathing sessions
- Cold timer
- All downloaded programs and videos
- Session history and analytics
- Settings and configurations

Community features fail gracefully with a "You're offline — your session will be shared when you reconnect" message.

### 11.3 Data and Privacy

- No account required for Free tier — all data stored locally only
- Account required only for Premium features and community
- Account signup: email only or Sign in with Apple / Google (no social login from Meta)
- Session data never sold or used for advertising
- GDPR compliant: data export and deletion available in settings
- No behavioral analytics beyond session completion rates (no screen recording, no heatmaps on user data screens)

### 11.4 Performance Targets

- Cold launch to ready state: under 2 seconds on a 3-year-old mid-range device
- Breathing session launch: under 1 second from tap
- No dropped frames during breathing animation (60fps target, 30fps minimum)
- App size: under 80MB on install (videos downloaded on demand)

---

## 12. App Store and Marketing

### 12.1 App Store Optimization

- Primary category: Health & Fitness
- Secondary: Meditation
- Keywords: cold therapy, breathing exercise, ice bath, stress relief, Wim Hof, breathwork, cold shower, immune health
- Screenshots: show the breathing session in action, the analytics screen, the cold timer — in that order
- Preview video: 30 seconds. Show a full breathing round condensed, then cold timer, then the retention time chart improving over 4 weeks.

### 12.2 Ratings and Reviews

- Prompt for rating after: completing the 30-day program, breaking a personal best, completing a 30-day streak
- Never prompt during or immediately after a session
- In-app feedback form available in settings (bug report / feature request / general feedback)
- Respond to all 1–3 star reviews within 48 hours

### 12.3 Website (Required at Launch)

A single landing page minimum:

- Method explanation in plain language (3 paragraphs)
- App screenshots or demo video
- Download buttons (App Store / Play Store)
- Privacy policy and terms of service (required for app stores)
- An email capture for a launch waitlist or newsletter
- A /science page with links to actual research papers

---

## Feature Priority for Production Launch

| Feature                                  | Priority | Effort |
| ---------------------------------------- | -------- | ------ |
| Onboarding flow + first session guide    | Critical | Medium |
| 30-day beginner program                  | Critical | Medium |
| Video library (5–8 core videos)          | High     | High   |
| Community feed + challenges              | High     | High   |
| Advanced analytics                       | High     | Low    |
| Subscription + payment                   | Critical | Medium |
| Apple Watch app                          | Medium   | High   |
| SpO2 integration                         | Medium   | Medium |
| Shareable session cards                  | Medium   | Low    |
| Accountability partners                  | Medium   | Medium |
| Additional programs (Cold Mastery, etc.) | High     | High   |
| Referral program                         | Low      | Medium |
| Full internationalization                | Low      | High   |
