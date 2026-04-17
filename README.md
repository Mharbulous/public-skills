# public-skills

A collection of Claude Code skills worth sharing.

## What's here

### `/determinize`

Hardens existing skills by extracting deterministic procedures into helper scripts. Uses a TDD-based workflow (harden → test → promote) to replace LLM variance with scripts that produce identical output for identical input.

Three modes:
- **harden** — inventory a skill, classify sections by determinism, extract procedures into scripts, verify no behavior change
- **test** — A/B test two skill variants with controlled trials and significance analysis
- **promote** — replace the original skill with the hardened version after testing confirms improvement

### `/elucidate`

Tests whether a symbol name (variable, function, field, class) is self-documenting by running a blind multi-agent prediction protocol: agents predict what the symbol represents from the name plus minimal local context, then their predictions are scored against ground truth from a full codebase exploration. If a proposed alternative name scores higher, it gets renamed across the codebase.

Two modes:
- `/elucidate <symbol>` — run the protocol on a specific symbol.
- `/elucidate` — auto-discover a high-impact, ambiguously-named symbol in the current repo.

## Installation

Copy each skill into your `.claude/skills/` folder:

```bash
cp -r determinize ~/.claude/skills/determinize
cp -r .claude/skills/elucidate ~/.claude/skills/elucidate
```

Then register the skill in your `.claude/settings.json` (or globally in `~/.claude/settings.json`):

```json
{
  "skills": [
    "determinize",
    "elucidate"
  ]
}
```

Invoke with `/determinize` or `/elucidate` in Claude Code.
