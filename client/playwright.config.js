import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30000,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',   // ← использовать установленный Chrome
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
            '--no-sandbox',
          ],
        },
      },
    },
  ],

  webServer: [
    {
      command: 'npm run dev -w server',
      port: 3000,
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -w client',
      port: 5173,
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});