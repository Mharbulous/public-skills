---
name: elucidate
description: >
  Tests whether a symbol name (variable, function, field, class) is
  self-documenting. Runs a blind multi-agent prediction protocol comparing the
  original name against an LLM-proposed alternative; if the alternative produces
  more accurate predictions from blind agents, renames it across the codebase.
  Use when invoked as `/elucidate <symbol>`, or as `/elucidate` with no
  argument to auto-discover a high-impact, ambiguously-named symbol in the
  current repo. Not for general refactoring — use standard rename for that.
---

# Elucidate

## Overview

Test whether a symbol name is self-documenting by comparing **blind predictions** (agents that only see the name plus minimal local context) against **ground truth** (full codebase exploration). If a proposed alternative name produces better blind predictions, rename it across the codebase.

**Core insight:** A name is self-documenting when an agent can accurately predict what it represents from the name alone, without reading the codebase.

## Invocation Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Targeted** | `/elucidate <symbolName>` | Run the 7-agent protocol on the given symbol. |
| **Auto-discover** | `/elucidate` (no args) | Scan the repo for high-impact, ambiguously-named symbols. Pick top candidate. Run the protocol. |

In auto-discover mode, candidate selection is itself an agent step (Agent 0). In targeted mode, Agent 0 is skipped.

## Protocol Summary

```
Step 0: (Auto-discover mode only) Scan repo → rank symbols → select top candidate
Step 1: Ground truth (Opus, full tools)  — what does the symbol actually mean?
Step 2: Blind prediction — name + minimal local context (declaration only)
Step 3: Blind prediction — name + module/file outline context
Step 4: Naming agent — propose ONE alternative name
Step 5: Blind predictions ×2 — repeat 2 + 3 with alternative name
Step 6: Judging agent — score all 4 predictions blind (randomized aliases)
Step 7: Compare scores → winner → rename if alternative wins
```

Steps 2+3 and 5+5b each run their two prediction agents in parallel.

## Step 0: Auto-Discovery (no-args mode)

**Goal:** find symbols that are (a) used in many places (high renaming payoff) and (b) likely non-self-documenting (high improvability).

### Discovery procedure

1. **Enumerate candidate symbols.** Prefer `jcodemunch` if the repo is indexed (`mcp__jcodemunch__list_repos` to check, `mcp__jcodemunch__index_repo` to index if needed). Use `mcp__jcodemunch__search_symbols` with broad patterns to collect declared symbols across the project. Fall back to Grep on declaration patterns (`function `, `const `, `class `, language-appropriate equivalents) if jcodemunch is unavailable.
2. **Filter to plausibly-ambiguous names** before counting references — checking references for every symbol is expensive. Keep names that match any of:
   - Generic: `status`, `data`, `flag`, `type`, `info`, `value`, `item`, `record`, `result`, `list`, `map`, `obj`, `arr`, `thing`, `temp`, `val`, `res`, `ret`, `out`, `input`, `output`, `params`, `config`, `options`, `helper`, `util`, `handle`, `process`, `manage`, `do`, `run`
   - Short: ≤ 3 characters AND not a well-known idiom (`id`, `ok`, `db` are fine)
   - Single-letter outside of loop indices in their own file
   - Pure structural words: ends in `List`, `Map`, `Obj`, `Arr`, `Set` with no domain prefix
3. **Count references** for each filtered candidate using `mcp__jcodemunch__find_references` (or Grep with word boundaries). Drop symbols with < 5 references — too low impact.
4. **Compose candidate list** with: name, declaration file:line, reference count, declared kind (function/variable/field/class).
5. **Spawn Agent 0** (Sonnet, chat-only) with the candidate list. Agent 0 returns a ranked list with rationale; pick the top entry.
6. **Cap candidate list at 50** before sending to Agent 0 (token economy). If more than 50 pass filtering, keep the 50 with the highest reference counts.

### When auto-discovery fails

- **No symbols pass the filter:** report "No high-ambiguity symbols found in this repo. Specify a symbol explicitly with `/elucidate <name>`." and exit.
- **All ranked candidates score low:** if Agent 0's top score is < 40/100, report and exit — the codebase is already well-named.

## Step 1: Ground Truth

Spawn **Agent 1** (Opus, Explore subagent type) to determine exactly what the symbol represents. Provide:
- The symbol name
- Its declaration file:line
- The declaration line itself

Agent 1 explores the repo (every reference, the data flow, type, possible values, business purpose) and returns a structured summary. Prefer `jcodemunch` tools per project conventions; fall back to Grep when jcodemunch is unavailable.

## Steps 2–3: Blind Predictions (Original Name)

Both agents run in parallel. Both are Sonnet, chat-only, with the `CRITICAL_CONSTRAINT_BLOCK` (see `prompts.md`) prepended.

| Agent | Context provided | Purpose |
|-------|------------------|---------|
| 2 | Symbol name + declaration line + file path | Tests "name alone" self-documentation |
| 3 | Symbol name + declaration + file outline (sibling symbols in same file/module) | Tests whether *local context* rescues an ambiguous name |

