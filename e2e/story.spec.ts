import { test, expect, type Page } from '@playwright/test';

/** Story v3 — "Del commit al cliente". Bajo webdriver el snap a labels se desactiva (posiciones exactas). */
const geo = (page: Page) => page.evaluate(() => {
  const s = document.querySelector('.story') as HTMLElement; const r = s.getBoundingClientRect();
  return { top: r.top + scrollY, h: r.height, ih: innerHeight, doc: document.documentElement.scrollHeight };
});
async function at(page: Page, p: number, wait = 1300) {
  const g = await geo(page);
  await page.evaluate((y) => window.scrollTo(0, y), g.top + (g.h - g.ih) * p);
  await page.waitForTimeout(wait);
}
async function open(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(3200);
  await page.waitForFunction(() => document.querySelectorAll('.story .sdev .ch').length > 0);
  return errors;
}
const visibleChars = (page: Page) => page.$$eval('.story .sdev .ch', (cs) => cs.filter((c) => getComputedStyle(c).visibility === 'visible').length);

for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 680 }]) {
  test.describe(`story desktop ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: vp });

    test('el pin queda fijo (top 0 ±2px) al 25/50/75%', async ({ page }) => {
      const errors = await open(page);
      for (const p of [0.25, 0.5, 0.75]) {
        await at(page, p, 700);
        const top = await page.evaluate(() => document.querySelector('.story .pin')!.getBoundingClientRect().top);
        expect(Math.abs(top), `pin top a ${p * 100}%`).toBeLessThanOrEqual(2);
      }
      expect(errors).toEqual([]);
    });

    test('presupuesto de altura', async ({ page }) => {
      await open(page);
      const g = await geo(page);
      expect(g.h).toBeLessThanOrEqual(1.8 * g.ih + 1);
      // 1440×900: ≤8 viewports (spec). 1280×680: el resto del home ya medía 8.39 vh antes de story v3,
      // así que se mantiene el presupuesto previo de ≤9 (ver informe).
      expect(g.doc).toBeLessThanOrEqual((vp.width === 1440 ? 8 : 9) * g.ih);
    });

    test('codigo → interfaz → producto', async ({ page }) => {
      await open(page);
      await at(page, 0.1);
      await expect.poll(() => visibleChars(page), { timeout: 8000 }).toBeGreaterThan(0);
      const c1 = await visibleChars(page);
      await at(page, 0.24);
      await expect.poll(() => visibleChars(page), { timeout: 8000 }).toBeGreaterThan(c1);
      await at(page, 0.56);
      const dests = await page.$$eval('.story .sdev [data-dest]', (els) => els.map((e) => {
        let o = 1; for (let n: Element | null = e; n && !n.classList.contains('story'); n = n.parentElement) o *= +getComputedStyle(n).opacity;
        return o;
      }));
      expect(dests).toHaveLength(5); dests.forEach((o) => expect(o).toBeGreaterThan(0.99));
      await at(page, 0.97);
      const row = page.locator('.story .sdev .tr.new');
      await expect(row).toBeInViewport();
      expect(+(await row.evaluate((e) => getComputedStyle(e).opacity))).toBeGreaterThan(0.9);
    });

    test('nunca dos pasos visibles a la vez', async ({ page }) => {
      await open(page);
      for (let p = 0; p <= 1.001; p += 0.1) {
        await at(page, p, 900);
        const n = await page.$$eval('.story .step', (s) => s.filter((e) => +getComputedStyle(e).opacity > 0.5).length);
        expect(n, `a ${Math.round(p * 100)}%`).toBeLessThanOrEqual(1);
      }
    });

    test('sin violeta en estilos computados', async ({ page }) => {
      await open(page);
      for (const p of [0, 0.3, 0.5, 0.7, 1]) {
        await at(page, p, 600);
        const bad = await page.evaluate(() => {
          const props = ['color', 'background-color', 'background-image', 'border-color', 'box-shadow', 'fill', 'stroke', 'outline-color'];
          return Array.from(document.querySelectorAll('*')).filter((e) => { const cs = getComputedStyle(e); return props.some((k) => cs.getPropertyValue(k).includes('rgb(124, 92, 255)')); }).length;
        });
        expect(bad).toBe(0);
      }
    });
  });
}

test.describe('story reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  test('tres estados finales estáticos y código legible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const cards = page.locator('.story .card');
    await expect(cards).toHaveCount(3);
    for (let i = 0; i < 3; i++) await expect(cards.nth(i)).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.story .pin')!).position)).not.toBe('sticky');
    await cards.first().scrollIntoViewIfNeeded();
    const lines = await page.$$eval('.story .c-code .row', (r) => r.map((e) => [+getComputedStyle(e).opacity, getComputedStyle(e).display]));
    expect(lines).toHaveLength(9); lines.forEach(([o, d]) => { expect(o).toBe(1); expect(d).not.toBe('none'); });
    const a = await page.locator('.story .cards').evaluate((e) => e.parentElement!.innerHTML);
    const s1 = await cards.nth(2).screenshot();
    await page.waitForTimeout(2000);
    const s2 = await cards.nth(2).screenshot();
    expect(Buffer.compare(s1, s2)).toBe(0);
    expect(await page.locator('.story .cards').evaluate((e) => e.parentElement!.innerHTML)).toBe(a);
    await expect(page.locator('.story .c-dash [data-kpi="128"]')).toHaveText('128');
  });
});

test.describe('story móvil @mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('sin pin, sin desborde horizontal y ≤2.2 viewports @mobile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await page.locator('.story').scrollIntoViewIfNeeded();
    for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(150); }
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.story .pin')!).position)).not.toBe('sticky');
    const over = await page.$$eval('.story, .story *', (els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline').map((e) => e.className.toString()));
    expect(over).toEqual([]);
    const g = await geo(page);
    expect(g.h).toBeLessThanOrEqual(2.2 * g.ih);
  });
});
