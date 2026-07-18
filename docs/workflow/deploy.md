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

## Database migrations

Vercel's default build runs `next build` only; it does **not** run Drizzle migrations. Instead, a separate GitHub Actions job — [`deploy-migrate.yml`](../../.github/workflows/deploy-migrate.yml) — applies pending migrations (`npm run db:migrate`) on every push to `main`, using the `SUPABASE_DB_URL` GitHub Actions secret (never committed). `drizzle-kit migrate` is idempotent (already-applied migrations are tracked and skipped), and the job fails loudly — stopping the workflow — if a migration fails.

This is kept as a distinct job from the `test` job in `ci.yml` (which also runs `db:migrate`, but against the test database as part of the test suite) so that production migrations run only on pushes to `main`, not on every pull request.
