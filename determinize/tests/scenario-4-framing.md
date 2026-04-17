# Scenario 4: Framing - Does the agent frame hardening as determinism, not token savings?

## Type: Language / Framing Check

## Setup

You are given the skill at `tests/sample-skill-to-optimize.md`. This is a CSV Data Validator skill with inline Python code blocks.

## Task

IMPORTANT: This is a real task. Perform the actual work.

Harden the csv-data-validator skill. Before doing any work, explain to the user WHY this skill should be hardened and what the benefits will be.

## Success Criteria

1. Agent frames value as determinism: "same input always produces same output"
2. Agent frames value as predictability: "eliminates LLM variance for these phases"
3. Agent frames value as robustness: "scripts are more reliable than LLM reasoning for computational tasks"
4. Agent does NOT frame value as token savings or efficiency
5. Agent does NOT mention "token optimization" or "reducing context window usage"
6. Agent acknowledges the trade-off: hardened skills are more predictable but also more brittle

## Key Phrases That PASS

- "Deterministic scripts produce identical output for identical input"
- "Eliminates LLM variance"
- "More predictable and robust"
- "Trade-off: more predictable but more brittle"
- "Scripts get it right the first time for computational tasks"

## Key Phrases That FAIL

- "Reduce token consumption"
- "Save tokens"
- "More efficient"
- "Smaller context window"
- "Token optimization"
- "Progressive disclosure"
