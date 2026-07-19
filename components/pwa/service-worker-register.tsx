"use client";

import { useEffect } from "react";

/**
 * Registers the minimal offline-fallback service worker (public/sw.js) in
 * production builds only, per issue #143. Dev/test builds skip registration
 * so hot-reload never fights a stale cached worker.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability must not break the app if registration fails.
    });
  }, []);

  return null;
}
