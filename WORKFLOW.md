# Workflow Guide

This project uses an automated pipeline to plan, execute, and QA tasks via Claude CLI.

## Files Overview

| File               | Purpose                                                                         |
| ------------------ | ------------------------------------------------------------------------------- |
| `config.sh`        | Shared utilities: notify(), log(), fmt_elapsed(), heartbeat functions           |
| `ralph-plan.sh`    | Generates tasks in TASKS.md from a spec or QA findings                          |
| `ralph.sh`         | Loops through unchecked tasks, delegates to ralph-task.sh, commits & pushes     |
| `ralph-task.sh`    | Executes a single task via Claude CLI with build verification (up to 8 retries) |
| `qa.sh`            | Runs automated QA testing against the deployed app                              |
| `research-plan.sh` | Takes a topic, asks context questions, breaks into subtopics                    |
| `research.sh`      | Loops subtopics, researches each with web search, synthesizes final output      |
| `TASKS.md`         | Task list — checked items are done, unchecked are pending                       |
| `QA-FINDINGS.md`   | QA test results (overwritten each run, git tracks history)                      |
| `SPEC-vX.md`       | Feature specifications per version                                              |
| `REVIEW-vX.md`     | Post-version review notes                                                       |
| `ralph.log`        | Append-only log of completed/failed tasks with timestamps                       |

---

## Three Pipelines

### `spec` mode — Feature work

Build new features from a spec file.

```
ralph-plan.sh spec  -->  TASKS.md  -->  ralph.sh spec  -->  feat: commits
```

### `fix` mode — Bug fixes

Fix bugs found by QA testing.

```
qa.sh  -->  QA-FINDINGS.md  -->  ralph-plan.sh fix  -->  TASKS.md  -->  ralph.sh fix  -->  fix: commits
```

### `research` mode — Research and brainstorming

Investigate a topic with web search, produce a synthesized document.

```
research-plan.sh "topic"  -->  RESEARCH-PLAN.md  -->  research.sh  -->  RESEARCH-OUTPUT.md
```

---

## Step-by-Step: Feature Work (spec mode)

### 1. Write a spec

Create a spec file named `SPEC-vX.md` (e.g., `SPEC-v5.md`). The scripts auto-detect the highest-versioned spec file, so just create the file and you're good.

### 2. Generate tasks

```bash
./ralph-plan.sh spec
```

This reads your spec and TASKS.md, then appends new tasks. Task numbering is auto-detected (continues from the highest existing number).

### 3. Review tasks

Open TASKS.md and sanity-check the generated tasks. Commit if satisfied:

```bash
git add TASKS.md && git commit -m "plan: v5 tasks"
```

### 4. Run Ralph

```bash
./ralph.sh spec
```

Ralph will:

1. Pick the first unchecked task from TASKS.md
2. Run `ralph-task.sh spec "task description"`
3. Claude implements the task, referencing the spec file
4. `npm run build` verifies it compiles (retries up to 8 times on failure)
5. On success: check off task, `git add . && git commit -m "feat: ..." && git push`
6. Repeat until all tasks are done or one fails

If a task fails after 8 retries, Ralph stops and notifies you. Fix it manually, then re-run `./ralph.sh spec` — it resumes from the first unchecked task.

---

## Step-by-Step: Bug Fixes (fix mode)

### 1. Run QA

```bash
./qa.sh              # smart mode (default): functional scan, then visual verification
./qa.sh functional   # functional only (cheaper)
./qa.sh visual       # visual only (screenshot-based)
```

Results are written to `QA-FINDINGS.md`. Each run overwrites the file — use `git diff QA-FINDINGS.md` to see what changed between runs.

### 2. Review findings

Open QA-FINDINGS.md. Findings marked `DISMISSED` were false positives caught by visual verification. Only confirmed findings will become tasks.

### 3. Generate fix tasks

```bash
./ralph-plan.sh fix
```

This reads QA-FINDINGS.md (ignores DISMISSED findings) and appends fix tasks to TASKS.md, ordered by severity (Critical > Major > Minor > Cosmetic). Each task references the finding ID (e.g., `Fix F-03: ...`).

### 4. Review and commit tasks

```bash
git add TASKS.md && git commit -m "plan: fix tasks from QA"
```

### 5. Run Ralph in fix mode

```bash
./ralph.sh fix
```

Same loop as spec mode, but:

- Claude reads QA-FINDINGS.md instead of the spec
- Commits use `fix:` prefix instead of `feat:`
- Claude is instructed to only fix the reported bug, not add features

### 6. Re-run QA to verify

```bash
./qa.sh
```

The new report should show fewer (or zero) findings. Compare with git:

```bash
git diff QA-FINDINGS.md
```

---

## Step-by-Step: Research

### 1. Plan the research

```bash
./research-plan.sh "How do other fitness apps handle streak mechanics?"
```

The script will:

