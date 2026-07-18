import { describe, expect, it } from "vitest";
import { getUserDisplayName } from "./user-display-name";

describe("getUserDisplayName", () => {
  it("capitalizes the first segment of a dotted email local part", () => {
    expect(getUserDisplayName("rafael.silva@example.com")).toBe("Rafael");
  });

  it("capitalizes an undotted email local part", () => {
    expect(getUserDisplayName("rafael@example.com")).toBe("Rafael");
  });

  it("returns null when no email is available", () => {
    expect(getUserDisplayName(null)).toBeNull();
    expect(getUserDisplayName(undefined)).toBeNull();
  });
});
