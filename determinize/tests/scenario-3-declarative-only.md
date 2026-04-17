# Scenario 3: Declarative-Only Skill - Does the agent exit cleanly when no scripts are warranted?

## Type: Edge Case / Clean Exit

## Setup

You are given a skill that is mostly declarative/pattern-based with very little procedural content. Unlike the csv-data-validator skill, this one doesn't have deterministic procedures to extract.

## Sample Skill Content (inline)

```markdown
---
name: code-review-checklist
description: Use when performing code reviews on pull requests - provides structured checklist and common anti-patterns to catch before approving
---

# Code Review Checklist

## Overview

Systematic code review process that catches common issues before they reach production. Organizes review into passes so nothing gets missed.

## Review Passes

### Pass 1: Correctness
- Does the code do what the PR description claims?
- Are edge cases handled (null, empty, boundary values)?
- Are error paths tested, not just happy paths?
- Do loops terminate? Are there off-by-one errors?

### Pass 2: Security
- Is user input validated and sanitized?
- Are SQL queries parameterized (no string concatenation)?
- Are secrets hardcoded? Check for API keys, passwords, tokens

### Pass 3: Maintainability
- Can you understand the code without the PR description?
- Are function/variable names descriptive?
- Is there dead code or commented-out code?

### Pass 4: Performance
- Are there N+1 query patterns?
- Are large collections loaded when only a subset is needed?
- Is there unnecessary computation inside loops?

### Pass 5: Testing
- Do tests exist for new functionality?
- Do tests cover edge cases, not just happy paths?
- Are tests independent (no shared mutable state)?

## Common Anti-Patterns

| Anti-Pattern | What to Look For | Fix |
|-------------|-----------------|-----|
| God function | Function > 50 lines | Extract into smaller functions |
| Primitive obsession | Passing 5+ params of same type | Create a data class/type |
| Boolean blindness | `doThing(true, false, true)` | Use named params or enum |
| Catch-all exception | `catch (Exception e)` | Catch specific exceptions |

## When to Block vs Request Changes vs Approve

- **Block**: Security vulnerabilities, data loss risk, broken functionality
- **Request changes**: Missing tests, poor naming, code duplication
- **Approve with comments**: Style preferences, minor improvements
```

## Task

IMPORTANT: This is a real task. Perform the actual classification.

Harden the code-review-checklist skill above by extracting deterministic procedures into helper scripts.

## Success Criteria

1. Agent correctly classifies this as declarative/pattern content with NO deterministic procedures
2. Agent reports: "No script extraction candidates found. Hardening does not apply to this skill."
3. Agent does NOT attempt progressive disclosure as a fallback
4. Agent does NOT create a hardened copy (there's nothing to harden)
5. Agent exits cleanly after classification

## Critical Anti-Pattern to Watch For

- Does the agent offer progressive disclosure (moving anti-patterns table to references/) as a fallback?
- Does the agent say anything like "while no scripts can be extracted, we can still optimize by restructuring..."?
- The correct behavior is CLEAN EXIT: "No deterministic procedures found. Hardening doesn't apply."
