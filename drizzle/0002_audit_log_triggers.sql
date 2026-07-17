-- Custom SQL migration file, put your code below! --
CREATE FUNCTION audit_log_row() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO "audit_log" (table_name, record_id, action, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO "audit_log" (table_name, record_id, action, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSE
    INSERT INTO "audit_log" (table_name, record_id, action, old_data, new_data)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER loads_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON "loads"
  FOR EACH ROW EXECUTE FUNCTION audit_log_row();
--> statement-breakpoint
CREATE TRIGGER items_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON "items"
  FOR EACH ROW EXECUTE FUNCTION audit_log_row();
--> statement-breakpoint
CREATE TRIGGER removals_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON "removals"
  FOR EACH ROW EXECUTE FUNCTION audit_log_row();
