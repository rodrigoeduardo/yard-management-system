# AI Review Policy

AI review of PRs is **optional and human-triggered**. It never runs unrequested.

## Triggering

- In a session: `/review-pr <PR#>`, or
- Asynchronously: human applies the `ai-review:requested` label — the next dispatcher run (any mode) processes it before claiming new build work.

## What the review does

1. Reads the PR diff, the linked issue's Requirements checklist, `docs/specs/`, and `docs/workflow/board-protocol.md`.
2. Posts findings as PR comments (one problem per comment: location, problem, suggested fix).
3. Applies exactly one verdict label and removes `ai-review:requested`:
   - `ai-review:approved` — all acceptance criteria met, no blocking findings;
   - `ai-review:changes-requested` — blocking findings exist (detailed in comments).

Builders treat `ai-review:changes-requested` exactly like human change-requests: addressed before any new work is claimed.

## Supplement vs replace (human-toggled, per PR)

| Mode | How | Meaning |
|---|---|---|
| **Supplement** (default) | just `ai-review:requested` | AI verdict is advisory. Human still reads the diff and merges. |
| **Replace** | human applies `ai-review:final` **before or with** the request | If the verdict is `ai-review:approved`, the human may merge without reading the diff. The merge click is still human — there is no auto-merge. |

`ai-review:final` is meaningful only when applied by the human. Agents never apply or remove it.
