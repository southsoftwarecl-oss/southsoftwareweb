import { expect, test, type Page } from '@playwright/test';
import { clp, quote, quoteMessage } from '../src/content/arma';
import { CUSTOM_PACK, MARKETING_ONBOARDING, MARKETING_PACKS, PACKS, WA_URL } from '../src/content/site';

/** "Arma tu pack" (/packs#arma-tu-pack): totales en vivo, regla combo y WhatsApp precargado. */
const n = (v: string) => Number(v.replace(/[^\d]/g, ''));
const P = (name: string) => PACKS.find((p) => p.name === name)!;
const M = (name: string) => MARKETING_PACKS.find((p) => p.name === name)!;

async function open(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/packs#arma-tu-pack');
  await page.waitForFunction(() => { const p = document.querySelector('.pre'); return !p || getComputedStyle(p).display === 'none'; }, null, { timeout: 8000 });
  return errors;
}
const sec = (page: Page) => page.locator('#arma-tu-pack');
const totals = async (page: Page) => ({
  setup: (await sec(page).locator('[data-total="setup"]').textContent())!.trim(),
  monthly: (await sec(page).locator('[data-total="monthly"]').textContent())!.replace('/mes', '').trim(),
});
const wa = async (page: Page) => new URL((await sec(page).locator('.atp-cta').getAttribute('href'))!).searchParams.get('text');

test('lógica de precios: solo de site.ts, combo 10 % y onboarding gratis', () => {
  const a = quote(['landing']);
  expect(a.setup).toBe(n(P('Emprende').setup)); expect(a.monthly).toBe(n(P('Emprende').monthly)); expect(a.combo).toBe(false);
  const b = quote(['pro', 'onboarding']);
  expect(b.setup).toBe(n(MARKETING_ONBOARDING.price)); expect(b.monthly).toBe(n(M('Marketing Pro').monthly)); expect(b.combo).toBe(false);
  const c = quote(['sitio-pyme', 'pro', 'onboarding']);
  expect(c.combo).toBe(true); expect(c.onboardingFree).toBe(true);
  expect(c.setup).toBe(n(P('Pyme').setup));
  expect(c.monthly).toBe(Math.round((n(P('Pyme').monthly) + n(M('Marketing Pro').monthly)) * 0.9));
  const d = quote(['a-medida', 'meta-ads']);
  expect(d.from).toBe(true); expect(d.combo).toBe(true);
  expect(d.setup).toBe(n(CUSTOM_PACK.setup));
  expect(d.monthly).toBe(Math.round((n(CUSTOM_PACK.monthly) + n(M('Solo Ads').monthly)) * 0.9));
  expect(clp(1234567)).toBe('$1.234.567');
});

test('totales en vivo, planes excluyentes y WhatsApp con servicios y totales', async ({ page }) => {
  const errors = await open(page);
  await expect(sec(page).locator('.atp-cta')).toHaveText('Elige al menos un servicio');
  await sec(page).getByLabel('Sitio pyme').check();
  expect(await totals(page)).toEqual({ setup: P('Pyme').setup, monthly: P('Pyme').monthly });
  // plan de marketing: radio (uno solo)
  await sec(page).getByRole('radio', { name: 'Marketing Básico' }).check();
  await sec(page).getByRole('radio', { name: 'Marketing Pro' }).check();
  await expect(sec(page).getByRole('radio', { name: 'Marketing Básico' })).not.toBeChecked();
  await sec(page).getByLabel('Onboarding de marketing').check();
  const q = quote(['sitio-pyme', 'pro', 'onboarding']);
  expect(await totals(page)).toEqual({ setup: clp(q.setup), monthly: clp(q.monthly) });
  await expect(sec(page).locator('.atp-combo')).toBeVisible();
  const text = await wa(page);
  expect(text).toBe(quoteMessage(q));
  expect(text).toContain('Sitio pyme, Marketing Pro, Onboarding de marketing');
  expect(text).toContain(`Pago inicial ${clp(q.setup)} + ${clp(q.monthly)}/mes (con 10 % de descuento combo)`);
  const href = (await sec(page).locator('.atp-cta').getAttribute('href'))!;
  expect(href.startsWith(WA_URL.split('?')[0] + '?')).toBe(true);
  expect(href.match(/[?&]text=/g)?.length).toBe(1);
  // "desde" al sumar un ítem con precio base
  await sec(page).getByLabel('App').check();
  await expect(sec(page).locator('[data-total="setup"]')).toContainText('desde ');
  // teclado: Espacio sobre una casilla la desmarca
  await sec(page).getByLabel('App').focus();
  await page.keyboard.press('Space');
  await expect(sec(page).getByLabel('App')).not.toBeChecked();
  await expect(sec(page).locator('.atp-sum')).toContainText('va siempre aparte');
  expect(errors).toEqual([]);
});

test('home: la franja de precios enlaza a Arma tu pack', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#precios a[href="/packs#arma-tu-pack"]')).toHaveCount(1);
});

test('móvil 390×844: sin overflow y totales visibles @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await open(page);
  await sec(page).getByLabel('Landing').check();
  await sec(page).getByRole('radio', { name: 'Marketing Básico' }).check();
  const q = quote(['landing', 'basico']);
  expect(await totals(page)).toEqual({ setup: clp(q.setup), monthly: clp(q.monthly) });
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(m.sw).toBe(m.cw);
  expect(errors).toEqual([]);
});
