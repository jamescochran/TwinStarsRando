import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  timeout: 30000,
  // On CI also emit GitHub annotations so failures are readable without downloading the report.
  reporter: process.env.CI ? [["github"], ["html"]] : "html",

  use: {
    baseURL: "http://localhost:7919",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: {
    // `npx --no` runs the lockfile-pinned serve from node_modules and refuses to download anything.
    command: "npx --no serve .. -p 7919 --no-clipboard",
    url: "http://localhost:7919",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
