# Determinism Heuristics Framework

## Overview

**Purpose:** Identify which deterministic steps in a skill will benefit most from extraction into helper scripts, eliminating LLM variance for those phases.

**Core insight:** The question is NOT "is this a code block?" (format-based). The question is: "Given identical input, would the output always be identical?" (determinism-based). Tables of transformation rules are just as script-extractable as code blocks.

**Use case:** During the GREEN phase of determinize, score each section of a skill to identify high-value script extraction candidates.

## How to Use This Framework

1. **Identify candidate steps** - Any section that appears deterministic (same input → same output)
2. **Score against each heuristic** - Rate 0-3 for each applicable heuristic (0=not present, 3=strongly present)
3. **Sum heuristic scores** - Higher total = higher priority for script extraction
4. **Estimate ROI** - Use scoring guidance to predict token savings and speed improvement
5. **Rank candidates** - Extract highest-scoring candidates first

---

## The 11 Heuristics

### 1. Computational Intensity

**Definition:** Steps requiring many calculations, comparisons, or modifications. Conventional algorithms outperform LLMs at computation.

**Key question:** "How bad are humans at this kind of computation?"

**Example from Find-Matches skill:**
- Phase 1: Normalize every clientNo+matterNo combination (strip dots, lowercase, combine with colon)
- Phase 2: Match each folder against every CSV row
- Phase 3: Check partial number containment with word boundary rules

All three are deterministic string operations repeated N×M times. A human would struggle with 50 folders × 200 CSV rows = 10,000 comparisons. An LLM must reason through each one. A script loops silently.

**Scoring guidance:**
- **0 points:** No iteration, single comparison
- **1 point:** Small iteration (< 10 items)
- **2 points:** Medium iteration (10-100 items)
- **3 points:** Large iteration (100+ items) or nested loops

**Token savings estimate:** ~50-100 tokens per iteration step × number of items processed

**Speed improvement:** 10-100x faster (avoids reasoning overhead for each calculation)

---

### 2. Data Volume with Low Signal Density

**Definition:** Steps that read through large amounts of text/data where most content is irrelevant to the task. Computers handle this via memory; humans via forgetting; but LLMs must process every token.

**Key question:** "How much of this data is actually needed for the output?"

**Example from Find-Matches skill:**
- Loading entire CSV file (200 rows × 100 chars = 20,000 chars) to extract 5 client numbers
- Reading all subfolder names to search for 3 specific keywords
- Scanning 50 folder names to count how many contain "L" prefix

The script reads the data, extracts the signal, returns only what's needed (500 chars instead of 20,000). The LLM loads everything into context.

**Scoring guidance:**
- **0 points:** All data is relevant
- **1 point:** 50-70% of data is signal
- **2 points:** 20-50% of data is signal
- **3 points:** <20% of data is signal (high fluff ratio)

**Token savings estimate:** (Total tokens - Signal tokens) saved by returning filtered result

**Speed improvement:** 2-10x faster (avoids loading irrelevant context)

---

### 3. Iteration Over Collections

**Definition:** "For each of N items, apply rule X" where rule X is deterministic. LLM cost scales linearly with N (unrolls the loop in reasoning). Script loops silently.

**Key question:** "Does the size of the collection directly affect reasoning cost?"

**Example from Find-Matches skill:**
- "For each folder in list, normalize the matter number"
- "For each CSV row, extract keywords from Name and Matter fields"
- "For each subfolder, check if it contains any of 10 keywords"

Larger N = bigger win. If N can grow from 50 to 500, the LLM pays 10× more; the script doesn't care.

**Scoring guidance:**
- **0 points:** No iteration
- **1 point:** Fixed small collection (< 10 items)
- **2 points:** Variable collection (10-100 items)
- **3 points:** Large or unbounded collection (100+ items or user-provided data)

**Token savings estimate:** ~30-80 tokens per iteration × N items

**Speed improvement:** Linear with N (2× items = 2× speedup for script, same cost for LLM)

---

### 4. Precision-Critical Operations

**Definition:** Character-level string matching, exact arithmetic, hash comparison, date parsing. LLMs approximate and sometimes need self-correction passes (doubling token cost). Scripts get it right the first time.

