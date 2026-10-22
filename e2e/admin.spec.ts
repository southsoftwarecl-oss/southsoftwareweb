import { test, expect } from '@playwright/test';
import { E2E_ADMIN_PASSWORD } from '../playwright.config';
import { PACKS } from '../src/content/site';

const GA_PORT = Number(process.env.E2E_GA_PORT || Number(process.env.E2E_PORT || 3300) + 1);

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Contraseña').fill(E2E_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe('panel /admin', () => {
  test('sin sesión redirige al login, noindex y sin chrome público ni Three.js', async ({ page }) => {
    for (const p of ['/admin', '/admin/solicitudes', '/admin/cobros', '/admin/catalogo', '/admin/clientes']) {
      await page.goto(p);
      await expect(page).toHaveURL(/\/admin\/login$/);
    }
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('nav[aria-label="Principal"], footer')).toHaveCount(0);
  });

  test('cookie falsificada no entra', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'ss_admin', value: 'owner.9999999999.firmafalsa', url: baseURL! + '/admin' }]);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('contraseña incorrecta muestra error', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Contraseña').fill('incorrecta');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Contraseña incorrecta.')).toBeVisible();
  });

  test('login → dashboard vacío honesto, catálogo real, simulador y salir', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
    await expect(page.getByText('Aún no hay datos').first()).toBeVisible();
    await page.getByRole('link', { name: 'Catálogo' }).click();
    for (const p of PACKS) await expect(page.getByRole('cell', { name: new RegExp(p.name) }).first()).toBeVisible();
    await expect(page.locator('[data-pack="vitrina-digital"]')).toContainText('$549.990');
    await expect(page.locator('[data-pack="blindaje-digital"]')).toContainText('$29.990');
    await page.getByRole('link', { name: 'Cobros' }).click();
    await page.getByLabel('Fecha de alta').fill('2026-11-15');
    await page.getByLabel('Cliente Fundador').check();
    const t = page.getByTestId('sim-table');
    await expect(t).toContainText('$384.993'); // 549.990 − 30 %
    await expect(t).toContainText('15-12-2026');
    await page.getByRole('button', { name: 'Salir' }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('sin variables de entorno el panel queda desactivado', async ({ page }) => {
    await page.goto(`http://localhost:${GA_PORT}/admin/login`);
    await expect(page.getByText('Panel desactivado: falta')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeDisabled();
  });

  test('robots.txt bloquea /admin', async ({ request }) => {
    expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /admin');
  });
});
