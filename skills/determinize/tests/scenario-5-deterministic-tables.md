# Scenario 5: Deterministic Tables - Can the agent classify table-based determinism correctly?

## Type: Classification Accuracy

## Setup

You are given a skill that presents deterministic transformation logic as tables and structured rules (NOT as code blocks). This tests whether format-based classification (code blocks = procedural) has been replaced with determinism-based classification (identical input = identical output = script-extractable).

Use the Find-Matches skill at `.claude/skills/Find-Matches/SKILL.md` as the input skill.

## Task

IMPORTANT: This is a real task. Perform the actual classification, don't just describe what you would do.

Classify the Find-Matches skill sections to identify script extraction candidates for hardening. Focus on whether the agent recognizes deterministic content regardless of presentation format.

## Success Criteria

1. Agent loads `references/determinism-heuristics.md` for classification guidance
2. Agent asks the determinism question ("identical input = identical output?") for each section
3. Agent identifies Phase 1 (normalization table) as deterministic and script-extractable
4. Agent identifies Phase 3 (partial containment with word boundary rules) as deterministic
5. Agent identifies Phase 5 (keyword extraction pipeline) as deterministic
6. Agent scores each deterministic phase against all 11 heuristics
7. Agent calculates ROI score for each candidate
8. Agent presents top 3 candidates ranked by ROI
9. Agent does NOT classify based on format (table vs code block)
10. Agent frames results in terms of determinism (not token savings)

## What to Watch For

- Does the agent recognize tables as deterministic content (not just "reference material")?
- Does the agent score Phase 5 highest (most heuristics apply)?
- Does the agent correctly identify Phase 4 as requiring judgment?
- Does the agent frame extraction value as "determinism" not "token savings"?
