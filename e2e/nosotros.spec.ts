import { test, expect, type Page } from '@playwright/test';

/** /nosotros — "Forjado en el sur" (5 actos). */
const WHY_TITLES = ['Todo queda a tu nombre', 'Precio publicado', 'Sin permanencia', 'Trato directo', 'Seguridad desde el día uno', 'Hablas con quien programa'];
const MANIFESTO = 'Creemos que cualquier pyme, esté donde esté, merece la misma calidad técnica que una gran empresa. Por eso publicamos nuestros precios, dejamos todo a tu nombre y te atiende quien programa.';

async function open(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const res = await page.goto('/nosotros', { waitUntil: 'load' });
  expect(res?.status()).toBe(200);
  await page.waitForTimeout(2500);
  return errors;
}
/** Recorre la página entera (dispara todas las entradas) y vuelve arriba. */
async function sweep(page: Page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 450) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(90); }
  await page.waitForTimeout(800);
}
const noHOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const noViolet = (page: Page) => page.evaluate(() => {
  const props = ['color', 'background-color', 'background-image', 'border-color', 'box-shadow', 'fill', 'stroke', 'outline-color'];
  return Array.from(document.querySelectorAll('*')).filter((e) => { const cs = getComputedStyle(e); return props.some((k) => cs.getPropertyValue(k).includes('rgb(124, 92, 255)')); }).length;
});

test('HTML inicial (sin JS): h1, manifiesto completo y los 6 principios', async ({ request }) => {
  const html = await (await request.get('/nosotros')).text();
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;|\u00a0/g, ' ').replace(/\s+/g, ' ');
  expect(text).toContain('Software hecho en el sur.');
  expect(text).toContain(MANIFESTO);
  for (const t of WHY_TITLES) expect(text).toContain(t);
  expect((html.match(/<h1[\s>]/g) || []).length).toBe(1);
  // premium-v2: sin mapa (decisión de Mathias)
  expect(html).not.toContain('class="cmap');
  // Decisión de Mathias: sin ciudad, región ni coordenadas en el contenido de /nosotros
  const forge = html.slice(html.indexOf('class="forge"'), html.indexOf('<footer'));
  expect(forge.length).toBeGreaterThan(1000);
  expect(forge).not.toMatch(/puerto montt|los lagos|reloncav|\d+°\d+′/i);
});

