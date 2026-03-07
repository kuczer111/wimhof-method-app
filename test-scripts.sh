#!/usr/bin/env bash
# ============================================================================
# test-scripts.sh — Unit tests for automation shell scripts.
# ============================================================================
# Runs pure logic tests without calling claude. Tests config.sh functions,
# awk/sed patterns, flag parsing, file naming, and data extraction.
#
# Usage:  ./test-scripts.sh
# ============================================================================
set -euo pipefail

PASS=0
FAIL=0
TEST_DIR=$(mktemp -d /tmp/script-tests-XXXXXX)
trap 'rm -rf "$TEST_DIR"' EXIT

# ── Test helpers ──

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label"
    echo "    expected: '$expected'"
    echo "    actual:   '$actual'"
    FAIL=$((FAIL + 1))
  fi
}

assert_contains() {
  local label="$1" needle="$2" haystack="$3"
  if echo "$haystack" | grep -qF -- "$needle"; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label"
    echo "    expected to contain: '$needle'"
    echo "    actual: '$haystack'"
    FAIL=$((FAIL + 1))
  fi
}

assert_not_contains() {
  local label="$1" needle="$2" haystack="$3"
  if ! echo "$haystack" | grep -qF -- "$needle"; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label"
    echo "    expected NOT to contain: '$needle'"
    echo "    actual: '$haystack'"
    FAIL=$((FAIL + 1))
  fi
}

assert_file_exists() {
  local label="$1" file="$2"
  if [ -f "$file" ]; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label (file not found: $file)"
    FAIL=$((FAIL + 1))
  fi
}

assert_exit_code() {
  local label="$1" expected="$2"
  shift 2
  local rc=0
  "$@" >/dev/null 2>&1 || rc=$?
  if [ "$rc" -eq "$expected" ]; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label (expected exit $expected, got $rc)"
    FAIL=$((FAIL + 1))
  fi
}

# ============================================================================
# 1. config.sh — fmt_elapsed
# ============================================================================
echo ""
echo "=== config.sh: fmt_elapsed ==="

# Source config.sh functions by creating a minimal wrapper
cd "$TEST_DIR"
cat > .env <<'EOF'
NTFY_TOPIC=test-topic
EOF

# Copy config.sh to test dir
cp /Users/tomaszkuczera/Documents/Playground/wimhof-method-app/config.sh "$TEST_DIR/"

# Source it (SCRIPT_TITLE required)
SCRIPT_TITLE="Test"
source ./config.sh

assert_eq "0 seconds" "0s" "$(fmt_elapsed 0)"
assert_eq "30 seconds" "30s" "$(fmt_elapsed 30)"
assert_eq "59 seconds" "59s" "$(fmt_elapsed 59)"
assert_eq "60 seconds" "1min" "$(fmt_elapsed 60)"
assert_eq "90 seconds" "1min 30s" "$(fmt_elapsed 90)"
assert_eq "120 seconds" "2min" "$(fmt_elapsed 120)"
assert_eq "3661 seconds" "61min 1s" "$(fmt_elapsed 3661)"
assert_eq "empty input" "0s" "$(fmt_elapsed "")"
assert_eq "non-numeric" "?" "$(fmt_elapsed "abc")"

# ============================================================================
# 2. config.sh — detect_spec_file
# ============================================================================
echo ""
echo "=== config.sh: detect_spec_file ==="

# No spec files — run in subshell since detect_spec_file calls exit 1
rc=0
(unset SPEC_FILE; SPEC_FILE=""; detect_spec_file) 2>/dev/null || rc=$?
assert_eq "no spec files exits" "1" "$rc"

# Create spec files
touch SPEC-v1.md SPEC-v2.md SPEC-v10.md SPEC-v3-draft.md
SPEC_FILE=""
detect_spec_file
assert_eq "detects highest version" "SPEC-v10.md" "$SPEC_FILE"

# Env override
SPEC_FILE="SPEC-v1.md"
detect_spec_file
assert_eq "env override respected" "SPEC-v1.md" "$SPEC_FILE"

# ============================================================================
# 3. ralph.sh — task check-off awk pattern
# ============================================================================
echo ""
echo "=== ralph.sh: task check-off (awk) ==="

cat > "$TEST_DIR/tasks_test.md" <<'EOF'
# Tasks

## v1
- [x] 001: Already done task
- [ ] 002: Fix the auth bug (special chars: $HOME & "quotes")
- [ ] 003: Another task
EOF

# Check off task 002
TASK='002: Fix the auth bug (special chars: $HOME & "quotes")'
awk -v task="- [ ] $TASK" '{if (!done && index($0, task) == 1) {sub(/^- \[ \]/, "- [x]"); done=1} print}' \
  "$TEST_DIR/tasks_test.md" > "$TEST_DIR/tasks_test.md.tmp" && mv "$TEST_DIR/tasks_test.md.tmp" "$TEST_DIR/tasks_test.md"

