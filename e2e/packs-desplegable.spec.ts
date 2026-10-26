import { expect, test } from '@playwright/test';
import { HOME_PACKS, PACKS } from '../src/content/site';

/**
 * Home · franja de precios: cada tarjeta (Emprende, Pyme, E-commerce) trae un desplegable "Ver qué incluye"
 * con el arreglo `includes` de PACKS, tal cual. Independientes entre sí, operables con teclado, tarjetas alineadas arriba.
 */
const items = HOME_PACKS.map((n) => PACKS.find((p) => p.name === n)!);

async function go(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.locator('.pre')).toBeHidden({ timeout: 25000 }); // con reduced motion queda en el DOM con display:none
  await page.locator('#precios').scrollIntoViewIfNeeded();
}

test('home: cada pack tiene un desplegable con sus includes exactos (abre/cierra, independientes)', async ({ page }) => {
  await go(page);
  const det = page.locator('#precios details.strip-inc');
  await expect(det).toHaveCount(items.length);
  for (const d of await det.all()) await expect(d).not.toHaveAttribute('open', /.*/);

  for (const [i, p] of items.entries()) {
    const d = det.nth(i);
    await d.locator('summary').click();
    await expect(d).toHaveAttribute('open', '');
    await expect(d.locator('li')).toHaveText(p.includes);
    // los otros siguen cerrados (independientes)
    for (const [j] of items.entries()) if (j !== i) await expect(det.nth(j)).not.toHaveAttribute('open', /.*/);
    await d.locator('summary').click();
    await expect(d).not.toHaveAttribute('open', /.*/);
    await expect(d.locator('li').first()).toBeHidden();
  }

  // abrir dos a la vez
  await det.nth(0).locator('summary').click();
  await det.nth(2).locator('summary').click();
  await expect(det.nth(0)).toHaveAttribute('open', '');
  await expect(det.nth(1)).not.toHaveAttribute('open', /.*/);
  await expect(det.nth(2)).toHaveAttribute('open', '');
});

test('home: el desplegable se opera con teclado y no mueve el precio de la tarjeta (alineadas arriba)', async ({ page }) => {
  await go(page);
  await page.waitForTimeout(1800); // termina el reveal de la franja
  const lis = page.locator('#precios .strip-p > li');
  const top = async () => lis.evaluateAll((els) => els.map((e) => Math.round(e.querySelector('b')!.getBoundingClientRect().top - e.getBoundingClientRect().top)));
  const before = await top();
  const s = page.locator('#precios details.strip-inc').nth(1).locator('summary');
  await s.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#precios details.strip-inc').nth(1)).toHaveAttribute('open', '');
  await page.waitForTimeout(500);
  expect(await top()).toEqual(before);
  await page.keyboard.press('Space');
  await expect(page.locator('#precios details.strip-inc').nth(1)).not.toHaveAttribute('open', /.*/);
});

test('home: desplegable en móvil no desborda y la animación respeta reduced motion @mobile', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await go(page);
  const d = page.locator('#precios details.strip-inc').first();
  await d.locator('summary').click();
  await expect(d.locator('li')).toHaveCount(items[0].includes.length);
  await expect(d.locator('li').last()).toBeVisible();
  const tr = await d.evaluate((e) => getComputedStyle(e, '::details-content').transitionDuration);
  expect(['0s', '', 'none']).toContain(tr);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over).toBeLessThanOrEqual(0);
});
