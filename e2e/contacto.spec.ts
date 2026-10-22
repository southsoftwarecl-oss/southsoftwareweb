import { expect, test, type Page } from '@playwright/test';
import { PACKS } from '../src/content/site';

/**
 * /contacto "brief conversacional": alturas, título, chips/presupuesto, tarjeta del brief,
 * packs de referencia (precios EXACTOS de PACKS), envío (dry-run), copiar email, WhatsApp con número real,
 * sin cursor personalizado / violeta, reduced motion y fallback sin JS.
 */
const errorsOf = (page: Page) => {
  const errs: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(String(e)));
  return errs;
};
const metrics = (page: Page) => page.evaluate(() => ({
  H: document.documentElement.scrollHeight, vh: innerHeight, sw: document.documentElement.scrollWidth, w: innerWidth,
  h1: parseFloat(getComputedStyle(document.querySelector('h1')!).fontSize),
}));
const brief = (page: Page) => page.locator('[data-bcard]:visible').first();

test.describe('contacto · desktop 1440×900', () => {
  test('200, sin errores, altura ≤ 2,8 vh, sin overflow, h1 ≥ 48 px', async ({ page }) => {
    const errs = errorsOf(page);
    const r = await page.goto('/contacto');
    expect(r?.status()).toBe(200);
    await page.waitForTimeout(1500);
    const m = await metrics(page);
    expect(m.H).toBeLessThanOrEqual(2.8 * m.vh);
    expect(m.sw).toBeLessThanOrEqual(m.w);
    expect(m.h1).toBeGreaterThanOrEqual(48);
    expect(errs).toEqual([]);
  });

  test('chip E-commerce, flechas en presupuesto y tarjeta del brief', async ({ page }) => {
    await page.goto('/contacto');
    await page.getByLabel('Nombre').fill('Ana Pérez');
    await page.getByLabel('Empresa').fill('Tienda Sur');
    await page.getByRole('radio', { name: 'E-commerce' }).click();
    await expect(page.locator('input[name=tipo]:checked')).toHaveValue('E-commerce');
    await page.getByRole('radio', { name: 'Menos de $300.000' }).click();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('input[name=presupuesto]:checked')).toHaveValue('$300.000 – $700.000');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('input[name=presupuesto]:checked')).toHaveValue('$700.000 – $1.500.000');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('input[name=presupuesto]:checked')).toHaveValue('$300.000 – $700.000');
    const card = brief(page);
    await expect(card).toContainText('Ana Pérez');
    await expect(card).toContainText('Tienda Sur');
    await expect(card).toContainText('tienda online (e-commerce)');
    await expect(card).toContainText('$300.000 – $700.000');
    await page.getByLabel('Cuéntanos tu idea').fill('x'.repeat(200));
    await expect(card.locator('.bc-msg')).toHaveText('x'.repeat(140) + '…');
    // pregunta guía según el tipo
    await expect(page.getByLabel('Cuéntanos tu idea')).toHaveAttribute('placeholder', '¿Qué vende tu tienda y cuántos productos tienes?');
  });

  test('packs de referencia: nombres y precios exactos de PACKS', async ({ page }) => {
    await page.goto('/contacto');
    const map: Record<string, string[]> = {
      'Sitio web': ['Emprende', 'Pyme'], 'E-commerce': ['E-commerce', 'Vitrina Digital'], 'App móvil': ['App'],
      'Software a medida': [], 'Software de escritorio': [], 'Seguridad informática': ['Blindaje Digital'], 'Ciencia de datos': ['Datos'],
    };
    const ref = page.locator('.packref');
    for (const [tipo, names] of Object.entries(map)) {
      await page.getByRole('radio', { name: tipo, exact: true }).click();
      const pks = ref.locator('.pk');
      if (!names.length) { await expect(pks).toHaveText(['Software a medida Cotización']); continue; }
      await expect(pks).toHaveText(names.map((n) => { const p = PACKS.find((x) => x.name === n)!; return `${p.name} ${p.setup} + ${p.monthly}/mes`; }));
    }
    await expect(ref.getByRole('link', { name: /Ver packs/ })).toHaveAttribute('href', '/packs');
  });

  test('envío → sello y "Recibido ✓" con 24 horas hábiles', async ({ page }) => {
    await page.goto('/contacto');
    await page.waitForFunction(() => !!(window as unknown as { __contactMotion?: unknown }).__contactMotion, null, { timeout: 10000 });
    await page.getByLabel('Nombre').fill('Prueba E2E');
    await page.getByLabel('Email', { exact: true }).fill('prueba@example.com');
    await page.getByRole('radio', { name: 'Sitio web' }).click();
    await page.getByRole('button', { name: 'Enviar brief' }).click();
    const ok = page.locator('form.brief .recv');
    await expect(ok).toContainText('Recibido ✓', { timeout: 15000 });
    await expect(ok).toContainText('24 horas hábiles');
    await expect(ok).not.toContainText('Modo demo');
    await expect(ok).toContainText('Resumen de tu brief: Hola, soy Prueba E2E.');
    await expect(brief(page)).toContainText('Recibido ✓');
  });

  test('errores de validación con aria-invalid', async ({ page }) => {
    await page.goto('/contacto');
    await page.getByRole('button', { name: 'Enviar brief' }).click();
    await expect(page.getByLabel('Nombre')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    const group = page.getByRole('radiogroup', { name: 'Tipo de proyecto' });
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Elige un tipo de proyecto')).toBeVisible();
  });

  test('copiar email escribe en el clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/contacto');
    await page.getByRole('button', { name: 'Copiar email' }).click();
    await expect(page.locator('.toast')).toHaveText('Copiado');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('contacto@southsoftware.cl');
  });

  test('WhatsApp real: "Enviar por WhatsApp" visible, número y canal activos', async ({ page }) => {
    await page.goto('/contacto');
    await expect(page.getByRole('link', { name: 'Enviar por WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/56964710361\?text=/);
    await expect(page.locator('.channels .ch-row .ch-btn')).toHaveAttribute('href', /^https:\/\/wa\.me\/56964710361\?text=/);
    await expect(page.locator('.channels a[href="tel:+56964710361"]')).toHaveText('+56 9 6471 0361');
    await expect(page.locator('.channels .ph')).toHaveCount(0);
    expect(await page.locator('body').innerText()).not.toMatch(/XXXX|por definir\)|Número por definir/);
  });

  test('cobertura: "Todo Chile" + hora de Chile, sin ciudad, coordenadas ni horarios', async ({ page }) => {
    await page.goto('/contacto');
    const loc = page.locator('.ch-loc');
    await expect(loc).toContainText('Todo Chile');
    await expect(loc).toContainText('Hora de Chile');
    await expect(loc.locator('.cc-t')).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
    await expect(loc).not.toContainText(/abierto|cerrado|horario/i);
    // sin ciudad ni coordenadas (pedido de Mathias): se excluye el footer compartido, que corrige otra rama
    const body = await page.locator('.page').first().innerText();
    expect(body).not.toMatch(/puerto\smontt|los\slagos|relon.av|\d{2}°\d/i);
  });

  test('sin cursor personalizado ni violeta', async ({ page }) => {
    await page.goto('/contacto');
    await page.mouse.move(400, 400); await page.mouse.move(900, 500);
    await page.getByRole('radio', { name: 'App móvil' }).click();
    const r = await page.evaluate(() => ({
      cursors: document.querySelectorAll('.cursor, .cursor-ring').length,
      violet: [...document.querySelectorAll('*')].filter((el) => {
        const s = getComputedStyle(el);
        return [s.color, s.backgroundColor, s.borderTopColor, s.backgroundImage, s.boxShadow].some((v) => v.includes('124, 92, 255'));
      }).length,
    }));
    expect(r.violet).toBe(0);
    expect(r.cursors).toBe(0);
  });
});

