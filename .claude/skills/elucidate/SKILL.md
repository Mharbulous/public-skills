---
name: elucidate
description: >
  Tests whether a symbol name (variable, function, field, class) is
  self-documenting. Runs a blind multi-agent prediction protocol comparing the
  original name against an LLM-proposed alternative; if the alternative produces
  more accurate predictions from blind agents, renames it across the codebase.
  Use when invoked as `/elucidate <symbol>` (or `/elucidate name1,name2,...`
  for up to 10 symbols), or as `/elucidate` with no argument to auto-discover
  high-impact ambiguously-named symbols in the current repo. Not for general
  refactoring — use standard rename for that.
---

# Elucidate

## Overview

Test whether a symbol name is self-documenting by comparing **blind predictions** (agents that only see the name plus minimal local context) against **ground truth** (full codebase exploration). If a proposed alternative name produces better blind predictions, rename it across the codebase.

**Core insight:** A name is self-documenting when an agent can accurately predict what it represents from the name alone, without reading the codebase.

## Invocation Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Targeted — single** | `/elucidate foo` | Run the protocol on one symbol. |
| **Targeted — batch** | `/elucidate foo,bar,baz` | Run the protocol on a comma-separated list (max 10). |
| **Auto-discover** | `/elucidate` (no args) | Prompt for batch size (1/3/5/10 or custom 1–10), scan the repo, pick top-K candidates, run the protocol. |

In auto-discover mode, candidate selection is itself an agent step (Agent 0). In targeted mode, Agent 0 is skipped.

## Batch Mode

The protocol runs **the same 7 agents** whether the batch size is 1 or 10. Each agent's prompt carries a list of up to 10 symbols; each returns one block per symbol. Never fan out extra agents for batching.

Within a run, symbols are identified by stable tags `S1, S2, …, SN`. Every agent must return its output ordered by tag so the orchestrator can zip responses back to symbols deterministically.

**Batch size limits:** 1 ≤ N ≤ 10. Requests above 10:
- **Targeted mode:** hard error `"Batch size {N} > 10 not supported. Split into multiple runs."` and exit.
- **Auto-discover "Other":** respond "Max batch size is 10" and re-ask.

**Batch-size prompt (auto-discover only):** use `AskUserQuestion` with options `1`, `3`, `5`, `10`. "Other" is auto-added. On "Other", parse:
- integer 1–10 → accept
- integer > 10 → "Max batch size is 10" and re-ask the same question
- non-integer / empty → "Please enter a whole number 1–10" and re-ask

**Duplicate names** in a targeted batch are deduplicated silently (log the dedup). **Unknown names** are reported as `not_found` in the final summary and skipped from the protocol — the rest of the batch proceeds.

## Protocol Summary

```
Step 0: (Auto-discover mode only) Prompt for batch size → scan repo → rank symbols → select top K
Step 1: Ground truth (Opus, full tools)  — what does each symbol actually mean?
Step 2: Blind prediction — name + minimal local context (declaration only)
Step 3: Blind prediction — name + module/file outline context
Step 4: Naming agent — propose ONE alternative name per symbol
Step 5: Blind predictions ×2 — repeat 2 + 3 with alternative names
Step 6: Judging agent — score all 4N predictions blind (per-symbol randomized aliases)
Step 7: Compare scores per symbol → winner → sequentially rename each winning symbol
```

Steps 2+3 and 5+5b each run their two prediction agents in parallel. Agent count does not scale with batch size.

## Step 0: Auto-Discovery (no-args mode)

**Goal:** find symbols that are (a) used in many places (high renaming payoff) and (b) likely non-self-documenting (high improvability), then pick the top **K** where K is the user-chosen batch size.

### Batch-size prompt

Before scanning, call `AskUserQuestion` with options `1`, `3`, `5`, `10`. Handle "Other" per the Batch Mode section above (1–10 accept, >10 re-ask, invalid re-ask).

### Discovery procedure

1. **Enumerate candidate symbols.** Prefer `jcodemunch` if the repo is indexed (`mcp__jcodemunch__list_repos` to check, `mcp__jcodemunch__index_repo` to index if needed). Use `mcp__jcodemunch__search_symbols` with broad patterns to collect declared symbols across the project. Fall back to Grep on declaration patterns (`function `, `const `, `class `, language-appropriate equivalents) if jcodemunch is unavailable.
2. **Filter to plausibly-ambiguous names** before counting references — checking references for every symbol is expensive. Keep names that match any of:
   - Generic: `status`, `data`, `flag`, `type`, `info`, `value`, `item`, `record`, `result`, `list`, `map`, `obj`, `arr`, `thing`, `temp`, `val`, `res`, `ret`, `out`, `input`, `output`, `params`, `config`, `options`, `helper`, `util`, `handle`, `process`, `manage`, `do`, `run`
   - Short: ≤ 3 characters AND not a well-known idiom (`id`, `ok`, `db` are fine)
   - Single-letter outside of loop indices in their own file
   - Pure structural words: ends in `List`, `Map`, `Obj`, `Arr`, `Set` with no domain prefix
