import { test, expect } from '@playwright/test';
import { SERVICE_PAGES } from '../src/content/service-pages';

/** Auditoría 22-oct: SEO on-page, JSON-LD, páginas por servicio, blog sin artículos y aviso de cookies en mobile. */
const PORT = Number(process.env.E2E_PORT || 3300);
const GA_BASE = `http://localhost:${Number(process.env.E2E_GA_PORT || PORT + 1)}`;
const PAGES = ['/', '/servicios', '/proyectos', '/packs', '/nosotros', '/contacto', '/proyectos/rg-motors-chile', '/proyectos/salgado-automotriz',
  '/proyectos/frio-austral', '/proyectos/unidades-chile', '/proyectos/suertu2s', ...SERVICE_PAGES.map((s) => `/servicios/${s.slug}`)];

test.describe('SEO auditoría', () => {
  test('titles con marca, descriptions 140–155 únicas, canonical, OG y Twitter por página', async ({ request }) => {
    const descs = new Set<string>(); const titles = new Set<string>();
    for (const p of PAGES) {
      const html = await (await request.get(p)).text();
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
      const desc = (html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '').replace(/&amp;/g, '&');
      expect(title, p).toContain('South Software');
      expect(desc.length, `${p}: ${desc}`).toBeGreaterThanOrEqual(140);
      expect(desc.length, `${p}: ${desc}`).toBeLessThanOrEqual(155);
      expect(descs.has(desc), `desc duplicada ${p}`).toBe(false); descs.add(desc);
      expect(titles.has(title), `title duplicado ${p}`).toBe(false); titles.add(title);
      expect(html, p).toMatch(/<link rel="canonical" href="https:\/\/southsoftware\.cl[^"]*"/);
      for (const m of ['og:title', 'og:description', 'og:image', 'og:url']) expect(html, `${p} ${m}`).toContain(`property="${m}"`);
      for (const m of ['twitter:card', 'twitter:title', 'twitter:image']) expect(html, `${p} ${m}`).toContain(`name="${m}"`);
    }
  });

  test('"desarrollo de software" y "desarrollo web" aparecen sin relleno', async ({ request }) => {
    const all = (await Promise.all(['/', '/servicios', '/servicios/software-a-medida', '/servicios/sitios-web'].map(async (p) => (await (await request.get(p)).text()).toLowerCase()))).join(' ');
    expect(all).toContain('desarrollo de software');
    expect(all).toContain('desarrollo web');
  });

  test('JSON-LD válido: WebSite, ProfessionalService solo con país, BreadcrumbList y Service por servicio', async ({ request }) => {
    const ld = async (p: string) => {
      const html = await (await request.get(p)).text();
      return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    };
    const home = await ld('/');
    const org = home.find((x) => x['@type'] === 'ProfessionalService');
    expect(org.areaServed.name).toBe('Chile');
    expect(org.address).toEqual({ '@type': 'PostalAddress', addressCountry: 'CL' }); // solo país, sin dirección física
    expect(home.some((x) => x['@type'] === 'WebSite' && !x.potentialAction)).toBe(true);
    for (const p of ['/servicios', '/packs', '/proyectos', '/nosotros', '/contacto', '/proyectos/rg-motors-chile', '/servicios/sitios-web']) {
      const b = (await ld(p)).find((x) => x['@type'] === 'BreadcrumbList');
      expect(b, p).toBeTruthy();
      expect(b.itemListElement[0].name).toBe('Inicio');
    }
    const svc = (await ld('/servicios/apps-moviles')).find((x) => x['@type'] === 'Service');
    expect(svc.provider['@id']).toContain('#org');
    expect(JSON.stringify(await ld('/servicios/apps-moviles'))).not.toMatch(/"Person"|FAQPage/);
  });

  test('páginas por servicio: H1 propio, enlazadas desde /servicios y en el sitemap', async ({ page, request }) => {
    test.setTimeout(150_000);
    await page.goto('/servicios');
    // enlazado interno: footer (software) + tarjetas de marketing + "Otros servicios" en cada página
    for (const s of SERVICE_PAGES) await expect(page.locator(`a[href="/servicios/${s.slug}"]`).first()).toBeAttached();
    const sm = await (await request.get('/sitemap.xml')).text();
    for (const s of SERVICE_PAGES) {
      expect(sm).toContain(`/servicios/${s.slug}<`);
      await page.goto(`/servicios/${s.slug}`);
      expect((await page.locator('h1').innerText()).replace(/\s+/g, ' ').trim()).toBe(s.h1);
    }
    // con Cache Components la primera visita puede llegar en streaming (200): lo que importa es noindex + página 404
    const nf = await request.get('/servicios/no-existe');
    expect([200, 404]).toContain(nf.status());
    expect(await nf.text()).toMatch(/noindex[\s\S]*Página no encontrada|Página no encontrada[\s\S]*noindex/);
  });

  test('blog con el primer artículo: indexable, en sitemap, Article schema y enlaces internos', async ({ request, page }) => {
    const html = await (await request.get('/blog')).text();
    expect(html).not.toMatch(/<meta name="robots" content="noindex/);
    expect(html).toContain('class="blog-list"');
    const sm = await (await request.get('/sitemap.xml')).text();
    expect(sm).toContain('/blog<');
    expect(sm).toContain('/blog/cuanto-cuesta-una-web-pyme-chile-2026<');
    const nf = await request.get('/blog/no-existe'); // slug no generado: streaming puede dar 200, lo que importa es noindex + 404
    expect([200, 404]).toContain(nf.status());
    expect(await nf.text()).toMatch(/noindex[\s\S]*Página no encontrada|Página no encontrada[\s\S]*noindex/);
    await page.goto('/blog/cuanto-cuesta-una-web-pyme-chile-2026');
    await expect(page.locator('h1')).toContainText('Cuánto cuesta una web');
    expect(await page.locator('article h2').count()).toBeGreaterThanOrEqual(4);
    const desc = (await page.locator('meta[name="description"]').getAttribute('content'))!;
    expect(desc.length).toBeGreaterThanOrEqual(140); expect(desc.length).toBeLessThanOrEqual(155);
    expect(await page.locator('meta[property="og:type"]').getAttribute('content')).toBe('article');
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join('');
    expect(ld).toContain('"@type":"Article"');
    for (const h of ['/packs', '/contacto', '/servicios/sitios-web']) await expect(page.locator(`article a[href="${h}"]`).first()).toBeVisible();
    const t = (await page.content()).toLowerCase();
    expect(t).not.toContain('google ads');
  });

  test('sin nombres del equipo ni ubicación en las páginas nuevas', async ({ request }) => {
    for (const p of [...SERVICE_PAGES.map((s) => `/servicios/${s.slug}`), '/blog', '/blog/cuanto-cuesta-una-web-pyme-chile-2026', '/nosotros']) {
      const t = (await (await request.get(p)).text()).toLowerCase();
      for (const bad of ['mathias', 'ramón', 'ojeda', 'puerto montt', 'el sur', 'google ads']) expect(t, `${p}: ${bad}`).not.toContain(bad);
    }
  });
});

test.describe('Aviso de cookies @mobile', () => {
  test('barra compacta abajo, Aceptar/Rechazar con el mismo peso y sin tapar los CTA del hero @mobile', async ({ page }) => {
    await page.goto(`${GA_BASE}/`, { waitUntil: 'load' });
    const bar = page.locator('.cookie[data-open]');
    await expect(bar).toBeVisible({ timeout: 15000 });
    const vb = page.viewportSize()!;
    const b = (await bar.boundingBox())!;
    expect(b.height).toBeLessThanOrEqual(96);
    expect(Math.round(b.y + b.height)).toBeGreaterThanOrEqual(vb.height - 1);
    const [acc, rej] = [bar.getByRole('button', { name: 'Aceptar' }), bar.getByRole('button', { name: 'Rechazar' })];
    const style = (l: typeof acc) => l.evaluate((e) => { const s = getComputedStyle(e); return [s.backgroundColor, s.color, s.borderColor, s.fontWeight, s.fontSize, s.height].join('|'); });
    expect(await style(acc)).toBe(await style(rej));
    // ningún CTA visible del primer pantallazo queda bajo la barra
    const ctas = await page.locator('.hero .actions a, .wa-float').evaluateAll((els, top) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && Number(getComputedStyle(e).opacity) > 0.1 && r.bottom > (top as number) && r.top < innerHeight; }).map((e) => e.textContent || e.className), b.y);
    expect(ctas).toEqual([]);
    await rej.click();
    await expect(page.locator('.cookie[data-open]')).toHaveCount(0);
  });
});