**Key question:** "Does this require exact character-by-character correctness?"

**Example from Find-Matches skill:**
- Checking if "l145" is contained at word boundary in "4077-l145" (requires precise regex or character position checking)
- Stripping leading dots from ".L145" (must remove exactly the dots, nothing else)
- Comparing normalized strings for exact equality (case-sensitive after normalization)

LLMs can fumble character-level operations. Scripts never do.

**Scoring guidance:**
- **0 points:** Fuzzy matching is acceptable
- **1 point:** Approximate precision needed (90% accuracy OK)
- **2 points:** High precision needed (99% accuracy required)
- **3 points:** Perfect precision required (100% - hash comparison, exact string match)

**Token savings estimate:** ~100-200 tokens if self-correction needed, ~50 tokens if avoided

**Speed improvement:** 2-5x faster (eliminates reasoning about character positions)

---

### 5. State Accumulation Across Items

**Definition:** Steps building running results (counters, lookup tables, scored candidate lists). LLM must hold growing state in context. Scripts maintain state in variables for free.

**Key question:** "Does this build up intermediate data that's only used later?"

**Example from Find-Matches skill:**
- Building a lookup table: `{normalizedMatterNo: csvRow}` for 200 CSV rows
- Accumulating matched folders into `confirmedMatches[]` and `possibleMatches[]`
- Counting how many folders matched vs unmatched for final summary

The LLM must keep the entire lookup table in reasoning context. A script stores it in a variable and references it instantly.

**Scoring guidance:**
- **0 points:** No intermediate state
- **1 point:** Small state (< 10 items accumulated)
- **2 points:** Medium state (10-100 items)
- **3 points:** Large state (100+ items or complex nested structure)

**Token savings estimate:** ~State size in tokens × number of times state is referenced

**Speed improvement:** 5-20x faster (instant variable lookup vs context scanning)

---

### 6. File I/O as Filtering

**Definition:** Reading files/directories to extract small pieces of information. LLM loads entire content into context; script reads and returns only relevant bits.

**Key question:** "What percentage of the file content is actually needed?"

**Example from Find-Matches skill:**
- Reading CSV file with 200 rows to extract just the rows where clientNo = "4077"
- Listing all subfolders to count how many contain "Rodrozen"
- Reading folder structure to find folders starting with "L"

Script returns 5 filtered results. LLM would need to load all 200 rows into context first.

**Scoring guidance:**
- **0 points:** No file I/O
- **1 point:** Small files (< 1KB) or all content needed
- **2 points:** Medium files (1-10KB) with filtering
- **3 points:** Large files (> 10KB) or directories with many entries

**Token savings estimate:** ~(File size - Filtered result size) in tokens

