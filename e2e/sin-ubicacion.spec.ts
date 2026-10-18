import { test, expect } from '@playwright/test';

/**
 * Privacidad + alcance nacional: ninguna página (HTML, metadata ni JSON-LD) menciona
 * Puerto Montt / Los Lagos / Reloncaví ni publica coordenadas.
 */
const ROUTES = ['/', '/servicios', '/packs', '/proyectos', '/proyectos/rg-motors-chile', '/nosotros', '/contacto', '/llms.txt', '/sitemap.xml', '/robots.txt', '/manifest.webmanifest'];
const BANNED = /puerto\s*montt|los\s*lagos|reloncav|41°|72°|-41\.4|-72\.9|GeoCoordinates/i;

test.describe('Sin ubicación precisa', () => {
  for (const url of ROUTES) {
    test(`sin referencias de ubicación → ${url}`, async ({ request }) => {
      const r = await request.get(url);
      if (r.status() === 404) return; // ruta opcional que no existe en este sitio
      expect(r.status(), url).toBe(200);
      expect(await r.text(), url).not.toMatch(BANNED);
    });
  }

  test('JSON-LD declara Chile sin dirección local', async ({ page }) => {
    await page.goto('/');
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join();
    expect(ld).toContain('"addressCountry":"CL"');
    expect(ld).not.toContain('addressLocality');
    expect(ld).not.toContain('"geo"');
    await expect(page.locator('footer')).toContainText('Hecho en Chile');
  });
});
