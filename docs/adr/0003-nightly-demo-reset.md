# ADR 0003 — Nightly demo reset and seed

Date: 2026-07-22 · Status: accepted

## Context

The demo (ADR 0002) lets anonymous visitors write to a shared free-tier database. Without hygiene, data rots (junk loads, nonsense removals) and the free tier can fill up — including `audit_log`, which grows on every mutation.

## Decision

- A **scheduled nightly job** (pg_cron on the demo Supabase project) resets the demo dataset: truncate `loads`, `items`, `removals`, `removal_items`, `materials`, **and `audit_log`**, then run a **seed script** that recreates realistic PT-BR sample data (materials, open loads with items, past removals spanning multiple loads, at least one finished load).
- The seed script is a standalone, idempotent artifact also usable for local development.
- **Fork safety (per ADR 0001):** migrations may define the reset function, but the cron **scheduling is applied only on the demo project** (manual/documented step) — a client fork inheriting the migration gets no active reset job.
- No in-app write caps for now; add only if abuse shows up.

## Consequences

- Demo always looks presentable; free-tier usage stays flat, audit included.
- Reseeding through normal inserts regenerates fresh audit entries naturally, so the audit feature still demos well despite truncation.
- Enabling pg_cron and scheduling the job on the demo project is a human step.
