import { test, expect } from '@playwright/test';

/** Premium v2: las 11 páginas en 390 y 1440 px. */
const PAGES = ['/', '/servicios', '/proyectos', '/proyectos/rg-motors-chile', '/proyectos/salgado-automotriz', '/proyectos/frio-austral', '/proyectos/unidades-chile', '/proyectos/suertu2s', '/packs', '/nosotros', '/contacto'];
const BANNED = /por confirmar|—\.|\[|lorem|google ads/i;

for (const width of [390, 1440]) {
  test.describe(`premium ${width}px`, () => {
    test.use({ viewport: { width, height: width === 390 ? 844 : 900 } });
    for (const url of PAGES) {
      test(`${url}`, async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
        await page.goto(url, { waitUntil: 'load' });
        await page.waitForTimeout(1500);
        const text = await page.locator('body').innerText();
        expect(text, 'texto prohibido').not.toMatch(BANNED);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'overflow').toBe(true);
        // H1 y CTAs del primer pantallazo no quedan tapados por cookies ni WhatsApp
        const covered = await page.evaluate(() => {
          const els = [document.querySelector('h1'), ...document.querySelectorAll('.btn')].filter(Boolean) as HTMLElement[];
          return els.filter((el) => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.bottom <= 0 || r.top >= innerHeight) return false;
            const x = r.left + r.width / 2, y = Math.min(r.top + r.height / 2, innerHeight - 1);
            const hit = document.elementFromPoint(x, y);
            return !!hit && !!hit.closest('.cookie, .wa-float');
          }).map((el) => el.textContent?.slice(0, 40));
        });
        expect(covered).toEqual([]);
        expect(errors).toEqual([]);
      });
    }
  });
}

test('sitemap incluye los 5 casos', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const s of ['frio-austral', 'suertu2s', 'unidades-chile', 'rg-motors-chile', 'salgado-automotriz']) expect(xml).toContain(`/proyectos/${s}`);
});
test('OG por caso', async ({ request }) => {
  const r = await request.get('/proyectos/suertu2s/opengraph-image');
  expect(r.status()).toBe(200);
  expect(r.headers()['content-type']).toContain('image/png');
});
