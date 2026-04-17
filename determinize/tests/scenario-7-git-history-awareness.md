# Test Scenario 7: Git History Awareness — Commit Keys & Prior Hardening Detection

## Type
Technique Application (COMPLETION + GREEN Phase)

## Context
Agent is hardening a skill called `notification-router` using the determinize skill. The scenario tests two features:
1. Whether commit messages in the COMPLETION phase contain a distinctive searchable key
2. Whether the GREEN Phase Step 1 checks git history for prior hardening attempts before presenting candidates

## Task Prompt

You are using the determinize skill in harden mode on a skill called `notification-router`. You have identified `route-by-priority.py` as the extraction candidate.

**Part A — Commit Message Template:**

You have just completed the REFACTOR phase. All regression tests pass. Here is the state:

- Original skill: `skills/notification-router/SKILL.md`
- Hardened skill: `skills/notification-router-hardened/SKILL.md`
- Extracted script: `skills/notification-router-hardened/scripts/route-by-priority.py`
- Determinism value: 20/33 (high priority)
- Regression tests: all pass (3/3 scenarios)

Walk through exactly what you would do in the COMPLETION phase Step 1 (Git Commit). Show the exact commit message you would use, including the full body. Do NOT actually execute anything.

**Part B — Prior Hardening Detection:**

Now imagine you are starting a NEW hardening run on the same `notification-router` skill. You are at GREEN Phase Step 1 — identifying script extraction candidates. Before presenting the top 3 candidates, describe what git history check you would perform and what output you would show the user if prior hardenings were found.

Assume `git log --grep` returns these results:
```
abc1234 feat(skills): harden notification-router — extract route-by-priority to script [hardening:notification-router:route-by-priority]
def5678 revert(skills): remove hardened notification-router — original retained [hardening:notification-router:route-by-priority]
```

Show the exact output you would display before the candidate list.

**Part C — Previously-attempted candidates still selectable:**

Given the prior hardening history above, confirm that `route-by-priority` would still appear in the candidate list if it scores high enough. Explain how the user would know it was previously attempted.

## Success Criteria

1. **Commit message contains searchable key**: The Step 1 git commit message body includes a key in the format `[hardening:<skill-name>:<script-name>]` (e.g., `[hardening:notification-router:route-by-priority]`). The key must also appear in the promote and delete commit messages.

2. **Prior hardenings detected and displayed**: Before presenting candidates, the agent runs a git log search using the hardening key format and displays a "Previously Attempted Hardenings" section with commit hashes, script names, and dates. The example output shows both the initial hardening and its subsequent deletion/revert.

3. **Previously-attempted candidates remain selectable**: The agent explicitly states that prior hardening history is informational only — candidates that were previously attempted can still be selected. The candidate list is not filtered by history.

## Failure Indicators

- Commit message uses generic format without a searchable key
- No `[hardening:...]` tag in the commit message body
- Agent does not check git history before presenting candidates
- Agent filters out previously-attempted candidates from the list
- Agent does not show commit hashes in the prior hardening display
- The searchable key format is inconsistent between commit messages and the git log search
- Agent only mentions the feature conceptually without showing concrete output format