**Speed improvement:** 10-50x faster (only reads what's needed)

---

### 7. Cross-Referencing Between Datasets

**Definition:** Comparing every item in set A against set B. O(N×M) for LLMs processing linearly; O(N+M) with hash maps in scripts.

**Key question:** "Does this compare items from two different lists?"

**Example from Find-Matches skill:**
- Match 50 folders against 200 CSV rows = 10,000 comparisons
- For each folder, search 200 CSV rows for matching matter number
- For each CSV row, check if any of 50 folders contain its keywords

LLM must reason through each comparison. Script builds a hash map of one set, then looks up items from the other set in O(1) time.

**Scoring guidance:**
- **0 points:** No cross-referencing
- **1 point:** Small sets (N×M < 100)
- **2 points:** Medium sets (N×M = 100-1,000)
- **3 points:** Large sets (N×M > 1,000)

**Token savings estimate:** ~50 tokens per comparison × (N×M comparisons)

**Speed improvement:** 10-100x faster (hash map lookup vs linear scan)

---

### 8. Format Transformation

**Definition:** Parsing CSV, constructing JSON, building markdown tables. Completely deterministic; LLMs spend tokens on formatting mechanics and occasionally get structure wrong.

**Key question:** "Is this just moving data between formats with no interpretation?"

**Example from Find-Matches skill:**
- Parsing CSV rows into structured objects: `{clientNo, matterNo, name, matter}`
- Building markdown table from match results:
  ```
  | Folder | CSV Match | Confidence |
  |--------|-----------|------------|
  | L145   | 4077.L145 | High       |
  ```
- Converting folder list to JSON array for output

Pure structural transformation. No judgment required.

**Scoring guidance:**
- **0 points:** No format transformation
- **1 point:** Simple transformation (split string, join array)
- **2 points:** Structured transformation (CSV → objects, objects → table)
- **3 points:** Complex transformation (nested structures, multiple formats)

**Token savings estimate:** ~100-300 tokens per transformation (avoids explaining format rules)

**Speed improvement:** 5-15x faster (dedicated parser vs reasoning about commas/quotes)

---

### 9. Multi-Step Deterministic Pipelines

**Definition:** When step A feeds step B and both are deterministic, LLM holds intermediate data in context that serves no reasoning purpose. Script chains internally, returns only final result.

**Key question:** "Are there intermediate results only used to calculate the final result?"

**Example from Find-Matches skill:**
- Step 1: Normalize all matter numbers → intermediate list
- Step 2: Build lookup table from normalized numbers → intermediate map
- Step 3: Match folders against lookup table → final result

The intermediate list and map serve no purpose after matching is done. LLM keeps them in context; script discards them.

**Scoring guidance:**
- **0 points:** Single-step transformation
- **1 point:** 2-step pipeline
- **2 points:** 3-4 step pipeline
- **3 points:** 5+ step pipeline or branching/merging pipelines

**Token savings estimate:** ~(Sum of intermediate result sizes) in tokens

**Speed improvement:** 3-10x faster (no context overhead for intermediate data)

---

### 10. Redundant Computation Across Phases

**Definition:** Same deterministic operation needed in multiple places. LLM recomputes each time; script computes once and memoizes. LLMs structurally cannot maintain persistent variables across reasoning steps.

**Key question:** "Is this calculation repeated with the same inputs?"

**Example from Find-Matches skill:**
- Normalizing the same matter number in Phase 1, Phase 2, and Phase 3
- Extracting keywords from CSV row multiple times (once for each folder it might match)
- Checking if a string is "generic" (same check applied to 200 different CSV descriptions)

LLM repeats the logic each time. Script caches: `const normalized = memoize(normalize)`.

**Scoring guidance:**
- **0 points:** No repeated computation
- **1 point:** Repeated 2-3 times
- **2 points:** Repeated 4-10 times
- **3 points:** Repeated 10+ times or across different phases

**Token savings estimate:** ~(Computation cost) × (Number of repetitions - 1)

**Speed improvement:** Linear with repetitions (10 repetitions = 10× speedup from memoization)

---

### 11. Enumerable Branching

**Definition:** All possible cases fully specified (if score >= 3, confirmed; if 1-2, possible; etc.). LLM spends tokens reasoning through a decision tree with no ambiguity. Script resolves with a simple conditional.

**Key question:** "Are all the branches explicitly defined with no judgment needed?"

**Example from Find-Matches skill:**
- Confidence scoring:
  ```
  if (numberMatch && descriptionMatch) → Confirmed (high)
  else if (numberMatch && deepeningScore >= 3) → Confirmed (medium)
  else if (numberMatch && deepeningScore >= 1) → Possible (low)
  else if (fuzzyNameMatch) → Confirmed (medium)
  else → No match
  ```

Every case is enumerated. No interpretation required. LLM still "thinks" through each branch; script evaluates conditionals instantly.

**Scoring guidance:**
- **0 points:** No branching or requires judgment
- **1 point:** 2-3 simple branches (if/else)
- **2 points:** 4-6 branches or nested conditionals
- **3 points:** 7+ branches or complex decision tree with all cases specified

**Token savings estimate:** ~20-50 tokens per branch × number of branches

**Speed improvement:** 5-20x faster (instant conditional evaluation vs reasoning)

---

## ROI Estimation Methodology

### Scoring Process

1. **For each candidate step in the skill:**
   - Read the step's content
   - Score against each of the 11 heuristics (0-3 points per heuristic)
   - Sum the scores to get total determinism score (0-33 max)

2. **Prioritize extraction candidates:**
   - **High priority (score >= 18):** Extract these first - major token/speed wins
   - **Medium priority (score 9-17):** Extract if time permits - moderate wins
   - **Low priority (score < 9):** Probably not worth extracting - minimal wins

### Token Savings Formula

**Estimated total token savings per extraction:**

```
Token Savings = (Step size in tokens) × (Execution frequency) × (Heuristic multiplier)
```

Where:
- **Step size in tokens** ≈ number of lines in SKILL.md × 20 tokens/line
- **Execution frequency** = how many times this step runs per skill invocation
- **Heuristic multiplier** = (Total heuristic score / 33) × 2

**Example:**
- Step size: 50 lines × 20 = 1,000 tokens
- Frequency: 3 times per invocation
- Heuristic score: 21/33 → multiplier = 1.27
- **Token savings: 1,000 × 3 × 1.27 = 3,810 tokens per invocation**

### Speed Improvement Formula

**Estimated speed improvement:**

```
Speed Multiplier = 1 + (Total heuristic score / 10)
```

**Example:**
- Heuristic score: 21
- Speed multiplier: 1 + (21/10) = 3.1×
- If LLM takes 30 seconds, script takes ~10 seconds

### Relative ROI Ranking

When comparing multiple extraction candidates:

1. Calculate **ROI score** for each:
   ```
   ROI Score = (Token Savings) × (Speed Multiplier) / (Implementation Effort)
   ```

2. **Implementation effort estimates:**
   - Simple script (single function, < 50 lines): 1.0
   - Medium script (multiple functions, 50-150 lines): 1.5
   - Complex script (external dependencies, > 150 lines): 2.5

3. **Sort candidates by ROI score (highest first)**

4. **Extract in priority order** until diminishing returns

---

## Usage Guide for LLM Classification

### Context: When to Load This Reference

Load this reference during the **GREEN phase, Step 1** of determinize when classifying sections as "script-extractable or not."

### Classification Workflow

**For each section of the skill being hardened:**

1. **Read the section content**

2. **Ask the determinism question:** "Given identical input, would this section always produce identical output?"
   - If NO → Mark as "Declarative" or "Reference" (not script-extractable)
   - If YES → Proceed to heuristic scoring

3. **Score against all 11 heuristics:**
   - Go through each heuristic definition
   - Rate 0-3 based on scoring guidance
   - Record individual scores and sum total

4. **Estimate token savings and speed improvement:**
   - Use formulas from ROI Estimation Methodology section
   - Calculate ROI score

5. **Output classification result:**
   ```
   Section: "Phase 1: Exact Number Match"
   Type: Procedural (script-extractable)
   Heuristic scores:
     - Computational Intensity: 2
     - Data Volume: 1
     - Iteration: 3
     - Precision: 3
     - State Accumulation: 2
     - File I/O: 0
     - Cross-Referencing: 3
     - Format Transformation: 1
     - Pipelines: 0
     - Redundancy: 1
     - Branching: 2
   Total Score: 18/33
   Priority: High
   Est. Token Savings: ~2,500 tokens
   Est. Speed Improvement: 2.8×
   ROI Score: 7,000 (2,500 × 2.8 / 1.0)
   ```

6. **Repeat for all sections, then rank by ROI score**

---

### Example: Classifying Find-Matches Phases

**Phase 1: Exact Number Match**

Content snippet:
```
Match clientNo + matterNo after normalization. Normalization rules:
- Strip leading dots
- Lowercase
- Combine clientNo:matterNo
For each folder, normalize its number and check against all CSV rows.
```

**Scoring:**
- Computational Intensity: 2 (normalization repeated for every folder+CSV combination)
- Data Volume: 1 (only extracting number fields)
- Iteration: 3 (nested loop: for each folder, for each CSV row)
- Precision: 3 (exact string matching required)
- State Accumulation: 2 (building lookup table)
- File I/O: 0 (data already loaded)
- Cross-Referencing: 3 (folders × CSV rows)
- Format Transformation: 1 (normalization is minor transformation)
- Pipelines: 0 (single-step comparison)
- Redundancy: 2 (same normalization repeated)
- Branching: 1 (simple match/no-match)

**Total: 18/33 → High priority extraction candidate**

---

**Phase 5: Keyword Deepening**

Content snippet:
```
Extract keywords from CSV row. Filter out common words (Inc, Ltd, the, of).
Search folder subfolders and filenames for keyword hits.
Score: +1 per keyword hit, +2 for client number or multi-part name.
If score >= 3: Confirmed (medium). If 1-2: Possible (low).
```

**Scoring:**
- Computational Intensity: 3 (string parsing, filtering, searching)
- Data Volume: 3 (reading all subfolder names and filenames)
- Iteration: 3 (for each keyword, search all subfolders)
- Precision: 2 (fuzzy keyword matching)
- State Accumulation: 2 (accumulating hit scores)
- File I/O: 3 (reading directory structure)
- Cross-Referencing: 3 (keywords × subfolders)
- Format Transformation: 1 (extracting keywords is minor)
- Pipelines: 2 (extract keywords → filter → search → score)
- Redundancy: 2 (same keyword filtering logic repeated)
- Branching: 2 (confidence thresholds)

**Total: 26/33 → Highest priority extraction candidate**

---

## Red Flags - You Are About to Misclassify

### Scripts for Non-Deterministic Content

**Red flag:** Creating scripts for checklists, decision trees that require judgment, or guidelines.

**Example:**
```
❌ BAD: Scripting this
"Review the test results and decide if the optimization preserved behavior"
(Requires human judgment)

✅ GOOD: Scripting this
"Run pytest, parse output, count PASS vs FAIL, return JSON summary"
(Completely deterministic)
```

**Why:** Scripts only work for deterministic steps. If a human would interpret it differently based on context, it's not scriptable.

---

### Format-Based Classification Instead of Determinism-Based

**Red flag:** Asking "Is this a code block?" instead of "Is this deterministic?"

**Example:**
```
❌ BAD: "This is a table, not code, so it's not script-extractable"

✅ GOOD: "This table maps inputs to outputs deterministically - it's script-extractable"
```

**Why:** Tables of transformation rules (normalization rules, confidence thresholds, format specifications) are just as deterministic as code blocks.

---

### Ignoring Low-Scoring Heuristics

**Red flag:** Only scoring the obvious heuristics (iteration, computation) and skipping others.

**Example:**
```
❌ BAD: "This has iteration (3 points) so it's worth extracting"
(Ignoring that it's only 5 items and has no other heuristics)

✅ GOOD: "This has iteration (1 point for small N), precision (3 points),
cross-referencing (2 points), branching (2 points) = 8 total - medium priority"
```

**Why:** The heuristics are cumulative. A step can have moderate scores across many heuristics and still be high-value.

---

### Not Estimating Implementation Effort

**Red flag:** Extracting low-ROI scripts because "might as well."

**Example:**
```
❌ BAD: "This step scored 6/33, but I'll script it anyway"
(ROI score would be negative after accounting for implementation time)

✅ GOOD: "This step scored 6/33 → low priority, skip extraction"
```

**Why:** Implementation effort matters. A complex script (effort 2.5) that saves 500 tokens has worse ROI than a simple script (effort 1.0) that saves 400 tokens.

---

## Summary

**Core insight:** Ask "Given identical input, would the output always be identical?" not "Is this a code block?"

**11 Heuristics:**
1. Computational Intensity
2. Data Volume with Low Signal Density
3. Iteration Over Collections
4. Precision-Critical Operations
5. State Accumulation Across Items
6. File I/O as Filtering
7. Cross-Referencing Between Datasets
8. Format Transformation
9. Multi-Step Deterministic Pipelines
10. Redundant Computation Across Phases
11. Enumerable Branching

**Priority thresholds:**
- High priority (18-33): Extract first
- Medium priority (9-17): Extract if time permits
- Low priority (0-8): Skip extraction

**Use during:** GREEN phase, Step 1 of determinize

**Expected outcome:** Ranked list of script extraction candidates with estimated ROI for each
