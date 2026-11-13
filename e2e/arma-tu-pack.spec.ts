import { expect, test, type Page } from '@playwright/test';
import { quoteMessage } from '../src/content/arma';
import { clp, quote } from '../src/lib/admin/arma-quote';
import { MARKETING_ONBOARDING_PRICE, packPrice } from '../src/lib/admin/pack-prices';

/** "Arma tu pack" (/packs#arma-tu-pack): totales en vivo, regla combo y WhatsApp precargado. */
const n = (v: string) => Number(v.replace(/[^\d]/g, ''));
const P = (name: string) => packPrice(name);

async function open(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/packs#arma-tu-pack');
  await page.waitForFunction(() => { const p = document.querySelector('.pre'); return !p || getComputedStyle(p).display === 'none'; }, null, { timeout: 8000 });
  return errors;
}
const sec = (page: Page) => page.locator('#arma-tu-pack');
const wa = async (page: Page) => new URL((await sec(page).locator('.atp-cta').getAttribute('href'))!).searchParams.get('text');

test('lógica de precios: pack-prices.ts, combo 15 % y onboarding cobrado', () => {
  const a = quote(['landing']);
  expect(a.setup).toBe(n(P('Emprende').setup)); expect(a.monthly).toBe(n(P('Emprende').monthly)); expect(a.combo).toBe(false);
  const b = quote(['pro', 'onboarding']);
  expect(b.setup).toBe(n(MARKETING_ONBOARDING_PRICE)); expect(b.monthly).toBe(n(P('Marketing Pro').monthly)); expect(b.combo).toBe(false);
  const c = quote(['sitio-pyme', 'pro', 'onboarding']);
  expect(c.combo).toBe(true); expect(c.setup).toBe(n(P('Pyme').setup) + n(MARKETING_ONBOARDING_PRICE));
  expect(c).not.toHaveProperty('onboardingFree');
  expect(c.monthly).toBe(Math.round((n(P('Pyme').monthly) + n(P('Marketing Pro').monthly)) * 0.85));
  const d = quote(['a-medida', 'meta-ads']);
  expect(d.from).toBe(true); expect(d.combo).toBe(true);
  expect(d.setup).toBe(n(P('Software a medida').setup));
  expect(d.monthly).toBe(Math.round((n(P('Software a medida').monthly) + n(P('Solo Ads').monthly)) * 0.85));
  expect(clp(1234567)).toBe('$1.234.567');
});

const next = (page: Page) => sec(page).getByRole('button', { name: 'Siguiente' }).click();
const stepTxt = (page: Page) => sec(page).locator('.atp-step');

test('flujo paso a paso: web + marketing, combo, onboarding y WhatsApp sin montos', async ({ page }) => {
  const errors = await open(page);
  await expect(stepTxt(page)).toHaveText('Paso 1 de 2');
  await expect(sec(page).getByRole('button', { name: 'Elige al menos una opción' })).toBeDisabled();
  await sec(page).getByLabel('Página web').check();
  await sec(page).getByLabel('Marketing', { exact: true }).check();
  await expect(stepTxt(page)).toHaveText('Paso 1 de 4');
  await next(page);
  await expect(sec(page).getByRole('heading', { name: 'Tu página web' })).toBeFocused();
  await sec(page).getByLabel('Sitio pyme').check();
  await expect(sec(page).locator('.atp-ask')).toHaveText('Pide tu cotización');
  await expect(sec(page)).not.toContainText('$');
  await next(page);
  await expect(stepTxt(page)).toHaveText('Paso 3 de 4');
  await sec(page).getByRole('radio', { name: 'Marketing Básico' }).check();
  await sec(page).getByRole('radio', { name: 'Marketing Pro' }).check();
  await expect(sec(page).getByRole('radio', { name: 'Marketing Básico' })).not.toBeChecked();
  await sec(page).getByLabel('Onboarding de marketing').check();
  const q = quote(['sitio-pyme', 'pro', 'onboarding']);
  expect(q.setup).toBe(n(P('Pyme').setup) + n(MARKETING_ONBOARDING_PRICE));
  await expect(sec(page).locator('.atp-combo')).toBeVisible();
  await expect(sec(page).locator('.atp-combo')).toContainText('15 %');
  // atrás conserva estado
  await sec(page).getByRole('button', { name: 'Atrás' }).click();
  await expect(sec(page).getByLabel('Sitio pyme')).toBeChecked();
  await next(page); await next(page);
  await expect(stepTxt(page)).toHaveText('Paso 4 de 4');
  await expect(sec(page).locator('.atp-detail')).toContainText('Onboarding de marketing');
  await expect(sec(page)).not.toContainText('$');
  await expect(sec(page)).not.toContainText(/gratis/i);
  await sec(page).getByLabel('Día').selectOption('Martes');
  await sec(page).getByLabel('Horario').selectOption('19:00 a 22:00');
  const text = await wa(page);
  const when = 'Martes, 19:00 a 22:00 (hora de Chile)';
  expect(text).toBe(quoteMessage(q, when));
  expect(text).toContain('Sitio pyme, Marketing Pro, Onboarding de marketing');
  expect(text).toContain('Aplica descuento combo 15 %');
  expect(text).not.toMatch(/\$/);
  expect(text).toContain('Martes, 19:00 a 22:00');
  const href = (await sec(page).locator('.atp-cta').getAttribute('href'))!;
  expect(href.startsWith('https://wa.me/56964710361?')).toBe(true);
  expect(href.match(/[?&]text=/g)?.length).toBe(1);
  await expect(sec(page).locator('a[href="/contacto"]')).toHaveCount(1);
  await expect(sec(page).locator('.atp-sum')).toContainText('va siempre aparte');
  // reiniciar
  await sec(page).getByRole('button', { name: 'Reiniciar' }).click();
  await expect(stepTxt(page)).toHaveText('Paso 1 de 2');
  expect(errors).toEqual([]);
});

test('escritorio y app, extras de seguridad y teclado', async ({ page }) => {
  await open(page);
  await sec(page).getByLabel('Software de escritorio').focus();
  await page.keyboard.press('Space');
  await expect(sec(page).getByLabel('Software de escritorio')).toBeChecked();
  await sec(page).getByLabel('App móvil').check();
  await sec(page).getByLabel('Seguridad').check();
  await next(page);
  await sec(page).getByLabel('App', { exact: true }).check();
  await next(page);
  await sec(page).getByLabel('Software a medida').check();
  await expect(sec(page).locator('.atp-list')).toContainText('Software a medida');
  await expect(sec(page).locator('.atp-ask')).toHaveText('Pide tu cotización');
  await expect(sec(page)).not.toContainText('$');
  const q = quote(['seguridad', 'app', 'a-medida']);
  expect(q.combo).toBe(false);
});

test('home: la franja de precios enlaza a Arma tu pack', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#precios a[href="/packs#arma-tu-pack"]')).toHaveCount(1);
});

test('móvil 390×844: sin overflow y resumen visible @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await open(page);
  await sec(page).getByLabel('Página web').check();
  await sec(page).getByLabel('Marketing', { exact: true }).check();
  await next(page);
  await sec(page).getByLabel('Landing').check();
  await next(page);
  await sec(page).getByRole('radio', { name: 'Marketing Básico' }).check();
  await expect(sec(page).locator('.atp-sum')).toBeInViewport();
  await expect(sec(page).locator('.atp-ask')).toHaveText('Pide tu cotización');
  await expect(sec(page)).not.toContainText('$');
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(m.sw).toBe(m.cw);
  expect(errors).toEqual([]);
});
