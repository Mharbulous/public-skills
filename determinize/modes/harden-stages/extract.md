# Stage 4: Extract

## Goal

Extract the selected candidate section into a helper script and create the hardened SKILL.md.

## Prerequisites

- Stage 3 (Baseline Tests) must be complete — baseline results documented
- You have a selected candidate from Stage 2
- You know the scripting language (from Language Selection in the orchestrator)

## Steps

### Step 1 — Write the Helper Script

1. Create the script in `<skill-name>-hardened/scripts/` using the chosen language's conventions (see the loaded language reference)
2. The script must:
   - Accept the same inputs the section currently processes
   - Produce the same outputs the section currently generates
   - Handle the edge cases identified in Stage 3's test scenarios
3. Test that the script actually runs: execute it with sample input and verify output

### Step 2 — Create Hardened SKILL.md

Copy the original SKILL.md to `<skill-name>-hardened/SKILL.md`, then:

1. Replace the extracted procedural section with a script invocation:
   `Run: <runtime> scripts/<name>.<ext> <args>`
2. Document the script's inputs, outputs, and what it does in 1-2 lines
3. Keep all non-deterministic content (judgment calls, decision trees, guidelines) inline
4. Keep all reference content (schemas, examples) inline
5. The hardened SKILL.md should be focused on orchestration: what to do, when, and which script to run

### Step 3 — Copy Supporting Files

Copy any referenced files (references/, other supporting files) from the original skill to the hardened directory.

## Output Structure

```
<skill-name>-hardened/
  SKILL.md              # Modified — procedural section replaced with script call
  scripts/              # Extracted helper scripts
  references/           # Inherited from original (if any)
  tests/                # From Stage 3 (already present)
    baseline-results.md
    scenario-*.md
```

## Gate

**Do NOT proceed to Stage 5 until:**
- Helper script is written and runs successfully
- Hardened SKILL.md replaces the extracted section with script invocation
- Supporting files are copied
- The `<skill-name>-hardened/` directory structure is complete

**When complete:** Read `harden-stages/verify.md` and follow its instructions.
