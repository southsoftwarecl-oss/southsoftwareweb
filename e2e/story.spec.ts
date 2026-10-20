import { test, expect, type Page } from '@playwright/test';

/** Story v3 — "Del commit al cliente". Bajo webdriver el snap a labels se desactiva (posiciones exactas). */
const geo = (page: Page) => page.evaluate(() => {
  const s = document.querySelector('.story') as HTMLElement; const r = s.getBoundingClientRect();
  return { top: r.top + scrollY, h: r.height, ih: innerHeight, doc: document.documentElement.scrollHeight };
});
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

    test('sin pin: altura normal, sin scroll extra', async ({ page }) => {
      const errors = await open(page);
      const g = await geo(page);
      expect(await page.evaluate(() => getComputedStyle(document.querySelector('.story .pin')!).position)).not.toBe('sticky');
      expect(g.h).toBeLessThanOrEqual(Math.max(g.ih, 860) + 1);
      expect(g.doc).toBeLessThanOrEqual((vp.width === 1440 ? 8 : 9) * g.ih);
      expect(errors).toEqual([]);
    });

    test('avanza solo por tiempo (sin scroll): codigo → interfaz → producto y vuelve', async ({ page }) => {
      test.setTimeout(90000);
      await open(page);
      await page.locator('.story').evaluate((e) => e.scrollIntoView({ block: 'center' }));
      const y = await page.evaluate(() => scrollY);
      const cur = () => page.$eval('.story .sprog [aria-current="step"]', (e) => e.getAttribute('data-go'));
      await expect.poll(() => visibleChars(page), { timeout: 9000 }).toBeGreaterThan(0);
      const c1 = await visibleChars(page);
      await expect.poll(() => visibleChars(page), { timeout: 9000 }).toBeGreaterThan(c1);
      await expect.poll(cur, { timeout: 12000 }).toBe('1');
      await expect.poll(cur, { timeout: 12000 }).toBe('2');
      await expect.poll(cur, { timeout: 15000 }).toBe('0');
      expect(await page.evaluate(() => scrollY)).toBe(y);
    });

    test('clic en pestaña salta a la etapa y nunca dos pasos visibles', async ({ page }) => {
      await open(page);
      await page.locator('.story').evaluate((e) => e.scrollIntoView({ block: 'center' }));
      await page.click('.story .sprog [data-go="2"]');
      await page.waitForTimeout(1500);
      await expect(page.locator('.story .sprog [data-go="2"]')).toHaveAttribute('aria-current', 'step');
      expect(+(await page.locator('.story .sdev .tr.new').evaluate((e) => getComputedStyle(e).opacity))).toBeGreaterThan(0.5);
      await page.click('.story .sprog [data-go="1"]');
      await page.waitForTimeout(2500);
      const dests = await page.$$eval('.story .sdev [data-dest]', (els) => els.map((e) => {
        let o = 1; for (let n: Element | null = e; n && !n.classList.contains('story'); n = n.parentElement) o *= +getComputedStyle(n).opacity;
        return o;
      }));
      expect(dests).toHaveLength(5); dests.forEach((o) => expect(o).toBeGreaterThan(0.99));
      for (let i = 0; i < 6; i++) {
        const n = await page.$$eval('.story .step', (s) => s.filter((e) => +getComputedStyle(e).opacity > 0.5).length);
        expect(n).toBeLessThanOrEqual(1); await page.waitForTimeout(600);
      }
    });

    test('se pausa fuera de pantalla', async ({ page }) => {
      await open(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1500);
      expect(await visibleChars(page)).toBe(0);
    });

    test('sin violeta en estilos computados', async ({ page }) => {
      await open(page);
      await page.locator('.story').evaluate((e) => e.scrollIntoView({ block: 'center' }));
      for (let p = 0; p < 5; p++) {
        await page.waitForTimeout(3000);
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
