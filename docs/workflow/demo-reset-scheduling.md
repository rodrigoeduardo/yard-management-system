# Demo reset scheduling (manual, demo project only)

The nightly demo reset ([ADR 0003](../adr/0003-nightly-demo-reset.md)) is implemented as a
Postgres function, `reset_demo_data()`, defined by the
[`drizzle/0008_demo_reset_function.sql`](../../drizzle/0008_demo_reset_function.sql) migration.
That migration ships to every environment (including client forks — see
[client-forks.md](./client-forks.md)) but **never schedules the function** — no `cron.schedule`
call exists in any migration. Scheduling it with `pg_cron` is a deliberate, manual step, applied
**only on the demo Supabase project**. A client fork that merges this migration gets a dormant
function and nothing else.

## What `reset_demo_data()` does

In one transaction: truncates `loads`, `items`, `removals`, `removal_items`, `materials` and
`audit_log`, then reseeds the fixed demo dataset from
[`scripts/lib/demo-dataset.ts`](../../scripts/lib/demo-dataset.ts) (#248) using plain `INSERT`
statements — so the existing `audit_log` triggers fire normally and the reseed leaves a fresh,
non-empty audit trail (the audit feature still demos well right after a reset).

## Prerequisite: apply migration 0008 to the demo project

`cron.schedule` only stores a command string — Postgres does not validate that
`reset_demo_data()` exists until the job actually fires. Confirm the migration is applied
*before* scheduling, or the job will silently fail every night:

```sql
select proname from pg_proc where proname = 'reset_demo_data';
```

If that returns no rows, apply `drizzle/0008_demo_reset_function.sql` to the demo project first
(via the Supabase SQL editor, `psql`, or the MCP `apply_migration` tool) — the demo project's
migration history is not guaranteed to track `drizzle/meta/_journal.json` 1:1 (e.g. if its schema
was seeded from a snapshot rather than a full migration run).

## Prerequisite: enable the `pg_cron` extension

Do this once, on the demo Supabase project only (Dashboard → Database → Extensions → enable
`pg_cron`), or via SQL:

```sql
create extension if not exists pg_cron;
```

## Schedule the nightly reset

Run this once, on the demo Supabase project's SQL editor (or via `psql`/the CLI against that
project's connection string), **as a role with privileges to `TRUNCATE`/`INSERT` on the demo
tables** (the default `postgres` role has this):

```sql
select cron.schedule(
  'nightly-demo-reset',
  '0 3 * * *', -- 03:00 UTC daily — adjust to a low-traffic hour for the demo audience
  $$select reset_demo_data()$$
);
```

`cron.schedule` is idempotent by job name: re-running it with the same name (`nightly-demo-reset`)
updates the existing job's schedule/command instead of creating a duplicate.

## Verify it's scheduled

```sql
select jobid, jobname, schedule, command, active
from cron.job
where jobname = 'nightly-demo-reset';
```

## Unschedule

To stop the nightly reset (e.g. before decommissioning the demo project, or to pause it):

```sql
select cron.unschedule('nightly-demo-reset');
```

## Run it once, ad hoc

Useful right after deploying a schema change to the demo project, or to manually freshen the demo
data outside the nightly schedule:

```sql
select reset_demo_data();
```

## Fork safety

This is the concrete pattern from [ADR 0001](../adr/0001-generic-yms-with-private-client-forks.md):
define the capability in a migration (safe to merge everywhere), activate it only through an
explicit, out-of-band step scoped to the one project that needs it. Never add a `cron.schedule`
call inside a migration — that would silently turn on the nightly reset (and destroy real data) on
every environment that merges it, including client forks.
