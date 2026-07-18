import { describe, expect, it } from "vitest";
import { getUserInitials } from "./user-initials";

describe("getUserInitials", () => {
  it("derives initials from the first two words of the metadata display name", () => {
    expect(
      getUserInitials({
        email: "rafael.silva@example.com",
        user_metadata: { display_name: "Rafael Moreira" },
      }),
    ).toBe("RM");
  });

  it("falls back to two letters when the metadata display name is a single word", () => {
    expect(
      getUserInitials({
        email: "rafael.silva@example.com",
        user_metadata: { display_name: "Rafael" },
      }),
    ).toBe("RA");
  });

  it("takes the first letter of the first two dot-separated email segments when metadata is absent", () => {
    expect(
      getUserInitials({
        email: "rafael.silva@example.com",
        user_metadata: {},
      }),
    ).toBe("RS");
  });

  it("uppercases the email-derived result", () => {
    expect(
      getUserInitials({
        email: "ana.costa@example.com",
        user_metadata: null,
      }),
    ).toBe("AC");
  });

  it("falls back to the first two letters when there is only one email segment", () => {
    expect(getUserInitials({ email: "rafael@example.com" })).toBe("RA");
  });

  it("falls back to a single letter for a one-character email local part", () => {
    expect(getUserInitials({ email: "r@example.com" })).toBe("R");
  });

  it("ignores a blank metadata display name and falls back to email", () => {
    expect(
      getUserInitials({
        email: "rafael.silva@example.com",
        user_metadata: { display_name: "   " },
      }),
    ).toBe("RS");
  });

  it("returns a generic fallback for a missing email and metadata", () => {
    expect(getUserInitials(undefined)).toBe("U");
    expect(getUserInitials(null)).toBe("U");
    expect(getUserInitials({})).toBe("U");
    expect(getUserInitials({ email: "" })).toBe("U");
  });
});
