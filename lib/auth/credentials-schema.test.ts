import { describe, expect, it } from "vitest";
import {
  loginCredentialsSchema,
  registerCredentialsSchema,
} from "./credentials-schema";

describe("loginCredentialsSchema", () => {
  it("accepts a well-formed email and non-empty password", () => {
    const result = loginCredentialsSchema.safeParse({
      email: "user@example.com",
      password: "correct-horse",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a malformed email", () => {
    const result = loginCredentialsSchema.safeParse({
      email: "not-an-email",
      password: "correct-horse",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginCredentialsSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("registerCredentialsSchema", () => {
  const valid = {
    name: "Maria Souza",
    email: "user@example.com",
    password: "correct-horse",
    inviteCode: "some-code",
  };

  it("accepts a well-formed name, email, password and invite code", () => {
    const result = registerCredentialsSchema.safeParse(valid);

    expect(result.success).toBe(true);
  });

  it("rejects a malformed email", () => {
    const result = registerCredentialsSchema.safeParse({
      ...valid,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = registerCredentialsSchema.safeParse({
      ...valid,
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = registerCredentialsSchema.safeParse({
      ...valid,
      name: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty invite code", () => {
    const result = registerCredentialsSchema.safeParse({
      ...valid,
      inviteCode: "",
    });

    expect(result.success).toBe(false);
  });
});
