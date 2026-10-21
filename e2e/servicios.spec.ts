import { expect, test, type Page } from '@playwright/test';
import { MARKETING_SERVICES, PACKS, SERVICES, STACK } from '../src/content/site';
import { NEEDS, SIZES, packFor } from '../src/content/servicios';

/**
 * /servicios "vivos": selector con demos, configurador "Arma tu proyecto", proceso y stack interactivos.
 * Alturas: ≤ 7,5 × innerHeight en escritorio y ≤ 10 × en móvil (incluye la sección de marketing digital). Precios EXACTOS de PACKS.
 */
async function open(page: Page, url = '/servicios', errors?: string[]) {
  if (errors) {
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
  }
  const res = await page.goto(url);
  // preloader terminado (con reduced motion queda en display:none)
  await page.waitForFunction(() => { const p = document.querySelector('.pre'); return !p || getComputedStyle(p).display === 'none'; }, null, { timeout: 8000 });
  await page.waitForTimeout(400);
  return res;
}
const visiblePanel = (page: Page) => page.locator('.sv-panel:not([hidden])');

for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 680 }]) {
  test(`altura, 200 y sin errores ${vp.width}×${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    const errors: string[] = [];
    const res = await open(page, '/servicios', errors);
    expect(res?.status()).toBe(200);
    const m = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, ih: innerHeight, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(m.h, `scrollHeight ${m.h} ≤ 7.5 × ${m.ih}`).toBeLessThanOrEqual(7.5 * m.ih);
    expect(m.sw, 'sin overflow horizontal').toBeLessThanOrEqual(m.cw);
    // bloque del selector ≤ 1,25 vh; configurador ≤ 0,9 vh; proceso ≤ 0,9 vh
    const hs = await page.evaluate(() => ({ sv: document.querySelector('.sv')!.getBoundingClientRect().height, cfg: document.querySelector('.cfg')!.getBoundingClientRect().height, ps: document.querySelector('.ps-d')!.getBoundingClientRect().height + document.querySelector('.ps-head')!.getBoundingClientRect().height }));
    expect(hs.sv).toBeLessThanOrEqual(1.25 * m.ih);
    expect(hs.cfg).toBeLessThanOrEqual(0.9 * m.ih);
    expect(hs.ps).toBeLessThanOrEqual(0.9 * m.ih);
    await page.waitForTimeout(600);
    expect(errors).toEqual([]);
  });
}

test('altura, 200 y sin errores 390×844 @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  const res = await open(page, '/servicios', errors);
  expect(res?.status()).toBe(200);
  const m = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, ih: innerHeight, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(m.h, `scrollHeight ${m.h} ≤ 10 × ${m.ih}`).toBeLessThanOrEqual(10 * m.ih);
  expect(m.sw, 'sin overflow horizontal').toBeLessThanOrEqual(m.cw);
  const sv = await page.locator('.sv').evaluate((e) => e.getBoundingClientRect().height);
  expect(sv, 'acordeón con un ítem abierto ≤ 2,6 vh').toBeLessThanOrEqual(2.6 * m.ih);
  const ps = await page.locator('#proceso .ps-m').evaluate((e) => e.getBoundingClientRect().height);
  expect(ps).toBeLessThanOrEqual(1.4 * m.ih);
  expect(errors).toEqual([]);
});

test('los 6 servicios están en el HTML inicial (sin JS)', async ({ request }) => {
  const html = await (await request.get('/servicios')).text();
  for (const s of SERVICES) {
    expect(html).toContain(`>${s.title}</h2>`);
    expect(html).toContain(`id="${s.slug}"`);
  }
  // paneles inactivos ocultos con hidden, no eliminados
  expect((html.match(/class="sv-panel"[^>]*hidden=""/g) || []).length).toBe(SERVICES.length - 1);
});

test('hash abre el tab y ↓ cambia aria-selected y el panel visible', async ({ page }) => {
  await open(page, '/servicios#apps-moviles');
  await expect(page.locator('#svt-apps-moviles')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#svp-apps-moviles')).toBeVisible();
  await expect(visiblePanel(page)).toHaveCount(1);
  await page.locator('#svt-apps-moviles').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#svt-seguridad-informatica')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#svt-apps-moviles')).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('#svp-seguridad-informatica')).toBeVisible();
  await expect(page.locator('#svp-apps-moviles')).toBeHidden();
  await expect(page).toHaveURL(/#seguridad-informatica$/);
  await page.keyboard.press('End');
  await expect(page.locator('#svt-ciencia-de-datos')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(page.locator('#svt-software-a-medida')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#svt-software-a-medida')).toBeFocused();
  // solo una demo montada (la del tab activo)
  await expect(page.locator('[data-demo]')).toHaveCount(1);
  await expect(page.locator('[data-demo="software-a-medida"]')).toBeVisible();
});

test('hash abre el ítem del acordeón @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/servicios#apps-moviles');
  await expect(page.locator('#sva-apps-moviles')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#svp-apps-moviles')).toBeVisible();
  await expect(page.locator('#svp-apps-moviles')).toHaveAttribute('role', 'region');
  await expect(visiblePanel(page)).toHaveCount(1);
  await page.locator('#sva-sitios-web').click();
  await expect(page.locator('#svp-sitios-web')).toBeVisible();
  await expect(page.locator('#sva-apps-moviles')).toHaveAttribute('aria-expanded', 'false');
});

test('configurador: pack y precios EXACTOS de PACKS y WhatsApp con el nombre', async ({ page }) => {
  test.setTimeout(150_000); // 7 × 3 combinaciones
  await open(page);
  const cfg = page.locator('#arma-tu-proyecto');
  for (const n of NEEDS) {
    for (const s of SIZES) {
      await cfg.locator('.chip', { hasText: new RegExp(`^${n.label.replace(/[()]/g, '\\$&')}$`) }).click();
      await cfg.locator('.chip', { hasText: new RegExp(`^${s.label.replace(/[()]/g, '\\$&')}$`) }).click();
      const want = packFor(n.v, s.v);
      const card = cfg.locator('.cfg-card');
      await expect(card.locator('.cfg-name')).toHaveText(want.name);
      if (!want.quote) {
        const p = PACKS.find((x) => x.name === want.name)!;
        expect(p, `${want.name} existe en PACKS`).toBeTruthy();
        await expect(card.locator('.cfg-setup')).toHaveText(p.setup);
        await expect(card.locator('.cfg-monthly')).toHaveText(p.monthly);
        await expect(card.locator('.cfg-li')).toHaveText(p.includes);
      } else {
        await expect(card.locator('.cfg-price b')).toHaveText('Cotización');
      }
      const href = await card.locator('.cfg-wa').getAttribute('href');
      expect(href).toContain(encodeURIComponent(want.name));
      expect(decodeURIComponent(href!.split('text=')[1])).toContain(`Hola, me interesa el pack ${want.name} (`);
      await expect(card.locator('a[href="/packs"]')).toBeVisible();
    }
  }
  await expect(page).toHaveURL(/necesito=a-medida&tamano=grande/);
  // mapeo exacto del spec
  expect(packFor('sitio-web', 'solo').name).toBe('Emprende');
  expect(packFor('sitio-web', 'pyme').name).toBe('Pyme');
  expect(packFor('sitio-web', 'grande').name).toBe('Pyme');
  expect(packFor('catalogo', null).name).toBe('Automotora / Catálogo');
  expect(packFor('tienda', null).name).toBe('E-commerce');
  // el estado de la URL se restaura al cargar
  await open(page, '/servicios?necesito=tienda&tamano=pyme');
  await expect(page.locator('.cfg-card .cfg-name')).toHaveText('E-commerce');
});

test('stack: filtro "Móvil" y tooltip con teclado', async ({ page }) => {
  await open(page);
  await page.locator('#stack .chip-b', { hasText: /^Móvil$/ }).click();
  await expect(page.locator('#stack .stk-t:visible')).toHaveCount(2);
  const names = await page.locator('#stack .stk-t:visible b').allTextContents();
  expect(names.sort()).toEqual(['Flutter', 'React Native']);
  // foco por teclado → tooltip visible (:focus-visible); Enter → aria-expanded
  await page.locator('#stack .chip-b', { hasText: /^Móvil$/ }).focus();
  const chips = await page.locator('#stack .chip-b').count();
  const idx = await page.locator('#stack .chip-b').evaluateAll((els) => els.findIndex((e) => e.textContent === 'Móvil'));
  for (let i = idx; i < chips; i++) await page.keyboard.press('Tab');
  const flutter = page.locator('#stack .stk-t[data-name="Flutter"]');
  await expect(flutter.locator('button')).toBeFocused();
  await expect(flutter.locator('.stk-tip')).toHaveCSS('opacity', '1');
  await page.keyboard.press('Enter');
  await expect(flutter.locator('button')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#stack .chip-b', { hasText: /^Todos$/ }).click();
  await expect(page.locator('#stack .stk-t:visible')).toHaveCount(STACK.length);
});

test('stack resalta las tecnologías del servicio activo', async ({ page }) => {
  await open(page, '/servicios#apps-moviles');
  await expect(page.locator('#stack .stk-t[data-hot]')).toHaveCount(2);
  await page.locator('#svt-ciencia-de-datos').click();
  await expect(page.locator('#stack .stk-t[data-hot] b')).toHaveText(['Python', 'Power BI']);
});

test('proceso: click y teclado muestran el panel del paso', async ({ page }) => {
  await open(page);
  await page.locator('#pst-2').click();
  await expect(page.locator('#psp-2')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#pst-3')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#psp-3')).toBeVisible();
});

test('reduced motion: sin timelines GSAP activos en las demos', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  for (const s of SERVICES) {
    await page.locator(`#svt-${s.slug}`).click();
    const demo = page.locator(`[data-demo="${s.slug}"]`);
    await expect(demo).toHaveAttribute('data-anim', 'static');
    await expect(demo.locator('.dm-pause')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __svDemoLive?: () => number }).__svDemoLive?.() ?? 0)).toBe(0);
  }
});

