import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests only — pure logic (matching, waitlist rules) and the Server Action
 * wrapper. End-to-end coverage lives in `tests/e2e` and runs under Playwright.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    // The wrapper logs unhandled errors on purpose; keep the output readable.
    silent: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