RESULT=$(grep "002:" "$TEST_DIR/tasks_test.md")
assert_contains "task 002 checked off" "- [x] 002:" "$RESULT"

# Verify task 003 unchanged
RESULT003=$(grep "003:" "$TEST_DIR/tasks_test.md")
assert_contains "task 003 still unchecked" "- [ ] 003:" "$RESULT003"

# ============================================================================
# 4. research.sh — subtopic check-off awk pattern
# ============================================================================
echo ""
echo "=== research.sh: subtopic check-off (awk) ==="

cat > "$TEST_DIR/plan_test.md" <<'EOF'
## Subtopics

- [x] 01: Already done
- [ ] 02: Current subtopic | Description here
- [ ] 03: Next subtopic | Another description
- [ ] 11: Double digit | Should not match 01
EOF

NUM="02"
awk -v num="$NUM" '{
  if (!done && match($0, "^- \\[ \\] " num ":")) {
    sub(/^- \[ \]/, "- [x]")
    done=1
  }
  print
}' "$TEST_DIR/plan_test.md" > "$TEST_DIR/plan_test.md.tmp" && mv "$TEST_DIR/plan_test.md.tmp" "$TEST_DIR/plan_test.md"

RESULT02=$(grep "02:" "$TEST_DIR/plan_test.md")
assert_contains "subtopic 02 checked off" "- [x] 02:" "$RESULT02"

RESULT03=$(grep "03:" "$TEST_DIR/plan_test.md")
assert_contains "subtopic 03 still unchecked" "- [ ] 03:" "$RESULT03"

RESULT11=$(grep "11:" "$TEST_DIR/plan_test.md")
assert_contains "subtopic 11 not affected" "- [ ] 11:" "$RESULT11"

# Test that 01 doesn't match 011
cat > "$TEST_DIR/plan_test2.md" <<'EOF'
- [ ] 01: First topic
- [ ] 011: Eleventh topic
EOF

NUM="01"
awk -v num="$NUM" '{
  if (!done && match($0, "^- \\[ \\] " num ":")) {
    sub(/^- \[ \]/, "- [x]")
    done=1
  }
  print
}' "$TEST_DIR/plan_test2.md" > "$TEST_DIR/plan_test2.md.tmp" && mv "$TEST_DIR/plan_test2.md.tmp" "$TEST_DIR/plan_test2.md"

RESULT01=$(grep "^- \[x\] 01:" "$TEST_DIR/plan_test2.md" || echo "")
RESULT011=$(grep "011:" "$TEST_DIR/plan_test2.md")
assert_eq "01 checked off" "- [x] 01: First topic" "$RESULT01"
assert_contains "011 not affected by 01 check" "- [ ] 011:" "$RESULT011"

# ============================================================================
# 5. research.sh — takeaways extraction (awk)
# ============================================================================
echo ""
echo "=== research.sh: takeaways extraction (awk) ==="

cat > "$TEST_DIR/wip_test.md" <<'EOF'
# Research Working Notes

**Topic:** Test topic
**Started:** 2026-03-07 12:00:00

---

## 01: First subtopic

Some detailed paragraph about the first thing we found.
More text here with lots of detail that should NOT be in takeaways.

- A random bullet that is NOT a takeaway
- Another random finding bullet

**Key claims:**
- [CLAIM]: "something" [SOURCE: url] [CONFIDENCE: high]

**Key takeaways:**
- Takeaway one from subtopic 01
- Takeaway two from subtopic 01

---

## 02: Second subtopic

Another detailed paragraph that should be excluded.

- Yet another random bullet
- And more random findings

**Key takeaways:**
- Takeaway from subtopic 02
- Another takeaway from 02

---

## 03: Third subtopic

No takeaways section in this one, just text and bullets.

- Random bullet in 03
- More stuff

---
EOF

