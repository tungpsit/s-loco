import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  baseURL: 'http://localhost:3000',
  reporter: [['list']],
  timeout: 30_000,
  retries: 0,
  webServer: [
    {
      command: 'bun run --cwd apps/api src/index.ts',
      url: 'http://localhost:3000/health',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'bun run --cwd apps/admin dev',
      url: 'http://localhost:3001',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
})
