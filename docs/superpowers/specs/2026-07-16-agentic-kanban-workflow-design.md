# Agentic Kanban Workflow — Design

**Date:** 2026-07-16
**Status:** Approved

## Problem

This repository will host a yard inventory management app (see `docs/specs/`). Before implementing the app, we need a reusable workflow in which AI agents propose tasks to a kanban board and pull tasks from it to build them — on-demand or automatically — with explicit human control points. The app is the first workload of this workflow, not part of it.

## Goals

- AI planner decomposes specs into small, testable tasks on a board the human can see and curate.
- AI builders pick up approved tasks, implement them, and deliver pull requests.
- Human stays in control at two gates: task approval and PR merge.
- The same protocol works whether triggered manually, by a local loop, or by a scheduled cloud agent.
- Everything dev-facing (docs, issues, labels, commits, code) is written in English. Brazilian domain terms (e.g. Nota Fiscal/NF) are kept as domain vocabulary and defined in `docs/specs/glossary.md`.

## Board

GitHub Issues + Projects v2, in the private repo `rodrigoeduardo/yard-management-system`.

**Issue labels are the machine source of truth.** The Projects v2 board is a human-facing view (auto-add workflow); dragging cards is cosmetic — labels win.

- Status labels: `status:proposed` → `status:ready` → `status:in-progress` → `status:in-review`. A closed issue is done. `status:blocked` marks stuck work and always comes with an explanatory comment.
- Area labels: `area:setup`, `area:database`, `area:auth`, `area:load-intake`, `area:load-removal`, `area:inventory-view`, `area:qrcode`, `area:audit`, `area:deploy`.
- AI review labels: `ai-review:requested`, `ai-review:approved`, `ai-review:changes-requested`, `ai-review:final`.

## Human gates

1. **Task gate** — the planner creates issues as `status:proposed`; only the human promotes them to `status:ready`.
2. **PR gate** — builders stop at the pull request; only the human merges. An optional AI review (below) may substitute for the human's read of the diff when the human pre-authorizes it, but the merge click stays human.

## Documentation tree

The planner's input is a structured `docs/` tree, not a monolithic CLAUDE.md:

```
docs/
  specs/
    overview.md          # the app, its 3 core functions
    business-rules.md    # Add Load / Load Removal / Inventory rules
    architecture.md      # stack decisions + rationale
    data-model.md        # tables, columns, relationships, constraints
    glossary.md          # domain terms (carga=load, NF=Nota Fiscal, ...)
  workflow/
    board-protocol.md    # labels, lifecycle, claim protocol — agents' single source of truth
    git-conventions.md   # always-applied git discipline
    review-policy.md     # AI review toggle semantics
    drafts/              # /plan-board draft outputs
```

CLAUDE.md is a thin pointer: read `docs/specs/` before any task, `docs/workflow/` before touching the board; `git-conventions.md` always applies.

## Issue template (`.github/ISSUE_TEMPLATE/task.md`)

- **Title:** `[area] Imperative short description` — e.g. `[database] Create loads and items schema with Drizzle`.
- **Body sections:**
  - **Goal** — what this task delivers and why; link to the relevant spec section.
  - **Pre-requisites** — `Depends on #N`, one per line, machine-parseable; environment/infra needs; "None" if independent.
  - **Requirements** — checkbox acceptance criteria, each objectively verifiable.
  - **Human actions** — steps only the human can do (accounts, secrets, approvals). A task with pending human actions cannot be claimed even if `status:ready`.
  - **Out of scope** — explicit non-goals.
  - **References** — `docs/specs/` anchors.

## PR template (`.github/pull_request_template.md`)

- **Title:** `type(scope): imperative description` — e.g. `feat(load-intake): add load creation form with per-item weights`.
- **Body sections:** **Summary** (the why, `Closes #N`) · **Changes** (bullets ≈ commits) · **Requirements coverage** (each issue criterion checked with evidence) · **Testing instructions** (concrete reviewer steps) · **Human actions needed** · **Notes** (trade-offs, follow-ups for the planner).

## Git discipline

Agents commit **on the fly**, branch when needed, and open PRs (draft-first) when needed. Continuous discipline lives in the always-loaded guideline `docs/workflow/git-conventions.md` (not an invocable skill — nothing would trigger it mid-flow):

- Commit as soon as a coherent change exists; atomic commits (one intent, working state after each); stage deliberately (`git add -p` for mixed files), never `git add -A`.
- Conventional Commits: `type(scope): short imperative description`; types `feat|fix|refactor|style|chore|docs|test|config`; body only when the *why* isn't obvious from the diff.
- Branches: `type/<issue-number>-<slug>` (e.g. `feat/23-load-creation-form`); never commit to `main`; never force-push.

The one discrete git moment is the skill `/create-pr`: it reads the PR template at runtime and fills every section from the actual commits/diff. Builders open a **draft PR after the first push** (progress visible early) and mark it ready (`gh pr ready`) + label the issue `status:in-review` only when the Requirements checklist is fully covered.

