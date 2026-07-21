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

type Db = ReturnType<typeof drizzle<typeof schema>>;

let instance: Db | undefined;

// Connecting eagerly at module load meant every file that merely imports
// this module (even transitively, e.g. a client component pulling in a
// server action) required SUPABASE_DB_URL to be set. Deferring the actual
// connection until the client is first used lets modules be imported freely
// in tests that never touch the database.
function getDb(): Db {
  if (!instance) {
    const client = postgres(requireEnv("SUPABASE_DB_URL"));
    instance = drizzle(client, { schema });
  }
  return instance;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
  set(_target, prop, value) {
    // Forward with the real instance as receiver (not the default
    // `receiver` arg, which is this proxy) so plain `db.x = fn` assignments
    // land on the actual drizzle instance instead of silently shadowing it
    // on the proxy's dummy target.
    return Reflect.set(getDb(), prop, value);
  },
  defineProperty(_target, prop, descriptor) {
    // `vi.spyOn(db, "insert")` uses `Object.defineProperty`, not a plain
    // assignment — needs its own trap for the same reason as `set` above.
    return Reflect.defineProperty(getDb(), prop, descriptor);
  },
  has(_target, prop) {
    return Reflect.has(getDb(), prop);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getDb(), prop);
  },
  ownKeys() {
    return Reflect.ownKeys(getDb());
  },
});
