---
name: auto-next-task
description: Use to run the board fully autonomously with no human interaction — claim every ready+claimable issue, build it, AI-review it, and auto-merge on approval. Orchestrator only; spawns auto-executor and auto-reviewer sub-agents. Invoke explicitly (/auto-next-task); never self-trigger.
---

# Auto Next Task (autonomous dispatcher)

Drain the board with **zero human interaction**: claim ready+claimable issues, spawn workers to
build them, spawn reviewers to review the PRs, loop review→fix until approved, and **auto-merge**.
You are the orchestrator — you coordinate and merge; you do **not** write code or review diffs
yourself.

> **⚠️ Divergence from protocol (deliberate).** `docs/workflow/board-protocol.md` and
> `review-policy.md` state the **merge click is always human**. This skill auto-merges on
> `ai-review:approved` + green CI + mergeable. That one human gate is broken **on purpose**. The
> other human gate — promoting `status:proposed → status:ready` — is **preserved**: this skill only
> ever consumes `status:ready` issues. Do not edit those docs; this note is the record of divergence.
>
> This skill also tiers review cost: trivial PRs skip AI review entirely (step 6), and fix-cycle
> re-reviews are delta-only, not from-scratch (step 7). Neither changes what a full first review of
> substantive code checks — they only cut redundant re-checking.

**REQUIRED READING:** `docs/workflow/board-protocol.md`, `git-conventions.md`, `review-policy.md`.

## Run this on the right session

- **Main (this) agent:** run in a **sonnet, high-effort** session. The orchestrator only does
  bookkeeping (labels, dispatch, merge-gate checklist) — state is re-derived from GitHub, so a
  stronger model buys nothing here. A skill cannot change its own session model; if you were
  launched on something else, note it and continue. For long boards, prefer draining in chunks:
  stop after a handful of merges and re-invoke in a fresh session (steps 2–3 re-adopt everything)
  rather than letting one session's context grow unbounded.
- **Workers:** dispatched as `auto-executor` (sonnet) and `auto-reviewer` (sonnet), each pinned to
  `effort: medium` in its agent definition (the `effort` frontmatter key overrides session effort
  while the sub-agent runs).
- **Do not** run this alongside a `/loop /next-task` session or a scheduled dispatcher (they share
  the claim-comment backstop and will collide). One autonomous dispatcher at a time.

## Arguments

- `--parallel[=N]` — run up to N executors concurrently (default N=2, max 3), each in its own
  worktree. Omitted → **sequential** (default).
- `--max-fix-cycles=N` — review→fix cap per PR (default 3).

## Setup (once per repo)

`gh label create auto:hold --description "auto-next-task: skip this issue/PR" 2>/dev/null || true`.
STOP marker convention: an open issue whose title is exactly `AUTO-STOP`. Its presence aborts runs.

## Procedure

1. **Abort check.** `gh issue list --search "AUTO-STOP in:title" --state open` → if found, print
   "STOP marker present — aborting" and stop. Record your session-id for claim comments.

2. **Adopt open PRs first** (service obligations before new work). For every open PR, drive it
   through the review→merge loop (steps 6–8) before claiming any new issue. This clears PRs left by
   prior runs or humans. Skip any PR labeled `auto:hold`.

3. **Build the claimable set.**
   ```bash
   gh issue list --label "status:ready" --state open --json number,title,body,labels,createdAt
   ```
   Keep an issue only if: every `Depends on #N` points to a **closed** issue; "Human actions" is
   "None" or fully checked; it is **not** labeled `auto:hold`; and it has no live claim comment from
   another session. Order by **most dependents unblocked first**, then oldest. (Dependents are
   naturally deferred — they are not claimable until their blocker merges and closes. This is how
   "always wait for issues that block others" is satisfied.)
   Empty set and no open PRs left → go to step 9.

4. **Claim** the next issue (or, with `--parallel`, the next N independent ones — never ones that
   share obvious files):
   ```bash
   gh issue edit <n> --remove-label "status:ready" --add-label "status:in-progress"
   gh issue comment <n> --body "Claimed by <session-id> at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
   ```
   A fresh claim comment from another session → skip. Stale (>24h, no branch pushes) → comment a
   takeover, then claim.

5. **Build.** Dispatch an `auto-executor` (mode BUILD) per claimed issue.
   - Sequential (default): one dispatch, wait for its status line, then continue.
   - `--parallel[=N]`: issue N dispatches in one turn; each gets its own worktree.
   On `BLOCKED`/`TOO_BIG` → the worker already labeled the issue; record it and move on.
   On `DONE pr=#<p>` → proceed to review that PR.

