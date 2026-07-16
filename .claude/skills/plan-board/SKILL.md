---
name: plan-board
description: Use when the user wants to populate or refresh the kanban board from specs — decomposing docs/specs into GitHub issues, planning tasks, proposing follow-ups from PR notes, or reconciling the board after spec changes.
---

# Plan Board (planner)

Decompose `docs/specs/` into small, testable board issues. Issues are **proposed only** — the human promotes them to `status:ready`.

**REQUIRED READING:** `docs/workflow/board-protocol.md` (labels, lifecycle). Follow it exactly.

## Procedure

1. **Read inputs**
   - Entire `docs/specs/` tree.
   - Open issues: `gh issue list --state open --limit 200 --json number,title,labels,body` — never propose duplicates.
   - Notes sections of recently merged PRs (`gh pr list --state merged --limit 20 --json number,body`) — follow-ups become proposals.

2. **Decompose** per area (`area:*` labels in board-protocol.md). Each task must be:
   - completable in one builder session;
   - objectively verifiable (checkbox acceptance criteria, input → expected outcome);
   - explicit about dependencies and human-only actions.

3. **Draft first — never create issues directly.** Write `docs/workflow/drafts/plan-YYYY-MM-DD.md`:

   | # | Title | Area | Depends on | Acceptance criteria (summary) | Human actions |
   |---|---|---|---|---|---|

   Flag in the draft: existing open issues that contradict current specs (human decides).

4. **Present the draft in-session.** User edits/cuts/approves the batch. STOP here without explicit approval.

5. **Create issues** only after approval, in dependency order (so `#N` references exist):

   ```bash
   gh issue create \
     --title "[area] Imperative description" \
     --label "status:proposed" --label "area:<x>" \
     --body-file <(...)   # body follows .github/ISSUE_TEMPLATE/task.md sections
   ```

   Body must contain every template section: Goal, Pre-requisites (`Depends on #N` one per line), Requirements, Human actions, Out of scope, References.

   Then add each created issue to the board (works even if the project's auto-add workflow is off):

   ```bash
   gh project item-add 2 --owner rodrigoeduardo --url <issue-url>
   ```

6. Commit the draft file.

## Re-runs

Later runs propose **deltas only**: new/changed spec sections, PR-note follow-ups. Never recreate or edit issues that are `ready`/`in-progress`/`in-review` — flag conflicts in the draft instead.

## Red flags — stop

- Creating issues without an approved draft
- Issue without verifiable acceptance criteria
- Labeling anything other than `status:proposed`
- Duplicating an existing open issue
