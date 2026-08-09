import { afterEach, describe, expect, it } from "vitest";
import { isRemovalCancelEnabled } from "./feature-flags";

describe("isRemovalCancelEnabled", () => {
  const original = process.env.FEATURE_REMOVAL_CANCEL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.FEATURE_REMOVAL_CANCEL;
    } else {
      process.env.FEATURE_REMOVAL_CANCEL = original;
    }
  });

  it("is false when the env var is unset", () => {
    delete process.env.FEATURE_REMOVAL_CANCEL;
    expect(isRemovalCancelEnabled()).toBe(false);
  });

  it("is false for any value other than the literal string 'true'", () => {
    process.env.FEATURE_REMOVAL_CANCEL = "1";
    expect(isRemovalCancelEnabled()).toBe(false);
  });

  it("is true when set to 'true'", () => {
    process.env.FEATURE_REMOVAL_CANCEL = "true";
    expect(isRemovalCancelEnabled()).toBe(true);
  });
});
