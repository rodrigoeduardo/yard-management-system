-- Custom SQL migration file, put your code below! --
ALTER TABLE "loads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "removals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "removal_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "authenticated_full_access" ON "loads"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "authenticated_full_access" ON "items"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "authenticated_full_access" ON "removals"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "authenticated_full_access" ON "removal_items"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "authenticated_full_access" ON "audit_log"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
