import { expect, test, type Page } from '@playwright/test';

/**
 * Home v2 "metal líquido": canvas, cursor nativo (sin seguidor), paleta sin violeta, reduced motion,
 * presupuesto de largo y enlaces internos. Corre a 1440×900 (desktop) y 390×844 (@mobile).
 */
const PURPLE = ['124, 92, 255', '120, 86, 255'];

async function settle(page: Page) {
  await expect(page.locator('.pre')).toHaveCount(0, { timeout: 8000 });
}

/** Recorre todos los estilos computados que pueden llevar color. */
async function purpleHits(page: Page) {
  return page.evaluate((purple) => {
    const props = ['color', 'background-color', 'background-image', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color', 'box-shadow', 'outline-color', 'fill', 'stroke', 'text-shadow', 'filter'];
    const hits: string[] = [];
    for (const el of [document.documentElement, ...document.querySelectorAll('*')]) {
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, pseudo);
        for (const p of props) {
          const v = cs.getPropertyValue(p);
          if (purple.some((c) => v.includes(c))) hits.push(`${el.tagName}.${(el as HTMLElement).className}${pseudo ?? ''} ${p}: ${v}`);
        }
      }
    }
    return hits.slice(0, 10);
  }, PURPLE);
}

/** Proporción largo/alto y secciones (excepto hero e historia) ≤ 1.4 vh. */
async function lengths(page: Page) {
  for (let i = 0; i < 25; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(40); }
  await page.waitForTimeout(600);
  return page.evaluate(() => {
    const vh = innerHeight;
    const page = [...document.querySelectorAll<HTMLElement>('main .page')].find((p) => p.offsetParent !== null) || document.querySelector('main')!;
    const secs = [...page.querySelectorAll<HTMLElement>(':scope > section, :scope > div > section')];
    return {
      ratio: document.documentElement.scrollHeight / vh,
      tall: secs.filter((s) => !s.classList.contains('hero') && !s.classList.contains('story')).map((s) => ({ id: s.id, vh: s.getBoundingClientRect().height / vh })).filter((s) => s.vh > 1.4),
    };
  });
}

function collectErrors(page: Page) {
  const errs: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(String(e)));
  return errs;
}

