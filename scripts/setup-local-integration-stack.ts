/**
 * Single documented command that gets `npm run test:integration` ready to
 * run against a local, disposable Supabase stack instead of the shared
 * remote project:
 *
 *   1. Starts the local stack (`supabase start`) if it isn't already up.
 *   2. Applies Drizzle migrations against it.
 *   3. Seeds (creates or resets) fixed local test auth users — the regular
 *      test user, the DEMO_MODE seeded demo user, and a viewer-role user.
 *   4. Writes `.env.test.local` (gitignored) with the connection details,
 *      which `vitest.setup.integration.ts` loads for the `integration`
 *      vitest project.
 *
 * Usage: `npm run test:integration:setup` (then `npm run test:integration`).
 * Requires Docker running locally; in CI the `integration` job in
 * `.github/workflows/ci.yml` runs the same command.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  buildTestEnvFileContents,
  LOCAL_DEMO_USER_EMAIL,
  LOCAL_DEMO_USER_PASSWORD,
  LOCAL_TEST_USER_EMAIL,
  LOCAL_TEST_USER_PASSWORD,
  LOCAL_VIEWER_USER_EMAIL,
  LOCAL_VIEWER_USER_PASSWORD,
  pickServiceKey,
  type LocalSupabaseStatus,
} from "./lib/local-supabase";

function readStatus(): LocalSupabaseStatus {
  const raw = execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
  });
  return JSON.parse(raw) as LocalSupabaseStatus;
}

function ensureStackRunning(): LocalSupabaseStatus {
  try {
    return readStatus();
  } catch {
    console.log(
      "Local Supabase stack not running — starting it (`supabase start`)...",
    );
    execFileSync("npx", ["supabase", "start"], { stdio: "inherit" });
    return readStatus();
  }
}

function migrate(dbUrl: string): void {
  execFileSync("npx", ["drizzle-kit", "migrate"], {
    stdio: "inherit",
    env: { ...process.env, SUPABASE_DB_URL: dbUrl },
  });
}

async function seedUser(
  admin: SupabaseClient,
  email: string,
  password: string,
  userMetadata?: Record<string, string>,
): Promise<void> {
  const { data: existing, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list local Supabase users: ${listError.message}`);
  }

  const found = existing.users.find((user) => user.email === email);
  if (found) {
    const { error } = await admin.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
      ...(userMetadata ? { user_metadata: userMetadata } : {}),
    });
    if (error) {
      throw new Error(`Failed to reset local user ${email}: ${error.message}`);
    }
    return;
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    ...(userMetadata ? { user_metadata: userMetadata } : {}),
  });
  if (error) {
    throw new Error(`Failed to create local user ${email}: ${error.message}`);
  }
}

async function seedTestUsers(apiUrl: string, serviceKey: string): Promise<void> {
  const admin = createClient(apiUrl, serviceKey);
  await seedUser(admin, LOCAL_TEST_USER_EMAIL, LOCAL_TEST_USER_PASSWORD);
  await seedUser(admin, LOCAL_DEMO_USER_EMAIL, LOCAL_DEMO_USER_PASSWORD);
  // app_role: "viewer" — matches what `app/register/actions.ts` sets on
  // sign-up via the viewer invite code, so a real viewer session is
  // available to integration tests (e.g. `lib/db/audit-context.test.ts`).
  await seedUser(admin, LOCAL_VIEWER_USER_EMAIL, LOCAL_VIEWER_USER_PASSWORD, {
    app_role: "viewer",
  });
}

async function main(): Promise<void> {
  const status = ensureStackRunning();

  migrate(status.DB_URL);
  await seedTestUsers(status.API_URL, pickServiceKey(status));

  writeFileSync(".env.test.local", buildTestEnvFileContents(status));

  console.log("\nLocal Supabase stack ready for integration tests.");
  console.log(`  API_URL: ${status.API_URL}`);
  console.log(`  DB_URL:  ${status.DB_URL}`);
  console.log(
    "  Wrote .env.test.local (gitignored) — run `npm run test:integration` next.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
