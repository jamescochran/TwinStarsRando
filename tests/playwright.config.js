import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  timeout: 30000,
  reporter: "html",

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
  ],

  webServer: {
    command: "npx serve@14 .. -p 7919 --no-clipboard",
    url: "http://localhost:7919",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