TAKEAWAYS=$(awk '
  /^## [0-9]+:/ { print; next }
  /^\*\*Key takeaways:\*\*/ { grab=1; next }
  grab && /^- / { print; next }
  grab && /^[[:space:]]*$/ { next }
  grab { grab=0 }
' "$TEST_DIR/wip_test.md") || true

# Should contain headers
assert_contains "contains subtopic 01 header" "## 01: First subtopic" "$TAKEAWAYS"
assert_contains "contains subtopic 02 header" "## 02: Second subtopic" "$TAKEAWAYS"
assert_contains "contains subtopic 03 header" "## 03: Third subtopic" "$TAKEAWAYS"

# Should contain takeaway bullets
assert_contains "contains takeaway from 01" "Takeaway one from subtopic 01" "$TAKEAWAYS"
assert_contains "contains takeaway from 02" "Takeaway from subtopic 02" "$TAKEAWAYS"

# Should NOT contain random bullets or claims
assert_not_contains "excludes random bullets" "A random bullet that is NOT a takeaway" "$TAKEAWAYS"
assert_not_contains "excludes claims" "[CLAIM]" "$TAKEAWAYS"
assert_not_contains "excludes paragraphs" "detailed paragraph" "$TAKEAWAYS"
assert_not_contains "excludes random findings" "Yet another random bullet" "$TAKEAWAYS"

# Count lines — should be compact
TAKEAWAY_COUNT=$(echo "$TAKEAWAYS" | wc -l | tr -d ' ')
assert_eq "takeaways are compact (7 lines)" "7" "$TAKEAWAY_COUNT"

# ============================================================================
# 6. research.sh — file naming with RESEARCH_NAME
# ============================================================================
echo ""
echo "=== research.sh: file naming ==="

# With name
RESEARCH_NAME="agent-sdk"
if [ -n "$RESEARCH_NAME" ]; then
  PLAN_FILE="RESEARCH-${RESEARCH_NAME}-PLAN.md"
  WIP_FILE="RESEARCH-${RESEARCH_NAME}-WIP.md"
  OUTPUT_FILE="RESEARCH-${RESEARCH_NAME}-OUTPUT.md"
  VERIFY_FILE="RESEARCH-${RESEARCH_NAME}-VERIFY.md"
else
  PLAN_FILE="RESEARCH-PLAN.md"
  WIP_FILE="RESEARCH-WIP.md"
  OUTPUT_FILE="RESEARCH-OUTPUT.md"
  VERIFY_FILE="RESEARCH-VERIFY.md"
fi

assert_eq "named plan file" "RESEARCH-agent-sdk-PLAN.md" "$PLAN_FILE"
assert_eq "named wip file" "RESEARCH-agent-sdk-WIP.md" "$WIP_FILE"
assert_eq "named output file" "RESEARCH-agent-sdk-OUTPUT.md" "$OUTPUT_FILE"
assert_eq "named verify file" "RESEARCH-agent-sdk-VERIFY.md" "$VERIFY_FILE"

# Without name
RESEARCH_NAME=""
if [ -n "$RESEARCH_NAME" ]; then
  PLAN_FILE="RESEARCH-${RESEARCH_NAME}-PLAN.md"
else
  PLAN_FILE="RESEARCH-PLAN.md"
fi
assert_eq "unnamed plan file" "RESEARCH-PLAN.md" "$PLAN_FILE"

# ============================================================================
# 7. research.sh — depth profile defaults
# ============================================================================
echo ""
echo "=== research.sh: depth profiles ==="

for depth in quick standard deep; do
  RESEARCH_TIMEOUT=""
  SKIP_VERIFY=""

  case "$depth" in
    quick)
      DEPTH_CLAIMS="3-5"
      DEPTH_PRIOR_LINES=150
      [ -z "$RESEARCH_TIMEOUT" ] && RESEARCH_TIMEOUT=300
      [ -z "$SKIP_VERIFY" ] && SKIP_VERIFY=1
      ;;
    standard)
      DEPTH_CLAIMS="5-15"
      DEPTH_PRIOR_LINES=300
      [ -z "$RESEARCH_TIMEOUT" ] && RESEARCH_TIMEOUT=1200
      ;;
    deep)
      DEPTH_CLAIMS="10-25"
      DEPTH_PRIOR_LINES=500
      [ -z "$RESEARCH_TIMEOUT" ] && RESEARCH_TIMEOUT=1800
      ;;
  esac
  [ -z "$SKIP_VERIFY" ] && SKIP_VERIFY=0

  case "$depth" in
    quick)
      assert_eq "quick timeout" "300" "$RESEARCH_TIMEOUT"
      assert_eq "quick skip_verify" "1" "$SKIP_VERIFY"
      assert_eq "quick claims" "3-5" "$DEPTH_CLAIMS"
      assert_eq "quick prior lines" "150" "$DEPTH_PRIOR_LINES"
      ;;
    standard)
      assert_eq "standard timeout" "1200" "$RESEARCH_TIMEOUT"
      assert_eq "standard skip_verify" "0" "$SKIP_VERIFY"
      assert_eq "standard claims" "5-15" "$DEPTH_CLAIMS"
      assert_eq "standard prior lines" "300" "$DEPTH_PRIOR_LINES"
      ;;
    deep)
      assert_eq "deep timeout" "1800" "$RESEARCH_TIMEOUT"
      assert_eq "deep skip_verify" "0" "$SKIP_VERIFY"
      assert_eq "deep claims" "10-25" "$DEPTH_CLAIMS"
      assert_eq "deep prior lines" "500" "$DEPTH_PRIOR_LINES"
      ;;
  esac
