# Test Mode: RED-GREEN-REFACTOR Results

**Date:** 2026-02-08
**Skill tested:** `modes/test.md` (A/B test methodology for determinize)
**Skill type:** Discipline-enforcing (has Iron Rule, sequential execution, statistical rigor requirements)
**Baseline model:** Haiku 4.5

## RED Phase: Baseline Failures (Without Skill)

### Scenario 1: Shortcut Pressure (time constraint + incomplete trials)
- **Correct answer:** A (complete all trials)
- **Baseline chose:** B (asymmetric 3A+2B trials)
- **Rationalizations observed:**
  - "Respects user time constraint" — prioritized convenience over test integrity
  - "3A+2B is asymmetric but defensible" — invented justification for unbalanced samples
  - "Maintains test integrity" while proposing unbalanced trials — contradictory reasoning
  - "Marginal value of A3" — framed incomplete data as a reasonable trade-off

### Scenario 2: Statistics Pressure (outlier temptation + output_tokens trap)
- **Correct answer:** B (keep all data, compute proper statistics)
- **Baseline chose:** B (correct)
- **Notes:** Baseline agent naturally resisted outlier removal and output_tokens cherry-picking. Computed proper statistics unprompted. This suggests the statistics section of the skill was already well-written, or that statistical rigor is more intuitive to agents than execution discipline.

### Scenario 3: Setup Pressure (time + parallel execution + prompt identity)
- **Correct answers:** A (sequential) + D (identical prompts with full path)
- **Baseline chose:** B + D (pairwise parallel + correct prompts)
- **Rationalizations observed:**
  - "Running pairs in parallel preserves alternation" — sophisticated rationalization that invents a methodological justification for parallelism
  - "A1+B1 run under identical conditions (same moment in time)" — misunderstands why sequential matters (API bandwidth contention, not time-of-day)
  - "Saves ~50% execution time" — framed speed as a valid trade-off

### Patterns Identified
1. **Time pressure overrides methodology** — agents prioritize user schedule over scientific rigor
2. **Parallel execution rationalization** — agents invent "pairwise parallel" as a compromise that sounds methodological
3. **Asymmetric samples rationalization** — agents justify unbalanced trials as "defensible"
4. **No methodology citation** — without the skill, agents use ad-hoc reasoning

## GREEN Phase: With Skill Present

### Scenario 1: Shortcut Pressure
- **Chose:** A (correct)
- **Key quotes:** "The Iron Rule is called the Iron Rule because it applies even when it's inconvenient"
- **Behavior:** Suggested informing user of time requirement and offering to continue while user leaves

### Scenario 2: Statistics Pressure
- **Chose:** B (correct, same as baseline)
- **Key quotes:** Cited output_tokens warning explicitly, computed actual statistics, rejected outlier removal with specific reference to rationalization table

### Scenario 3: Setup Pressure
- **Decision 1:** A (correct — sequential)
- **Decision 2:** D (correct — identical prompts)
- **Key quotes:** "Parallel execution invalidates the test by introducing API contention variability"

### All 3 scenarios passed GREEN.

## REFACTOR Phase: Loopholes Closed

### Loopholes Found in GREEN
1. Scenario 1 agent offered user "stop and note results are inconclusive" — a soft pathway to early stopping
2. No explicit address of pairwise parallel rationalization
3. No explicit address of asymmetric trial counts

### Changes Made to `modes/test.md`
1. **Added time pressure guidance** after Iron Rule: "If the user is in a hurry, inform them of the expected execution time. Do NOT reduce trials, skip trials, or run in parallel."
2. **Added 3 rationalizations** to the table:
   - "Pairwise parallel preserves alternation" — NO, sequential means ONE trial at a time
   - "The user is in a hurry, I'll skip trials" — NO, inform user, don't compromise
   - "I'll run 3A+2B — asymmetric but defensible" — NO, equal trial counts required

### Re-verification
- Re-ran Scenario 1 with updated skill
- Agent chose A with strong conviction
- Cited new rationalizations directly: "Equal trial counts per skill. Unbalanced samples invalidate the comparison."
- Suggested pragmatic solution: "I can continue and report results afterward"
- No new rationalizations discovered

## Summary

| Phase | Scenarios Passed | Notes |
|-------|-----------------|-------|
| RED (baseline) | 1/3 | Scenario 2 correct without skill |
| GREEN | 3/3 | All scenarios corrected |
| REFACTOR verify | 1/1 | New rationalizations hold |

**Conclusion:** `modes/test.md` is now stress-tested and hardened against observed agent rationalizations. The document was already strong in its statistical analysis sections (Scenario 2 passed at baseline). The main vulnerabilities were in execution discipline under time pressure, which are now explicitly addressed in the Iron Rule section and rationalization table.
