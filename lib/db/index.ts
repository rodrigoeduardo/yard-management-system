import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing database environment variable: ${name}`);
  }
  return value;
}

const client = postgres(requireEnv("SUPABASE_DB_URL"));

export const db = drizzle(client, { schema });