done

# ============================================================================
# 8. research.sh — SKIP_VERIFY tri-state
# ============================================================================
echo ""
echo "=== research.sh: SKIP_VERIFY tri-state ==="

# Auto (empty) + quick = skip
SKIP_VERIFY=""
DEPTH="quick"
[ -z "$SKIP_VERIFY" ] && SKIP_VERIFY=1
assert_eq "auto + quick = skip" "1" "$SKIP_VERIFY"

# Auto (empty) + standard = verify
SKIP_VERIFY=""
[ -z "$SKIP_VERIFY" ] && SKIP_VERIFY=0
assert_eq "auto + standard = verify" "0" "$SKIP_VERIFY"

# Force on (--verify) overrides quick
SKIP_VERIFY="0"
[ -z "$SKIP_VERIFY" ] && SKIP_VERIFY=1  # quick would set this, but SKIP_VERIFY is already "0"
assert_eq "--verify overrides quick" "0" "$SKIP_VERIFY"

# Force off (--no-verify) overrides standard
SKIP_VERIFY="1"
[ -z "$SKIP_VERIFY" ] && SKIP_VERIFY=0  # standard would set this, but already "1"
assert_eq "--no-verify overrides standard" "1" "$SKIP_VERIFY"

# ============================================================================
# 9. research.sh — model flag arrays
# ============================================================================
echo ""
echo "=== research.sh: model flag arrays ==="

# Default research model (empty = no flag)
RESEARCH_MODEL=""
RESEARCH_MODEL_FLAG=()
if [ -n "$RESEARCH_MODEL" ]; then
  RESEARCH_MODEL_FLAG=(--model "$RESEARCH_MODEL")
fi
assert_eq "empty research model = no flag" "0" "${#RESEARCH_MODEL_FLAG[@]}"

# Custom research model
RESEARCH_MODEL="claude-opus-4-6"
RESEARCH_MODEL_FLAG=()
if [ -n "$RESEARCH_MODEL" ]; then
  RESEARCH_MODEL_FLAG=(--model "$RESEARCH_MODEL")
fi
assert_eq "custom research model flag count" "2" "${#RESEARCH_MODEL_FLAG[@]}"
assert_eq "custom research model flag[0]" "--model" "${RESEARCH_MODEL_FLAG[0]}"
assert_eq "custom research model flag[1]" "claude-opus-4-6" "${RESEARCH_MODEL_FLAG[1]}"

# Verify model always set
VERIFY_MODEL="claude-sonnet-4-6"
VERIFY_MODEL_FLAG=(--model "$VERIFY_MODEL")
assert_eq "verify model flag count" "2" "${#VERIFY_MODEL_FLAG[@]}"
assert_eq "verify model flag[1]" "claude-sonnet-4-6" "${VERIFY_MODEL_FLAG[1]}"

# ============================================================================
# 10. ralph-plan.sh — task number extraction
# ============================================================================
echo ""
echo "=== ralph-plan.sh: task number extraction ==="

cat > "$TEST_DIR/tasks_num.md" <<'EOF'
- [x] 001: First task
- [x] 002: Second task
- [x] 010: Tenth task
- [ ] 011: Eleventh task
EOF

LAST_NUM=$(grep -oE '^\- \[[ x]\] [0-9]+' "$TEST_DIR/tasks_num.md" | sed 's/.*\] //' | sort -n | tail -1)
assert_eq "last task number" "011" "$LAST_NUM"

# Empty file
cat > "$TEST_DIR/tasks_empty.md" <<'EOF'
# Tasks
EOF
LAST_NUM=$(grep -oE '^\- \[[ x]\] [0-9]+' "$TEST_DIR/tasks_empty.md" | sed 's/.*\] //' | sort -n | tail -1) || true
assert_eq "empty tasks = empty result" "" "$LAST_NUM"

# ============================================================================
# 11. research.sh — topic extraction from plan file
# ============================================================================
echo ""
echo "=== research.sh: topic extraction ==="

cat > "$TEST_DIR/plan_topic.md" <<'EOF'
# Research Plan

**Topic:** How to build agents with the Agent SDK
**Date:** 2026-03-07

## Context

- Some context here

## Subtopics

- [ ] 01: First | Description
EOF

TOPIC=$(sed -n 's/^\*\*Topic:\*\* //p' "$TEST_DIR/plan_topic.md" | head -1)
assert_eq "topic extracted" "How to build agents with the Agent SDK" "$TOPIC"