1. Ask Claude to generate 3-5 context questions tailored to your topic
2. Present them interactively — answer each or press Enter to skip
3. Use your answers + topic to generate focused subtopics
4. Write everything to `RESEARCH-PLAN.md`

Example interaction:

```
Before I research this, a few questions to sharpen the focus:

1. What is the goal of this research? (Benchmarking, redesigning, learning?)
   > We want to redesign our streak system to reduce anxiety

2. Which platforms matter most? (Mobile, web, wearables?)
   > Mobile fitness and language learning apps

3. Who is the audience for this output? (You, stakeholders, design team?)
   > Me, solo developer

Planning subtopics...
Done: RESEARCH-PLAN.md (7 subtopics)
```

To skip the questions and go straight to subtopics:

```bash
./research-plan.sh --quick "your topic here"
```

To read a longer topic from a file:

```bash
./research-plan.sh --file RESEARCH-TOPIC.md
```

### 2. Run the research

```bash
./research.sh
```

This will:

1. Loop through each subtopic in `RESEARCH-PLAN.md`
2. Claude researches each one using web search, web fetch, and local file reading
3. Each claim is tagged with `[CLAIM]`, `[SOURCE]`, and `[CONFIDENCE]` inline
4. Findings are appended to `RESEARCH-WIP.md` (working notes)
5. Each subtopic gets checked off and you get a notification
6. **Verification pass** — visits cited URLs, checks if sources support claims, produces a trust score
7. Final synthesis pass produces `RESEARCH-OUTPUT.md` with an evidence appendix

Options:

```bash
./research.sh                              # standard depth, verify on, 20 min timeout
./research.sh --depth quick                # fast overview, verify off, 5 min timeout
./research.sh --depth deep                 # exhaustive, verify on, 30 min timeout
./research.sh --depth quick --verify       # fast but still verify sources
./research.sh --no-verify                  # skip verification on any depth
./research.sh --timeout 900               # custom timeout per Claude call
```

#### Depth profiles

| Depth      | Timeout | Searches | Claims | Verify | Use case                      |
| ---------- | ------- | -------- | ------ | ------ | ----------------------------- |
| `quick`    | 5 min   | 2-3      | 3-5    | off    | Quick overview, brainstorming |
| `standard` | 20 min  | 5-8      | 5-15   | on     | Default, balanced research    |
| `deep`     | 30 min  | 10+      | 10-25  | on     | Exhaustive, cross-referenced  |

### 3. Output files

| File                 | Contents                                                   |
| -------------------- | ---------------------------------------------------------- |
| `RESEARCH-PLAN.md`   | Topic, context answers, subtopic checklist                 |
| `RESEARCH-WIP.md`    | Raw findings per subtopic with inline citations            |
| `RESEARCH-VERIFY.md` | Verification report: each claim checked against its source |
| `RESEARCH-OUTPUT.md` | Polished final document with evidence appendix             |

### Named research sessions

Run multiple research sessions in parallel using `RESEARCH_NAME`:

```bash
RESEARCH_NAME=streaks ./research-plan.sh "How do apps handle streaks?"
RESEARCH_NAME=streaks ./research.sh
# produces: RESEARCH-streaks-PLAN.md, RESEARCH-streaks-WIP.md, RESEARCH-streaks-OUTPUT.md

RESEARCH_NAME=onboarding ./research-plan.sh "Best onboarding flows in fitness apps"
RESEARCH_NAME=onboarding ./research.sh
# produces: RESEARCH-onboarding-PLAN.md, etc.
```

---

## Spec File Naming

Specs are named `SPEC-vX.md` by convention (e.g., `SPEC-v1.md`, `SPEC-v5.md`, `SPEC-v4-draft.md`).

**Auto-detection:** Both `ralph-plan.sh` and `ralph-task.sh` automatically find the highest-versioned spec file by sorting `SPEC-v*.md` numerically. You don't need to specify which spec to use — just create the file and the scripts pick it up.

```bash
# Auto-detects latest (e.g., SPEC-v5.md if it exists)
./ralph-plan.sh spec
./ralph.sh spec

# Override to a specific spec
SPEC_FILE=SPEC-v3.md ./ralph-plan.sh spec
export SPEC_FILE=SPEC-v3.md && ./ralph.sh spec
```

The auto-detection sorts by the number after `v`, so `SPEC-v10.md` > `SPEC-v9.md` > `SPEC-v4-draft.md`.

---

## Task Numbering

Task numbers are auto-detected. `ralph-plan.sh` finds the highest number in TASKS.md and starts from the next one. You never need to manually specify the starting number.

```
v1: 001-025
v2: 026-050
v3: 051-076
v4: 077-101
fix: 102+  (or whatever comes next)
```

Tasks from different modes (spec and fix) share the same TASKS.md and numbering sequence.

---

## Environment Variables

