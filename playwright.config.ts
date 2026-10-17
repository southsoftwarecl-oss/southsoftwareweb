import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra el build de producción (`npm run build` antes de correr).
 * Usa Chrome del sistema si existe (CHROME_PATH), si no, el Chromium de Playwright.
 */
const PORT = Number(process.env.E2E_PORT || 3300);
const executablePath = process.env.CHROME_PATH || (process.platform === 'linux' ? '/usr/bin/google-chrome' : undefined);

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: { executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    // Sin RESEND_API_KEY → el formulario corre en modo demo
    env: { CONTACT_RATE_LIMIT: '1000', RESEND_API_KEY: '', CONTACT_TO_EMAIL: '', TURNSTILE_SECRET_KEY: '' },
  },
});