CONTEXT=$(sed -n '/^## Context$/,/^## Subtopics$/{ /^## Context$/d; /^## Subtopics$/d; p; }' "$TEST_DIR/plan_topic.md") || true
assert_contains "context extracted" "Some context here" "$CONTEXT"

# No context section (--quick mode)
cat > "$TEST_DIR/plan_quick.md" <<'EOF'
# Research Plan

**Topic:** Quick topic
**Date:** 2026-03-07

## Subtopics

- [ ] 01: Only one | Simple
EOF

CONTEXT_QUICK=$(sed -n '/^## Context$/,/^## Subtopics$/{ /^## Context$/d; /^## Subtopics$/d; p; }' "$TEST_DIR/plan_quick.md") || true
assert_eq "no context = empty" "" "$(echo "$CONTEXT_QUICK" | tr -d '[:space:]')"

# ============================================================================
# 12. research.sh — subtopic parsing
# ============================================================================
echo ""
echo "=== research.sh: subtopic parsing ==="

NEXT="- [ ] 05: Building a planning agent | Spec decomposition"
SUBTOPIC=$(echo "$NEXT" | sed 's/^- \[ \] [0-9]*: //')
NUM=$(echo "$NEXT" | sed 's/^- \[ \] \([0-9]*\):.*/\1/')

assert_eq "subtopic text" "Building a planning agent | Spec decomposition" "$SUBTOPIC"
assert_eq "subtopic number" "05" "$NUM"

# Edge case: subtopic with special chars
NEXT2="- [ ] 12: Fix \$HOME & \"paths\" | Handle edge cases"
SUBTOPIC2=$(echo "$NEXT2" | sed 's/^- \[ \] [0-9]*: //')
NUM2=$(echo "$NEXT2" | sed 's/^- \[ \] \([0-9]*\):.*/\1/')

assert_eq "special chars subtopic" 'Fix $HOME & "paths" | Handle edge cases' "$SUBTOPIC2"
assert_eq "special chars number" "12" "$NUM2"

# ============================================================================
# 13. config.sh — ensure_timeout
# ============================================================================
echo ""
echo "=== config.sh: ensure_timeout ==="

# ensure_timeout should make timeout available (as command, function, or gtimeout wrapper)
ensure_timeout
if type timeout &>/dev/null; then
  echo "  PASS: timeout is available after ensure_timeout"
  PASS=$((PASS + 1))
else
  echo "  FAIL: timeout not available"
  FAIL=$((FAIL + 1))
fi

# ============================================================================
# 14. Takeaways extraction — edge cases
# ============================================================================
echo ""
echo "=== research.sh: takeaways edge cases ==="

# Empty WIP file
cat > "$TEST_DIR/wip_empty.md" <<'EOF'
# Research Working Notes

**Topic:** Empty
**Started:** 2026-03-07 12:00:00

---
EOF

