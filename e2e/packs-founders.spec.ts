import { expect, test, type Page } from '@playwright/test';

/**
 * Caja "Clientes Fundadores" en /packs: debe quedar DEBAJO de las tarjetas, sin tapar
 * ninguna tarjeta ni sus botones ("Elegir pack" / "Conversemos"). Regresión: la entrada
 * GSAP de las tarjetas (from y:50) competía con la transición CSS de transform de .pack
 * y las dejaba fijas 50 px abajo, encima de .founders.
 * También revisa que en la franja de precios del home ningún precio tape el CTA.
 */
type R = { l: number; t: number; r: number; b: number; name: string };

async function settle(page: Page) {
  await expect(page.locator('.pre')).toHaveCount(0, { timeout: 8000 });
}

/** Baja por toda la página (dispara los ScrollTrigger con Lenis) y espera a que terminen las entradas. */
async function scrollThrough(page: Page) {
  for (let i = 0; i < 14; i++) { await page.mouse.wheel(0, 500); await page.waitForTimeout(60); }
  await page.waitForTimeout(2200);
}

const rects = (page: Page, sel: string) => page.locator(sel).evaluateAll((els) => els.map((e, i) => {
  const b = e.getBoundingClientRect();
  return { l: b.left, t: b.top + scrollY, r: b.right, b: b.bottom + scrollY, name: `${e.className || e.tagName}#${i}` };
}));
const hit = (a: R, b: R) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

async function checkPacks(page: Page) {
  await page.goto('/packs#solo-software');
  await settle(page);
  await scrollThrough(page);
  const [founders] = await rects(page, '#packs .founders');
  expect(founders, '.founders existe en /packs').toBeTruthy();
  const cards = await rects(page, '#packs .pack');
  const ctas = await rects(page, '#packs .pack .btn');
  expect(cards.length).toBeGreaterThanOrEqual(5);
  expect(ctas.length).toBe(cards.length);
  const overlaps = [...cards, ...ctas].filter((c) => hit(founders, c)).map((c) => c.name);
  expect(overlaps, 'Fundadores no se cruza con tarjetas ni botones').toEqual([]);
  // espacio propio: al menos 24 px bajo la tarjeta más baja
  const lowest = Math.max(...cards.map((c) => c.b));
  expect(founders.t - lowest).toBeGreaterThanOrEqual(24);
  // las tarjetas terminan su entrada en su sitio (sin transform residual)
  const residual = await page.locator('#packs .pack').evaluateAll((els) => els.map((e) => getComputedStyle(e).transform).filter((t) => t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)'));
  expect(residual).toEqual([]);
}

for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 680 }]) {
  test(`/packs: Fundadores debajo de las tarjetas a ${vp.width}×${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await checkPacks(page);
  });
}

test('/packs: Fundadores debajo de las tarjetas a 390×844 @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await checkPacks(page);
});

test('home: la franja de precios no tapa su CTA', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  await page.locator('#precios').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  const items = await rects(page, '#precios .strip-p > li');
  const [cta] = await rects(page, '#precios .strip-cta');
  expect(items.length).toBeGreaterThan(0);
  expect(items.filter((i) => hit(i, cta)).map((i) => i.name)).toEqual([]);
});