6. **Request review — unless trivial.** Check `gh pr diff <p> --name-only` and
   `gh pr view <p> --json additions,deletions`. Skip the reviewer entirely when the diff touches
   **only** docs/config (`*.md`, `.github/**`, `.claude/**`, dotfiles) **or** total changed lines
   < ~30 with no files under `app/`, `lib/`, `drizzle/`. For a skipped PR: don't apply
   `ai-review:requested`, treat the merge gate (step 8) as satisfied by green CI + mergeable alone,
   and record "review skipped: trivial" for it in the run summary.
   Otherwise: `gh pr edit <p> --add-label "ai-review:requested"`, dispatch an `auto-reviewer` for PR
   `<p>` as a **first review**. Wait for `APPROVED` / `CHANGES_REQUESTED`.

7. **Fix loop (cap = `--max-fix-cycles`, default 3).** A "round" = one AI review verdict on the PR.
   Derive the current round count from the PR timeline (count of `ai-review:*` verdicts / reviewer
   comments) so a restarted orchestrator resumes correctly — do not rely on memory.
   - `ai-review:changes-requested`, **or** `gh pr checks <p>` red, **or** PR behind `main`:
     dispatch an `auto-executor` (mode FIX) with the PR number, branch, and reason. On its `DONE`,
     re-apply `ai-review:requested` and dispatch `auto-reviewer` again as a **delta re-review**,
     passing it the previous round's blocking findings and the SHA it last reviewed (last
     `ai-review:*` label event) so it diffs only what changed since then.
   - Rounds ≥ cap and still not clean → `gh pr edit <p> --add-label` is not enough: label the
     **issue** `status:blocked` and comment what remains, leave the PR+branch untouched for a human,
     stop working this PR.

8. **Merge gate + merge.** Merge **only** when ALL hold:
   - label `ai-review:approved` present (or the PR was skip-reviewed as trivial in step 6),
   - `gh pr checks <p>` — every check **green**. If checks are still running, don't poll in a loop:
     run `gh pr checks <p> --watch --fail-fast` as a single **background** command with a ~10 min
     timeout, and continue other bookkeeping (re-derive the claimable set, adopt other open PRs)
     while it runs. React to its result when it completes; still pending/timed out → treat as
     not-ready, revisit next pass,
   - PR **mergeable**, not behind `main` (`gh pr view <p> --json mergeable,mergeStateStatus`).
   Then:
   ```bash
   gh pr merge <p> --squash          # NO --delete-branch
   ```
   Merge auto-closes the issue via `Closes #N`; `pr-merged-cleanup.yml` strips `status:in-review`.
   Not mergeable / behind / red → route back to the fix loop (step 7), counts against the cap.

9. **Re-poll & continue.** After each merge, re-derive the claimable set (newly unblocked dependents
   appear) and repeat from step 3.

10. **Terminate (drain once).** When no claimable issues remain AND every adopted PR is resolved
    (merged or `status:blocked`), print a run summary: issues claimed, PRs merged, PRs blocked (with
    reasons), total review rounds. Then stop.

## Known risks

- **Shared Supabase project.** Local `.env.local` and the GitHub Actions secrets point at the same
  Supabase project. Two parallel executors' test runs, or a local run overlapping a CI run, hit the
  same DB and can interfere. `--parallel` stays opt-in for this reason; if you see flaky
  DB-dependent tests, suspect cross-run DB interference before suspecting the code. (Follow-up, not
  in scope here: per-run data prefixes or a local Supabase stack for true isolation.)
- **CI red with local green** after the worktree env fix (`scripts/lib/load-env.ts`) means real
  env/schema drift, not a missing-env artifact — report it `BLOCKED` with the differing check output
  instead of thrashing on it.

## Red flags — stop

- Merging on approval alone, or with red/pending CI, or with conflicts / behind `main`.
- Committing or pushing to `main`; deleting any branch; applying/removing `ai-review:final`.
- Claiming anything not `status:ready` + claimable, or labeled `auto:hold`, or claimed elsewhere.
- Auto-promoting `status:proposed → status:ready` (that human gate stays).
- Looping a PR past the fix cap instead of marking it `status:blocked`.
- Writing code or reviewing a diff yourself — always delegate to a worker.
- Running while a `/loop /next-task` or scheduled dispatcher is active.
