# CLAUDE.md — Yard Inventory Management App

Web app for yard inventory control: loads identified by Nota Fiscal (NF), items tracked individually by QR code. Development is driven by an agentic kanban workflow on GitHub Issues.

## Read before working

- **Any task**: read the relevant files under `docs/specs/` — [overview](docs/specs/overview.md), [business rules](docs/specs/business-rules.md), [architecture](docs/specs/architecture.md), [data model](docs/specs/data-model.md), [glossary](docs/specs/glossary.md). Business rules are the source of truth.
- **Anything touching the board** (issues, labels, claims, PRs): follow [docs/workflow/board-protocol.md](docs/workflow/board-protocol.md) exactly.
- **Git**: [docs/workflow/git-conventions.md](docs/workflow/git-conventions.md) applies at all times — commit on the fly, atomic commits, Conventional Commits, never commit to `main`.
- **AI PR review semantics**: [docs/workflow/review-policy.md](docs/workflow/review-policy.md).

## Language

Everything dev-facing is English: code, comments, commits, branches, issues, labels, docs. End-user UI text is Portuguese. Domain terms (Nota Fiscal/NF, etc.) defined in the [glossary](docs/specs/glossary.md).

## Workflow skills

- `/plan-board` — planner: decompose specs into proposed issues (human gates promotion to ready).
- `/next-task` — builder: claim next ready issue, implement with TDD, deliver PR (human gates merge).
- `/create-pr` — finalize a branch into a template-compliant PR (draft-first).
- `/review-pr` — AI review of a PR, only when a human requests it.
