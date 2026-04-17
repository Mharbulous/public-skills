# Stage 3: Baseline Tests

## Goal

Write regression tests for the CHOSEN candidate and run them against the ORIGINAL skill to establish baseline behavior.

## The Iron Law

```
NO HARDENING WITHOUT BASELINE TESTS FIRST
```

You MUST have a selected candidate from Stage 2 before entering this stage. If you don't have one, go back.

## Prerequisites

- Stage 2 (Classify & Score) must be complete
- A candidate section has been selected by the user (or auto-selected)
- You know exactly which section will be extracted to a script

## Steps

### Step 1 — Create Test Directory

Create `<skill-name>-hardened/tests/` if it doesn't exist.

### Step 2 — Write Regression Test Scenarios

Write test scenarios that exercise the skill's key behaviors, focusing on the section that will be hardened. Save in `<skill-name>-hardened/tests/`.

Each scenario should:
- Describe a specific input condition
- Specify expected behavior/output
- Cover normal cases, edge cases, and boundary conditions for the candidate section

### Step 3 — Run Baseline with Original Skill

Run each test scenario with a subagent using the ORIGINAL skill. Document baseline behavior verbatim.

### Step 4 — Record Baseline Results

Save baseline results in `<skill-name>-hardened/tests/baseline-results.md`. These are your regression suite — the hardened version MUST produce equivalent results.

## Red Flags — STOP

If you catch yourself thinking any of these:
- "The extraction is obvious, I don't need baseline tests" — Go back. Baseline first.
- "I can see exactly what to extract, testing would waste time" — Go back.
- "I'll write tests after to verify" — Backfilled tests prove nothing.
- "This is just moving code, what could go wrong?" — Go back.

## Gate

**Do NOT proceed to Stage 4 until:**
- Test scenarios are written and saved
- Baseline behavior is documented from running with the ORIGINAL skill
- Results are saved in `baseline-results.md`

**When complete:** Read `harden-stages/extract.md` and follow its instructions.
