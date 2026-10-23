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
    await expect(card).toContainText('Manual');
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
    await c.getByRole('button', { name: 'Acciones: Ferretería Ejemplo' }).click();
    await page.getByRole('menuitem', { name: 'Contactado' }).click();
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

  test('Reglas de etapa: Propuesta exige cotización, Aceptado exige aceptada, Reunión fecha, Cancelado motivo; versiones', async ({ page }) => {
    await login(page);
    const name = 'Reglas E2E ' + Date.now();
    await page.goto('/admin/solicitudes/nueva');
    await page.getByLabel('Nombre o empresa *').fill(name);
    await page.getByLabel('Correo').fill('reglas@example.com');
    await page.getByRole('button', { name: 'Crear solicitud' }).click();
    await expect(page).toHaveURL(/creada=1/);
    const card = () => page.getByTestId('lead-card').filter({ hasText: name });
    const moveTo = async (st: string) => { await card().getByRole('button', { name: `Acciones: ${name}` }).click(); await page.getByRole('menuitem', { name: st, exact: true }).click(); };
    // Reunión pide fecha
    await moveTo('Reunión');
    await page.getByLabel('Fecha y hora de la reunión').fill('2026-11-05T10:30');
    await page.getByRole('button', { name: 'Mover a Reunión' }).click();
    await expect(page.locator('[data-stage="reunion"]').getByTestId('lead-card').filter({ hasText: name })).toBeVisible();
    // Propuesta sin cotización → error + abrir cotizaciones
    await moveTo('Propuesta');
    await expect(page.getByText('crea primero una cotización')).toBeVisible();
    await page.getByRole('button', { name: 'Abrir cotizaciones' }).click();
    const dlg = page.getByRole('dialog', { name });
    await dlg.getByRole('button', { name: 'Nueva cotización' }).click();
    await dlg.getByLabel('Ítems (uno por línea)').fill('Sitio pyme\nMarketing Pro');
    await dlg.getByLabel('Pago inicial (CLP)').fill('349990');
    await dlg.getByLabel('Mensualidad (CLP)').fill('39990');
    await dlg.getByRole('button', { name: 'Guardar borrador' }).click();
    await expect(dlg.getByText('v1')).toBeVisible();
    // Nueva versión → v1 queda de solo lectura
    await dlg.getByRole('button', { name: 'Nueva versión' }).click();
    await dlg.getByLabel('Pago inicial (CLP)').fill('299990');
    await dlg.getByRole('button', { name: 'Guardar borrador' }).click();
    await expect(dlg.getByText('v2')).toBeVisible();
    await expect(dlg.getByText('Versiones anteriores (1)')).toBeVisible();
    await page.keyboard.press('Escape');
    await moveTo('Propuesta');
    await expect(page.locator('[data-stage="propuesta"]').getByTestId('lead-card').filter({ hasText: name })).toBeVisible();
    // Aceptado sin aceptada → error; aceptar → ok
    await moveTo('Aceptado');
    await expect(page.getByText('marca una cotización como aceptada')).toBeVisible();
    await page.getByRole('button', { name: 'Abrir cotizaciones' }).click();
    await page.getByRole('dialog', { name }).getByRole('button', { name: 'Aceptar' }).click();
    await expect(page.getByRole('dialog', { name }).getByText('Aceptada')).toBeVisible();
    await page.keyboard.press('Escape');
    await moveTo('Aceptado');
    await expect(page.locator('[data-stage="aceptado"]').getByTestId('lead-card').filter({ hasText: name })).toBeVisible();
    // Cancelado pide motivo
    await moveTo('Cancelado');
    await page.getByLabel('Motivo').selectOption('Precio');
    await page.getByRole('button', { name: 'Cancelar solicitud' }).click();
    await page.getByRole('button', { name: 'Expandir Cancelado' }).click(); // Pausado y Cancelado quedan contraídas
    await expect(page.locator('[data-stage="cancelado"]').getByTestId('lead-card').filter({ hasText: name })).toBeVisible();
  });

  test('Mover con teclado (Espacio + flecha) y clic derecho', async ({ page }) => {
    await login(page);
    await page.goto('/admin/solicitudes?ejemplo=1');
    const c = page.locator('[data-stage="nuevo"]').getByTestId('lead-card').filter({ hasText: 'Ferretería Ejemplo' });
    await page.waitForLoadState('networkidle'); // esperar hidratación antes de usar teclado
    await expect(async () => {
      await c.focus();
      await page.keyboard.press(' ');
      await expect(page.getByText('levantada', { exact: false })).toBeAttached({ timeout: 1000 });
    }).toPass();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-stage="contactado"]').getByTestId('lead-card').filter({ hasText: 'Ferretería Ejemplo' })).toBeVisible();
    const d = page.getByTestId('lead-card').filter({ hasText: 'Clínica Demo' });
    await d.click({ button: 'right', position: { x: 60, y: 50 } });
    await expect(page.getByRole('menu', { name: 'Acciones: Clínica Demo' })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('Kanban a 1440: columnas ≥240 px, scroll horizontal con desvanecido; Pausado/Cancelado contraídas; nombre truncado con title', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto('/admin/solicitudes?ejemplo=1');
    const kb = page.getByRole('list', { name: 'Etapas' });
    await expect(kb).toHaveClass(/\bfr\b/);
    const w = await page.locator('[data-stage="nuevo"]').evaluate((e) => e.getBoundingClientRect().width);
    expect(w).toBeGreaterThanOrEqual(240);
    await expect(page.getByRole('button', { name: 'Expandir Pausado' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Expandir Cancelado' })).toBeVisible();
    await kb.evaluate((e) => { e.style.scrollBehavior = 'auto'; e.scrollLeft = e.scrollWidth; });
    await expect(kb).toHaveClass(/\bfl\b/);
    const t = page.getByTestId('lead-card').first().locator('.lc-t');
    expect(await t.getAttribute('title')).toBeTruthy();
    expect(await t.evaluate((e) => getComputedStyle(e).textOverflow)).toBe('ellipsis');
  });
});
