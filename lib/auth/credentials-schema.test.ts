import { describe, expect, it } from "vitest";
import { loginCredentialsSchema } from "./credentials-schema";

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
