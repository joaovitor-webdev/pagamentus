import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
  },
  webServer: {
    command: 'npm run start -- -p 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
