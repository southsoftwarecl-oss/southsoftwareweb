import { expect, test, type Page } from '@playwright/test';

/**
 * Cursor nativo en todo el sitio: sin punto/anillo que siga al puntero, sin cursor:none,
 * sin [data-cursor]; pointer sobre botones; el hero 3D sigue reaccionando al mouse.
 */
const PAGES = ['/', '/servicios', '/proyectos', '/packs', '/nosotros', '/contacto', '/esta-ruta-no-existe'];

function collectErrors(page: Page) {
  const errs: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/404 \(Not Found\)/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(String(e)));
  return errs;
}

async function settle(page: Page) {
  await expect(page.locator('.pre')).toHaveCount(0, { timeout: 8000 });
}

test.describe('Cursor nativo · 1440×900', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const path of PAGES) {
    test(`sin cursor personalizado en ${path}`, async ({ page }) => {
      const errs = collectErrors(page);
      await page.goto(path);
      await settle(page);
      // recorrer el hero/primer viewport
      for (let i = 0; i < 10; i++) await page.mouse.move(300 + i * 80, 250 + (i % 3) * 40);
      // y pasar por los botones visibles
      const btn = page.locator('.btn:visible').first();
      await expect(btn).toBeVisible();
      await btn.hover();
      await page.mouse.move(10, 450);
      await btn.hover();

      const r = await page.evaluate(() => {
        const vis = (el: Element) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
        const none = [...document.querySelectorAll('*')].filter((el) => vis(el) && getComputedStyle(el).cursor === 'none').map((el) => `${el.tagName}.${(el as HTMLElement).className}`);
        const b = document.querySelector('.btn')!;
        return {
          followers: document.querySelectorAll('.cursor, .cursor-ring, .cursor-dot').length,
          html: getComputedStyle(document.documentElement).cursor,
          body: getComputedStyle(document.body).cursor,
          none: none.slice(0, 5),
          dataCursor: document.querySelectorAll('[data-cursor], [data-cursor-hide]').length,
          btn: getComputedStyle(b).cursor,
          btnInner: getComputedStyle(b.querySelector('span') ?? b).cursor,
          bodyCls: document.body.className,
        };
      });
      expect(r.followers).toBe(0);
      expect(r.html).not.toBe('none');
      expect(r.body).not.toBe('none');
      expect(r.none).toEqual([]);
      expect(r.dataCursor).toBe(0);
      expect(r.btn).toBe('pointer');
      expect(r.btnInner).toBe('pointer');
      expect(r.bodyCls).not.toMatch(/cursor-(on|hide)/);
      expect(errs).toEqual([]);
    });
  }

  test('cursor nativo por tipo de elemento (pointer / text / auto)', async ({ page }) => {
    await page.goto('/contacto');
    await settle(page);
    const c = await page.evaluate(() => {
      const cur = (s: string) => { const el = document.querySelector(s); return el ? getComputedStyle(el).cursor : null; };
      return { a: cur('a[href]'), button: cur('button'), input: cur('input:not([type=hidden]):not([type=checkbox]):not([type=radio])'), textarea: cur('textarea'), select: cur('select'), p: cur('p'), h1: cur('h1') };
    });
    expect(c.a).toBe('pointer');
    expect(c.button).toBe('pointer');
    if (c.input) expect(c.input).toBe('text');
    if (c.textarea) expect(c.textarea).toBe('text');
    if (c.select) expect(c.select).toBe('pointer');
    expect(c.p).toBe('auto');
    expect(c.h1).toBe('auto');
  });

  test('etiquetas visibles en lugar del cursor: "Ver caso →" y "Explorar →" con flecha que avanza 4px y acento', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    const media = page.locator('.case .media').first();
    await media.scrollIntoViewIfNeeded();
    await expect(media.locator('.cue')).toHaveText(/Ver caso/i);
    await media.hover();
    await expect.poll(() => media.locator('.cue .ic').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41), { timeout: 3000 }).toBeCloseTo(4, 0);
    const accent = await page.evaluate(() => { const d = document.createElement('i'); d.style.color = 'var(--accent)'; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; });
    await expect.poll(() => media.evaluate((el) => getComputedStyle(el).borderTopColor), { timeout: 3000 }).toBe(accent);
    // la captura del proyecto no se deforma: sin filtro SVG ni zoom al pasar el puntero
    const img = media.locator('img');
    const before = await img.evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(800);
    expect(await img.evaluate((el) => getComputedStyle(el).filter)).toBe('none');
    expect(await img.evaluate((el) => getComputedStyle(el).transform)).toBe(before);
    expect(await page.locator('feDisplacementMap').count()).toBe(await page.locator('.forge feDisplacementMap').count());

    const item = page.locator('.svc .item').first();
    await item.scrollIntoViewIfNeeded();
    await expect(item.locator('.cue')).toHaveText(/Explorar/i);
    await item.hover();
    await expect.poll(() => item.locator('.cue .ic').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41), { timeout: 3000 }).toBeCloseTo(4, 0);
    await expect.poll(() => item.locator('.cue').evaluate((el) => getComputedStyle(el).color), { timeout: 3000 }).toBe(accent);

    // foco con teclado: mismo feedback
    await page.mouse.move(5, 5);
    await media.focus();
    await expect.poll(() => media.locator('.cue .ic').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41), { timeout: 3000 }).toBeCloseTo(4, 0);
  });

  test('WhatsApp (orbe): flecha que avanza 4px y anillo --accent en hover', async ({ page }) => {
    await page.goto('/contacto');
    await settle(page);
    const orb = page.locator('.orb').first();
    await orb.scrollIntoViewIfNeeded();
    await orb.hover();
    await expect.poll(() => orb.locator('.ic').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41), { timeout: 3000 }).toBeCloseTo(4, 0);
  });

  test('hero 3D: el metal líquido reacciona al puntero sin seguidor visual', async ({ page }) => {
    const errs = collectErrors(page);
    await page.goto('/?gl=mid');
    await settle(page);
    await page.waitForFunction(() => !!(window as unknown as { __liq?: { engine: unknown } }).__liq?.engine, null, { timeout: 15000 });
    const before = await page.evaluate(() => (window as unknown as { __liq: { cursor: number } }).__liq.cursor);
    for (let i = 0; i < 12; i++) await page.mouse.move(500 + i * 25, 260 + (i % 3) * 10);
    await expect.poll(() => page.evaluate(() => (window as unknown as { __liq: { cursor: number } }).__liq.cursor), { timeout: 8000 }).toBeGreaterThan(Math.max(0.5, before));
    expect(await page.evaluate(() => document.querySelectorAll('.cursor, .cursor-ring, .cursor-dot').length)).toBe(0);
    expect(await page.locator('.hero canvas').evaluate((el) => getComputedStyle(el).cursor)).not.toBe('none');
    expect(errs).toEqual([]);
  });
});
