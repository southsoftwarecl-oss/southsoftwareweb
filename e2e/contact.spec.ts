import { expect, test } from '@playwright/test';

const valid = { nombre: 'Prueba E2E', empresa: 'Test SpA', email: 'prueba@example.com', tipo: 'Sitio web', presupuesto: 'Aún no lo sé', mensaje: 'Hola', website: '', turnstileToken: '' };

test.describe('Formulario de contacto (UI)', () => {
  test('muestra errores por campo y no envía si falta información', async ({ page }) => {
    let posted = false;
    page.on('request', (r) => { if (r.url().includes('/api/contact')) posted = true; });
    await page.goto('/contacto');
    await page.getByRole('button', { name: 'Enviar brief' }).click();
    await expect(page.getByText('Ingresa tu nombre')).toBeVisible();
    await expect(page.getByText('Email no válido')).toBeVisible();
    await expect(page.getByText('Elige un tipo de proyecto')).toBeVisible();
    await expect(page.getByLabel('Nombre')).toHaveAttribute('aria-invalid', 'true');
    expect(posted).toBe(false);
  });

  test('envío válido → estado de éxito (modo demo sin claves)', async ({ page }) => {
    await page.goto('/contacto');
    await page.getByLabel('Nombre').fill('Prueba E2E');
    await page.getByLabel('Empresa').fill('Test SpA');
    await page.getByLabel('Email').fill('prueba@example.com');
    await page.getByLabel('Tipo de proyecto').selectOption('Software a medida');
    await page.getByLabel('Presupuesto').selectOption('Aún no lo sé');
    await page.getByLabel('Cuéntanos tu idea').fill('Necesito un sistema de inventario.');
    const resP = page.waitForResponse('**/api/contact');
    await page.getByRole('button', { name: 'Enviar brief' }).click();
    const res = await resP;
    expect(res.status()).toBe(200);
    await expect(page.getByRole('status')).toContainText('¡Listo!');
    await expect(page.getByRole('status')).toContainText('Modo demo');
    await expect(page.locator('form.brief')).toHaveClass(/done/);
  });

  test('email inválido marca solo ese campo', async ({ page }) => {
    await page.goto('/contacto');
    await page.getByLabel('Nombre').fill('Ana');
    await page.getByLabel('Email').fill('ana@');
    await page.getByLabel('Tipo de proyecto').selectOption('App móvil');
    await page.getByRole('button', { name: 'Enviar brief' }).click();
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Nombre')).not.toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('API /api/contact (validación en servidor)', () => {
  test('payload válido → 200 demo', async ({ request }) => {
    const r = await request.post('/api/contact', { data: valid });
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({ ok: true, demo: true });
  });

  test('payload inválido → 422 con errores por campo', async ({ request }) => {
    const r = await request.post('/api/contact', { data: { ...valid, email: 'no-es-email', tipo: 'Hackeo', nombre: '' } });
    expect(r.status()).toBe(422);
    const j = await r.json();
    expect(Object.keys(j.fields).sort()).toEqual(['email', 'nombre', 'tipo']);
  });

  test('honeypot lleno → 200 silencioso sin envío', async ({ request }) => {
    const r = await request.post('/api/contact', { data: { ...valid, website: 'http://spam.example' } });
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
  });

  test('content-type no JSON → 415', async ({ request }) => {
    const r = await request.post('/api/contact', { headers: { 'content-type': 'text/plain' }, data: 'hola' });
    expect(r.status()).toBe(415);
  });

  test('origen cruzado → 403', async ({ request }) => {
    const r = await request.post('/api/contact', { data: valid, headers: { origin: 'https://evil.example' } });
    expect(r.status()).toBe(403);
  });

  test('payload gigante → 413', async ({ request }) => {
    const r = await request.post('/api/contact', { data: { ...valid, mensaje: 'x'.repeat(20000) } });
    expect(r.status()).toBe(413);
  });

  test('GET no permitido → 405', async ({ request }) => {
    const r = await request.get('/api/contact');
    expect(r.status()).toBe(405);
  });
});
