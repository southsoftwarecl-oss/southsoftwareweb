import { test, expect, type Page, type Request } from '@playwright/test';

/**
 * GA4 + Consent Mode v2 + Search Console + sitemap/robots.
 * - baseURL (build normal, sin NEXT_PUBLIC_GA_ID): no hay gtag, ni aviso, ni link de preferencias.
 * - GA_BASE (build .next-ga con G-TEST000000, ver playwright.config.ts): aviso, consentimiento y eventos.
 *   Las peticiones a Google se interceptan: gtag.js se sirve como stub y nunca sale nada a la red.
 */
const PORT = Number(process.env.E2E_PORT || 3300);
const GA_BASE = `http://localhost:${Number(process.env.E2E_GA_PORT || PORT + 1)}`;
const GA_ID = 'G-TEST000000';
const GOOGLE = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com/;
const ROUTES = ['/', '/servicios', '/packs', '/proyectos', '/proyectos/rg-motors-chile', '/proyectos/salgado-automotriz', '/proyectos/frio-austral', '/nosotros', '/contacto'];

async function trackGoogle(page: Page) {
  const hits: string[] = [];
  await page.route(GOOGLE, (route) => {
    hits.push(route.request().url());
    if (/gtag\/js/.test(route.request().url())) return route.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.__gtagLoaded=true;' });
    return route.fulfill({ status: 204, body: '' });
  });
  page.on('request', (r: Request) => { if (GOOGLE.test(r.url()) && !hits.includes(r.url())) hits.push(r.url()); });
  return hits;
}

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'load' });
  await page.waitForFunction(() => { const p = document.querySelector('.pre'); return !p || getComputedStyle(p).display === 'none'; }, null, { timeout: 8000 });
}

/** Entradas de dataLayer como arrays planos (gtag encola objetos `arguments`). */
const dataLayer = (page: Page) => page.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a as ArrayLike<unknown>)));

