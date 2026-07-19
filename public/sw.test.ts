import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * public/sw.js runs in the ServiceWorkerGlobalScope, which jsdom doesn't
 * provide. We load the real source into a minimal sandboxed `self` so the
 * install/fetch wiring is exercised for real rather than duplicated as a
 * TS module the browser never actually runs.
 */
function loadServiceWorker(sandbox: {
  self: Record<string, unknown>;
  caches: { open: ReturnType<typeof vi.fn> };
  fetch: ReturnType<typeof vi.fn>;
}) {
  const source = readFileSync(path.join(__dirname, "sw.js"), "utf-8");
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
}

describe("public/sw.js", () => {
  let listeners: Record<string, (event: unknown) => void>;
  let cache: { add: ReturnType<typeof vi.fn>; match: ReturnType<typeof vi.fn> };
  let selfObj: Record<string, unknown>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    listeners = {};
    cache = {
      add: vi.fn().mockResolvedValue(undefined),
      match: vi.fn().mockResolvedValue("offline-response"),
    };
    fetchMock = vi.fn();
    selfObj = {
      addEventListener: (type: string, handler: (event: unknown) => void) => {
        listeners[type] = handler;
      },
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn().mockResolvedValue(undefined) },
    };

    loadServiceWorker({
      self: selfObj,
      caches: { open: vi.fn().mockResolvedValue(cache) },
      fetch: fetchMock,
    });
  });

  it("caches the offline fallback page on install", async () => {
    const waitUntil = vi.fn();
    listeners.install({ waitUntil });

    await waitUntil.mock.calls[0][0];

    expect(cache.add).toHaveBeenCalledWith("/offline");
  });

  it("serves the cached offline page when a navigation request fails", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const respondWith = vi.fn();
    listeners.fetch({ request: { mode: "navigate" }, respondWith });

    const response = await respondWith.mock.calls[0][0];

    expect(response).toBe("offline-response");
  });

  it("does not intercept non-navigation requests", () => {
    const respondWith = vi.fn();
    listeners.fetch({ request: { mode: "cors" }, respondWith });

    expect(respondWith).not.toHaveBeenCalled();
  });
});
