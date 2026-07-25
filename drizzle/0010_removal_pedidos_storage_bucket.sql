-- Custom SQL migration file, put your code below! --
-- Dedicated, private bucket for the customer's Pedido reference image
-- attached to each removal (issue #269). Object bytes never live in
-- Postgres — only the storage object path is stored on `removals`
-- (`pedido_image_path`).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'removal-pedidos',
  'removal-pedidos',
  false,
  20971520, -- 20 MiB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
-- Same "authenticated users get full access" posture as the app's table
-- RLS policies (drizzle/0003_enable_rls_policies.sql) — there is no
-- per-user ownership model for removals, so any authenticated operator may
-- upload/read/replace Pedido images.
CREATE POLICY "authenticated_full_access_removal_pedidos"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'removal-pedidos')
  WITH CHECK (bucket_id = 'removal-pedidos');