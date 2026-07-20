import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./flows",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: process.env.DEMO_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 1280, height: 720 },
  },
});