For Agent 3, generate the file outline using `mcp__jcodemunch__get_file_outline` if available; otherwise Grep top-level declarations from the file.

The target symbol in the outline is marked with `>>>name<<<` so Agent 3 knows which one to predict.

## Step 4: Naming Agent

**Agent 4** (Opus, chat-only) sees the ground truth + both blind predictions and proposes ONE alternative name.

Constraints on the proposal:
- Same identifier conventions as the original (camelCase / snake_case / PascalCase — match the host language and surrounding code).
- Max 30 characters.
- More specific than the original.
- Must NOT collide with any existing top-level symbol in the file or module. Pass a list of sibling names so Agent 4 can avoid collisions.

## Steps 5–5b: Blind Predictions (Alternative Name)

Identical to Steps 2–3, but with the alternative name substituted into the declaration line and outline (the surrounding code is otherwise unchanged). Run in parallel.

## Step 6: Blind Judging

Spawn **Agent 7** (Opus, chat-only) with all 4 predictions in **randomized order with aliases** (Alpha / Beta / Gamma / Delta). The judge does not know which prediction came from which name.

**Randomization:** Fisher-Yates shuffle. Store the alias→agent mapping for score extraction.

**Scoring weights:**
- Concept accuracy: 40%
- Value/type accuracy: 30%
- Business/domain context: 20%
- Specificity: 10%

## Step 7: Decision Logic

```
original_scores = [agent2_total, agent3_total]
alt_scores      = [agent5_total, agent5b_total]

Compare on 3 metrics: min, avg, max.
For each metric: alt strictly > original ⇒ alt wins that metric.
Ties on a metric ⇒ original wins (status quo bias).

alt wins ≥ 2 of 3 metrics ⇒ alternative wins (rename).
otherwise                  ⇒ original wins (keep).
```

### If original wins
Report the result and exit. The name is self-documenting enough.

### If alternative wins
Run the renaming protocol below.

## Renaming Protocol

### Phase 1: Discovery
Spawn an Explore agent (Opus) to find ALL references. Use `mcp__jcodemunch__find_references` first; fall back to Grep with word boundaries. Check casing variants (camelCase ↔ snake_case ↔ PascalCase), property accesses, string literals (event names, dispatch strings, route params), and config files.

### Phase 2: Mechanical Rename
- **Source code:** Edit identifiers across all reference sites.
- **External-schema fields** (database columns, Firestore fields, API contracts, on-the-wire JSON keys): **ASK USER FIRST** — schema changes have migration consequences. If the user defers, do JS-side rename only and add a one-line comment at the divergence point: `// schema field still uses "<oldName>"`.
- **Tests:** update assertions and fixtures.
- **Docs:** update any markdown that references the symbol.

### Phase 3: Verification
1. Search for the old name — must return zero hits in source. (String-literal hits in tests/docs are inspected case-by-case.)
2. Run the project's lint command if one exists (`npm run lint`, `ruff check`, etc.).
3. Run the project's test command if one exists.

If lint or tests fail, report failures and stop — don't auto-revert the rename, but don't proceed past the failure either. The user decides whether to fix forward or revert.

## Edge Cases

- **Symbol not found** (targeted mode): Report and exit. Suggest fuzzy matches if `jcodemunch search_symbols` returns near hits.
- **Symbol declared in multiple places** (e.g., method on multiple classes): Treat each declaration site as a separate symbol. Ask the user which one in targeted mode; pick the most-referenced one in auto-discover mode and report the choice.
- **Proposed name collides with existing identifier:** Re-run Agent 4 with collision feedback (max 3 retries). After 3 failures, report and stop.
- **External-schema field rename:** Always blocking-prompt the user.
- **Re-run on a previously-renamed symbol:** No state is persisted. The skill will happily re-evaluate the new name.

## Error Handling

- **Model overload (529):** Retry 3× with 30s backoff, then fall back to a smaller model (Opus → Sonnet → Haiku).
- **Judge score parse failure:** Re-run Agent 7 with explicit `| Alias | Concept | Values | Business | Specificity | Total |` table format.
- **Tool-use violation by chat-only agent:** Re-spawn with strengthened constraint language — count as one of the 3 retries.

## Progress Reporting

| Step | Report |
|------|--------|
| 0 (auto) | "Scanned {N} symbols, {M} passed ambiguity filter. Top candidate: **{name}** ({R} refs, score {S}/100)." |
| 1 | "Ground truth: {one-sentence definition}. {N} references." |
| 2–3 | "2 blind predictions on original name collected." |
| 4 | "Proposed alternative: **{altName}**." |
| 5–5b | "2 blind predictions on alternative name collected." |
| 6 | "Judged. Original {min}/{avg}/{max}, Alt {min}/{avg}/{max}." |
| 7 | "**{winner} wins** ({2-1 or 3-0}). {action taken}." |
| Rename | "Renamed `{old}` → `{new}` in {N} files. Lint: {pass/fail}. Tests: {pass/fail}." |

## Final Output

End every run with the structured summary defined in `prompts.md` § Output Template.
