# Stage 6: Commit & Finalize

## Goal

Create a git recovery point, present results, and let the user decide the outcome.

## Prerequisites

- Stage 5 (Verify) must be complete — all regression tests pass

## Steps

### Step 1 — Git Commit (Recovery Point)

Use the `git-agent` subagent to commit ONLY the hardened skill files. This creates a recovery point in git history before any deletion occurs — either version can be recovered from this commit regardless of what the user decides next.

```
Invoke git-agent with prompt:
"Commit these specific files from the hardening session. Stage ONLY files
under the <skill-name>-hardened/ directory (SKILL.md, scripts/, tests/, references/).
Do NOT stage changes to the original skill directory.

Use this commit message format:
- Title: 'feat(skills): harden <skill-name> — extract <script-name> to script'
- Body: Brief description of what was extracted and why
- Body MUST include the searchable key: [hardening:<skill-name>:<script-name>]
- Include Co-Authored-By trailer

Do NOT push to remote."
```

### Step 2 — Summary Report

Output a summary table of the hardening session:

- What was hardened (section name, which mode)
- What was extracted (script name, what it does in 1 sentence)
- Why this matters (what LLM variance it eliminates)
- Files created (table of new/modified files with purpose)
- Regression status (pass/fail)

### Step 3 — A/B Test & Finalize

Ask the user via AskUserQuestion:

- **"Run A/B tests now" (Recommended)** — Runs controlled A/B tests between original and hardened skill using subagents in this session. Each trial gets a fresh context window for unbiased comparison.
- **"Skip A/B tests"** — Keeps both versions on disk. You can run `/determinize -test` later to compare them.

**If user chooses "Run A/B tests now":**

Run the A/B test inline using subagent-based trials. Follow the test mode process (`modes/test.md`) with these parameters:

- **Skill A:** `<skill-name>/SKILL.md` (original)
- **Skill B:** `<skill-name>-hardened/SKILL.md` (hardened)
- **Test task prompt:** The same prompt used during Stage 3 baseline
- **Trials:** 3 per skill (minimum)
- **Model:** sonnet

Execute each trial as a `general-purpose` subagent with `run_in_background: true`, waiting for completion before launching the next trial. Alternate A/B: A1, B1, A2, B2, A3, B3.

After all trials complete, extract metrics per test mode Phase 3, present the results report per test mode Phase 4, and apply the decision matrix per test mode Phase 5.

Then proceed to the **User Decision** below.

**If user chooses "Skip A/B tests":**

Announce: "Both versions kept on disk. Run `/determinize -test` in a new session to compare them later."

Then proceed to the **User Decision** below.

### Step 4 — User Decision

Ask the user via AskUserQuestion with three options:

- **"Promote hardened version"** — Replaces the original. The original is recoverable from the git commit in Step 1.
- **"Keep both versions"** — Both remain on disk for further testing.
- **"Delete hardened version"** — Removes the hardened version. Recoverable from the git commit in Step 1.

If A/B test results are available, mark the option that aligns with the test mode decision matrix as "(Recommended)". If no A/B tests were run, mark "Keep both versions" as "(Recommended)".

**If user chooses "Promote hardened version":**

1. Delete the original skill via git: `git rm -r <path-to-original-skill>/`
2. Rename the hardened directory to the original name (remove `-hardened` suffix). If `git mv` on the directory fails (e.g., file locks), move files individually.
3. Update all internal references in the promoted skill files from `<skill-name>-hardened` to `<skill-name>` (replace all occurrences).
4. Run a final grep scan across the promoted directory for any remaining references to `<skill-name>-hardened`. Fix any found.
5. Stage all changes and use git-agent to commit:
   - Title: `feat(skills): promote hardened <skill-name> — replace original`
   - Body: "Hardened version replaces original after passing regression tests. Original recoverable from previous commit.\n\n[hardening:<skill-name>:<script-name>]"
6. Announce: "Promotion complete. The hardened skill is now at `<skill-name>/`. The original is recoverable from the git commit prior to this one."

**If user chooses "Keep both versions":**

Announce: "Both versions retained. Run `/determinize -test` in a new session to compare them."

**If user chooses "Delete hardened version":**

1. Remove the hardened directory via git: `git rm -r <skill-name>-hardened/`
2. Stage and use git-agent to commit:
   - Title: `revert(skills): remove hardened <skill-name> — original retained`
   - Body: "Hardened version removed per user decision. Recoverable from previous commit.\n\n[hardening:<skill-name>:<script-name>]"
3. Announce: "Hardened version deleted. The original skill remains at `<skill-name>/`. The hardened files are recoverable from the git commit prior to this one."