## Skills (`.claude/skills/`)

### `/plan-board` (planner)

1. Read the full `docs/specs/` tree and current open issues (avoid duplicates).
2. Decompose per area into small testable tasks, each with goal, acceptance criteria, and dependencies.
3. Write a draft to `docs/workflow/drafts/plan-YYYY-MM-DD.md` (table: title, area, depends-on, criteria summary).
4. The user previews, edits, and approves the batch in-session.
5. Only after batch approval, create issues via `gh issue create` (template format, `status:proposed` + `area:*`, `Depends on #N` lines, created in dependency order so numbers exist).
6. Re-runnable: later runs propose deltas only (spec changes, follow-ups from PR Notes). Open issues that contradict updated specs are flagged in the draft for user decision.

### `/next-task` (builder)

1. List `status:ready` issues; filter to those whose `Depends on #N` are all closed AND whose Human-actions section is clear; pick the oldest. (`/next-task <issue#>` forces a specific issue.)
2. Claim: swap label to `status:in-progress`, post a timestamped claim comment. If another live claim exists, skip to the next issue.
3. Branch `type/<issue#>-<slug>` off fresh `main`.
4. Implement with TDD, committing on the fly per git-conventions; open a draft PR after the first push. Scope is strictly the Requirements checklist; respect Out of scope.
5. Verify, then finalize via `/create-pr`; label the issue `status:in-review`. Stop — one task per invocation.
6. If blocked: label `status:blocked` + a precise comment, exit cleanly. Never a half-finished PR.
7. Every invocation starts by addressing human/AI change-requests on its own open PRs, and any `ai-review:requested` PRs, before claiming new work.

### `/review-pr` (AI reviewer — optional, human-toggled)

- **Trigger:** human only — `/review-pr <PR#>` in a session, or the `ai-review:requested` label (picked up by any dispatcher). Never runs unrequested.
- Reviews the diff against the issue's acceptance criteria, the specs, and the board protocol; posts findings as PR comments; applies a verdict label: `ai-review:approved` or `ai-review:changes-requested`.
- **Modes** (defined in `docs/workflow/review-policy.md`):
  - *supplement* (default): the AI verdict is advisory; the human still reviews and merges.
  - *replace*: if the human pre-applied `ai-review:final`, an `ai-review:approved` verdict means the human may merge without their own review — the merge click is still manual.
- Builders treat `ai-review:changes-requested` comments the same as human change-requests.

## Dispatch modes

All three run the exact same `/next-task` protocol; only the trigger differs. The claim protocol is the backstop if two modes overlap.

1. **On-demand** — the user invokes `/next-task`. Default while trust builds.
2. **Local loop** — `/loop /next-task`, self-paced. Stop conditions: no claimable issues, or ≥3 PRs already `status:in-review` (review is the bottleneck; building atop unreviewed work compounds rework).
3. **Scheduled cloud agent** — a `/schedule` routine (e.g. weekday mornings) whose prompt follows `board-protocol.md`, capped at 2 tasks per run (bounded headless spend). Configured last, after local verification passes. Requires the repo connected to the Claude cloud GitHub app.

Overlap policy: avoid running the loop and the routine in the same window; claim comments make the second dispatcher skip claimed issues.

## Edge cases

| Situation | Handling |
|---|---|
| Builder can't complete | `status:blocked` + precise comment; exit cleanly, never half-PR |
| Stale claim (dead session) | Claim >24h old with no branch pushes → next dispatcher comments a takeover and re-claims |
| Task too big mid-build | No PR; comment a proposed split; back to `status:proposed` for planner/user to split |
| PR change-requests | Always addressed before claiming new work, in any mode |
| `main` moved (conflicts) | Rebase own branch each iteration; unresolvable → PR comment + `status:blocked` |
| Follow-up discovered | Never expands scope; goes in PR Notes → next `/plan-board` delta |
| Pending Human actions | Issue unclaimable regardless of `status:ready` until the user checks them off |
| Spec edits | Re-run `/plan-board`; contradicting open issues flagged in the draft for user decision |

## Verification (staged dry-run)

1. **Board smoke test:** `/plan-board` on `docs/specs/` → user approves a small batch (3–5 issues) → verify labels, template compliance, dependencies, board visibility.
2. **Round-trip:** promote one trivial issue (e.g. `[setup] Scaffold Next.js app`) → `/next-task` → verify claim, branch name, on-the-fly commits, draft→ready PR, `status:in-review`.
3. **Gate test:** user requests changes on that PR → `/next-task` addresses them before new work.
4. **AI review test:** `ai-review:requested` → verify comments + verdict label.
5. **Loop test:** `/loop /next-task` with 2 ready issues → sequential claims, stops at a stop condition.
6. **Cloud routine:** configured only after 1–5 pass.
