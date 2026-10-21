import { expect, test } from '@playwright/test';
import { detectOverlaps, type Hit } from './overlap-lib';

/** Ningún texto se pisa con otro ni desborda en horizontal en celulares de 360 y 390 px. */
const PAGES = ['/', '/servicios', '/packs', '/proyectos', '/nosotros', '/contacto',
  '/proyectos/rg-motors-chile', '/proyectos/salgado-automotriz', '/proyectos/frio-austral', '/proyectos/unidades-chile', '/proyectos/suertu2s'];
const run = (fn: () => Hit[]) => `var __name=(f)=>f;(${fn.toString()})()`;

for (const width of [360, 390]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 740 } });
    test.describe.configure({ timeout: 90_000 });
    for (const path of PAGES) {
      test(`${path} sin solapes ni desborde @mobile`, async ({ page }) => {
        await page.goto(path, { waitUntil: 'load' });
        await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } scrollTo(0, 0); });
        await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
        await page.waitForTimeout(2000);
        const hits = (await page.evaluate(run(detectOverlaps))) as Hit[];
        expect(hits, JSON.stringify(hits, null, 1)).toEqual([]);
      });
    }
    test(`menú abierto sin solapes @mobile`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'load' });
      await page.locator('.menu-btn').click();
      await page.waitForTimeout(2000);
      expect((await page.evaluate(run(detectOverlaps))) as Hit[]).toEqual([]);
    });
    test(`el logotipo 3D queda bajo el header y sobre el titular @mobile`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'load' });
      const r = await page.evaluate(() => {
        const st = document.querySelector('.hero .status')!.getBoundingClientRect();
        const nav = document.querySelector('header, .nav')!.getBoundingClientRect();
        const pad = parseFloat(getComputedStyle(document.querySelector('.hero .hx')!).paddingTop);
        return { status: st.top, navBottom: nav.bottom, pad };
      });
      // franja reservada para el logo: ≥ 30 % del ancho entre el header y `.status`
      expect(r.status - r.navBottom).toBeGreaterThan(width * 0.3);
    });
  });
}
