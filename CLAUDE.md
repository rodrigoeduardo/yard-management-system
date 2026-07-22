# CLAUDE.md — Yard Inventory Management App

Web app for yard inventory control: loads identified by Nota Fiscal (NF), items tracked individually by QR code. Development is driven by the [raw](https://github.com/rodrigoeduardo/raw) agentic workflow on GitHub Issues.

## Read before working

- **Any task**: read the relevant files under `docs/specs/` — [overview](docs/specs/overview.md), [business rules](docs/specs/business-rules.md), [architecture](docs/specs/architecture.md), [data model](docs/specs/data-model.md), [glossary](docs/specs/glossary.md). Business rules are the source of truth.
- **Client fork work**: read [`docs/workflow/client-forks.md`](docs/workflow/client-forks.md) — duplicate procedure, sync flow, config-first customization rules, fork-safety rule.

## Language

Everything dev-facing is English: code, comments, commits, branches, issues, labels, docs. End-user UI text is Portuguese. Domain terms (Nota Fiscal/NF, etc.) defined in the [glossary](docs/specs/glossary.md).

<!-- BEGIN:raw-workflow -->
## Agentic workflow (raw)

Development is driven by an agentic workflow on GitHub Issues.

- **Config**: `raw.config.yml` — gates, commands, labels. Run `/configure` to change it.
- **Any task**: read the relevant specs under `docs/specs/` first. Business rules are the source of truth.
- **Anything touching the board** (issues, labels, claims, PRs): follow `docs/workflow/board-protocol.md` exactly.
- **Git**: `docs/workflow/git-conventions.md` applies at all times — commit on the fly, atomic commits, Conventional Commits, never commit to the default branch.
- **AI PR review semantics**: `docs/workflow/review-policy.md`.

### Workflow skills

- `/configure` — set up gates, labels, commands (writes `raw.config.yml`).
- `/plan-board` — planner: decompose specs into proposed issues.
- `/next-task` — builder: claim next ready issue, implement with TDD, deliver PR.
- `/create-pr` — finalize a branch into a template-compliant PR (draft-first).
- `/review-pr` — AI review of a PR, on request.
- `/autopilot` — autonomous orchestrator: build → review → merge → deploy within configured gates.
<!-- END:raw-workflow -->
