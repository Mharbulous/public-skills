# GREEN Phase Results

## Date: 2026-02-08
## Tested WITH determinize skill

### Scenario 3: Declarative-Only (Clean Exit)
**Agent behavior:**
- Classified code-review-checklist as 100% declarative/non-deterministic, 0% deterministic
- Applied determinism question to every section: "Given identical input, would this section always produce identical output?"
- Stated: "No script extraction candidates found... Hardening does not apply to this skill."
- Did NOT attempt progressive disclosure
- Did NOT offer any fallback optimization
- Exited cleanly after classification

**Baseline failures addressed:**
- Progressive disclosure fallback: PASS - not offered (old skill still had it as option)
- Framing: PASS - used determinism language throughout

**Result: PASS - Clean exit, correct framing**

### Scenario 4: Framing (Determinism vs Token Savings)
**Agent behavior:**
- Used "purely deterministic", "identical output for identical input", "predictability and robustness"
- Used "eliminates LLM variance" multiple times
- Included dedicated trade-off section: "More predictable but more brittle"
- Did NOT mention "token savings", "token efficiency", "reducing context"
- Did NOT mention "progressive disclosure"
- Correctly identified non-deterministic parts that should stay in SKILL.md

**Baseline failures addressed:**
- Token savings framing: PASS - completely absent, replaced with determinism framing
- Progressive disclosure: PASS - not mentioned
- Trade-off acknowledgment: PASS - dedicated section

**Result: PASS - Correct framing throughout**

## Comparison: Baseline vs GREEN

| Failure Pattern | Baseline (optimizing-skills) | GREEN (determinize) |
|---|---|---|
| Token savings framing | 3/3 used token language | 0/2 used token language |
| Progressive disclosure offered | 1/3 (checkpoint text) | 0/2 offered |
| Clean exit when no scripts | Offered progressive disclosure fallback | Exited cleanly |
| Trade-off acknowledged | 1/3 mentioned | 2/2 mentioned |
| Determinism framing | Only when scenario overrode skill | Natural from skill language |

## New Rationalizations Found: NONE
No new rationalizations were observed in GREEN phase testing.
Both agents followed the skill precisely and the framing was correct.
