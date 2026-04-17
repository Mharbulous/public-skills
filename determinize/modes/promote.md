# Promote Mode

## Overview

**Replace the original skill with its hardened version after A/B testing confirms improvement.**

This mode is the final step in the hardening lifecycle: harden → test → promote. It conducts a user interview to confirm the replacement decision, then delegates the actual file operations to a deterministic script.

## Prerequisites

Before entering this mode, the following MUST be true:

1. A/B test results exist comparing original vs hardened skill
2. Results favor the hardened version (lower variance, no degradation)
3. The user has reviewed the test results

**If no A/B test has been run**, direct the user to test mode first:
"No A/B test results found. Run `/determinize -test` first to compare the original and hardened versions."

## Inputs

The user provides:

1. **Hardened skill directory** — path to the `-hardened` skill (e.g., `.claude/skills/foo-hardened`)

### Auto-Detection

If only a skill name is provided (not a full path), resolve it:

| Input | Resolved Path |
|-------|---------------|
| `foo` | `.claude/skills/foo-hardened` |
| `foo-hardened` | `.claude/skills/foo-hardened` |
| `.claude/skills/foo-hardened` | As-is |
| `.claude/skills/foo-hardened/SKILL.md` | Parent directory |

If the resolved directory does not exist, report the error and exit.

## Process

### Phase 1: Confirmation Interview

**This interview is MANDATORY. The script MUST NOT run without explicit user approval.**

Present the user with a summary and ask for confirmation using AskUserQuestion:

```
Ready to promote the hardened skill.

This will:
1. Replace .claude/skills/<name>/ with .claude/skills/<name>-hardened/
2. Update internal references (frontmatter name, path references)
3. Delete the original skill directory permanently

The hardened version's tests/ folder will be preserved in the promoted skill.

This operation is NOT reversible (except via git).

Options:
1. "Promote" — Replace the original with the hardened version
2. "Cancel" — Exit without changes
```

**If user chooses "Cancel":** Exit cleanly. No changes made.

### Phase 2: Execute Script

Run the deterministic promote script:

```bash
node .claude/skills/determinize/scripts/promote-skill.mjs .claude/skills/<name>-hardened
```

Parse the JSON output. If `action` is `error`, report the error and exit.

### Phase 3: Report & Commit

1. **Report the results** from the script's JSON output:
   - Files updated (internal references changed)
   - Files deleted (original skill contents)
   - New location of the promoted skill

2. **Commit** using git-agent:

```
Invoke git-agent with prompt:
"Commit the skill promotion. Stage all changes.

Use this commit message format:
- Title: 'feat(skills): promote <name>-hardened to <name>'
- Body: 'Replaces original skill with hardened version after A/B testing confirmed improvement.'
- Include Co-Authored-By trailer

Do NOT push to remote."
```

3. **Announce completion:**
   "Promotion complete. The hardened skill is now at `skills/<name>/`. The `-hardened` directory has been removed."

## The Iron Rule

```
NO PROMOTION WITHOUT USER APPROVAL
```

The script is deterministic and destructive (deletes the original). It MUST only execute after explicit user confirmation in Phase 1. No exceptions.

## Common Rationalizations (All Wrong)

| Excuse | Reality |
|--------|---------|
| "The A/B test clearly showed B is better" | User still decides. Present results, ask for approval. |
| "I can just run the script — it's reversible via git" | Reversibility doesn't replace consent. Ask first. |
| "The user already said they want to promote" | The interview is the formal consent mechanism. Run it. |
| "I'll promote and then ask if they want to revert" | Wrong order. Ask THEN promote. |
