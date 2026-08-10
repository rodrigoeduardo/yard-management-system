-- Custom SQL migration file, put your code below! --
-- Enforces the viewer restriction at the database level (issue #315). The
-- app connects to Postgres directly as its own role (`lib/db/index.ts`), so
-- it never goes through PostgREST/Supabase Auth and never has the
-- `authenticated_full_access` RLS policies (0003) evaluated against it —
-- those only guard the anon/PostgREST path. A restricted role that the app
-- assumes for the duration of a viewer's transaction (`SET LOCAL ROLE`,
-- lib/db/audit-context.ts) is the mechanism that actually reaches the app's
-- own connection.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'yms_viewer') THEN
    -- NOLOGIN: this role is only ever assumed via `SET LOCAL ROLE`, never
    -- connected to directly.
    CREATE ROLE yms_viewer NOLOGIN;
  END IF;
END
$$;
--> statement-breakpoint
GRANT SELECT ON TABLE "materials" TO yms_viewer;
--> statement-breakpoint
GRANT SELECT ON TABLE "loads" TO yms_viewer;
--> statement-breakpoint
GRANT SELECT ON TABLE "items" TO yms_viewer;
--> statement-breakpoint
GRANT SELECT ON TABLE "removals" TO yms_viewer;
--> statement-breakpoint
GRANT SELECT ON TABLE "removal_items" TO yms_viewer;
--> statement-breakpoint
GRANT SELECT ON TABLE "audit_log" TO yms_viewer;
--> statement-breakpoint
-- `GRANT` alone is not enough: `loads`, `items`, `removals`, `removal_items`
-- and `audit_log` have row level security enabled (0003), and RLS defaults
-- to denying every row when a role has no policy of its own — the existing
-- `authenticated_full_access` policy (0003) is scoped `TO authenticated`
-- only, which `yms_viewer` is not a member of. `materials` has no RLS
-- enabled, so its `GRANT` above needs no matching policy.
CREATE POLICY "yms_viewer_select" ON "loads"
  FOR SELECT TO yms_viewer USING (true);
--> statement-breakpoint
CREATE POLICY "yms_viewer_select" ON "items"
  FOR SELECT TO yms_viewer USING (true);
--> statement-breakpoint
CREATE POLICY "yms_viewer_select" ON "removals"
  FOR SELECT TO yms_viewer USING (true);
--> statement-breakpoint
CREATE POLICY "yms_viewer_select" ON "removal_items"
  FOR SELECT TO yms_viewer USING (true);
--> statement-breakpoint
CREATE POLICY "yms_viewer_select" ON "audit_log"
  FOR SELECT TO yms_viewer USING (true);
--> statement-breakpoint
-- Let the role running this migration (the app's own Postgres connection
-- role — `SUPABASE_DB_URL`) assume `yms_viewer` via `SET LOCAL ROLE`. A
-- dynamic grant (rather than a hardcoded role name) because that connection
-- role differs between the local stack (`postgres`) and the hosted
-- project's pooled connection role.
DO $$
BEGIN
  EXECUTE format('GRANT yms_viewer TO %I', current_user);
END
$$;