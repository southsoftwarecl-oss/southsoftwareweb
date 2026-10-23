import { test, expect } from '@playwright/test';
import { E2E_ADMIN_PASSWORD } from '../playwright.config';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Contraseña').fill(E2E_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe('+ Crear', () => {
  test.skip(({ isMobile }) => isMobile, 'flujo de escritorio');

  test('Nueva solicitud manual: valida y queda en Nuevo con origen manual', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Crear' }).click();
    await page.getByRole('menuitem', { name: 'Nueva solicitud' }).click();
    await expect(page.getByRole('heading', { name: 'Nueva solicitud', level: 1 })).toBeVisible();
    const name = 'Manual E2E ' + Date.now();
    await page.getByLabel('Nombre o empresa *').fill(name);
    await page.getByRole('button', { name: 'Crear solicitud' }).click();
    await expect(page.getByText('Agrega al menos un correo o un teléfono.')).toBeVisible();
    await page.getByLabel('Teléfono / WhatsApp').fill('+56 9 1234 5678');
    await page.getByRole('button', { name: 'Crear solicitud' }).click();
    await expect(page).toHaveURL(/\/admin\/solicitudes\?creada=1$/);
    const card = page.locator('[data-stage="nuevo"] [data-testid="lead-card"]', { hasText: name });
    await expect(card).toContainText('Ingreso manual');
  });

  test('Registrar pago: sin cobros muestra estado vacío honesto', async ({ page }) => {
    await login(page);
    await page.goto('/admin/cobros/pago');
    await expect(page.getByRole('heading', { name: 'Registrar pago', level: 1 })).toBeVisible();
    await expect(page.getByText('No hay cobros pendientes')).toBeVisible();
  });

  test('Inicio: Fundadores con barra real (0 de 10) y sin "—"', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('progressbar', { name: 'Cupos Fundadores usados' })).toHaveAttribute('aria-valuenow', '0');
    await expect(page.locator('main')).not.toContainText('—');
  });

  test('/api/leads no acepta canal manual', async ({ request, baseURL }) => {
    expect((await request.post('/api/leads', { headers: { origin: baseURL! }, data: { channel: 'manual' } })).status()).toBe(422);
  });

  test('Datos de ejemplo: banda visible, mover es local y nunca toca la BD', async ({ page }) => {
    await login(page);
    await page.goto('/admin/solicitudes?ejemplo=1');
    await expect(page.getByText('datos de ejemplo', { exact: false }).first()).toBeVisible();
    const c = page.locator('[data-stage="nuevo"]').getByTestId('lead-card').filter({ hasText: 'Ferretería Ejemplo' });
    await c.getByLabel('Mover a').selectOption('contactado');
    await c.getByRole('button', { name: 'Mover' }).click();
    await expect(page.getByText('(ejemplo, no se guarda)')).toBeVisible();
    await page.goto('/admin/solicitudes');
    await expect(page.getByText('Ferretería Ejemplo')).toHaveCount(0);
  });

  test('Lista y detalle lateral', async ({ page }) => {
    await login(page);
    await page.goto('/admin/solicitudes?ejemplo=1&vista=lista');
    await page.getByTestId('lead-row').filter({ hasText: 'Clínica Demo' }).click();
    await expect(page.getByRole('dialog', { name: 'Clínica Demo' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
