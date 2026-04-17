# Stage 1: Inventory

## Goal

Build a complete file inventory of the skill being hardened. This provides the raw data for classification in the next stage.

## Steps

1. **List all files** in the skill directory using Glob
2. **Read each file** and count lines
3. **Output an inventory table:**

```
Inventory: <skill-name>
| File | Lines | Purpose |
|------|-------|---------|
| SKILL.md | 216 | Main skill document |
| scripts/foo.py | 45 | Helper script |
| ... | ... | ... |
| **Total** | **XXX** | |
```

4. **Identify logical sections** within SKILL.md — list each heading and its line range

## Gate

**Do NOT proceed to Stage 2 until:**
- Every file in the skill directory has been read and counted
- The inventory table is complete
- SKILL.md sections are listed with line ranges

**When complete:** Read `harden-stages/classify-and-score.md` and follow its instructions.
