import { describe, expect, it } from "vitest";
import { getUserInitials } from "./user-initials";

describe("getUserInitials", () => {
  it("takes the first letter of the first two dot-separated segments", () => {
    expect(getUserInitials("rafael.silva@example.com")).toBe("RS");
  });

  it("uppercases the result", () => {
    expect(getUserInitials("ana.costa@example.com")).toBe("AC");
  });

  it("falls back to the first two letters when there is only one segment", () => {
    expect(getUserInitials("rafael@example.com")).toBe("RA");
  });

  it("falls back to a single letter for a one-character local part", () => {
    expect(getUserInitials("r@example.com")).toBe("R");
  });

  it("returns a generic fallback for a missing email", () => {
    expect(getUserInitials(undefined)).toBe("U");
    expect(getUserInitials(null)).toBe("U");
    expect(getUserInitials("")).toBe("U");
  });
});
