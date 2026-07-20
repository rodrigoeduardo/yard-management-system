import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { loadEnv } from "./scripts/lib/load-env";
import "@testing-library/jest-dom/vitest";

loadEnv();

afterEach(() => {
  cleanup();
});