test('demos: corren, se pausan y hay una sola a la vez', async ({ page }) => {
  await open(page);
  await page.locator('.sv').scrollIntoViewIfNeeded();
  const demo = page.locator('[data-demo="software-a-medida"]');
  await expect(demo).toHaveAttribute('data-anim', 'running');
  await demo.locator('.dm-pause').click();
  await expect(demo).toHaveAttribute('data-anim', 'paused');
  await expect(demo.locator('.dm-pause')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => (window as unknown as { __svDemoLive: () => number }).__svDemoLive())).toBe(0);
  await page.locator('#svt-software-de-escritorio').click();
  await expect(page.locator('[data-demo]')).toHaveCount(1);
  const es = page.locator('[data-demo="software-de-escritorio"]');
  await expect(es).toHaveAttribute('data-anim', 'running');
  await es.locator('.dm-switch').click();
  await expect(es.locator('.dm-switch')).toHaveAttribute('aria-pressed', /true|false/);
});

test('sin violeta y sin cursor seguidor', async ({ page }) => {
  await open(page);
  await page.mouse.move(700, 400);
  await page.waitForTimeout(300);
  const purple = await page.evaluate(() => {
    const bad: string[] = [];
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const cs = getComputedStyle(el);
      for (const p of ['color', 'backgroundColor', 'borderTopColor', 'fill', 'stroke', 'boxShadow', 'backgroundImage', 'outlineColor'] as const) {
        if (String(cs[p]).includes('124, 92, 255')) bad.push(`${el.tagName}.${el.className}:${p}`);
      }
    }
    return bad;
  });
  expect(purple).toEqual([]);
  await expect(page.locator('.cursor, .cursor-ring')).toHaveCount(0);
});

test('marketing digital en /servicios y en el home, liderado por Ramón Ojeda', async ({ request }) => {
  for (const url of ['/servicios', '/']) {
    const html = await (await request.get(url)).text();
    for (const s of MARKETING_SERVICES) expect(html, url).toContain(s.title);
    expect(html, url).toContain('liderado por Ramón Ojeda');
    expect(html, url).toContain('Software &amp; Marketing');
  }
});
