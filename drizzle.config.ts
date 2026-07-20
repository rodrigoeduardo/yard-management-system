import { defineConfig } from "drizzle-kit";
import { loadEnv } from "./scripts/lib/load-env";

loadEnv();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing database environment variable: ${name}`);
  }
  return value;
}

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: requireEnv("SUPABASE_DB_URL"),
  },
});