3. **Count references** for each filtered candidate using `mcp__jcodemunch__find_references` (or Grep with word boundaries). Drop symbols with < 5 references — too low impact.
4. **Compose candidate list** with: name, declaration file:line, reference count, declared kind (function/variable/field/class).
5. **Spawn Agent 0** (Sonnet, chat-only) with the candidate list **and the requested K**. Agent 0 returns a ranked list with rationale and selects the top K entries.
6. **Cap candidate list at 50** before sending to Agent 0 (token economy). If more than 50 pass filtering, keep the 50 with the highest reference counts.
7. **Shortfall:** if fewer than K candidates survive filtering, proceed with what's available and note the shortfall in progress output.

### When auto-discovery fails

- **No symbols pass the filter:** report "No high-ambiguity symbols found in this repo. Specify a symbol explicitly with `/elucidate <name>`." and exit.
- **All ranked candidates score low:** if Agent 0's top-ranked score is < 40/100, report and exit — the codebase is already well-named. (Even in K>1 mode, a low top score means none of the candidates are worth the effort.) If the top score is ≥ 40 but fewer than K candidates clear the 40 threshold, proceed with only the ones that do and report the shortfall.

## Step 1: Ground Truth

Spawn **Agent 1** (Opus, Explore subagent type) to determine exactly what each symbol represents. Provide an array of N entries, each:
- The symbol tag (`S1`, `S2`, …)
- The symbol name
- Its declaration file:line
- The declaration line itself

Agent 1 explores the repo for each symbol (every reference, the data flow, type, possible values, business purpose) and returns N structured summaries, one per tag. Prefer `jcodemunch` tools per project conventions; fall back to Grep when jcodemunch is unavailable.

## Steps 2–3: Blind Predictions (Original Names)

Both agents run in parallel. Both are Sonnet, chat-only, with the `CRITICAL_CONSTRAINT_BLOCK` (see `prompts.md`) prepended. Each receives the full array of N symbols and must return N predictions ordered by tag.

| Agent | Context provided | Purpose |
|-------|------------------|---------|
| 2 | Array of {name, declaration line, file path} | Tests "name alone" self-documentation |
| 3 | Array of {name, declaration, file outline with target marked} | Tests whether *local context* rescues an ambiguous name |

For Agent 3, generate each file outline using `mcp__jcodemunch__get_file_outline` if available; otherwise Grep top-level declarations from the file.

The target symbol in each outline is marked with `>>>name<<<` so Agent 3 knows which one to predict.

## Step 4: Naming Agent

**Agent 4** (Opus, chat-only) sees the N ground truths + 2N blind predictions + N sibling lists and proposes ONE alternative name **per symbol**.

Constraints on each proposal:
- Same identifier conventions as the original (camelCase / snake_case / PascalCase — match the host language and surrounding code).
- Max 30 characters.
- More specific than the original.
- Must NOT collide with any existing top-level symbol in that symbol's file or module. Pass each symbol's sibling names so Agent 4 can avoid collisions.

### Collision retry (Agent 4R)

If Agent 4's proposal for symbol `Si` collides with a sibling, spawn **Agent 4R** (Opus, chat-only) with ONLY that symbol's ground truth + both predictions + updated sibling list (including the rejected name flagged as "do not propose"). Returns one new proposal. Max 3 retries per symbol. Other symbols' valid proposals are preserved. If `Si` still fails after 3 retries, mark it `rename_blocked` and continue the batch.

## Steps 5–5b: Blind Predictions (Alternative Names)

Identical to Steps 2–3, but each symbol's alternative name is substituted into the declaration line and outline (the surrounding code is otherwise unchanged). Run in parallel.

Symbols marked `rename_blocked` in Step 4 are **excluded** from Steps 5–7 — there's no alternative to evaluate.

## Step 6: Blind Judging

