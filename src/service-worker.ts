/// <reference lib="webworker" />

/**
 * Online-only PWA worker.
 *
 * Intentionally no fetch handler or precache: every document, asset, and API
 * request uses the browser's normal network path and fails when offline.
 */
self.addEventListener("install", () => {
  // Keep the worker valid without enabling offline behavior.
});