test.describe('contacto · reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  test('sin animaciones GSAP activas, sin charco y todo visible', async ({ page }) => {
    await page.goto('/contacto');
    await page.waitForFunction(() => !!(window as unknown as { __contactMotion?: unknown }).__contactMotion, null, { timeout: 10000 });
    await page.getByRole('radio', { name: 'E-commerce' }).click();
    await page.getByRole('radio', { name: 'Aún no lo sé' }).click();
    await page.getByLabel('Nombre').fill('Ana');
    const active = await page.evaluate(() => (window as unknown as { __contactMotion: { active: () => number } }).__contactMotion.active());
    expect(active).toBe(0);
    await expect(page.locator('.pool')).toHaveCount(0);
    await expect(page.locator('h1')).toBeVisible();
    // el chip se rellena al instante (sin gota)
    const clip = await page.locator('.chip:has(input:checked) .fill').evaluate((el) => getComputedStyle(el).clipPath);
    expect(clip).toContain('150%');
  });
});

test.describe('contacto · sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('el formulario existe en el SSR con radios nativos y fallback mailto', async ({ page }) => {
    await page.goto('/contacto');
    const form = page.locator('form.brief');
    await expect(form).toHaveAttribute('action', 'mailto:contacto@southsoftware.cl');
    await expect(form.locator('input[name=tipo]')).toHaveCount(7);
    await expect(form.locator('input[name=presupuesto]')).toHaveCount(5);
    await expect(page.locator('h1')).toContainText('Agenda una');
  });
});

test.describe('contacto · móvil 390×844 @mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('200, altura ≤ 4 vh, sin overflow, h1 ≥ 40 px, brief colapsable @mobile', async ({ page }) => {
    const errs = errorsOf(page);
    const r = await page.goto('/contacto');
    expect(r?.status()).toBe(200);
    await page.waitForTimeout(1500);
    const m = await metrics(page);
    expect(m.H).toBeLessThanOrEqual(4 * m.vh);
    expect(m.sw).toBeLessThanOrEqual(m.w);
    expect(m.h1).toBeGreaterThanOrEqual(40);
    const tog = page.locator('.bc-tog');
    await expect(tog).toHaveAttribute('aria-expanded', 'false');
    await page.getByLabel('Nombre').fill('Ana');
    await page.getByRole('radio', { name: 'Ciencia de datos' }).check();
    await tog.click();
    await expect(tog).toHaveAttribute('aria-expanded', 'true');
    await expect(brief(page)).toContainText('Ana');
    await expect(brief(page)).toContainText('ciencia de datos');
    expect(errs).toEqual([]);
  });
});
