# ADR 0001 — Generic YMS with private per-client forks

Date: 2026-07-22 · Status: accepted

## Context

The app was built for a single client. The goal is a productized model: this repo (`yard-management-system`, "yms") becomes the generic product; each client gets a private customized instance. First client instance: a new private repo `patio`. Every yms update must be pullable into client repos. GitHub cannot fork a repo into the same account, and forks of private personal repos are not a native feature anyway.

## Decision

- `patio` is created as a **manual duplicate with full history** (`git clone --bare` + push), with yms added as an `upstream` git remote.
- Updates flow by **manual, on-demand `git merge upstream/main`** in the client repo — no automation for now. The procedure lives in `docs/workflow/client-forks.md`.
- Client customization is **config-first**: prefer env vars, config files, and data over code changes; unavoidable client-specific code goes in dedicated, isolated files. Shared core files are edited in yms only, so upstream merges stay near-conflict-free.
- Anything demo- or client-specific that ships in shared artifacts (e.g. migrations) must be **inert unless explicitly enabled** — a migration merged into `patio` must never activate demo behavior there.
- yms stays **private for now**; making it public and choosing a license is deferred.

## Consequences

- Shared git ancestry keeps merges cheap forever; a squashed fresh-start repo would have forced cherry-pick maintenance.
- Merge cost grows with the number of client repos and with how much they diverge — the config-first rule is the control on that cost.
- Repo creation/duplication is a human action (account-level operation).
