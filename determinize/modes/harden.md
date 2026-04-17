# Harden Mode

## Overview

**Harden existing skills by extracting deterministic procedures into helper scripts.**

Core insight: The biggest value comes from **extracting deterministic procedures into helper scripts** — not for token savings, but because deterministic scripts produce identical output for identical input, eliminating LLM variance for those phases. A 200-line procedure in SKILL.md that an LLM must reason through becomes `run scripts/do_thing.<ext>` — the script executes with guaranteed correctness for computational tasks.

**The trade-off:** Hardened skills are more predictable and robust but also more brittle. If inputs change in ways the script doesn't anticipate, you must modify the script rather than relying on LLM flexibility.

**REQUIRED BACKGROUND:**
- superpowers:test-driven-development
- superpowers:writing-skills

## Staged Execution

This process is split into 6 stages. **Read each stage file ONLY when you reach that stage.** Do NOT read ahead.

```
Stage 1: Inventory        → Read harden-stages/inventory.md
Stage 2: Classify & Score → Read harden-stages/classify-and-score.md
Stage 3: Baseline Tests   → Read harden-stages/baseline-tests.md
Stage 4: Extract          → Read harden-stages/extract.md
Stage 5: Verify           → Read harden-stages/verify.md
Stage 6: Commit & Finalize→ Read harden-stages/commit-and-finalize.md
```

**Each stage has a gate condition.** Do NOT proceed to the next stage until the current stage's gate is satisfied. The gate is at the bottom of each stage file.

**Reading ahead is a violation.** Do NOT read `extract.md` while working on `classify-and-score.md`. Do NOT read `verify.md` while working on `baseline-tests.md`. Each stage tells you exactly which file to read next. If you find yourself wanting to "understand the full process first" — that's the read-ahead rationalization. Trust the gates.

## Language Selection

Extracted helper scripts can be written in any supported scripting language. Available languages have reference files in `references/`.

1. **If the user specified a language** in their prompt (e.g., "use JavaScript for scripts"), use it.
2. **If no language was specified**, ask the user which language they prefer before proceeding.
3. **Load `references/<language>.md`** for the chosen language and use its substitutions throughout.

## The Iron Law

```
NO HARDENING WITHOUT BASELINE TESTS FIRST
```

Wrote hardened SKILL.md before testing the original? Delete it. Start over.

**No exceptions:**
- Not because "the extraction is obvious"
- Not because "it's just extracting code blocks"
- Not because "I can backfill tests after"
- Backfilled tests prove nothing - they test what you built, not what you should have preserved

## Begin

**Start now:** Read `harden-stages/inventory.md` and follow its instructions.

Do NOT read any other stage file until directed to by the current stage's gate condition.

## Output Structure

```
<skill-name>-hardened/
  SKILL.md
  scripts/           # Extracted helper scripts
  references/        # Inherited from original (if any)
  tests/             # Regression tests (ALWAYS present)
    baseline-results.md
    scenario-*.md
```

**The `tests/` folder is MANDATORY.** It lives inside the hardened skill folder and is never deleted.

## Red Flags - STOP

If you catch yourself thinking any of these, STOP:

- "The extraction is obvious, I don't need baseline tests"
- "I can see exactly what to extract, testing would waste time"
- "I'll write tests after to verify"
- "This is just moving code, what could go wrong?"
- "Let me create a script for this checklist/decision tree"
- "I should also restructure the reference material while I'm at it"

**All of these mean: Go back to Stage 3. Baseline first.**

| Rationalization | Reality |
|----------------|---------|
| "Extraction is obvious" | Obvious extractions still break subtle behavior. Test first. |
| "Backfill tests after" | Tests written after hardening verify what you built, not what you should preserve. Worthless. |
| "Just extracting code blocks" | Code blocks have context (thresholds, error formats, edge cases). Easy to lose. |
| "I'll script this checklist" | Checklists are non-deterministic (require judgment). Scripts for non-deterministic content waste effort. |
| "No scripts found, but I can still restructure" | If no deterministic procedures exist, hardening doesn't apply. Exit cleanly. |
| "I'll read ahead to understand the full process" | Each stage gives you exactly what you need. Reading ahead causes stage-skipping. |

## Quick Reference

| Skill Content Type | Hardening Strategy |
|-------------------|--------------------|
| Deterministic procedures | Extract to helper scripts |
| Non-deterministic content (judgment, guidelines) | Leave in SKILL.md — LLM flexibility is the value |
| Reference material (schemas, examples) | Leave in SKILL.md — no hardening benefit |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping baseline tests | Always Stage 3 first |
| Reading ahead to later stages | Read ONLY the current stage file |
| Forcing scripts on non-deterministic content | Recognize when script extraction doesn't apply |
| Modifying the original skill | Always create `<name>-hardened/` copy |
| Forgetting to save tests | Tests go in `<name>-hardened/tests/` - mandatory |
| Not testing extracted scripts | Run each script to verify it works |
| Framing value as token savings | The value is determinism (same input = same output), not efficiency |
| Creating a deprecated/archived folder | Git history is the recovery mechanism — the commit in Stage 6 preserves both versions |
| Committing original + hardened together | Commit ONLY hardened files in Stage 6 to create a clean recovery point |
| Combining classification with test writing | Complete ALL of Stage 2 before starting Stage 3 |
