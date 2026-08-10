# Deploy

The app is deployed on **Vercel** via git integration (see [architecture.md](../specs/architecture.md) — Deploy decision). Pushes to the default branch trigger a production deploy; pull requests get preview deploys automatically.

## Build configuration

Vercel auto-detects the Next.js App Router project and uses defaults:

| Setting | Value |
|---|---|
| Framework preset | Next.js |
| Build command | `next build` (default) |
| Output | `.next` (default) |
| Install command | `npm install` (default) |

**No `vercel.json` is required** — no non-default build, routing, or region config is needed. Add one only if a future need arises (e.g. cron, custom headers, region pinning).

## Environment variables

Set these in the Vercel dashboard (Project → Settings → Environment Variables). **Never commit them.**

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (client + server) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (client + server) |
| `SUPABASE_DB_URL` | Postgres connection string for Drizzle (`drizzle.config.ts`, server only) |

Names above are what the code actually reads today (Supabase client setup + `drizzle.config.ts`). No service-role key is used yet — add `SUPABASE_SERVICE_ROLE_KEY` only when a privileged server path introduces it.

## Plan

Hobby for dev/staging; **Pro required in production** due to commercial use (architecture.md). Alternative if cost is a concern: VPS with Coolify.

## Verifying a deploy

The production URL must serve `/login` (or redirect there via the auth middleware). After a deploy, hit the root URL and confirm the login page loads.

Production URL: https://yard-management-system-eight.vercel.app/

## Demo deployment

A separate Vercel project serves the public demo at
[yms-demo.rodrigoeduardo.com](https://yms-demo.rodrigoeduardo.com/), backed by its own Supabase
project (`DEMO_MODE` — see [ADR 0002](../adr/0002-demo-mode-flag.md)). It uses the same build
configuration as production, plus:

| Variable | Purpose |
|---|---|
| `DEMO_MODE` | Must be the literal string `"true"` — flips the app into auto-session demo mode (`lib/supabase/middleware.ts`) |
| `DEMO_USER_EMAIL` | Credentials for the seeded demo user the middleware auto-signs visitors in as |
| `DEMO_USER_PASSWORD` | — |
| `DEMO_CONTACT_URL` | Optional. CTA link in the demo banner; left unset until the landing page (#254) ships — the banner degrades gracefully with no link |

The nightly data reset (`reset_demo_data()`, scheduled via `pg_cron`) is a separate manual step —
see [demo-reset-scheduling.md](./demo-reset-scheduling.md), including the migration-applied
prerequisite check.

## Database migrations

Vercel's default build runs `next build` only; it does **not** run Drizzle migrations. A `migrate` job in `.github/workflows/ci.yml` runs `npm run db:migrate` against `SUPABASE_DB_URL` after `checks` and `integration` pass on a push to `main`, so schema changes land right after merge, ahead of (or racing) the Vercel prod deploy.

**Known gap — preview deploys**: PR preview deploys still point at the shared dev/prod Supabase project and get no migrations of their own. A migration only reaches that project once its PR merges to `main` (triggering the `migrate` job above). Testing a PR's DB-schema changes before merge still requires running `npm run db:migrate` by hand against that shared project. Fixing this needs either a per-PR isolated database (Supabase Branching) or a CI step that migrates the shared dev DB on every push — tracked as a follow-up.

### Failure mode: a migrate run that silently applies nothing (#328)

`drizzle-kit migrate` (`PgDialect.migrate` in `drizzle-orm/pg-core/dialect.js`) decides what to
apply by reading a single row — `select ... from drizzle.__drizzle_migrations order by created_at
desc limit 1` — and applying every `drizzle/meta/_journal.json` entry whose `when` is strictly
greater than that row's `created_at`. It never consults the migration hash, and it prints
`[✓] migrations applied successfully!` unconditionally on resolve, with no distinction between
"applied 3" and "applied 0". If a migration's `when` ever ends up at or behind the watermark
already recorded on a given database (e.g. two branches mint the same migration number and one
gets renumbered with a hand-set `when` — see PR #323/#325's incident), `drizzle-kit migrate`
against that database is a silent no-op that still exits zero.

`npm run db:migrate` now runs `tsx scripts/verify-migration-watermark.ts` immediately after
`drizzle-kit migrate` (pure comparison logic in `scripts/lib/verify-migration-watermark.ts`, unit
tested). It asserts the row count in `drizzle.__drizzle_migrations` equals the entry count in
`drizzle/meta/_journal.json` and exits non-zero with a clear message on divergence — so a no-op run
can no longer report success under this script's own logic.

That guard is necessary but not sufficient as a CI safety net, because of **where** the bug can
occur: `checks` and `integration` in `.github/workflows/ci.yml` both run against a fresh,
per-run Postgres with no migration history, so a stale watermark can never exist there — those jobs
are structurally immune and cannot exercise this guard in anger. The **`migrate` job** is the only
one that runs `npm run db:migrate` against the shared, stateful Supabase database that can actually
carry a poisoned watermark forward — and it only runs **after** `checks`/`integration` pass and the
PR has already merged to `main`. A green PR (from `checks`/`integration`) says nothing about
whether the post-merge `migrate` job will apply the migration or silently skip it; catching that
requires watching the `migrate` job's own result after each merge, not "CI is green" on the PR.
Concretely: treat a red `migrate` job as a stop-the-line incident (the schema on `main` is now
behind what the merged code expects), and do not assume a migration reached the shared DB just
because its PR's checks passed.
