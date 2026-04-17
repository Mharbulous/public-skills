# Test Mode

## Overview

**Run controlled A/B tests between two skill variants to measure whether changes produce measurable differences.**

This mode compares two versions of the same skill (e.g., original vs hardened) by running both against the same task with identical inputs, capturing execution metrics, and performing significance analysis. It detects both improvements AND null results with equal rigor.

## Inputs

The user provides:

1. **Skill A** - path to the first skill file (typically the original)
2. **Skill B** - path to the second skill file (typically the modified/hardened variant)
3. **Test task prompt** - the prompt that exercises the skill (must be identical for both)
4. **Trial count** - number of trials per skill (default: 3, minimum: 3)

### Auto-Detection

If only one skill path is provided, auto-detect the pair:

| Pattern | Detected Pair |
|---------|---------------|
| `skills/Foo/SKILL.md` | Look for `skills/Foo-hardened/SKILL.md` |
| `skills/Foo-hardened/SKILL.md` | Look for `skills/Foo/SKILL.md` |

If no pair is found, ask the user for the second skill path.

## The Iron Rule

```
IDENTICAL INPUTS. SEQUENTIAL EXECUTION. NO SHORTCUTS.
```

Both skills MUST receive the exact same prompt with the exact same data. Trials MUST run sequentially (not in parallel) to eliminate API rate contention. Every trial MUST complete before the next begins.

**Time pressure**: If the user is in a hurry, inform them of the expected execution time (N trials x ~2-3 min each). Do NOT reduce trials, skip trials, or run in parallel. A compromised test with fast results is worse than a correct test that takes longer.

## Process

### Phase 1: Setup

1. **Read both skill files** and confirm they exist
2. **Verify the test prompt** exercises the skill's core functionality
3. **Determine trial order** - alternate A/B to control for cache warming and system load:
   - 3 trials: A1, B1, A2, B2, A3, B3
   - 4 trials: A1, B1, A2, B2, A3, B3, A4, B4
   - General pattern: Ai, Bi for i = 1..N
4. **Select agent model** - use the same model for ALL trials. Default: `sonnet` (most consistent variance per MEMORY.md). If the user specifies a model, use that instead.
5. **Set max turns** - default 50, or as specified by user

### Phase 2: Execute Trials

For each trial in the alternating sequence:

1. **Launch a Task agent** (`general-purpose` subagent) with:
   - The test task prompt
   - Instruction to use the specific skill (A or B)
   - `max_turns` set to the configured limit
   - `model` set to the selected model
   - `run_in_background: true`

2. **Wait for completion** before launching the next trial

3. **Extract metrics from NDJSON output** after each trial completes:

   Read the agent's output file. The reliable metrics from NDJSON are:

   | Metric | Source | Notes |
   |--------|--------|-------|
   | Duration (ms) | First and last timestamps | Wall clock time |
   | API calls | Count of assistant messages | Round trips to the API |
   | Tool uses | Count of tool_use content blocks | Individual tool invocations |
   | Input context | Sum of `input_tokens` + `cache_creation_input_tokens` + `cache_read_input_tokens` | Total context processed |
   | Cost ($) | From task completion message | If available |

   **Do NOT use `output_tokens`** - this field contains fragment counts (1-25 per call), not actual token usage.

4. **Record functional output** - capture the skill's actual results (matches found, classifications made, etc.) for equivalence comparison

5. **Record all metrics** in a results table before proceeding to the next trial

### Phase 3: Analyze Results

#### 3a. Compute Summary Statistics

For each metric, compute mean and standard deviation for both groups:

```
Metric: [name]
  Skill A: mean = X, std = Y (from N trials)
  Skill B: mean = X, std = Y (from N trials)
  Delta: absolute difference of means
  Delta %: (delta / mean_A) x 100
```

#### 3b. Significance Test

Apply the **2x standard deviation threshold**:

```
Significant = delta > 2 * max(std_A, std_B)
```

This is a conservative threshold. If the difference between means is NOT larger than twice the maximum standard deviation, attribute it to noise.

#### 3c. Variance Comparison

For each metric, compare standard deviations:

