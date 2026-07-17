-- Custom SQL migration file, put your code below! --
-- Populate audit_log.user_id from the authenticated session (auth.uid()).
-- auth.uid() reads the request.jwt.claim.sub setting and returns NULL when
-- there is no session (e.g. a direct/admin connection), so this stays
-- error-free for both authenticated and unauthenticated mutations.
CREATE OR REPLACE FUNCTION audit_log_row() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO "audit_log" (table_name, record_id, action, user_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO "audit_log" (table_name, record_id, action, user_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSE
    INSERT INTO "audit_log" (table_name, record_id, action, user_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, auth.uid(), to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;