| Variable            | Default                                | Used by                       | Description                                       |
| ------------------- | -------------------------------------- | ----------------------------- | ------------------------------------------------- |
| `NTFY_TOPIC`        | _(from .env)_                          | all (via config.sh)           | ntfy.sh topic for push notifications              |
| `SPEC_FILE`         | _(auto-detected)_                      | ralph-plan.sh, ralph-task.sh  | Override spec file (default: highest SPEC-v\*.md) |
| `APP_URL`           | `https://wimhof-method-app.vercel.app` | qa.sh                         | URL to test                                       |
| `QA_FILE`           | `QA-FINDINGS.md`                       | qa.sh                         | Output file for QA results                        |
| `QA_TIMEOUT`        | `600` (10 min)                         | qa.sh                         | Timeout per QA pass in seconds                    |
| `QA_MODEL`          | `claude-sonnet-4-6`                    | qa.sh                         | Model for QA testing                              |
| `QA_SKIP_PREFLIGHT` | `0`                                    | qa.sh                         | Set to `1` to skip MCP check                      |
| `RESEARCH_NAME`     | _(none)_                               | research-plan.sh, research.sh | Prefix for research output files                  |
| `DEPTH`             | `standard`                             | research.sh                   | Research depth: `quick`, `standard`, or `deep`    |
| `SKIP_VERIFY`       | _(auto by depth)_                      | research.sh                   | Set to `1` to skip fact verification pass         |
| `RESEARCH_TIMEOUT`  | _(auto by depth)_                      | research.sh                   | Timeout per Claude call in seconds                |
| `RESEARCH_MODEL`    | _(claude default)_                     | research.sh                   | Model for research subtopics                      |
| `VERIFY_MODEL`      | `claude-sonnet-4-6`                    | research.sh                   | Model for verification & synthesis (cheaper)      |

---

## Notifications

All scripts send push notifications via [ntfy.sh](https://ntfy.sh). The topic is loaded from `.env` file (`NTFY_TOPIC` variable), which `config.sh` sources. Falls back to macOS native notifications if ntfy is not configured or fails.

```bash
# .env (gitignored)
NTFY_TOPIC=your-topic-here
```

Events notified (all include elapsed time where applicable):

- **ralph-plan.sh**: start, done (mode, elapsed time, open task count)
- **ralph.sh**: task complete (task number, elapsed time), task failed, all done (task count, total time), push failed, suspicious commit size
- **ralph-task.sh**: max-loops failure
- **qa.sh**: start (mode, URL), pass complete (elapsed time), pass failed/timed out, QA complete (issue count, total time)
- **research-plan.sh**: done (subtopic count, elapsed time)
- **research.sh**: start (topic), subtopic complete (progress N/M), synthesis started, research complete (subtopic count, total time)

---

## Shared Utilities (config.sh)

All scripts source `config.sh` at the top with: `SCRIPT_TITLE="X"; source ./config.sh`

This provides:

| Function                 | Description                                                     |
| ------------------------ | --------------------------------------------------------------- |
| `notify(msg)`            | Push notification via ntfy.sh, falls back to macOS notification |
| `log(msg)`               | Timestamped echo: `[HH:MM:SS] msg`                              |
| `fmt_elapsed(secs)`      | Human-readable duration: `45s` or `3min`                        |
| `start_heartbeat(label)` | Background process logging every 60s while Claude runs          |
| `stop_heartbeat()`       | Kills the heartbeat background process                          |

---

## Prerequisites

- `claude` CLI installed and authenticated
- `npm` with project dependencies installed
- For QA testing:
  - Playwright MCP: `npx @anthropic-ai/claude-code mcp add playwright -- npx -y @playwright/mcp --headless`
  - Puppeteer MCP: `npx @anthropic-ai/claude-code mcp add puppeteer -- npx -y @modelcontextprotocol/server-puppeteer`
  - Playwright browsers: `npx -y playwright install chromium`
  - On macOS, if Chromium is blocked: `xattr -cr ~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/`

---

## Common Workflows

### Full version cycle

```bash
# 1. Write spec
vim SPEC-v5.md

# 2. Plan and execute (auto-detects SPEC-v5.md)
./ralph-plan.sh spec
# review TASKS.md, commit
./ralph.sh spec

# 3. QA
./qa.sh
# review QA-FINDINGS.md, commit

# 4. Fix bugs
./ralph-plan.sh fix
# review TASKS.md, commit
./ralph.sh fix

# 5. Re-QA to confirm fixes
./qa.sh
```

### Resume after failure

```bash
# Ralph stopped on a task — fix it manually, then:
./ralph.sh spec   # or ./ralph.sh fix
# Resumes from the first unchecked task
```

### Re-run QA after deploying fixes

```bash
./qa.sh
git diff QA-FINDINGS.md   # see what's fixed vs still broken
git add QA-FINDINGS.md && git commit -m "qa: re-run after fixes"
```

### Research a topic

```bash
./research-plan.sh "What state management patterns work best for offline-first PWAs?"
# answer context questions, review RESEARCH-PLAN.md
./research.sh
# wait for notifications, read RESEARCH-OUTPUT.md when done
```
