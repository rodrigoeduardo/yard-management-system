import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/inventory",
  useSearchParams: () => currentSearchParams,
}));

const useTransitionMock = vi.fn();
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useTransition: () => useTransitionMock() };
});

const { useStockQueryNav } = await import("./use-stock-query-nav");

beforeEach(() => {
  push.mockClear();
  currentSearchParams = new URLSearchParams();
});

describe("useStockQueryNav", () => {
  it("wraps the router push in a transition and disables the scroll reset", () => {
    const startTransition = vi.fn((callback: () => void) => callback());
    useTransitionMock.mockReturnValue([false, startTransition]);

    const { result } = renderHook(() => useStockQueryNav());
    result.current.navigateStock({ q: "abc" });

    expect(startTransition).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/inventory?stock_q=abc", {
      scroll: false,
    });
  });

  it("surfaces the transition's pending state so callers can keep stale rows visible with an indicator", () => {
    useTransitionMock.mockReturnValue([true, vi.fn()]);

    const { result } = renderHook(() => useStockQueryNav());

    expect(result.current.isPending).toBe(true);
  });

  it("reports isPending: false when no transition is in flight", () => {
    useTransitionMock.mockReturnValue([
      false,
      vi.fn((callback: () => void) => callback()),
    ]);

    const { result } = renderHook(() => useStockQueryNav());

    expect(result.current.isPending).toBe(false);
  });
});
