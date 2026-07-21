import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { loadEnv } from "./scripts/lib/load-env";
import "@testing-library/jest-dom/vitest";

loadEnv();

// jsdom has no ResizeObserver, and its Element.scrollIntoView is a no-op stub
// that some versions omit entirely; the `Command` primitive
// (components/ui/command.tsx, backed by cmdk) uses both to track/scroll to
// the selected item, so any test rendering it needs these stubbed.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  cleanup();
});
