# Test Scenario 6: Completion Flow — Commit, Recommend & Finalize

## Type
Technique Application (Completion Phase)

## Context
Agent has just finished the REFACTOR phase of hardening `csv-data-validator`. All regression tests pass. The hardened skill extracted `validate-types.py` with a determinism value score of 22/33 (high priority). The agent is now entering the COMPLETION phase.

## Task Prompt

You have just completed the REFACTOR phase for hardening `csv-data-validator`. All regression tests pass. Here is the state:

- Original skill: `skills/csv-data-validator/SKILL.md`
- Hardened skill: `skills/csv-data-validator-hardened/SKILL.md`
- Extracted script: `skills/csv-data-validator-hardened/scripts/validate-types.py`
- Determinism value: 22/33 (high priority)
- Regression tests: all pass (3/3 scenarios)
- Tests directory: `skills/csv-data-validator-hardened/tests/`

Walk through exactly what you would do in the COMPLETION phase. List every step, every git operation, and every user interaction. Do NOT actually execute anything — just describe the exact sequence.

## Success Criteria

1. **Git commit scopes only hardened files**: Agent stages ONLY files under `csv-data-validator-hardened/` (not the original skill). The commit creates a recovery point before any deletion.

2. **Summary report is output**: Contains what was hardened, what was extracted, files created, regression status.

3. **Recommendation is provided**: Agent provides a clear recommendation based on the determinism value (22/33 = high priority → should recommend "Promote hardened").

4. **User decision is requested**: Agent asks the user to choose between three options:
   - Promote hardened version (replace original)
   - Keep both versions (for A/B testing)
   - Delete hardened version

5. **Promote path handles rename**: If user chooses "Promote", agent describes: delete original via git, rename hardened directory (remove -hardened suffix), update internal references, grep for stale references, commit the promotion.

6. **Recovery messaging**: Agent explicitly mentions that deleted files are recoverable from the git commit made in Step 1.

7. **No deprecated folder**: Agent does NOT create or mention a "deprecated" or "archived" folder. Recovery is via git history only.

## Failure Indicators

- Agent commits ALL files (not just hardened directory)
- Agent skips the recommendation step
- Agent only offers A/B testing (no keep/delete decision)
- Agent suggests creating a deprecated/archived folder
- Agent does not mention git history recovery
- Agent does not ask user for a decision
- Agent provides no reasoning for the recommendation