| Metric | Skill A Std | Skill B Std | Lower Variance |
|--------|-------------|-------------|----------------|
| ... | ... | ... | A or B |

Count how many metrics favor each skill. If one skill has lower variance in the majority of metrics, it is MORE consistent.

#### 3d. Functional Equivalence

Compare the actual output of both skills across all trials:

- Do they produce the same results?
- Are classification differences minor (confidence level) or major (different conclusions)?
- Is one skill MORE correct per its own rules?

### Phase 4: Report

Present the complete results in this format:

```markdown
# A/B Test Results: [Skill A Name] vs [Skill B Name]

**Date:** [date]
**Model:** [model used]
**Trials per skill:** [N]

## Raw Trial Data

| Trial | Skill | Duration (ms) | API Calls | Tool Uses | Input Context | Cost ($) |
|-------|-------|--------------|-----------|-----------|---------------|----------|
| 1 | A | ... | ... | ... | ... | ... |
| 2 | B | ... | ... | ... | ... | ... |
| ... | ... | ... | ... | ... | ... | ... |

## Summary Statistics

| Metric | A (mean +/- std) | B (mean +/- std) | Delta % | Significant? |
|--------|------------------|------------------|---------|--------------|
| Duration | ... | ... | ... | YES/NO |
| API Calls | ... | ... | ... | YES/NO |
| Tool Uses | ... | ... | ... | YES/NO |
| Input Context | ... | ... | ... | YES/NO |

## Variance Comparison

| Metric | A Std | B Std | Lower Variance |
|--------|-------|-------|----------------|
| ... | ... | ... | A/B |

**[Skill X] has lower variance in M/N metrics.**

## Functional Equivalence

[Summary of output comparison]

## Decision

[Apply decision matrix below]
```

### Phase 5: Decision

Apply the decision matrix:

| Result | Action |
|--------|--------|
| B shows lower variance AND no degradation in other metrics | B is an improvement. Recommend keeping B. |
| B shows no variance reduction | B does not achieve its goal. Recommend reverting to A. |
| Means differ significantly (any metric) | Investigate cause. Report which skill is better and why. |
| Functional differences found | Investigate which skill is more correct. Report findings. |
| No significant differences on any metric | Skills are equivalent. Recommend the simpler one (fewer files, less complexity). |

**Present the decision to the user.** Do not auto-delete or auto-modify skills. The user decides what to do with the results.

**If B is recommended:** Inform the user that promote mode exists for replacement:
"To replace the original skill with the hardened version, run `/determinize -promote` in a new session."

Do NOT load or read `modes/promote.md` from this mode. The user invokes promote mode separately.

## Common Rationalizations (All Wrong)

| Excuse | Reality |
|--------|---------|
| "3 trials is enough to see the pattern" | 3 is the minimum. If results are ambiguous, run more trials. |
| "I can run them in parallel to save time" | NO. Parallel execution shares API bandwidth. Sequential only. |
| "Pairwise parallel preserves alternation" | NO. Running A1+B1 simultaneously still shares bandwidth. Sequential means ONE trial at a time. |
| "The user is in a hurry, I'll skip trials" | NO. Inform the user of the time requirement. An incomplete test is worse than a delayed test. |
| "I'll run 3A+2B — asymmetric but defensible" | NO. Equal trial counts per skill. Unbalanced samples invalidate the comparison. |
| "The prompts are close enough" | NO. Byte-for-byte identical prompts. |
| "I'll just eyeball the difference" | NO. Compute statistics. Human intuition is unreliable for small samples. |
| "One outlier skewed it, let me remove it" | NO. Report all trials. Outliers are data. Note them but don't remove. |
| "The difference is obvious from trial 1" | NO. N=1 proves nothing. Complete all trials. |

## Quick Reference

| Step | Action |
|------|--------|
| 1 | Read both skills, verify test prompt |
| 2 | Run N trials per skill, alternating A/B, sequential |
| 3 | Extract NDJSON metrics after each trial |
| 4 | Compute mean, std, significance for each metric |
| 5 | Compare variance, functional equivalence |
| 6 | Apply decision matrix, present to user |
