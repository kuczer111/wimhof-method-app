# Workflow Guide

This project uses an automated pipeline to plan, execute, and QA tasks via Claude CLI.

## Files Overview

| File             | Purpose                                                                         |
| ---------------- | ------------------------------------------------------------------------------- |
| `plan.sh`        | Generates tasks in TASKS.md from a spec or QA findings                          |
| `ralph.sh`       | Loops through unchecked tasks, delegates to ralph-task.sh, commits & pushes     |
| `ralph-task.sh`  | Executes a single task via Claude CLI with build verification (up to 8 retries) |
| `qa.sh`          | Runs automated QA testing against the deployed app                              |
| `TASKS.md`       | Task list — checked items are done, unchecked are pending                       |
| `QA-FINDINGS.md` | QA test results (overwritten each run, git tracks history)                      |
| `SPEC-vX.md`     | Feature specifications per version                                              |
| `REVIEW-vX.md`   | Post-version review notes                                                       |
| `ralph.log`      | Append-only log of completed/failed tasks with timestamps                       |

---

## Two Modes

### `spec` mode — Feature work

Build new features from a spec file.

```
plan.sh spec  -->  TASKS.md  -->  ralph.sh spec  -->  feat: commits
```

### `fix` mode — Bug fixes

Fix bugs found by QA testing.

```
qa.sh  -->  QA-FINDINGS.md  -->  plan.sh fix  -->  TASKS.md  -->  ralph.sh fix  -->  fix: commits
```

---

## Step-by-Step: Feature Work (spec mode)

### 1. Write a spec

Create a spec file named `SPEC-vX.md` (e.g., `SPEC-v5.md`). The scripts auto-detect the highest-versioned spec file, so just create the file and you're good.

### 2. Generate tasks

```bash
./plan.sh spec
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
./plan.sh fix
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

## Spec File Naming

Specs are named `SPEC-vX.md` by convention (e.g., `SPEC-v1.md`, `SPEC-v5.md`, `SPEC-v4-draft.md`).

**Auto-detection:** Both `plan.sh` and `ralph-task.sh` automatically find the highest-versioned spec file by sorting `SPEC-v*.md` numerically. You don't need to specify which spec to use — just create the file and the scripts pick it up.

```bash
# Auto-detects latest (e.g., SPEC-v5.md if it exists)
./plan.sh spec
./ralph.sh spec

# Override to a specific spec
SPEC_FILE=SPEC-v3.md ./plan.sh spec
export SPEC_FILE=SPEC-v3.md && ./ralph.sh spec
```

The auto-detection sorts by the number after `v`, so `SPEC-v10.md` > `SPEC-v9.md` > `SPEC-v4-draft.md`.

---

## Task Numbering

Task numbers are auto-detected. `plan.sh` finds the highest number in TASKS.md and starts from the next one. You never need to manually specify the starting number.

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

| Variable            | Default                                | Used by                | Description                                       |
| ------------------- | -------------------------------------- | ---------------------- | ------------------------------------------------- |
| `SPEC_FILE`         | _(auto-detected)_                      | plan.sh, ralph-task.sh | Override spec file (default: highest SPEC-v\*.md) |
| `APP_URL`           | `https://wimhof-method-app.vercel.app` | qa.sh                  | URL to test                                       |
| `QA_FILE`           | `QA-FINDINGS.md`                       | qa.sh                  | Output file for QA results                        |
| `QA_TIMEOUT`        | `600` (10 min)                         | qa.sh                  | Timeout per QA pass in seconds                    |
| `QA_MODEL`          | `claude-sonnet-4-6`                    | qa.sh                  | Model for QA testing                              |
| `QA_SKIP_PREFLIGHT` | `0`                                    | qa.sh                  | Set to `1` to skip MCP check                      |

---

## Notifications

All scripts send push notifications via [ntfy.sh](https://ntfy.sh). The topic is configured in each script (`NTFY_TOPIC` variable). Falls back to macOS native notifications if ntfy fails.

Events notified:

- **plan.sh**: planning done (with task count)
- **ralph.sh**: task complete, task failed, all done, push failed, suspicious commit size
- **qa.sh**: pass complete, pass failed/timed out, QA complete

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
./plan.sh spec
# review TASKS.md, commit
./ralph.sh spec

# 3. QA
./qa.sh
# review QA-FINDINGS.md, commit

# 4. Fix bugs
./plan.sh fix
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
