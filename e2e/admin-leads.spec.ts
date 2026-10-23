import { test, expect, type Page } from '@playwright/test';
import { E2E_ADMIN_PASSWORD } from '../playwright.config';

async function login(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Contraseña').fill(E2E_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
const card = (page: Page, text: string) => page.getByTestId('lead-card').filter({ hasText: text });

test.describe('solicitudes → panel', () => {
  test('formulario de contacto queda en "Nuevo" y se puede mover de etapa', async ({ page, request, baseURL }) => {
    const nombre = `Lead E2E ${Date.now()}`;
    const r = await request.post('/api/contact', { headers: { origin: baseURL! }, data: { nombre, empresa: 'Prueba SpA', email: 'lead@example.com', tipo: 'E-commerce', presupuesto: 'Aún no lo sé', mensaje: 'Quiero una tienda', website: '', turnstileToken: '', t: 5000 } });
    expect(r.ok()).toBeTruthy();
    await login(page);
    await page.goto('/admin/solicitudes');
    const c = page.locator('[data-stage="nuevo"]').getByTestId('lead-card').filter({ hasText: nombre });
    await expect(c).toContainText('Formulario de contacto');
    await c.getByRole('button', { name: nombre, exact: true }).click();
    await expect(page.getByRole('dialog', { name: nombre })).toContainText('E-commerce');
    await page.keyboard.press('Escape');
    await c.getByRole('button', { name: `Acciones: ${nombre}` }).click();
    await page.getByRole('menuitem', { name: 'Contactado' }).click();
    await expect(page.locator('[data-stage="contactado"]').getByTestId('lead-card').filter({ hasText: nombre })).toBeVisible();
  });

  test('honeypot no guarda nada', async ({ page, request, baseURL }) => {
    const nombre = `Bot ${Date.now()}`;
    await request.post('/api/contact', { headers: { origin: baseURL! }, data: { nombre, email: 'bot@example.com', tipo: 'Sitio web', website: 'spam', t: 5000 } });
    await login(page);
    await page.goto('/admin/solicitudes');
    await expect(card(page, nombre)).toHaveCount(0);
  });

  test('"Elegir pack" en /packs guarda la intención con precios del servidor y sigue abriendo WhatsApp', async ({ page, context }) => {
    await page.goto('/packs');
    const btn = page.locator('a[data-lead][href*="wa.me"]', { hasText: 'Elegir pack' }).first();
    const lead = JSON.parse((await btn.getAttribute('data-lead'))!) as { pack: string };
    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/api/leads')),
      context.waitForEvent('page').then((p) => p.close()).catch(() => {}),
      btn.evaluate((a: HTMLAnchorElement) => a.click()),
    ]);
    expect(resp.status()).toBe(204);
    await login(page);
    await page.goto('/admin/solicitudes');
    await expect(card(page, `Interés en ${lead.pack}`).first()).toContainText('Elegir pack');
  });

  test('/api/leads: valida, rechaza otro origen y recalcula montos (no confía en el cliente)', async ({ request, baseURL, page }) => {
    expect((await request.post('/api/leads', { headers: { origin: 'https://evil.example' }, data: { channel: 'reservar_cupo' } })).status()).toBe(403);
    expect((await request.post('/api/leads', { headers: { origin: baseURL! }, data: { channel: 'elegir_pack', pack: 'No existe' } })).status()).toBe(422);
    const ok = await request.post('/api/leads', { headers: { origin: baseURL! }, data: { channel: 'arma_tu_pack', items: ['sitio-pyme', 'pro'], when: 'E2E-' + Date.now() } });
    expect(ok.status()).toBe(204);
    await login(page);
    await page.goto('/admin/solicitudes');
    // arma.ts usa la mensualidad regular: Sitio pyme $349.990 + (34.990 + 349.990) × 0,85 = $327.233/mes (combo 15 %)
    await expect(card(page, 'Armó: Sitio pyme, Marketing Pro').first()).toContainText('$349.990 + $327.233/mes');
  });
});