test.describe('Home v2 · desktop 1440×900', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('canvas, sin errores de consola, sin cursor personalizado en el hero y sin violeta', async ({ page }) => {
    const errs = collectErrors(page);
    await page.goto('/');
    await settle(page);
    await expect(page.locator('.hero canvas')).toHaveCount(1, { timeout: 15000 });
    await expect(page.locator('.hero canvas')).toHaveAttribute('aria-hidden', 'true');
    await page.mouse.move(700, 300); await page.mouse.move(720, 320);
    // cursor nativo: no existe ningún seguidor (punto/anillo) en el DOM
    expect(await page.evaluate(() => document.querySelectorAll('.cursor, .cursor-ring, .cursor-dot').length)).toBe(0);
    expect(await purpleHits(page)).toEqual([]);
    expect(errs).toEqual([]);
  });

  test('largo del home ≤ 8× (1440×900) y ≤ 9× (1280×680); secciones ≤ 1.4vh', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    const a = await lengths(page);
    expect(a.ratio).toBeLessThanOrEqual(8);
    expect(a.tall).toEqual([]);
    await page.setViewportSize({ width: 1280, height: 680 });
    await page.goto('/');
    await settle(page);
    const b = await lengths(page);
    expect(b.ratio).toBeLessThanOrEqual(9);
    expect(b.tall).toEqual([]);
  });

  test('viewport bajo (680px): ≥32px entre el wordmark 3D y .status', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 680 });
    await page.goto('/?gl=mid');
    await settle(page);
    await page.waitForFunction(() => !!(window as unknown as { __liq?: { engine: unknown } }).__liq?.engine, null, { timeout: 15000 });
    await page.waitForTimeout(800);
    const gap = await page.evaluate(() => {
      const st = (window as unknown as { __liq: { fr: { scale: number; posY: number }; engine: { bounds: { minY: number } } } }).__liq;
      const h = innerHeight, ppw = h / (2 * 13 * Math.tan((20 * Math.PI) / 180));
      const bottom = h / 2 - (st.fr.posY + st.fr.scale * st.engine.bounds.minY) * ppw;
      const hero = document.querySelector('.hero')!.getBoundingClientRect().top;
      const b = st.engine.bounds as unknown as { minX: number; maxX: number };
      return { gap: document.querySelector('.hero .status')!.getBoundingClientRect().top - hero - bottom, center: (b.minX + b.maxX) / 2 };
    });
    expect(gap.gap).toBeGreaterThanOrEqual(32);
    expect(Math.abs(gap.center)).toBeLessThan(0.6); // el wordmark muestreado está centrado
  });

  test('sin seguidor visual, la interacción con las partículas sigue activa (empuje/onda)', async ({ page }) => {
    await page.goto('/?gl=mid');
    await settle(page);
    await page.waitForFunction(() => !!(window as unknown as { __liq?: { engine: unknown } }).__liq?.engine, null, { timeout: 15000 });
    for (let i = 0; i < 12; i++) await page.mouse.move(500 + i * 25, 260 + (i % 3) * 10);
    await expect.poll(() => page.evaluate(() => (window as unknown as { __liq: { cursor: number } }).__liq.cursor), { timeout: 8000 }).toBeGreaterThan(0.5);
    expect(await page.evaluate(() => document.querySelectorAll('.cursor, .cursor-ring, .cursor-dot').length)).toBe(0);
  });

  test('/packs responde 200 y NAV "Packs" lleva a /packs', async ({ page, request }) => {
    expect((await request.get('/packs')).status()).toBe(200);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Packs', exact: true })).toHaveAttribute('href', '/packs');
  });

  test('enlaces internos sin 404 (rastreo de todas las páginas)', async ({ page, request }) => {
    test.setTimeout(120_000);
    const seen = new Set<string>(), queue = ['/'], bad: string[] = [];
    while (queue.length) {
      const url = queue.shift()!;
      if (seen.has(url)) continue;
      seen.add(url);
      const r = await request.get(url);
      if (r.status() >= 400) { bad.push(`${url} → ${r.status()}`); continue; }
      if (!(r.headers()['content-type'] || '').includes('text/html')) continue;
      await page.goto(url);
      const hrefs = await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')!));
      for (const h of hrefs) { const clean = h.split('#')[0] || '/'; if (!seen.has(clean)) queue.push(clean); }
    }
    expect(seen.size).toBeGreaterThan(5);
    expect(bad).toEqual([]);
  });
});

test.describe('Home v2 · reduced motion', () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  test('un solo frame estático del texto cromado (sin cambios en 2s)', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.hero canvas');
    await expect(canvas).toHaveCount(1, { timeout: 15000 });
    await page.waitForTimeout(3500);
    const a = await canvas.screenshot();
    await page.waitForTimeout(2000);
    const b = await canvas.screenshot();
    expect(Buffer.compare(a, b)).toBe(0);
  });
});

test.describe('Home v2 · móvil 390×844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('canvas, sin seguidor de cursor, sin errores ni violeta @mobile', async ({ page }) => {
    const errs = collectErrors(page);
    await page.goto('/');
    await settle(page);
    await expect(page.locator('.hero canvas')).toHaveCount(1, { timeout: 20000 });
    expect(await page.evaluate(() => document.querySelectorAll('.cursor, .cursor-ring, .cursor-dot').length)).toBe(0);
    expect(await purpleHits(page)).toEqual([]);
    expect(errs).toEqual([]);
  });

  test('largo del home ≤ 11× y secciones ≤ 1.4vh @mobile', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    const r = await lengths(page);
    expect(r.ratio).toBeLessThanOrEqual(11);
    expect(r.tall).toEqual([]);
  });
});
