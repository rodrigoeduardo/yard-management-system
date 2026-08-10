import { describe, expect, it } from "vitest";
import {
  VIEWER_RESTRICTED_PATHS,
  isViewerRestrictedPath,
} from "./viewer-restricted-routes";

describe("VIEWER_RESTRICTED_PATHS", () => {
  it("lists exactly the write-entry routes: Entrada and Saída", () => {
    expect(VIEWER_RESTRICTED_PATHS).toEqual(["/loads/new", "/removals/new"]);
  });
});

describe("isViewerRestrictedPath", () => {
  it("matches /loads/new", () => {
    expect(isViewerRestrictedPath("/loads/new")).toBe(true);
  });

  it("matches /removals/new", () => {
    expect(isViewerRestrictedPath("/removals/new")).toBe(true);
  });

  it("does not match read routes", () => {
    expect(isViewerRestrictedPath("/inventory")).toBe(false);
    expect(isViewerRestrictedPath("/materials")).toBe(false);
    expect(isViewerRestrictedPath("/")).toBe(false);
  });

  it("does not match unrelated nested routes under /loads or /removals", () => {
    expect(isViewerRestrictedPath("/loads/abc-123/print")).toBe(false);
    expect(isViewerRestrictedPath("/removals/abc-123/receipt")).toBe(false);
  });
});
