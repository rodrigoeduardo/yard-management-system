import { config } from "dotenv";

// Same timezone pin as vitest.setup.ts (kept in sync deliberately — tests
// that construct `Date`s from local wall-clock components need this
// regardless of which vitest project runs them).
process.env.TZ = "America/Sao_Paulo";

// Integration tests run against a local, disposable Supabase stack, never
// the shared remote project — see `scripts/setup-local-integration-stack.ts`
// and the shared-remote-DB interference note in
// `.claude/skills/auto-next-task/SKILL.md`. That setup script writes the
// local stack's connection details to `.env.test.local` (gitignored); load
// it here instead of the generic `.env.local` (which holds the *remote*
// project's credentials for `npm run dev` / `db:migrate`).
//
// In CI, the `integration` job in `.github/workflows/ci.yml` injects these
// same variables directly as job env vars, so `.env.test.local` won't exist
// there and this call is a harmless no-op (dotenv only fills variables that
// aren't already set).
config({ path: ".env.test.local" });
