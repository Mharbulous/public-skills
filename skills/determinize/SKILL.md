---
name: determinize
description: Use when procedural instructions in existing skills or commands should be extracted into deterministic scripts - applies TDD-based hardening to replace non-deterministic LLM execution with scripts that produce identical output for identical input, eliminating LLM variance for computational phases
disable-model-invocation: true
---

# Determinize

This skill operates in three modes. Detect mode from the user's prompt, then load the corresponding mode file.

## Mode Detection

| Signal | Mode |
|--------|------|
| `-harden` flag, or "harden", or no flag specified | **Harden** (default) |
| `-test` flag, or "test", "compare", "A/B test" | **Test** |
| `-promote` flag, or "promote" | **Promote** |

## Execution

1. Determine mode from the table above
2. Read the mode file: `modes/<mode>.md`
3. Follow that file's instructions exactly
