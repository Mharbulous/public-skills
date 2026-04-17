# public-skills

A collection of Claude Code skills worth sharing.

## What's here

### `/determinize`

Determinize existing skills looks for parts of skills that could be better handled by conventional deterministic algorithims rather than LLM inference. Uses a TDD-based workflow (harden → test → promote) to replace LLM stochastic skil protocols with deterministic scripts that produce identical output more consistently and without burning tokens.

Three modes:
- **harden** — inventory a skill, classify sections by determinism heuristics, extract procedures into scripts, verify no behavior change
- **test** — A/B test original stoachastic skill against determinized version of skill with controlled trials and significance analysis
- **promote** — replace the original skill with the hardened version after testing confirms improvement

### `/elucidate`

Tests whether a symbol name (variable, function, field, class) is self-documenting by running a blind multi-agent prediction protocol: agents predict what the symbol represents from the name plus minimal local context, then their predictions are scored against ground truth from a full codebase exploration. If a proposed alternative name scores higher, it gets renamed across the codebase.

Two modes:
- `/elucidate <symbol>` — run the protocol on a specific symbol.
- `/elucidate` — auto-discover a high-impact, ambiguously-named symbol in the current repo.

## Installation

Copy each skill into your `.claude/skills/` folder

## License

MIT — see [LICENSE](LICENSE). Use, fork, modify, and redistribute freely.
