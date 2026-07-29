import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["game/**/__tests__/**/*.test.ts"],
    // save.test.ts uses localStorage which requires a browser-like environment.
    // It is excluded from the main vitest run (kept for manual/browser testing).
    exclude: ["game/__tests__/save.test.ts", "**/beatability*"],
  },
});
