import { expect, test } from '@playwright/test';

const PAGES = [
  { link: 'Packs', url: '/packs', h1: /Precio claro/ },
  { link: 'Servicios', url: '/servicios', h1: /Software & Marketing/ },
  { link: 'Proyectos', url: '/proyectos', h1: /Sitios que venden/ },
  { link: 'Nosotros', url: '/nosotros', h1: /hace crecer/ },
  { link: 'Contacto', url: '/contacto', h1: /Agenda una/ },
];

test.describe('Navegación', () => {
  test('home: hero, secciones y preloader que se retira', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1:visible')).toContainText('Cada detalle');
    await expect(page.locator('.pre')).toHaveCount(0, { timeout: 8000 });
    // home v2: servicios (teaser), historia, proyectos destacados, franja de precios, contacto
    for (const id of ['servicios', 'proyectos', 'precios', 'contacto']) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    for (const id of ['proceso', 'stack', 'packs', 'por-que']) await expect(page.locator(`#${id}`)).toHaveCount(0);
    await expect(page.locator('#precios .strip-p > li')).toHaveCount(3);
    await expect(page.locator('#precios')).toContainText('Desde $149.990');
    await expect(page.locator('footer')).toContainText('Hecho en Chile');
  });

  for (const p of PAGES) {
    test(`nav principal → ${p.link}`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: p.link, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${p.url}$`));
      await expect(page.locator('h1:visible')).toContainText(p.h1);
      await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: p.link, exact: true })).toHaveAttribute('aria-current', 'page');
    });
  }

  test('proyectos → página de caso → siguiente proyecto', async ({ page }) => {
    await page.goto('/proyectos');
    await page.getByRole('link', { name: 'RG Motors Chile', exact: true }).click();
    await expect(page).toHaveURL(/\/proyectos\/rg-motors-chile$/);
    await expect(page.locator('h1:visible')).toHaveText('RG Motors Chile');
    expect(await page.locator('main').innerText()).not.toMatch(/\[[^\]]*(completar|confirmar)[^\]]*\]/i);
    await page.locator('.next-case').click();
    await expect(page).toHaveURL(/\/proyectos\/salgado-automotriz$/);
    await expect(page.locator('h1:visible')).toHaveText('Salgado Automotriz');
  });

  test('las tres páginas de caso existen', async ({ request }) => {
    for (const slug of ['rg-motors-chile', 'salgado-automotriz', 'frio-austral']) {
      const r = await request.get(`/proyectos/${slug}`);
      expect(r.status(), slug).toBe(200);
    }
  });

  test('ruta inexistente → 404 creativo', async ({ page }) => {
    const res = await page.goto('/esta-ruta-no-existe');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1:visible')).toContainText('se perdió en el camino');
    await page.getByRole('link', { name: 'Volver al inicio' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1:visible')).toContainText('Cada detalle');
  });

  test('/packs: precios exactos y JSON-LD', async ({ page }) => {
    const res = await page.goto('/packs#solo-software');
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/Precios de desarrollo web y marketing en Chile · South Software/);
    for (const price of ['$149.990', '$349.990', '$549.990', '$699.990', 'desde $1.490.000', '$249.990', 'desde $390.000']) {
      // packs v3: "desde" va en la línea pequeña (.pl) y el monto en .pr (una sola línea)
      const amount = price.replace(/^desde\s+/, '');
      const card = page.locator('.pack', { has: page.locator('.pr', { hasText: amount }) }).first();
      await expect(card.locator('.pr')).toBeVisible();
      if (amount !== price) await expect(card.locator('.pl')).toContainText('desde');
    }
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join();
    expect(ld).toContain('OfferCatalog');
  });

  test('anclas antiguas del home redirigen (#packs → /packs, #proceso → /servicios#proceso)', async ({ page }) => {
    await page.goto('/#packs');
    await expect(page).toHaveURL(/\/packs$/);
    await page.goto('/#proceso');
    await expect(page).toHaveURL(/\/servicios#proceso$/);
    await expect(page.locator('#proceso')).toHaveCount(1);
  });

  test('menú móvil abre y navega @mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo móvil');
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    const menu = page.getByRole('dialog', { name: 'Menú' });
    await expect(menu).toBeVisible();
    await menu.getByRole('link', { name: /Servicios/ }).click();
    await expect(page).toHaveURL(/\/servicios$/);
    await expect(menu).toBeHidden();
    await expect(page.locator('h1:visible')).toContainText('Software & Marketing');
  });

  test('sin overflow horizontal en móvil @mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo móvil');
    for (const url of ['/', '/servicios', '/proyectos/frio-austral', '/nosotros', '/contacto']) {
      await page.goto(url);
      const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(sw, url).toBeLessThanOrEqual(cw);
    }
  });
});

test.describe('SEO y seguridad', () => {
  test('metadata, JSON-LD, robots y sitemap', async ({ page, request }) => {
    await page.goto('/servicios');
    await expect(page).toHaveTitle(/Desarrollo de software, web y marketing digital · South Software/);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = ld.map((t) => JSON.stringify(JSON.parse(t)));
    expect(types.join()).toContain('ProfessionalService');
    expect(types.join()).toContain('"@type":"Service"');
    expect((await request.get('/robots.txt')).status()).toBe(200);
    const sm = await (await request.get('/sitemap.xml')).text();
    expect(sm).toContain('/proyectos/frio-austral');
  });

  test('cabeceras de seguridad', async ({ request }) => {
    const r = await request.get('/');
    const h = r.headers();
    expect(h['content-security-policy']).toContain("default-src 'self'");
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['strict-transport-security']).toContain('max-age=63072000');
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-powered-by']).toBeUndefined();
  });
});
