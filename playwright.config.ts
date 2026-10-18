import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra el build de producción (`npm run build` antes de correr).
 * Usa Chrome del sistema si existe (CHROME_PATH), si no, el Chromium de Playwright.
 */
const PORT = Number(process.env.E2E_PORT || 3300);
/** Segundo servidor con GA4 de prueba (build aparte en .next-ga) para e2e/analytics.spec.ts. */
const GA_PORT = Number(process.env.E2E_GA_PORT || PORT + 1);
const GA_TEST_ID = 'G-TEST000000';
const GSC_TEST_TOKEN = 'gsc-test-token';
/**
 * Formulario: nunca se llama a Resend en tests. Servidor principal con CONTACT_DRY_RUN=1 (arma el correo y responde ok);
 * el servidor GA corre SIN clave ni dry-run para probar el error "falta RESEND_API_KEY" (503 + alternativas).
 */
const SERVER_ENV = { CONTACT_RATE_LIMIT: '1000', RESEND_API_KEY: '', CONTACT_TO_EMAIL: '', TURNSTILE_SECRET_KEY: '', CONTACT_DRY_RUN: '' };
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
  webServer: [
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: false,
      timeout: 60_000,
      // Resend simulado en la ruta (CONTACT_DRY_RUN=1): valida y responde ok sin enviar
      env: { ...SERVER_ENV, CONTACT_DRY_RUN: '1' },
    },
    {
      // Build con NEXT_PUBLIC_GA_ID de prueba en .next-ga: se (re)construye solo si falta o es más viejo que .next
      command: `([ .next-ga/BUILD_ID -nt .next/BUILD_ID ] || npx next build) && npx next start -p ${GA_PORT}`,
      url: `http://localhost:${GA_PORT}`,
      reuseExistingServer: false,
      timeout: 400_000,
      env: { ...SERVER_ENV, SOUTH_DIST_DIR: '.next-ga', NEXT_PUBLIC_GA_ID: GA_TEST_ID, NEXT_PUBLIC_GSC_VERIFICATION: GSC_TEST_TOKEN },
    },
  ],
});