test.describe('Sin NEXT_PUBLIC_GA_ID', () => {
  test('no hay gtag, ni aviso, ni link de preferencias, ni meta de Search Console', async ({ page }) => {
    const hits = await trackGoogle(page);
    await open(page, '/');
    await page.waitForTimeout(800);
    await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
    await expect(page.locator('.cookie')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Preferencias de cookies' })).toHaveCount(0);
    await expect(page.locator('meta[name="google-site-verification"]')).toHaveCount(0);
    expect(hits).toEqual([]);
  });

  test('CSP permite GA4 (script, connect, img) y mantiene el resto', async ({ request }) => {
    const csp = (await request.get('/')).headers()['content-security-policy'];
    expect(csp).toMatch(/script-src [^;]*https:\/\/www\.googletagmanager\.com/);
    for (const dir of ['connect-src', 'img-src']) {
      const d = csp.split(';').find((x) => x.trim().startsWith(dir))!;
      for (const host of ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com']) expect(d, dir).toContain(host);
    }
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });
});

test.describe('Con GA4 (build de prueba)', () => {
  test.use({ baseURL: GA_BASE });

  test('primera visita: aviso visible, accesible y sin gtag hasta decidir', async ({ page }) => {
    const hits = await trackGoogle(page);
    await open(page, '/');
    const ck = page.getByRole('dialog', { name: 'Cookies' });
    await expect(ck).toBeVisible();
    await expect(ck).toContainText('analítica');
    await expect(ck.getByRole('button', { name: 'Aceptar' })).toBeVisible();
    await expect(ck.getByRole('button', { name: 'Rechazar' })).toBeVisible();
    expect(await ck.evaluate((el) => getComputedStyle(el).position)).toBe('fixed');
    await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
    expect(hits).toEqual([]);
    // Teclado: los botones son alcanzables con Tab
    await ck.getByRole('button', { name: 'Rechazar' }).focus();
    await page.keyboard.press('Tab');
    await expect(ck.getByRole('button', { name: 'Aceptar' })).toBeFocused();
    // Search Console
    await expect(page.locator('meta[name="google-site-verification"]')).toHaveAttribute('content', 'gsc-test-token');
  });

  test('"Rechazar" oculta el aviso, lo recuerda y no hay peticiones a Google', async ({ page }) => {
    const hits = await trackGoogle(page);
    await open(page, '/');
    await page.getByRole('button', { name: 'Rechazar' }).click();
    await expect(page.locator('.cookie')).toBeHidden();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('south-consent') || '{}').analytics)).toBe('denied');
    await open(page, '/packs');
    await page.waitForTimeout(1000);
    await expect(page.locator('.cookie')).toBeHidden();
    await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
    expect(await page.evaluate(() => typeof window.gtag)).toBe('undefined');
    expect(hits).toEqual([]);
  });

  test('"Aceptar" carga gtag con Consent Mode v2 (default denied → analytics granted)', async ({ page }) => {
    const hits = await trackGoogle(page);
    await open(page, '/');
    await page.getByRole('button', { name: 'Aceptar' }).click();
    await expect(page.locator('.cookie')).toBeHidden();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __gtagLoaded?: boolean }).__gtagLoaded === true)).toBe(true);
    expect(hits.some((u) => u.includes(`gtag/js?id=${GA_ID}`))).toBe(true);
    const dl = await dataLayer(page);
    const iDefault = dl.findIndex((a) => a[0] === 'consent' && a[1] === 'default');
    const iUpdate = dl.findIndex((a) => a[0] === 'consent' && a[1] === 'update');
    const iConfig = dl.findIndex((a) => a[0] === 'config' && a[1] === GA_ID);
    expect(iDefault).toBeGreaterThanOrEqual(0);
    expect(dl[iDefault][2]).toMatchObject({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    expect(dl[iUpdate][2]).toEqual({ analytics_storage: 'granted' });
    expect(iDefault).toBeLessThan(iUpdate);
    expect(iUpdate).toBeLessThan(iConfig);
    // un solo config (el page_view inicial); las navegaciones las mide la medición mejorada → sin duplicados
    expect(dl.filter((a) => a[0] === 'config')).toHaveLength(1);
    expect(dl.some((a) => a[0] === 'event' && a[1] === 'page_view')).toBe(false);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('south-consent') || '{}').analytics)).toBe('granted');
    // navegación cliente: sigue sin duplicar config ni page_view manual
    await page.locator('nav').getByRole('link', { name: 'Packs' }).first().click();
    await page.waitForURL('**/packs');
    const dl2 = await dataLayer(page);
    expect(dl2.filter((a) => a[0] === 'config')).toHaveLength(1);
    // recarga: sin aviso y gtag carga directo
    await open(page, '/');
    await expect(page.locator('.cookie')).toBeHidden();
    await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(1);
  });

  test('eventos: whatsapp_click (+pack), select_pack, email/phone y generate_lead', async ({ page, context }) => {
    await trackGoogle(page);
    await context.route(/wa\.me|whatsapp\.com/, (r) => r.fulfill({ status: 204, body: '' }));
    await open(page, '/packs');
    await page.getByRole('button', { name: 'Aceptar' }).click();
    await expect.poll(() => page.evaluate(() => typeof window.gtag)).toBe('function');
    const link = page.locator('a[href*="wa.me"]', { hasText: 'Elegir pack' }).first();
    await link.evaluate((a) => a.addEventListener('click', (e) => e.preventDefault(), { once: true }));
    await link.click();
    await page.evaluate(() => {
      const mk = (href: string) => { const a = document.createElement('a'); a.href = href; a.textContent = 'x'; a.addEventListener('click', (e) => e.preventDefault()); document.body.append(a); a.click(); a.remove(); };
      mk('mailto:contacto@southsoftware.cl'); mk('tel:+56964710361');
      window.dispatchEvent(new CustomEvent('south:lead', { detail: { form: 'contacto' } }));
    });
    const events = (await dataLayer(page)).filter((a) => a[0] === 'event');
    const wa = events.find((a) => a[1] === 'whatsapp_click');
    expect(wa?.[2]).toMatchObject({ pack: expect.any(String), page_path: '/packs' });
    expect(events.find((a) => a[1] === 'select_pack')?.[2]).toMatchObject({ pack: (wa![2] as { pack: string }).pack });
    expect(events.some((a) => a[1] === 'email_click')).toBe(true);
    expect(events.some((a) => a[1] === 'phone_click')).toBe(true);
    expect(events.find((a) => a[1] === 'generate_lead')?.[2]).toMatchObject({ form: 'contacto' });
  });

  test('"Preferencias de cookies" en el footer reabre el aviso (foco + Escape)', async ({ page }) => {
    await trackGoogle(page);
    await open(page, '/');
    await page.getByRole('button', { name: 'Rechazar' }).click();
    await expect(page.locator('.cookie')).toBeHidden();
    const link = page.locator('footer').getByRole('button', { name: 'Preferencias de cookies' });
    await link.scrollIntoViewIfNeeded();
    await link.click();
    const ck = page.getByRole('dialog', { name: 'Cookies' });
    await expect(ck).toBeVisible();
    await expect(ck.getByRole('button', { name: 'Rechazar' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(ck).toBeHidden();
    await expect(link).toBeFocused();
    await link.click();
    await ck.getByRole('button', { name: 'Aceptar' }).click();
    await expect(ck).toBeHidden();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('south-consent') || '{}').analytics)).toBe('granted');
  });

  test('aviso en celular: dentro del viewport y con botones grandes @mobile', async ({ page }) => {
    await trackGoogle(page);
    await open(page, '/');
    const ck = page.getByRole('dialog', { name: 'Cookies' });
    await expect(ck).toBeVisible();
    const box = (await ck.boundingBox())!;
    const vw = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vw.width);
    expect(box.y + box.height).toBeLessThanOrEqual(vw.height);
    const btn = (await ck.getByRole('button', { name: 'Aceptar' }).boundingBox())!;
    expect(btn.height).toBeGreaterThanOrEqual(36);
  });
});

test.describe('Indexación', () => {
  test('sitemap.xml lista todas las rutas públicas con URL absoluta', async ({ request }) => {
    const r = await request.get('/sitemap.xml');
    expect(r.status()).toBe(200);
    const xml = await r.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const p of ROUTES) expect(locs, p).toContain(`https://southsoftware.cl${p === '/' ? '' : p}`);
    for (const l of locs) expect(l).toMatch(/^https:\/\/southsoftware\.cl/);
    expect(xml).toContain('<lastmod>');
  });

  test('robots.txt permite todo y apunta al sitemap', async ({ request }) => {
    const txt = await (await request.get('/robots.txt')).text();
    expect(txt).toMatch(/User-Agent: \*/i);
    expect(txt).toMatch(/Allow: \//);
    expect(txt).toContain('Sitemap: https://southsoftware.cl/sitemap.xml');
  });
});
