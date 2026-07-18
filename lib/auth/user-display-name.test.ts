import { describe, expect, it } from "vitest";
import { getUserDisplayName } from "./user-display-name";

describe("getUserDisplayName", () => {
  it("returns the display name from user_metadata when present", () => {
    expect(
      getUserDisplayName({
        email: "rafael.silva@example.com",
        user_metadata: { display_name: "Rafael Moreira" },
      }),
    ).toBe("Rafael Moreira");
  });

  it("trims whitespace around the metadata display name", () => {
    expect(
      getUserDisplayName({
        email: "rafael.silva@example.com",
        user_metadata: { display_name: "  Rafael Moreira  " },
      }),
    ).toBe("Rafael Moreira");
  });

  it("falls back to the email-derived name when metadata display_name is absent", () => {
    expect(
      getUserDisplayName({
        email: "rafael.silva@example.com",
        user_metadata: {},
      }),
    ).toBe("Rafael");
  });

  it("falls back to the email-derived name when metadata display_name is blank", () => {
    expect(
      getUserDisplayName({
        email: "rafael.silva@example.com",
        user_metadata: { display_name: "   " },
      }),
    ).toBe("Rafael");
  });

  it("falls back to the email-derived name when metadata display_name is not a string", () => {
    expect(
      getUserDisplayName({
        email: "rafael.silva@example.com",
        user_metadata: { display_name: 123 },
      }),
    ).toBe("Rafael");
  });

  it("capitalizes an undotted email local part", () => {
    expect(getUserDisplayName({ email: "rafael@example.com" })).toBe(
      "Rafael",
    );
  });

  it("returns null when neither metadata nor email is available", () => {
    expect(getUserDisplayName(null)).toBeNull();
    expect(getUserDisplayName(undefined)).toBeNull();
    expect(getUserDisplayName({})).toBeNull();
    expect(getUserDisplayName({ email: null })).toBeNull();
  });
});
