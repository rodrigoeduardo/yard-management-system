import { cleanup } from "@testing-library/react";
import { config } from "dotenv";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

config({ path: ".env.local" });

afterEach(() => {
  cleanup();
});