for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 680 }]) {
  test.describe(`nosotros desktop ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: vp });

    test('200, sin errores, presupuesto de altura y sin desborde', async ({ page }) => {
      const errors = await open(page);
      await sweep(page);
      const r = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: innerHeight }));
      expect(r.sh, `scrollHeight ${r.sh} vs ${7.6 * r.ih}`).toBeLessThanOrEqual(7.6 * r.ih);
      expect(await noHOverflow(page)).toBe(true);
      expect(await noViolet(page)).toBe(0);
      expect(errors).toEqual([]);
    });

    test('pin del manifiesto: top 0 ±2px al 25/50/75% y todas las palabras a opacity 1 al final', async ({ page }) => {
      await open(page);
      await page.waitForFunction(() => document.querySelectorAll('.mf .mw').length > 20);
      const g = await page.evaluate(() => { const s = document.querySelector('.mf') as HTMLElement; const r = s.getBoundingClientRect(); return { top: r.top + scrollY, h: r.height, ih: innerHeight }; });
      expect(g.h).toBeGreaterThan(g.ih * 1.2);
      expect(g.h - g.ih).toBeLessThanOrEqual(1.2 * g.ih + 1);
      for (const p of [0.25, 0.5, 0.75]) {
        await page.evaluate((y) => window.scrollTo(0, y), g.top + (g.h - g.ih) * p);
        await page.waitForTimeout(700);
        const top = await page.evaluate(() => document.querySelector('.mf .mf-pin')!.getBoundingClientRect().top);
        expect(Math.abs(top), `pin top a ${p * 100}%`).toBeLessThanOrEqual(2);
      }
      await page.evaluate((y) => window.scrollTo(0, y), g.top + g.h);
      await page.waitForTimeout(1500);
      const ops = await page.$$eval('.mf .mw', (ws) => ws.map((w) => +getComputedStyle(w).opacity));
      ops.forEach((o) => expect(o).toBeGreaterThan(0.99));
      // frases clave cromadas al completarse
      const chromed = await page.$$eval('.mf .kw', (ws) => ws.filter((w) => w.classList.contains('on')).length);
      expect(chromed).toBe(await page.locator('.mf .kw').count());
    });

    test('confianza: 6 tarjetas planas con número y descripción visibles', async ({ page }) => {
      await open(page);
      await page.locator('#principios').scrollIntoViewIfNeeded();
      await expect(page.locator('.trust-c')).toHaveCount(6);
      await expect(page.locator('.trust-c p').first()).toBeVisible();
    });

    test('sin marcadores: no hay texto [..] ni "Espacio reservado"; equipo = tarjeta de Mathias', async ({ page }) => {
      await open(page);
      await sweep(page);
      const body = await page.locator('body').innerText();
      expect(body).not.toMatch(/\[[^\]]*\]/);
      expect(body).not.toContain('Espacio reservado');
      expect(body).not.toMatch(/por completar/i);
      // equipo: dos tarjetas reales (Mathias y Ramón), con monograma y sin silueta ni marcadores
      await expect(page.locator('#equipo .tm')).toHaveCount(2);
      await expect(page.locator('#equipo .team.duo')).toHaveCount(1);
      const card = page.locator('#equipo .tm-card').nth(0);
      await expect(card).toBeVisible();
      await expect(card.locator('.tm-name')).toHaveText('Mathias Jara');
      await expect(card.locator('.tm-role')).toHaveText('Fundador');
      await expect(card.locator('.tm-bio')).toContainText('Diseña y desarrolla cada proyecto de South Software.');
      await expect(card.locator('.tm-mono2')).toHaveText('MJ');
      const card2 = page.locator('#equipo .tm-card').nth(1);
      await expect(card2).toBeVisible();
      await expect(card2.locator('.tm-name')).toHaveText('Ramón Ojeda');
      await expect(card2.locator('.tm-role')).toHaveText('Experto en marketing');
      await expect(card2.locator('.tm-bio')).toContainText('Lidera la marca, las redes sociales y las campañas');
      await expect(card2.locator('.tm-mono2')).toHaveText('RO');
      await expect(page.locator('.tm-sil, .tm-res, .tm-pill')).toHaveCount(0);
    });

    test('hora local en vivo (America/Santiago)', async ({ page }) => {
      await open(page);
      const t1 = await page.locator('.fhero .lc-t').textContent();
      expect(t1).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      await page.waitForTimeout(1300);
      expect(await page.locator('.fhero .lc-t').textContent()).not.toBe(t1);
    });
  });
}

test.describe('nosotros sin seguidor de cursor', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('no hay .cursor ni .cursor-ring', async ({ page }) => {
    await open(page);
    await page.mouse.move(400, 400); await page.mouse.move(700, 500);
    await page.waitForTimeout(300);
    expect(await page.locator('.cursor, .cursor-ring').count()).toBe(0);
  });
});

test.describe('nosotros reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  test('sin pin ni timelines GSAP activos; todo el texto visible', async ({ page }) => {
    const errors = await open(page);
    await page.waitForFunction(() => typeof (window as Window & { __nosTweens?: () => number }).__nosTweens === 'function');
    await sweep(page);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.mf .mf-pin')!).position)).not.toBe('sticky');
    expect(await page.evaluate(() => (window as Window & { __nosTweens?: () => number }).__nosTweens!())).toBe(0);
    for (const sel of ['.fh-title', '.mf-text', '.trust-c p', '.trust-c h3', '.tm-name', '.tm-bio', '.stp-t']) {
      const ops = await page.$$eval(sel, (els) => els.map((e) => { let o = 1; for (let n: Element | null = e; n; n = n.parentElement) o *= +getComputedStyle(n).opacity; return o; }));
      expect(ops.length, sel).toBeGreaterThan(0);
      ops.forEach((o) => expect(o, sel).toBe(1));
    }
    // frases clave cromadas estáticas
    expect(await page.$eval('.mf .kp', (e) => getComputedStyle(e).backgroundClip)).toContain('text');
    // la hora sigue actualizándose
    expect(await page.locator('.lc-t').first().textContent()).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(errors).toEqual([]);
  });
});

test.describe('nosotros móvil @mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('200, sin errores, ≤ 8 viewports, sin desborde, sin pin y mapa ≤ 20 trazos @mobile', async ({ page }) => {
    const errors = await open(page);
    await sweep(page);
    const r = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: innerHeight }));
    expect(r.sh, `scrollHeight ${r.sh} vs ${11 * r.ih}`).toBeLessThanOrEqual(11 * r.ih);
    expect(await noHOverflow(page)).toBe(true);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.mf .mf-pin')!).position)).not.toBe('sticky');
    expect(await page.locator('.cmap').count()).toBe(0);
    expect(await noViolet(page)).toBe(0);
    expect(errors).toEqual([]);
  });

  test('tarjetas de confianza visibles en móvil @mobile', async ({ page }) => {
    await open(page);
    await page.locator('#principios').scrollIntoViewIfNeeded();
    await expect(page.locator('.trust-c').first().locator('p')).toBeVisible();
  });
});
