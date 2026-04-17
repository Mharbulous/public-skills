# Stage 5: Verify

## Goal

Run the same regression tests from Stage 3 with the HARDENED skill and confirm all baseline behaviors are preserved.

## Prerequisites

- Stage 4 (Extract) must be complete — hardened SKILL.md and script exist
- Stage 3 baseline results are available for comparison

## Steps

### Step 1 — Run Regression Tests with Hardened Skill

Run the same test scenarios from Stage 3, but this time using the HARDENED skill (`<skill-name>-hardened/SKILL.md`).

### Step 2 — Compare Results

Compare hardened results against baseline results from `<skill-name>-hardened/tests/baseline-results.md`.

All baseline behaviors MUST be preserved:
- Same outputs for same inputs
- Same edge case handling
- No new failures

### Step 3 — Handle Failures

If any test fails: the hardening broke something.

1. Identify what changed between original and hardened behavior
2. Fix the helper script or hardened SKILL.md
3. Re-run the failing test
4. Repeat until all tests pass

**Do NOT proceed to Stage 6 with any failing tests.**

## Gate

**Do NOT proceed to Stage 6 until:**
- All regression tests pass with the hardened skill
- Results match baseline behavior

**When complete:** Read `harden-stages/commit-and-finalize.md` and follow its instructions.
