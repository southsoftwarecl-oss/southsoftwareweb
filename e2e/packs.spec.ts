import { expect, test, type Page } from '@playwright/test';
import { COMBO_PACKS, CUSTOM_PACK, MARKETING_PACKS, PACKS, WA_URL } from '../src/content/site';

/**
 * Packs v3 — "Forja de cromo" (/packs). Nombres y CTA de cotización (sin montos públicos),
 * tilt ≤4° sobre Pyme con el resto en opacity .78, carrusel móvil (snap x, abre en Pyme, ≤1.3 viewports),
 * reduced motion sin animaciones y sin violeta.
 */
type G = { globalTimeline: { getChildren: (n: boolean, t: boolean, tl: boolean) => { targets?: () => Element[] }[] }; getProperty: (e: Element, p: string) => number };

async function open(page: Page, path = '/packs#solo-software') {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const res = await page.goto(path, { waitUntil: 'load' });
  expect(res?.status()).toBe(200);
  await page.waitForFunction(() => { const p = document.querySelector('.pre'); return !p || getComputedStyle(p).display === 'none'; }, null, { timeout: 8000 });
  return errors;
}
const forged = (page: Page) => expect(page.locator('#packs .packs')).toHaveAttribute('data-forja', /done|static/, { timeout: 15000 });

