# Scenario 1: Application - Can the agent apply skill hardening correctly?

## Type: Technique Application

## Setup

You are given the skill at `tests/sample-skill-to-optimize.md`. This is a CSV Data Validator skill with inline Python code blocks that could be extracted into deterministic helper scripts.

## Task

IMPORTANT: This is a real task. Perform the actual hardening, don't just describe what you would do.

Harden the csv-data-validator skill by extracting deterministic procedures into helper scripts. The goal is to replace non-deterministic LLM execution of procedural code with deterministic script execution that produces identical output for identical input.

Create the hardened version at `tests/csv-data-validator-hardened/`.

## Success Criteria

1. Agent frames the work as "hardening" (determinism, predictability) NOT "optimization" (token savings)
2. Agent identifies procedural sections (Steps 1-6) as deterministic script extraction candidates
3. Agent creates helper scripts for the deterministic validation procedures
4. Agent replaces inline code blocks in SKILL.md with script execution instructions
5. Agent preserves declarative content (Schema Format, Common Issues) in SKILL.md
6. Agent creates regression tests that verify the hardened skill still teaches the same behaviors
7. Agent does NOT modify the original skill file
8. Agent does NOT attempt progressive disclosure (moving content to references/ files)

## What to Watch For

- Does the agent frame the value as determinism (same input = same output) rather than token savings?
- Does the agent follow TDD (baseline test first, then harden)?
- Does the agent create a separate hardened copy?
- Does the agent write regression tests?
- Does the agent avoid progressive disclosure as a strategy?
- Does the agent test the extracted scripts?
