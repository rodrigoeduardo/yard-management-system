import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const alias = {
  "@": path.resolve(__dirname, "."),
};

// Test files that hit the remote Supabase DB/network. These run only in the
// `integration` project; everything else runs in `unit` (or `component` for
// .tsx files), which need no DB/auth env vars and stay fast.
const integrationInclude = [
  "lib/db/**/*.test.ts",
  "lib/actions/**/*.test.ts",
  "lib/supabase/**/*.test.ts",
  "app/login/actions.test.ts",
  "app/register/actions.test.ts",
  "scripts/lib/seed-demo-data.test.ts",
  // Not in the issue's original list, but genuinely DB-touching (inserts a
  // real load via lib/db/loads before decoding its generated QR codes) —
  // leaving it in `unit` would break the "no DB env vars" requirement.
  "lib/qrcode/generate.test.ts",
];

export default defineConfig({
  cacheDir: ".vite-cache",
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          setupFiles: ["./vitest.setup.ts"],
          include: ["**/*.test.ts"],
          exclude: [
            "**/node_modules/**",
            ".claude/**",
            ...integrationInclude,
          ],
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "component",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.component.ts"],
          include: ["**/*.test.tsx"],
          exclude: ["**/node_modules/**", ".claude/**"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          environment: "node",
          setupFiles: ["./vitest.setup.ts"],
          include: integrationInclude,
          exclude: ["**/node_modules/**", ".claude/**"],
        },
      },
    ],
  },
});
