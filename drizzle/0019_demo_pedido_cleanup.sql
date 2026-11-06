-- Custom SQL migration file, put your code below! --
-- Nightly cleanup of demo Pedido images (#364). reset_demo_data()
-- (drizzle/0008, 0011, 0013, 0018) truncates `removals` but never touched
-- the `removal-pedidos` bucket, so every photo a demo visitor attached
-- survived the reset as an orphaned Storage object.
--
-- run_nightly_demo_reset() wraps reset_demo_data() (unchanged) and, in the
-- same transaction, deletes only the Pedido objects created after the
-- previous run. Objects created at or before it are never deleted.
--
-- Fork-safety (ADR 0001/0003): like reset_demo_data(), this only *defines*
-- the function. Nothing schedules it, and it needs pg_net plus two Vault
-- secrets that exist only on the demo project — see
-- docs/workflow/demo-reset-scheduling.md.

-- When run_nightly_demo_reset() last ran with cleanup enabled: the cutoff
-- for the next cleanup. One row at most. Not in reset_demo_data()'s
-- TRUNCATE list, so a reset never erases it.
CREATE TABLE "demo_reset_marker" (
  "id" boolean PRIMARY KEY DEFAULT true CHECK ("id"),
  "reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
-- Public-schema tables are exposed to the Data API roles (supabase/seed.sql);
-- RLS with no policies keeps the marker out of their reach.
ALTER TABLE "demo_reset_marker" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION run_nightly_demo_reset() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  previous_reset_at timestamptz;
  storage_api_url text;
  service_key text;
  object_name text;
BEGIN
  SELECT reset_at INTO previous_reset_at FROM demo_reset_marker;
  SELECT decrypted_secret INTO storage_api_url
    FROM vault.decrypted_secrets WHERE name = 'demo_storage_api_url';
  SELECT decrypted_secret INTO service_key
    FROM vault.decrypted_secrets WHERE name = 'demo_storage_service_key';

  -- Without its secrets the cleanup can't run. Still reset the data, but
  -- leave the marker alone so the next configured run catches up on every
  -- object uploaded since the last real cleanup.
  IF storage_api_url IS NULL OR service_key IS NULL THEN
    RAISE WARNING 'run_nightly_demo_reset: Vault secrets demo_storage_api_url/demo_storage_service_key missing; skipping Pedido image cleanup';
    PERFORM reset_demo_data();
    RETURN;
  END IF;

  -- Supabase blocks DELETE on storage.objects (storage.protect_delete), so
  -- deletes go through the Storage API. net.http_delete only queues the
  -- request; pg_net sends it after this transaction commits. One request
  -- per object, with no body, works on every pg_net version. Names are
  -- `<uuid>.<ext>` (lib/actions/pedido-image.ts), so they need no URL
  -- encoding. Both headers are sent so new `sb_secret_` keys and legacy
  -- service_role JWTs work alike.
  IF previous_reset_at IS NOT NULL THEN
    FOR object_name IN
      SELECT name FROM storage.objects
      WHERE bucket_id = 'removal-pedidos'
        AND created_at > previous_reset_at
        AND created_at <= now()
    LOOP
      PERFORM net.http_delete(
        url := storage_api_url || '/storage/v1/object/removal-pedidos/' || object_name,
        headers := jsonb_build_object(
          'apikey', service_key,
          'Authorization', 'Bearer ' || service_key
        )
      );
    END LOOP;
  END IF;

  PERFORM reset_demo_data();

  -- The cleanup window just closed at now(): the next run starts from here.
  INSERT INTO demo_reset_marker (reset_at) VALUES (now())
  ON CONFLICT (id) DO UPDATE SET reset_at = EXCLUDED.reset_at;
END;
$$;
--> statement-breakpoint
-- Only the scheduler (postgres) may run it — never the Data API roles.
REVOKE EXECUTE ON FUNCTION run_nightly_demo_reset() FROM PUBLIC, anon, authenticated;
