---
name: elucidate
description: >
  Use when evaluating whether data element names in the lineage table are
  self-documenting, or when the Self-documenting? column has empty cells.
  Runs a blind multi-agent prediction protocol comparing original vs alternative
  names. Not for general variable renaming — use standard refactoring for that.
---

# Elucidate

## Overview

Test whether a data element name is self-documenting by comparing **blind predictions** (agents that only see the lineage table) against **ground truth** (full codebase exploration). If an alternative name produces better predictions, rename it across the codebase.

**Core insight:** A name is self-documenting when agents can accurately predict what it represents from the name alone, without codebase access.

## When to Use

- `Self-documenting?` column has empty cells in `docs/Data/2026-04-07_data-lineage-table.md`
- After populating all empty cells, re-evaluate elements marked `No`
- When all elements are `Yes`, report completion and exit

## Protocol Summary

8 agents total: 1 (pre-screen) + 1 (ground truth) + 2 (original predictions) + 1 (naming) + 2 (alt predictions) + 1 (judge). Steps 2 and 4 each run their 2 agents in parallel.

```
Step 0: Pre-screen (Sonnet, chat-only) — rank unevaluated elements; select top candidate
Step 1: Ground truth (Opus, Explore) — what does the element actually mean?
Step 2: Blind predictions ×2 — predict from original name only
Step 3: Naming agent — propose ONE alternative name
Step 4: Blind predictions ×2 — predict from alternative name
Step 5: Judging agent — score all 4 predictions blind (randomized aliases)
Step 6: Compare scores → winner → update table (+ rename if alternative wins)
```

## Element Selection

### Pre-Screening (Agent 0)

Before the 7-agent protocol, rank all unevaluated elements by likelihood of being non-self-documenting. This avoids wasting the expensive 7-agent protocol on names that are almost certainly fine.

1. Read the lineage table ONCE and extract every row where `Self-documenting?` is empty.
2. For each candidate, collect: element name + section title + populated column cells (for domain context).
3. Spawn **Agent 0** (Sonnet, chat-only, no tools) with the full candidate list — see prompt in `prompts.md`.
4. Agent 0 returns a ranked list (highest → lowest improvability likelihood) with a one-line rationale per element.
5. Select the **top-ranked** element for the full 7-agent protocol.

**Signals Agent 0 scores on:**
- Generic or overloaded terms (`status`, `data`, `flag`, `type`, `info`, `value`)
- Single-letter or cryptic abbreviations
- Names that describe structure rather than meaning (`list`, `item`, `record`)
- Ambiguity: name could plausibly describe 3+ different things
- No domain specificity for a legal document management app

If Agent 0 assigns equal scores to multiple elements, prefer the one appearing earliest in the table (stable ordering).

### Data Extraction

If the system prompt does not contain pre-extracted data, read the lineage table ONCE and extract all needed data in a single pass: unevaluated candidates (for Agent 0), then the selected element's row and section table (for Agents 1-7).

**Column headers vary per section** — always pass the selected element's section headers to ALL prediction agents.

## Agent Configuration

| Agent | Role | Model | Tools | Input |
|-------|------|-------|-------|-------|
| 0 | Pre-screen | Sonnet | None | All unevaluated element names + section titles + row cells |
| 1 | Ground truth | Opus | Explore (full) | Element name + lineage row |
| 2 | Row-only predict | Sonnet | None | Column headers + single row |
| 3 | Full-table predict | Sonnet | None | Full section table (target marked `>>>name<<<`) |
| 4 | Naming | Opus | None | Ground truth + both predictions + existing names list |
| 5-6 | Repeat of 2-3 | Sonnet | None | Same templates, alternative name substituted |
| 7 | Judge | Opus | None | All 4 predictions shuffled with aliases |

**Prompt templates:** See `prompts.md` in this directory.

**Chat-only constraint:** Agents 2-7 MUST receive the `CRITICAL_CONSTRAINT_BLOCK` (in prompts.md) prepended to their prompt. If any uses tools, the response is invalid — re-run with stronger constraint language.

## Blind Judging (Step 5)

1. Assign aliases: Alpha through Delta.
2. Shuffle all 4 predictions (Fisher-Yates).
3. Assign aliases in shuffled order.
4. Store mapping for score extraction.
5. Judge never sees agent IDs, model names, or which name was used.

**Scoring weights:**
- Concept accuracy: 40%
- Value accuracy: 30%
- Business context: 20%
- Specificity: 10%

## Decision Logic (Step 6)

```
original_scores  = [agent2, agent3]
alt_scores       = [agent5, agent6]

Compare on 3 metrics: min, avg, max
Each metric: alt strictly > original = alt wins that metric
Ties on a metric = original wins (status quo bias)

alt_wins >= 2 of 3 → alternative wins (rename)
alt_wins < 2       → original wins (keep)
```

### If Original Wins
Set `Self-documenting?` = `Yes`. Done.

### If Alternative Wins
1. Set `Self-documenting?` = `No`.
2. Execute Renaming Protocol (below).
3. Update lineage table row with new name in all columns.

## Renaming Protocol

### Phase 1: Discovery
Spawn Explore agent (Opus) to find ALL references: `src/**`, `functions/**`, `cloud-run/**`, tests, docs, config, Firestore rules. Check camelCase variants, field paths, string literals.

### Phase 2: Mechanical Rename
- **Source code** (`.js`, `.vue`): Replace identifiers.
- **Firestore fields**: Ask user for approval (blocking prompt). If user approves, rename the field. If user defers, proceed with JS-side-only rename and add a `// NOTE: Firestore field still uses "oldName"` comment at each divergence point.
- **Tests**: Update assertions and fixtures.
- **Docs + lineage table**: Update all references.

### Phase 3: Verification
1. Grep for old name — must return zero hits.
2. `npm run lint` — must pass.
3. `npm run test:run` — must pass.

## Edge Cases

- **All elements rated:** Report stats and exit.
- **`No` elements re-run:** Tests whether the NEW name is now self-documenting. If it also fails, flag for manual review (prevent infinite rename loop).
- **Proposed name already exists:** Reject and re-run Agent 6 with collision feedback (max 3 retries, then flag for manual naming).
- **Firestore field rename:** Schema migration — always requires user approval.
- **Element name in multiple sections:** Each row is independent; section context disambiguates.

## Error Handling

- **529 (overloaded):** Retry 3x with 30s backoff, then use fallback model (Opus→Sonnet, Sonnet→Haiku).
- **Parse failure on judge scores:** Re-run with explicit format instructions.

## Progress Reporting

| Step | Report |
|------|--------|
| Pre-screen | "Pre-screened {N} candidates. Top-ranked: **{name}** (score {S}/100) — {one-line rationale}." |
| Selection | "Selected: **{name}** from section {N}. {X} elements remaining." |
| Step 1 | "Ground truth established. {N} file references found." |
| Steps 2-3 | "2 blind predictions collected." |
| Step 3 | "Alternative name proposed: **{altName}**." |
| Steps 5-6 | "2 alternative-name predictions collected." |
| Step 5 | "Judging complete. Original {min}/{avg}/{max}, Alt {min}/{avg}/{max}." |
| Decision | "**{winner} wins** ({detail}). {action}." |
| Rename | "Renamed {old} -> {new} across {N} files. Tests: {pass/fail}." |

## Session Output Summary

End each run with a structured summary — see `prompts.md` § Output Template.
