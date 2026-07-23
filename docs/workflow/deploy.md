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

## Known gap — database migrations

Vercel's default build runs `next build` only; it does **not** run Drizzle migrations (`npm run db:migrate`). Schema changes must be applied to production Supabase separately. Automating this (a migration step in the deploy pipeline) is out of scope for the initial deploy — tracked as a follow-up.
