import { describe, expect, it } from "vitest";
import {
  buildTestEnvFileContents,
  LOCAL_DEMO_USER_EMAIL,
  LOCAL_DEMO_USER_PASSWORD,
  LOCAL_REGISTER_INVITE_CODE,
  LOCAL_TEST_USER_EMAIL,
  LOCAL_TEST_USER_PASSWORD,
  LOCAL_VIEWER_INVITE_CODE,
  LOCAL_VIEWER_USER_EMAIL,
  LOCAL_VIEWER_USER_PASSWORD,
  pickPublishableKey,
  pickServiceKey,
  type LocalSupabaseStatus,
} from "./local-supabase";

const baseStatus: LocalSupabaseStatus = {
  API_URL: "http://127.0.0.1:54321",
  DB_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
};

describe("pickPublishableKey", () => {
  it("prefers the new PUBLISHABLE_KEY format", () => {
    const key = pickPublishableKey({
      ...baseStatus,
      PUBLISHABLE_KEY: "sb_publishable_abc",
      ANON_KEY: "legacy-jwt-anon",
    });

    expect(key).toBe("sb_publishable_abc");
  });

  it("falls back to the legacy ANON_KEY", () => {
    const key = pickPublishableKey({ ...baseStatus, ANON_KEY: "legacy-jwt-anon" });

    expect(key).toBe("legacy-jwt-anon");
  });

  it("throws when neither key is reported", () => {
    expect(() => pickPublishableKey(baseStatus)).toThrow(
      /PUBLISHABLE_KEY or ANON_KEY/,
    );
  });
});

describe("pickServiceKey", () => {
  it("prefers the new SECRET_KEY format", () => {
    const key = pickServiceKey({
      ...baseStatus,
      SECRET_KEY: "sb_secret_abc",
      SERVICE_ROLE_KEY: "legacy-jwt-service",
    });

    expect(key).toBe("sb_secret_abc");
  });

  it("falls back to the legacy SERVICE_ROLE_KEY", () => {
    const key = pickServiceKey({ ...baseStatus, SERVICE_ROLE_KEY: "legacy-jwt-service" });

    expect(key).toBe("legacy-jwt-service");
  });

  it("throws when neither key is reported", () => {
    expect(() => pickServiceKey(baseStatus)).toThrow(
      /SECRET_KEY or SERVICE_ROLE_KEY/,
    );
  });
});

describe("buildTestEnvFileContents", () => {
  it("renders every variable vitest.setup.integration.ts needs, from local stack status", () => {
    const contents = buildTestEnvFileContents({
      ...baseStatus,
      PUBLISHABLE_KEY: "sb_publishable_abc",
    });

    expect(contents).toContain(`NEXT_PUBLIC_SUPABASE_URL=${baseStatus.API_URL}`);
    expect(contents).toContain(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_abc",
    );
    expect(contents).toContain(`SUPABASE_DB_URL=${baseStatus.DB_URL}`);
    expect(contents).toContain(`TEST_USER_EMAIL=${LOCAL_TEST_USER_EMAIL}`);
    expect(contents).toContain(`TEST_USER_PASSWORD=${LOCAL_TEST_USER_PASSWORD}`);
    expect(contents).toContain(
      `REGISTER_INVITE_CODE=${LOCAL_REGISTER_INVITE_CODE}`,
    );
    expect(contents).toContain(
      `VIEWER_INVITE_CODE=${LOCAL_VIEWER_INVITE_CODE}`,
    );
    expect(contents).toContain(`DEMO_USER_EMAIL=${LOCAL_DEMO_USER_EMAIL}`);
    expect(contents).toContain(`DEMO_USER_PASSWORD=${LOCAL_DEMO_USER_PASSWORD}`);
    expect(contents).toContain(`VIEWER_USER_EMAIL=${LOCAL_VIEWER_USER_EMAIL}`);
    expect(contents).toContain(
      `VIEWER_USER_PASSWORD=${LOCAL_VIEWER_USER_PASSWORD}`,
    );
  });
});
