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

Tests whether a data element name is self-documenting by running a blind multi-agent prediction protocol: agents predict what a name represents from the lineage table alone, and their predictions are scored against ground truth. If an alternative name scores higher, it gets renamed across the codebase.

Designed for a Vue 3/Firebase project with a data lineage table. The protocol is general-purpose but the prompts are tuned for that context — adapt `prompts.md` for your own domain.

## Installation

Copy the skill directory into your `.claude/skills/` folder:

```bash
cp -r determinize ~/.claude/skills/determinize
cp -r elucidate ~/.claude/skills/elucidate
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
