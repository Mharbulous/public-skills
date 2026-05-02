# RED Phase Baseline Results - Testing Against Current optimizing-skills

## Date: 2026-02-08
## Tested WITH current optimizing-skills skill (testing for hardening-specific failures)

### Scenario 1: Application (Script Extraction with Hardening Framing)
**Agent behavior:**
- Followed TDD correctly: RED phase first, baseline tests, then GREEN
- Extracted validate-types.py script (correct choice - highest ROI)
- Created tests/ directory with scenarios and baseline-results.md
- Skipped progressive disclosure when scenario told it not to (but only because scenario explicitly said so)
- FAILED: Mixed framing - used both "hardening" and "optimization" language
- FAILED: Naturally gravitated to token/speed language from the skill's ROI formula
- FAILED: Hardened-results.md says "Token savings achieved: ~1,100 tokens" and "Speed improvement" prominently
- Agent self-reported: "I primarily thought in terms of 'optimization' because the SKILL.md I was following uses that language exclusively"

**Key failure:** The skill's language anchors agents in optimization framing. The ROI formula literally asks agents to calculate "Token Savings" - this makes determinism framing impossible.

### Scenario 3: Declarative-Only (Clean Exit)
**Agent behavior:**
- Correctly classified code-review-checklist as 95% declarative, 0% procedural
- Correctly stated "No script extraction candidates found"
- PASS: Did NOT attempt progressive disclosure as fallback
- PASS: Did NOT create an optimized/hardened copy
- PASS: Exited cleanly after classification
- Mentioned "token savings" only in context of explaining why NOT proceeding (50-70% savings)

**Surprising result:** The current skill ALREADY handles this correctly. The checkpoint on lines 138-146 asks "Proceed with progressive-disclosure-only optimization, or abort?" - agent chose abort path correctly. However, the checkpoint text still references progressive disclosure as an option.

### Scenario 4: Framing (Determinism vs Token Savings)
**Agent behavior:**
- PASS: Used "determinism," "predictability," "same input = same output" language
- PASS: Mentioned trade-off "more predictable but also more brittle"
- PASS: Did NOT mention "progressive disclosure"
- PARTIAL FAIL: Did NOT mention "token savings" in the main explanation
- Agent self-reported: "I followed the test scenario's success criteria rather than the SKILL.md's own language"

**Key insight:** The agent was smart enough to read the test's success criteria and follow those instead of the skill. This means the test scenario itself taught the framing, not the skill. The skill's own language is all token-optimization.

## Patterns Identified

1. **Framing mismatch (3/3 scenarios)**: The skill's language is "optimizing" and "token efficiency". Agents default to this framing unless the scenario explicitly overrides it.
2. **Progressive disclosure still present (1/3 failed)**: The skill still offers progressive disclosure as a fallback option (lines 138-146, 156-166). Even though agents can choose to skip it, its presence anchors it as a valid strategy.
3. **ROI formula uses wrong vocabulary (3/3 affected)**: The formula calculates "Token Savings" and "Speed Multiplier" - both optimization-frame language. Should use "Determinism Score" or similar.
4. **Agent followed scenario over skill (2/3)**: When scenario and skill conflicted on framing, agents followed the scenario. This proves the skill needs to be rewritten to match the desired framing.

## What the Hardened Skill Must Fix

1. Remove ALL "token optimization" framing from title, description, overview, formulas
2. Remove Step 3 (Progressive Disclosure) entirely
3. Remove progressive-disclosure fallback from User Checkpoint
4. Reframe ROI formula around determinism value, not token savings
5. Rename from "optimizing-skills" to "determinize"
6. Update Quick Reference table to remove "Reference → Move to references/" row
7. Remove line 216's reference to progressive disclosure increasing tokens
8. Update Common Mistakes table