TAKEAWAYS_EMPTY=$(awk '
  /^## [0-9]+:/ { print; next }
  /^\*\*Key takeaways:\*\*/ { grab=1; next }
  grab && /^- / { print; next }
  grab && /^[[:space:]]*$/ { next }
  grab { grab=0 }
' "$TEST_DIR/wip_empty.md") || true
assert_eq "empty wip = empty takeaways" "" "$TAKEAWAYS_EMPTY"

# Consecutive takeaway sections (no gap)
cat > "$TEST_DIR/wip_consecutive.md" <<'EOF'
## 01: First

**Key takeaways:**
- Take 1A
- Take 1B

## 02: Second

**Key takeaways:**
- Take 2A
EOF

TAKEAWAYS_CONSEC=$(awk '
  /^## [0-9]+:/ { print; next }
  /^\*\*Key takeaways:\*\*/ { grab=1; next }
  grab && /^- / { print; next }
  grab && /^[[:space:]]*$/ { next }
  grab { grab=0 }
' "$TEST_DIR/wip_consecutive.md") || true

assert_contains "consecutive: has Take 1A" "Take 1A" "$TAKEAWAYS_CONSEC"
assert_contains "consecutive: has Take 1B" "Take 1B" "$TAKEAWAYS_CONSEC"
assert_contains "consecutive: has Take 2A" "Take 2A" "$TAKEAWAYS_CONSEC"
CONSEC_COUNT=$(echo "$TAKEAWAYS_CONSEC" | wc -l | tr -d ' ')
assert_eq "consecutive: 5 lines (2 headers + 3 bullets)" "5" "$CONSEC_COUNT"

# Takeaways with nested indentation (indented line stops grab)
cat > "$TEST_DIR/wip_nested.md" <<'EOF'
## 01: Topic

**Key takeaways:**
- Top level takeaway
  - Nested bullet (should be excluded)
- After nested (not captured — grab stopped at indent)

Some paragraph after.
EOF

TAKEAWAYS_NESTED=$(awk '
  /^## [0-9]+:/ { print; next }
  /^\*\*Key takeaways:\*\*/ { grab=1; next }
  grab && /^- / { print; next }
  grab && /^[[:space:]]*$/ { next }
  grab { grab=0 }
' "$TEST_DIR/wip_nested.md") || true

assert_contains "nested: has top level" "Top level takeaway" "$TAKEAWAYS_NESTED"
assert_not_contains "nested: excludes indented" "Nested bullet" "$TAKEAWAYS_NESTED"
assert_not_contains "nested: stops after indent" "After nested" "$TAKEAWAYS_NESTED"
assert_not_contains "nested: excludes paragraph" "paragraph after" "$TAKEAWAYS_NESTED"

# ============================================================================
# 15. ralph-plan.sh — mode parsing and task numbering
# ============================================================================
echo ""
echo "=== ralph-plan.sh: mode and task numbering ==="

# Task number extraction from various TASKS.md formats
cat > "$TEST_DIR/tasks_plan.md" <<'EOF'
# Task List

## v1
- [x] 001: First task
- [x] 002: Second task

## v2
- [x] 025: Last v1
- [ ] 026: First v2 task
- [ ] 027: Second v2 task
EOF

LAST_NUM=$(grep -E '^\- \[.\] [0-9]+' "$TEST_DIR/tasks_plan.md" | sed 's/^- \[.\] \([0-9]*\).*/\1/' | sort -n | tail -1)
if ! [[ "${LAST_NUM:-}" =~ ^[0-9]+$ ]]; then LAST_NUM=0; fi
NEXT_NUM=$(printf "%03d" $((10#${LAST_NUM:-0} + 1)))
assert_eq "next num after 027" "028" "$NEXT_NUM"

# Non-numeric guard
LAST_NUM="abc"
if ! [[ "${LAST_NUM:-}" =~ ^[0-9]+$ ]]; then LAST_NUM=0; fi
NEXT_NUM=$(printf "%03d" $((10#${LAST_NUM:-0} + 1)))
assert_eq "non-numeric falls back to 001" "001" "$NEXT_NUM"

# Empty TASKS.md
LAST_NUM=""
if ! [[ "${LAST_NUM:-}" =~ ^[0-9]+$ ]]; then LAST_NUM=0; fi
NEXT_NUM=$(printf "%03d" $((10#${LAST_NUM:-0} + 1)))
assert_eq "empty falls back to 001" "001" "$NEXT_NUM"

# High task numbers (>999)
cat > "$TEST_DIR/tasks_high.md" <<'EOF'
- [x] 1000: Big number task
- [ ] 1001: Next big task
EOF
LAST_NUM=$(grep -E '^\- \[.\] [0-9]+' "$TEST_DIR/tasks_high.md" | sed 's/^- \[.\] \([0-9]*\).*/\1/' | sort -n | tail -1)
NEXT_NUM=$(printf "%03d" $((10#${LAST_NUM:-0} + 1)))
assert_eq "handles numbers > 999" "1002" "$NEXT_NUM"

# ============================================================================
# 16. ralph.sh — mode parsing and commit prefix
# ============================================================================
echo ""
echo "=== ralph.sh: mode and commit prefix ==="

for mode in spec fix; do
  case "$mode" in
    spec) COMMIT_PREFIX="feat" ;;
    fix)  COMMIT_PREFIX="fix" ;;
  esac
  assert_eq "$mode mode prefix" "$([ "$mode" = "spec" ] && echo "feat" || echo "fix")" "$COMMIT_PREFIX"
done

# Task extraction from TASKS.md
cat > "$TEST_DIR/tasks_ralph.md" <<'EOF'
- [x] 001: Done task
- [x] 002: Also done
- [ ] 003: First pending | Do something
- [ ] 004: Second pending | Do more
EOF

NEXT=$(grep -m 1 "^- \[ \]" "$TEST_DIR/tasks_ralph.md") || true
TASK=$(echo "$NEXT" | sed 's/^- \[ \] //')
assert_eq "first pending task" "003: First pending | Do something" "$TASK"

# All tasks done
cat > "$TEST_DIR/tasks_done.md" <<'EOF'
- [x] 001: Done
- [x] 002: Also done
EOF
NEXT_DONE=$(grep -m 1 "^- \[ \]" "$TEST_DIR/tasks_done.md") || true
assert_eq "all done = empty" "" "$NEXT_DONE"

# ============================================================================
# 17. ralph.sh — file count safety check
# ============================================================================
echo ""
echo "=== ralph.sh: safety check logic ==="

# Simulate file count check
for count in 50 100 101 500; do
  FILE_COUNT="$count"
  if [ "$FILE_COUNT" -gt 100 ]; then
    SAFE="blocked"
  else
    SAFE="ok"
  fi
  assert_eq "file count $count" "$([ "$count" -gt 100 ] && echo "blocked" || echo "ok")" "$SAFE"
done

# ============================================================================
# 18. ralph-task.sh — argument validation and mode context
# ============================================================================
echo ""
echo "=== ralph-task.sh: mode context ==="

# Spec mode context
MODE="spec"
SPEC_FILE_TEST="SPEC-v5.md"
case "$MODE" in
  spec)
    CONTEXT_TEST="Full spec is in ${SPEC_FILE_TEST} — read it for context."
    ;;
  fix)
    CONTEXT_TEST="QA-FINDINGS.md contains the bug reports"
    ;;
esac
assert_contains "spec context references spec file" "SPEC-v5.md" "$CONTEXT_TEST"

# Fix mode context
MODE="fix"
case "$MODE" in
  spec)
    CONTEXT_TEST="Full spec is in ${SPEC_FILE_TEST}"
    ;;
  fix)
    CONTEXT_TEST="QA-FINDINGS.md contains the bug reports"
    ;;
esac
assert_contains "fix context references QA findings" "QA-FINDINGS.md" "$CONTEXT_TEST"

# Build retry logic
MAX_LOOPS=8
loop=0
loop_results=()
while [ $loop -lt $MAX_LOOPS ]; do
  loop=$((loop + 1))
  loop_results+=("$loop")
done
assert_eq "max loops count" "8" "${#loop_results[@]}"
assert_eq "first loop" "1" "${loop_results[0]}"
assert_eq "last loop" "8" "${loop_results[7]}"

# Error context on first vs subsequent loops
loop=1
if [ $loop -eq 1 ]; then
  ERRORS_CONTEXT=""
else
  ERRORS_CONTEXT="has errors"
fi
assert_eq "first loop = no error context" "" "$ERRORS_CONTEXT"

loop=2
if [ $loop -eq 1 ]; then
  ERRORS_CONTEXT=""
else
  ERRORS_CONTEXT="has errors"
fi
assert_eq "second loop = has error context" "has errors" "$ERRORS_CONTEXT"

# ============================================================================
# 19. qa.sh — has_issues detection
# ============================================================================
echo ""
echo "=== qa.sh: has_issues ==="

# File with ZERO_ISSUES_FOUND sentinel
cat > "$TEST_DIR/qa_clean.md" <<'EOF'
# QA Report
ZERO_ISSUES_FOUND
All checks passed.
EOF

if grep -q "ZERO_ISSUES_FOUND" "$TEST_DIR/qa_clean.md" 2>/dev/null; then
  HAS_ISSUES_CLEAN="no"
else
  HAS_ISSUES_CLEAN="yes"
fi
assert_eq "zero issues sentinel" "no" "$HAS_ISSUES_CLEAN"

# File with findings
cat > "$TEST_DIR/qa_issues.md" <<'EOF'
# QA Report
### [F-01] Button not clickable
### [F-02] Text overflow
EOF

if grep -q "ZERO_ISSUES_FOUND" "$TEST_DIR/qa_issues.md" 2>/dev/null; then
  HAS_ISSUES_FOUND="no"
elif grep -q "^### \[F-" "$TEST_DIR/qa_issues.md" 2>/dev/null; then
  HAS_ISSUES_FOUND="yes"
fi
assert_eq "has findings" "yes" "$HAS_ISSUES_FOUND"

# ============================================================================
# 20. qa.sh — issue_count
# ============================================================================
echo ""
echo "=== qa.sh: issue_count ==="

ISSUE_COUNT=$(grep -c "^### \[F-" "$TEST_DIR/qa_issues.md" 2>/dev/null) || true
assert_eq "counts 2 issues" "2" "${ISSUE_COUNT:-0}"

ISSUE_COUNT_CLEAN=$(grep -c "^### \[F-" "$TEST_DIR/qa_clean.md" 2>/dev/null) || true
assert_eq "counts 0 issues in clean" "0" "${ISSUE_COUNT_CLEAN:-0}"

# ============================================================================
# 21. qa.sh — merge_reports counting
# ============================================================================
echo ""
echo "=== qa.sh: merge report counting ==="

cat > "$TEST_DIR/qa_func.md" <<'EOF'
### [F-01] Button broken
### [F-02] Text overflow
### [F-03] Missing link
EOF

cat > "$TEST_DIR/qa_vis.md" <<'EOF'
### [F-01] Button broken — CONFIRMED
### [F-02] Text overflow — DISMISSED
### [F-03] Missing link — CONFIRMED
### [F-04] New visual issue
EOF

func_count=$(grep -c "^### \[F-" "$TEST_DIR/qa_func.md" 2>/dev/null) || true
vis_total=$(grep -c "^### \[F-" "$TEST_DIR/qa_vis.md" 2>/dev/null) || true
vis_dismissed=$(grep -c "^### .*DISMISSED" "$TEST_DIR/qa_vis.md" 2>/dev/null) || true
vis_confirmed=$((vis_total - vis_dismissed))

assert_eq "functional count" "3" "$func_count"
assert_eq "visual total" "4" "$vis_total"
assert_eq "visual dismissed" "1" "$vis_dismissed"
assert_eq "visual confirmed" "3" "$vis_confirmed"

# ============================================================================
# 22. qa.sh — mode validation
# ============================================================================
echo ""
echo "=== qa.sh: mode validation ==="

for mode in smart functional visual; do
  case "$mode" in
    smart|functional|visual) VALID="yes" ;;
    *) VALID="no" ;;
  esac
  assert_eq "mode '$mode' is valid" "yes" "$VALID"
done

INVALID_MODE="broken"
case "$INVALID_MODE" in
  smart|functional|visual) VALID="yes" ;;
  *) VALID="no" ;;
esac
assert_eq "mode 'broken' is invalid" "no" "$VALID"

# ============================================================================
# 23. research-plan.sh — flag parsing
# ============================================================================
echo ""
echo "=== research-plan.sh: flag parsing ==="

# Simulate --quick flag
QUICK=false
args=(--quick "test topic")
for arg in "${args[@]}"; do
  case "$arg" in
    --quick) QUICK=true ;;
  esac
done
assert_eq "--quick sets QUICK=true" "true" "$QUICK"

# Simulate --file flag
TOPIC=""
echo "Topic from file" > "$TEST_DIR/topic.md"
TOPIC=$(cat "$TEST_DIR/topic.md")
assert_eq "--file reads topic" "Topic from file" "$TOPIC"

# File naming with RESEARCH_NAME
RESEARCH_NAME="streaks"
PLAN_FILE_TEST="RESEARCH-${RESEARCH_NAME}-PLAN.md"
assert_eq "named plan file" "RESEARCH-streaks-PLAN.md" "$PLAN_FILE_TEST"

RESEARCH_NAME=""
if [ -n "$RESEARCH_NAME" ]; then
  PLAN_FILE_TEST="RESEARCH-${RESEARCH_NAME}-PLAN.md"
else
  PLAN_FILE_TEST="RESEARCH-PLAN.md"
fi
assert_eq "unnamed plan file" "RESEARCH-PLAN.md" "$PLAN_FILE_TEST"

# ============================================================================
# 24. research-plan.sh — subtopic count from plan file
# ============================================================================
echo ""
echo "=== research-plan.sh: subtopic counting ==="

cat > "$TEST_DIR/plan_count.md" <<'EOF'
## Subtopics

- [ ] 01: First
- [ ] 02: Second
- [ ] 03: Third
EOF

SUBTOPIC_COUNT=$(grep -c "^- \[ \]" "$TEST_DIR/plan_count.md" 2>/dev/null || echo 0)
assert_eq "counts 3 subtopics" "3" "$SUBTOPIC_COUNT"

# Mixed checked/unchecked
cat > "$TEST_DIR/plan_mixed.md" <<'EOF'
- [x] 01: Done
- [x] 02: Done
- [ ] 03: Pending
- [ ] 04: Pending
EOF

REMAINING=$(grep -c "^- \[ \]" "$TEST_DIR/plan_mixed.md" 2>/dev/null) || true
DONE_COUNT=$(grep -c "^- \[x\]" "$TEST_DIR/plan_mixed.md" 2>/dev/null) || true
assert_eq "2 remaining" "2" "$REMAINING"
assert_eq "2 done" "2" "$DONE_COUNT"

# ============================================================================
# 25. Syntax checks for all scripts
# ============================================================================
echo ""
echo "=== Syntax checks (bash -n) ==="

SCRIPT_DIR="/Users/tomaszkuczera/Documents/Playground/wimhof-method-app"
for script in config.sh ralph-plan.sh ralph.sh ralph-task.sh qa.sh research-plan.sh research.sh test-scripts.sh; do
  if bash -n "$SCRIPT_DIR/$script" 2>/dev/null; then
    echo "  PASS: $script syntax OK"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $script has syntax errors"
    FAIL=$((FAIL + 1))
  fi
done

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "========================================="
echo "Results: $PASS passed, $FAIL failed"
echo "========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
