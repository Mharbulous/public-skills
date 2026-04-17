# Stage 2: Classify & Score

## Goal

Classify every section of the skill and score deterministic sections against the 11 heuristics. Present ranked extraction candidates to the user for selection.

## Prerequisites

- Stage 1 (Inventory) must be complete — you need the section list and line ranges.
- **Load the determinism framework:** Read `references/determinism-heuristics.md` now.

## Steps

### Step 1 — Classify Each Section

For each section identified in the inventory:

**Ask the determinism question:** "Given identical input, would this section always produce identical output?"

- **If NO** — Mark as non-deterministic (requires LLM judgment). Note why.
- **If YES** — Mark as deterministic. Proceed to heuristic scoring.

**Classification is determinism-based, NOT format-based:**
- Tables of transformation rules (normalization, scoring thresholds) ARE script-extractable
- Code blocks with judgment calls ("review and decide") are NOT script-extractable
- Checklists requiring context-dependent interpretation are NOT script-extractable
- Step-by-step procedures with enumerable branches ARE script-extractable

### Step 2 — Score Deterministic Sections

For each section that passed the determinism test, score 0-3 points per heuristic:

1. Computational Intensity (0-3)
2. Data Volume with Low Signal Density (0-3)
3. Iteration Over Collections (0-3)
4. Precision-Critical Operations (0-3)
5. State Accumulation Across Items (0-3)
6. File I/O as Filtering (0-3)
7. Cross-Referencing Between Datasets (0-3)
8. Format Transformation (0-3)
9. Multi-Step Deterministic Pipelines (0-3)
10. Redundant Computation Across Phases (0-3)
11. Enumerable Branching (0-3)

See `references/determinism-heuristics.md` for detailed scoring guidance.

**Sum scores for each candidate section** (max 33 points per section).

### Step 3 — Calculate Determinism Value

For each scored section:

```
Determinism Value = (Heuristic Score / 33) x (Section Complexity) x (Execution Frequency)

Where:
- Heuristic Score = sum of 11 heuristic scores (0-33)
- Section Complexity = number of lines in section
- Execution Frequency = how many times this section runs per skill invocation
```

**Rank candidates by determinism value** (highest first).

### Step 4 — Check Prior Hardening Attempts

Search git history:

```bash
git log --all --grep="\[hardening:<skill-name>:" --oneline --format="%h %s (%ai)"
```

If matches found, display a "Previously Attempted Hardenings" section before the candidate list. This is informational only — previously-attempted candidates can still be selected.

If no matches found, skip silently.

### Step 5 — Present Candidates

**Present top 3 candidates to user:**

```
Top Script Extraction Candidates:

1. [Section Name]
   - Heuristic Score: X/33
   - Determinism Value: X,XXX
   - Key heuristics: [Which scored highest]
   - Why extract: [What LLM variance this eliminates]

2. [Section Name]
   - ...

3. [Section Name]
   - ...
```

**Interactive Mode (HITL):**

Ask the user: "Which candidate should I extract first? (Enter 1, 2, or 3, or 'skip' if no extraction is warranted)"

Wait for user response and proceed with their choice.

**Autonomous Mode (no HITL):**

Auto-select the highest-ranked candidate (candidate #1) and state: "Auto-selecting highest-ranked candidate: [Section Name] (Determinism Value: X,XXX)"

**One-at-a-time principle:** Only ONE script is extracted per hardening run, regardless of how many candidates are identified.

### No Candidates Found — STOP

When classification reveals no deterministic procedural content, STOP and report:

1. Show classification breakdown (% deterministic vs non-deterministic)
2. State: "No script extraction candidates found. This skill's content requires LLM judgment and cannot be replaced with deterministic scripts. Hardening does not apply to this skill."
3. End session. No `-hardened` copy is created.

**If a skill has no deterministic content, script extraction does NOT apply.** Do NOT force scripts where none are warranted.

## Gate

**Do NOT proceed to Stage 3 until:**
- Every section has been classified (determinism question answered)
- All deterministic sections have been scored against all 11 heuristics
- Candidates have been presented to the user
- User has selected a candidate (or process has ended due to no candidates)

**When complete:** Read `harden-stages/baseline-tests.md` and follow its instructions.