for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 680 }]) {
  test.describe(`packs desktop ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: vp });

    test('200, sin errores, nombres de PACKS y CTA de cotización', async ({ page }) => {
      const errors = await open(page);
      await page.locator('#packs .packs').scrollIntoViewIfNeeded();
      await forged(page);
      const cards = page.locator('#packs .pack');
      await expect(cards).toHaveCount(PACKS.length + 1);
      for (const [i, p] of PACKS.entries()) {
        const c = cards.nth(i);
        await expect(c.locator('.pn')).toHaveText(p.name);
        await expect(c.locator('.pr')).toHaveText('Pide tu cotización');
        await expect(c.getByRole('link', { name: 'Cotiza por WhatsApp' })).toBeVisible();
        await expect(c).not.toContainText('$');
      }
      await expect(cards.nth(PACKS.length).locator('.pn')).toHaveText(CUSTOM_PACK.name);
      expect(errors).toEqual([]);
    });

    test('hover sobre Pyme: tilt ≤4° y las demás a .78', async ({ page }) => {
      await open(page);
      await page.locator('#packs .packs').scrollIntoViewIfNeeded();
      await forged(page);
      const pyme = page.locator('#packs .pack.feat');
      // deja la tarjeta completa a la vista (con Lenis: rueda del mouse)
      const top = await pyme.evaluate((e) => e.getBoundingClientRect().top);
      await page.mouse.move(4, 300);
      await page.mouse.wheel(0, top - 60);
      await page.waitForTimeout(1600);
      const b = (await pyme.boundingBox())!;
      await page.mouse.move(b.x + b.width * 0.15, b.y + b.height * 0.2, { steps: 10 });
      await page.waitForTimeout(900);
      const r = await pyme.evaluate((el) => {
        const g = (window as unknown as { __gsap: G }).__gsap;
        return { tr: (el as HTMLElement).style.transform, rx: g.getProperty(el, 'rotationX'), ry: g.getProperty(el, 'rotationY') };
      });
      expect(r.tr).toMatch(/rotate/);
      expect(Math.abs(r.rx)).toBeGreaterThan(0.2);
      expect(Math.abs(r.rx)).toBeLessThanOrEqual(4);
      expect(Math.abs(r.ry)).toBeLessThanOrEqual(4);
      const ops = await page.$$eval('#packs .pack:not(.feat)', (els) => els.map((e) => +getComputedStyle(e).opacity));
      ops.forEach((o) => expect(o).toBeCloseTo(0.78, 2));
    });
  });
}

test('WhatsApp precargado: cada "Cotiza por WhatsApp" lleva el nombre del pack, sin precios', async ({ page }) => {
  await open(page);
  const base = WA_URL.split('?')[0];
  const hrefs = await page.$$eval('#packs .pack', (cs) => cs.map((c) => ({ name: c.querySelector('.pn')?.textContent, href: c.querySelector('.btn')?.getAttribute('href') || '' })));
  PACKS.forEach((p, i) => {
    const h = hrefs[i].href;
    expect(hrefs[i].name).toBe(p.name);
    expect(h.startsWith(base + '?')).toBe(true);
    expect(h).toContain(encodeURIComponent(p.name));
    expect(h).not.toMatch(/149\.990|19\.990|349\.990|699\.990|549\.990/);
    expect(h.match(/[?&]text=/g)?.length, 'un solo parámetro text').toBe(1);
    const text = new URL(h).searchParams.get('text');
    expect(text).toBe(`Hola, me interesa el pack ${p.name}. ¿Conversamos?`);
    expect(text).not.toMatch(/\$/);
  });
  expect(new URL(hrefs[PACKS.length].href).searchParams.get('text')).toBe(`Hola, me interesa el pack ${CUSTOM_PACK.name}. ¿Conversamos?`);
  const cupo = await page.locator('#packs .founders .btn').getAttribute('href');
  expect(new URL(cupo!).searchParams.get('text')).toBe('Quiero reservar un cupo de Cliente Fundador');
  expect(cupo!.match(/[?&]text=/g)?.length).toBe(1);
});

test('sin violeta en /packs', async ({ page }) => {
  await open(page);
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll('*'))) for (const ps of [null, '::before', '::after']) {
      const cs = getComputedStyle(el, ps);
      for (let i = 0; i < cs.length; i++) { const v = cs.getPropertyValue(cs[i]); if (v.includes('124, 92, 255')) out.push(`${el.tagName}.${el.className}${ps || ''} ${cs[i]}`); }
    }
    return out;
  });
  expect(bad).toEqual([]);
});

test.describe('packs reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  test('nombres y checks visibles de inmediato, sin animaciones', async ({ page }) => {
    await open(page);
    await page.waitForFunction(() => !!(window as unknown as { __gsap?: unknown }).__gsap);
    await forged(page);
    for (const p of PACKS) await expect(page.locator('#packs .pack', { hasText: p.name }).first()).toBeVisible();
    const st = await page.evaluate(() => {
      const sec = document.querySelector('#packs')!;
      const g = (window as unknown as { __gsap: G }).__gsap;
      const inSec = g.globalTimeline.getChildren(true, true, false).filter((t) => (t.targets?.() || []).some((x) => x instanceof Element && sec.contains(x)));
      const paths = Array.from(sec.querySelectorAll('.ck path')).map((p) => getComputedStyle(p).strokeDashoffset);
      const items = Array.from(sec.querySelectorAll('li > span')).map((x) => +getComputedStyle(x).opacity);
      const cards = Array.from(sec.querySelectorAll('.pack')).map((c) => getComputedStyle(c).maskImage);
      return { n: inSec.length, paths, items, cards };
    });
    expect(st.n).toBe(0);
    st.paths.forEach((d) => expect(parseFloat(d)).toBe(0));
    st.items.forEach((o) => expect(o).toBe(1));
    st.cards.forEach((m) => expect(m).toBe('none'));
  });
});

test('móvil 390×844: carrusel snap x, abre en Pyme, ≤1.3 viewports, sin overflow @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await open(page);
  await page.locator('#packs .packs').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => {
    const g = document.querySelector<HTMLElement>('#packs .packs')!;
    const cards = Array.from(g.querySelectorAll<HTMLElement>('.pack'));
    const mid = g.getBoundingClientRect().left + g.clientWidth / 2;
    const near = cards.map((c) => Math.abs(c.getBoundingClientRect().left + c.offsetWidth / 2 - mid));
    const idx = near.indexOf(Math.min(...near));
    return {
      snap: getComputedStyle(g).scrollSnapType, h: document.querySelector('#packs')!.getBoundingClientRect().height, ih: innerHeight,
      centered: cards[idx].querySelector('.pn')!.textContent, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
      role: g.getAttribute('aria-roledescription'), count: document.querySelector('#packs .pk-count')!.textContent, live: document.querySelector('#packs .pk-count')!.getAttribute('aria-live'),
      cardW: cards[0].offsetWidth / innerWidth,
    };
  });
  expect(m.snap).toContain('x');
  expect(m.snap).toContain('mandatory');
  expect(m.h).toBeLessThanOrEqual(1.3 * m.ih);
  expect(m.centered).toBe('Pyme');
  expect(m.sw).toBe(m.cw);
  expect(m.role).toBe('carrusel');
  expect(m.count).toBe('2 / 8');
  expect(m.live).toBe('polite');
  expect(m.cardW).toBeCloseTo(0.84, 2);
  // teclado: flecha derecha → pack 3
  await page.locator('#packs .packs').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#packs .pk-count')).toHaveText('3 / 8', { timeout: 4000 });
  expect(errors).toEqual([]);
});

test('/packs responde 200 a 390×844 sin errores de consola @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await open(page);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('grupos Combinados / Solo marketing / Solo software: nombres, CTA y WhatsApp precargado sin precios', async ({ page }) => {
  const errors = await open(page, '/packs');
  await expect(page.getByRole('tab')).toHaveCount(3);
  for (const [id, list] of [['combinados', COMBO_PACKS], ['solo-marketing', MARKETING_PACKS]] as const) {
    await page.locator(`.pk-tab[aria-controls="${id}"]`).click();
    const cards = page.locator(`#${id} .mkp`);
    await expect(cards).toHaveCount(list.length);
    for (const [i, p] of list.entries()) {
      const c = cards.nth(i);
      await expect(c.locator('.mkp-n')).toHaveText(p.name);
      await expect(c.locator('.mkp-ask')).toHaveText('Pide tu cotización');
      await expect(c).not.toContainText('$');
      const h = (await c.locator('.mkp-btn').getAttribute('href'))!;
      expect(h.startsWith(WA_URL.split('?')[0] + '?')).toBe(true);
      expect(h.match(/[?&]text=/g)?.length).toBe(1);
      expect(new URL(h).searchParams.get('text')).toBe(`Hola, me interesa el pack ${p.name}. ¿Conversamos?`);
    }
    await expect(page.locator(`#${id} .fine`)).toContainText('pauta publicitaria');
  }
  expect(errors).toEqual([]);
});