Spawn **Agent 7** (Opus, chat-only) with all 4N predictions grouped by symbol. **Aliases are randomized independently per symbol** (each symbol's four predictions get their own Alpha/Beta/Gamma/Delta shuffle). The judge does not know which prediction came from which name, and no cross-symbol alias comparison is requested.

**Randomization:** Fisher-Yates shuffle, one per symbol. Store the per-symbol alias→agent mapping for score extraction.

**Scoring weights (same as before):**
- Concept accuracy: 40%
- Value/type accuracy: 30%
- Business/domain context: 20%
- Specificity: 10%

## Step 7: Decision Logic

Apply the **same per-symbol** logic for each of the N symbols independently:

```
original_scores = [agent2_total, agent3_total]   # for this symbol
alt_scores      = [agent5_total, agent5b_total]  # for this symbol

Compare on 3 metrics: min, avg, max.
For each metric: alt strictly > original ⇒ alt wins that metric.
Ties on a metric ⇒ original wins (status quo bias).

alt wins ≥ 2 of 3 metrics ⇒ alternative wins (rename this symbol).
otherwise                  ⇒ original wins (keep this symbol).
```

Collect the set of **winning-alternative symbols** W ⊆ batch. Proceed to the rename phase with W.

## Renaming Protocol

Run **sequentially** per winning symbol — never parallelize renames. Each winning symbol completes all three phases before the next begins, so verification failures on one rename don't corrupt the state of later renames.

Order: process winners in tag order (`S1`, `S2`, …). If any rename's Phase 3 fails, stop the sequence; report which symbols were renamed, which remain pending, and which are skipped.

### Phase 1: Discovery
Spawn an Explore agent (Opus) to find ALL references for this symbol. Use `mcp__jcodemunch__find_references` first; fall back to Grep with word boundaries. Check casing variants (camelCase ↔ snake_case ↔ PascalCase), property accesses, string literals (event names, dispatch strings, route params), and config files.

### Phase 2: Mechanical Rename
- **Source code:** Edit identifiers across all reference sites.
- **External-schema fields** (database columns, Firestore fields, API contracts, on-the-wire JSON keys): **ASK USER FIRST** — schema changes have migration consequences. If the user defers, do JS-side rename only and add a one-line comment at the divergence point: `// schema field still uses "<oldName>"`.
- **Tests:** update assertions and fixtures.
- **Docs:** update any markdown that references the symbol.

### Phase 3: Verification
1. Search for the old name — must return zero hits in source. (String-literal hits in tests/docs are inspected case-by-case.)
2. Run the project's lint command if one exists (`npm run lint`, `ruff check`, etc.).
3. Run the project's test command if one exists.

If lint or tests fail, report failures and stop the rename sequence — don't auto-revert the rename, but don't proceed past the failure either. The user decides whether to fix forward or revert.

## Edge Cases

- **Batch size > 10** (targeted): hard error `"Batch size {N} > 10 not supported. Split into multiple runs."` and exit.
- **Batch size > 10** (auto-discover "Other"): "Max batch size is 10" and re-ask.
- **Non-integer / empty "Other":** "Please enter a whole number 1–10" and re-ask.
- **Duplicate names in targeted batch:** dedupe silently (log the dedup).
- **Symbol not found** (any mode): mark as `not_found`, include in final summary, continue with the rest of the batch. If **all** targeted names are missing, report and exit. Suggest fuzzy matches if `jcodemunch search_symbols` returns near hits.
- **Symbol declared in multiple places** (method on multiple classes, etc.): each declaration site is a separate symbol. In targeted mode, ask the user which one. In auto-discover mode, pick the most-referenced declaration and report the choice.
- **Proposed name collides with existing identifier:** Agent 4R re-proposal loop (max 3 retries per symbol). On continued failure, mark that symbol `rename_blocked` and continue.
- **External-schema field rename:** Always blocking-prompt the user (unchanged). If the user defers for one symbol, proceed with the JS-side rename and divergence comment; move on to the next symbol.
- **Agent returns wrong symbol count:** treat as malformed — retry the agent once with a stricter format reminder; if still wrong, fail the whole batch.
- **Re-run on a previously-renamed symbol:** No state is persisted. The skill will happily re-evaluate the new name.

## Error Handling

- **Model overload (529):** Retry 3× with 30s backoff, then fall back to a smaller model (Opus → Sonnet → Haiku).
- **Judge score parse failure:** Re-run Agent 7 with explicit `| Alias | Concept | Values | Business | Specificity | Total |` table format (grouped by symbol in batch mode).
- **Tool-use violation by chat-only agent:** Re-spawn with strengthened constraint language — count as one of the 3 retries.

## Progress Reporting

Line prefix `[Si]` = per-symbol detail within a batch. Omit the prefix when K=1.

| Step | Report |
|------|--------|
| 0 (auto) | "Scanned {N} symbols, {M} passed ambiguity filter. Selecting top {K}: S1 `name1` ({R1} refs, score {score1}), S2 `name2` ({R2} refs, score {score2}) …" |
| 1 | "Ground truth collected for {K} symbols. [Si] {one-sentence definition}, {N} refs." |
| 2–3 | "2 blind predictions on original names collected ({K}×2 predictions)." |
| 4 | "Proposed alternatives: [S1] `alt1`, [S2] `alt2`, …  {C} collision retries via Agent 4R." |
| 5–5b | "2 blind predictions on alternative names collected." |
| 6 | "Judged. [Si] Original {min}/{avg}/{max}, Alt {min}/{avg}/{max}." |
| 7 | "Per-symbol results: [S1] **alt wins** (3-0), [S2] original wins (2-1), …" |
| Rename | "Renaming {M} winners sequentially. [S1] Renamed `{old}` → `{new}` in {F} files. Lint: {pass/fail}. Tests: {pass/fail}." |

## Final Output

End every run with the structured summary defined in `prompts.md` § Output Template.

- For **K=1**: emit the existing single-symbol template only (no batch summary).
- For **K>1**: emit the batch summary block followed by one `## Elucidation Result` block per symbol (reusing the existing template).
