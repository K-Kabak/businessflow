import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: process.env.PLAYWRIGHT_PRODUCTION ? "pnpm start" : "pnpm dev",
    url: "http://127.0.0.1:3000/login",
    reuseExistingServer: !process.env.CI && !process.env.E2E_DATABASE_URL,
    env: {
      DATABASE_URL:
        process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "test-auth-secret-businessflow",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
