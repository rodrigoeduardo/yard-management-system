-- Runs once, automatically, after migrations on `supabase start` (fresh
-- volume) / `supabase db reset` — see [db.seed] in config.toml.
--
-- The remote Supabase project auto-exposes every public-schema table to the
-- Data API roles (a project-creation-time default that predates the CLI's
-- current "not auto-exposed" default for local stacks). The Drizzle
-- migrations under `drizzle/` assume that: they add RLS policies to gate
-- access but never emit explicit GRANTs. Without this, every Data API call
-- against a RLS-protected table fails with "permission denied" locally even
-- though the policy would have allowed it. Grant the same access here so
-- the local stack matches the remote project's behavior, and apply it to
-- future tables too via default privileges.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;
grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
