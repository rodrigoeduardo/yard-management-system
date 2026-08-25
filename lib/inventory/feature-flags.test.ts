import { afterEach, describe, expect, it } from "vitest";
import { isItemWeightEditEnabled, isLoadEditEnabled } from "./feature-flags";

describe("isLoadEditEnabled", () => {
  const original = process.env.FEATURE_LOAD_EDIT;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.FEATURE_LOAD_EDIT;
    } else {
      process.env.FEATURE_LOAD_EDIT = original;
    }
  });

  it("is false when unset", () => {
    delete process.env.FEATURE_LOAD_EDIT;
    expect(isLoadEditEnabled()).toBe(false);
  });

  it("is false for any value other than the exact string 'true'", () => {
    process.env.FEATURE_LOAD_EDIT = "TRUE";
    expect(isLoadEditEnabled()).toBe(false);
    process.env.FEATURE_LOAD_EDIT = "1";
    expect(isLoadEditEnabled()).toBe(false);
  });

  it("is true only for the exact string 'true'", () => {
    process.env.FEATURE_LOAD_EDIT = "true";
    expect(isLoadEditEnabled()).toBe(true);
  });
});

describe("isItemWeightEditEnabled (regression guard)", () => {
  it("is unaffected by FEATURE_LOAD_EDIT", () => {
    delete process.env.FEATURE_ITEM_WEIGHT_EDIT;
    process.env.FEATURE_LOAD_EDIT = "true";
    expect(isItemWeightEditEnabled()).toBe(false);
    delete process.env.FEATURE_LOAD_EDIT;
  });
});
