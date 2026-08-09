import { describe, expect, it, vi } from "vitest";

const getCurrentUserRoleMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/current-role", () => ({
  getCurrentUserRole: getCurrentUserRoleMock,
}));

describe("isViewerWriteRefused", () => {
  it("returns true for a viewer session", async () => {
    getCurrentUserRoleMock.mockResolvedValue("viewer");
    const { isViewerWriteRefused } = await import("./guard");

    await expect(isViewerWriteRefused()).resolves.toBe(true);
  });

  it("returns false for an operator session", async () => {
    getCurrentUserRoleMock.mockResolvedValue("operator");
    const { isViewerWriteRefused } = await import("./guard");

    await expect(isViewerWriteRefused()).resolves.toBe(false);
  });
});

describe("VIEWER_WRITE_ERROR_MESSAGE", () => {
  it("is a Portuguese message", async () => {
    const { VIEWER_WRITE_ERROR_MESSAGE } = await import("./guard");

    expect(VIEWER_WRITE_ERROR_MESSAGE).toMatch(/visualiza/i);
  });
});
