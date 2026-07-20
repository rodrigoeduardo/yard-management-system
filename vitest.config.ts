import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const alias = {
  "@": path.resolve(__dirname, "."),
};

export default defineConfig({
  cacheDir: ".vite-cache",
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          setupFiles: ["./vitest.setup.ts"],
          include: ["**/*.test.ts"],
          exclude: ["**/node_modules/**", ".claude/**"],
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
    ],
  },
});
