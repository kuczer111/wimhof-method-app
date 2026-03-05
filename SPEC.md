# Wim Hof Method — App Feature Specification

---

## Part 1: The Method Explained

### What is the Wim Hof Method?

The Wim Hof Method (WHM) is a system developed by Dutch athlete Wim Hof ("The Iceman") built around **three pillars**: controlled breathing, cold exposure, and meditation/mindset training. The core claim — supported by a growing body of peer-reviewed research — is that deliberate practice of these three pillars allows a person to consciously influence the autonomic nervous system and immune response, which classical physiology long considered impossible.

A 2014 study published in PNAS demonstrated that trained practitioners could voluntarily suppress immune response to endotoxin injection, significantly reducing symptoms compared to a control group. The mechanism is largely explained through alkalosis (blood pH increase), adrenaline release, and modulation of inflammatory cytokines.

---

### Pillar 1: Breathing Technique

This is the technical heart of the method. It involves a series of controlled hyperventilation cycles followed by voluntary breath retention.

#### The Full Breathing Round

**Phase 1 — Power Breaths (30–40 repetitions)**
The practitioner takes a deep, full breath in and then releases it passively, without force. Repeated 30–40 times. The breathing pace is roughly one breath every 1.5–2 seconds.

Physiological effect: CO₂ levels drop sharply. Blood pH rises. Tingling sensations in hands, feet, and face. Some people feel lightheadedness or euphoria.

**Phase 2 — Retention (exhale hold)**
After the last power breath, the practitioner exhales and holds — lungs mostly empty. Typically 1–3 minutes for beginners, up to 3–5+ minutes for experienced practitioners.

**Phase 3 — Recovery Breath**
One very deep inhale, held for 10–15 seconds. Re-oxygenates the blood rapidly. Completes one round. A standard session consists of 3–4 rounds.

#### Safety Rules for Breathing
- Never practice in or near water
- Never practice while driving or operating machinery
- Do not force the exhale hold
- Lie down or sit — fainting is possible
- Contraindicated for epilepsy, cardiac conditions, high blood pressure, pregnancy

---

### Pillar 2: Cold Exposure

#### Cold Shower Protocol
- Week 1–2: End warm shower with 30 seconds cold
- Week 3–4: 1 minute cold at the end
- Week 5–8: 2 minutes cold
- Month 2+: Full cold showers (2–3 minutes)

#### Physiological Benefits
- Increased norepinephrine (up to 300%)
- Reduced inflammatory markers
- Improved insulin sensitivity
- Enhanced mood
- Activation of brown fat thermogenesis

---

### Pillar 3: Meditation and Mindset

- Concentration and commitment during sessions
- Body scanning — awareness of internal sensation
- Visualization during retention holds
- Sessions done in silence, full attention

---

## Part 2: App Feature Specification

### Module 1 — Guided Breathing Sessions

#### 1.1 Breathing Round Engine
- Configurable rounds (default 3, range 1–5)
- Three phases: power breaths, retention hold, recovery breath hold
- Distinct audio and visual cues per phase

#### 1.2 Breathing Pace Control
- Slow (2.5s), Medium (2s), Fast (1.5s)
- Visual animation locked to pace
- Audio: voice prompts or tones

#### 1.3 Breath Count Configuration
- Default 30, options: 20, 30, 40
- Current breath number displayed prominently

#### 1.4 Retention Timer and Tracking
- Elapsed time display (not countdown)
- User manually ends hold by tapping
- Retention time recorded per round
- End of session shows all retention times

#### 1.5 Recovery Breath Hold
- Fixed 15-second countdown
- Distinct animation/color
- Auto-advance to next round

#### 1.6 Session Completion Screen
- Total duration
- All retention times by round
- Personal best per round position
- Note/feeling log (1–5 scale + optional text)

---

### Module 2 — Cold Exposure Tracker

#### 2.1 Cold Shower Timer
- Configurable target (30s → 3 min)
- Visual progress bar + elapsed time
- Alert at target, option to continue

#### 2.2 Cold Log
- Date, duration, temperature (optional), type, rating
- Running streak counter

#### 2.3 Progressive Protocol Guide
- 8-week progression plan
- Mark each day complete
- Milestones

---

### Module 3 — Progress and Analytics

#### 3.1 Breathing Progress Charts
- Retention time over time (line chart)
- Average per week, personal record
- Total sessions

#### 3.2 Cold Exposure Stats
- Total minutes, streak calendar (heatmap)
- Distribution by type

#### 3.3 Combined Dashboard
- Weekly view
- Consistency score
- Monthly summary

---

### Module 4 — Session Presets

#### 4.1 Preset Sessions
- Beginner, Standard, Deep Practice, Morning Activation

#### 4.2 Custom Session Builder
- Save up to 5 named custom presets

---

### Module 5 — Safety and Education

#### 5.1 Mandatory Onboarding Safety Screen
- Cannot be skipped on first launch
- Critical safety rules listed
- User must acknowledge

#### 5.2 In-Session Safety Reminder
- Before every breathing session
- Dismiss button required

#### 5.3 Method Education Library
- Articles on each pillar (500–800 words)
- FAQ: tingling, lightheadedness, muscle cramps

---

### Module 6 — Notifications and Habit Support

- Daily reminders for breathing and cold exposure
- Streak milestone alerts
- Gentle nudge after 2 days no session

---

### Module 7 — Audio Engine

- Voice guidance, tone guidance, or silent mode
- Background ambient soundscape optional
- Must work with screen locked
- Background audio required

---

### Module 8 — Optional: Biometric Integration

- Heart rate via Apple Watch / Wear OS
- SpO2 display during retention
- Apple Health / Google Fit sync

---

## Technical Notes

| Area | Recommendation |
|---|---|
| Platform | PWA — Next.js + TypeScript + Tailwind CSS |
| Auth | Clerk |
| Local storage | localStorage + IndexedDB for session history |
| Charts | Recharts |
| Audio | Web Audio API |
| Offline-first | All core features work offline |
| PWA | Installable on iPhone home screen |

---

## MVP Scope (Build First)

1. Breathing session engine (Module 1, complete)
2. Safety screens (Module 5.1 and 5.2)
3. Session history with retention times (Module 3.1, basic)
4. Cold shower timer (Module 2.1)
5. Tone audio guidance (Module 7, tones only)
