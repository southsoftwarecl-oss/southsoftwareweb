import { expect, test, type Page } from '@playwright/test';

/**
 * Formulario de contacto → /api/contact → Resend (REST).
 * - baseURL: CONTACT_DRY_RUN=1 → la ruta arma el correo y responde { ok, dryRun } sin llamar a Resend.
 * - NOKEY_BASE (servidor GA, sin RESEND_API_KEY ni dry-run): error 503 + alternativas WhatsApp/email.
 */
const PORT = Number(process.env.E2E_PORT || 3300);
const NOKEY_BASE = `http://localhost:${Number(process.env.E2E_GA_PORT || PORT + 1)}`;
const valid = { nombre: 'Prueba E2E', empresa: 'Test SpA', email: 'prueba@example.com', tipo: 'Sitio web', presupuesto: 'Aún no lo sé', mensaje: 'Hola', website: '', turnstileToken: '', t: 5000 };

/** Cuenta los eventos de lead (trackLead → 'south:lead') que emite la página. */
async function countLeads(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __leads: string[] };
    w.__leads = [];
    window.addEventListener('south:lead', (e) => w.__leads.push(String((e as CustomEvent).detail?.form)));
  });
  return () => page.evaluate(() => (window as unknown as { __leads: string[] }).__leads);
}

async function fillBrief(page: Page) {
  await page.getByLabel('Nombre').fill('Prueba E2E');
  await page.getByLabel('Empresa').fill('Test SpA');
  await page.getByLabel('Email', { exact: true }).fill('prueba@example.com');
  await page.getByRole('radio', { name: 'Software a medida' }).check();
  await page.getByRole('radio', { name: 'Aún no lo sé' }).check();
  await page.getByLabel('Cuéntanos tu idea').fill('Necesito un sistema de inventario.');
}

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

  test('envío válido → éxito, lead registrado y payload con tiempo mínimo', async ({ page }) => {
    const leads = await countLeads(page);
    await page.goto('/contacto');
    await fillBrief(page);
    const reqP = page.waitForRequest('**/api/contact');
    const resP = page.waitForResponse('**/api/contact');
    await page.getByRole('button', { name: 'Enviar brief' }).click();
    const body = (await reqP).postDataJSON() as { t: number; website: string };
    expect(body.t).toBeGreaterThanOrEqual(3000);
    expect(body.website).toBe('');
    const res = await resP;
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
    const ok = page.locator('form.brief .recv');
    await expect(ok).toContainText('Recibido', { timeout: 15000 });
    await expect(ok).not.toContainText('Modo demo');
    await expect(page.locator('form.brief')).toHaveClass(/done/);
    expect(await leads()).toEqual(['contacto']);
  });

  test('error del servidor (Resend caído) → mensaje amable + WhatsApp/email, sin lead', async ({ page }) => {
    const leads = await countLeads(page);
    await page.route('**/api/contact', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'No pudimos enviar tu mensaje en este momento. Escríbenos por WhatsApp o a contacto@southsoftware.cl.' }) }));
    await page.goto('/contacto');
    await fillBrief(page);
    await page.getByRole('button', { name: 'Enviar brief' }).click();
    const ko = page.locator('form.brief .ko');
    await expect(ko).toContainText('No pudimos enviar tu mensaje', { timeout: 15000 });
    await expect(ko.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/56964710361\?text=/);
    await expect(ko.getByRole('link', { name: 'contacto@southsoftware.cl' })).toHaveAttribute('href', 'mailto:contacto@southsoftware.cl');
    await expect(page.locator('form.brief')).not.toHaveClass(/done/);
    await expect(page.getByRole('button', { name: 'Enviar brief' })).toBeEnabled();
    // las alternativas de siempre siguen ahí
    await expect(page.getByRole('link', { name: 'Enviar por WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/56964710361\?text=/);
    await expect(page.locator('form.brief')).toHaveAttribute('action', 'mailto:contacto@southsoftware.cl');
    expect(await leads()).toEqual([]);
  });

  test('home: envío válido → éxito; error → alternativas', async ({ page }) => {
    const leads = await countLeads(page);
    await page.goto('/');
    const form = page.locator('form.brief').first();
    await form.scrollIntoViewIfNeeded();
    await form.getByLabel('Nombre').fill('Prueba E2E');
    await form.getByLabel('Email', { exact: true }).fill('prueba@example.com');
    await form.getByLabel('Tipo de proyecto').selectOption('Sitio web');
    const resP = page.waitForResponse('**/api/contact');
    await form.getByRole('button', { name: 'Enviar brief' }).click();
    expect((await resP).status()).toBe(200);
    await expect(form.locator('.ok')).toContainText('¡Listo!', { timeout: 15000 });
    expect(await leads()).toEqual(['home']);

    await page.route('**/api/contact', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'No pudimos enviar tu mensaje en este momento.' }) }));
    await page.reload();
    const f2 = page.locator('form.brief').first();
    await f2.scrollIntoViewIfNeeded();
    await f2.getByLabel('Nombre').fill('Prueba E2E');
    await f2.getByLabel('Email', { exact: true }).fill('prueba@example.com');
    await f2.getByLabel('Tipo de proyecto').selectOption('Sitio web');
    await f2.getByRole('button', { name: 'Enviar brief' }).click();
    await expect(f2.locator('.ko')).toContainText('No pudimos enviar', { timeout: 15000 });
    await expect(f2.locator('.ko').getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/56964710361/);
    await expect(f2.locator('.ko').getByRole('link', { name: 'contacto@southsoftware.cl' })).toBeVisible();
    expect(await leads()).toEqual([]);
  });

  test('email inválido marca solo ese campo', async ({ page }) => {
    await page.goto('/contacto');
    await page.getByLabel('Nombre').fill('Ana');
    await page.getByLabel('Email', { exact: true }).fill('ana@');
    await page.getByRole('radio', { name: 'App móvil' }).check();
    await page.getByRole('button', { name: 'Enviar brief' }).click();
    await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Nombre')).not.toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('API /api/contact (validación en servidor)', () => {
  test('payload válido → 200 y correo armado (dry-run): from, to, reply_to', async ({ request }) => {
    const r = await request.post('/api/contact', { data: valid });
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(j.dryRun).toMatchObject({ from: 'South Software <formulario@southsoftware.cl>', to: ['contacto@southsoftware.cl'], reply_to: 'prueba@example.com', subject: 'Nueva solicitud: Sitio web — Prueba E2E' });
    expect(j.dryRun.text).toContain('Empresa:     Test SpA');
    expect(j.dryRun.html).toContain('Nueva solicitud desde southsoftware.cl');
    expect(j.dryRun.html).toContain('https://southsoftware.cl/email/logo.png');
    expect(j.dryRun.html).toContain('href="mailto:prueba@example.com?subject=');
    expect(j.dryRun.html).toContain('Responder a Prueba');
    expect(j.dryRun.html).not.toContain('wa.me/');
    for (const s of ['contacto@southsoftware.cl', '+56 9 6471 0361', '@southsoftwarecl']) expect(j.dryRun.html).toContain(s);
    expect(j.dryRun.html).not.toMatch(/purple|violet|#8b5cf6|#a855f7/i);
    // auto-reply al visitante
    expect(j.autoReply).toMatchObject({ from: 'South Software <contacto@southsoftware.cl>', to: ['prueba@example.com'], reply_to: 'contacto@southsoftware.cl', subject: 'Recibimos tu mensaje · South Software' });
    expect(j.autoReply.html).toContain('Hola Prueba,');
    expect(j.autoReply.text).toContain('24 horas hábiles');
  });

  test('teléfono → botón de WhatsApp; auto-reply no repite el mensaje ni nombres raros', async ({ request }) => {
    const r = await request.post('/api/contact', { data: { ...valid, telefono: '9 6471 0000', nombre: 'http://spam.example oferta', mensaje: 'Compra en http://spam.example' } });
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j.dryRun.html).toContain('href="https://wa.me/56964710000"');
    expect(j.dryRun.text).toContain('WhatsApp: https://wa.me/56964710000');
    expect(j.autoReply.html).not.toContain('spam.example');
    expect(j.autoReply.text).not.toContain('spam.example');
    expect(j.autoReply.text).toContain('Hola,');
  });

  test('campos faltantes → mensajes en español', async ({ request }) => {
    const r = await request.post('/api/contact', { data: {} });
    expect(r.status()).toBe(422);
    expect((await r.json()).fields).toEqual({ nombre: 'Ingresa tu nombre', email: 'Email no válido', tipo: 'Elige un tipo de proyecto' });
  });

  test('logo del correo publicado (/email/logo.png @2x)', async ({ request }) => {
    const r = await request.get('/email/logo.png');
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toContain('image/png');
  });

  test('HTML escapado y asunto en una línea', async ({ request }) => {
    const r = await request.post('/api/contact', { data: { ...valid, nombre: '<b>Ana</b>\nX', mensaje: '<script>alert(1)</script>\n"hola" & chao' } });
    expect(r.status()).toBe(200);
    const { dryRun } = await r.json();
    expect(dryRun.html).not.toContain('<script>');
    expect(dryRun.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;<br>&quot;hola&quot; &amp; chao');
    expect(dryRun.html).toContain('&lt;b&gt;Ana&lt;/b&gt;');
    expect(dryRun.subject).not.toMatch(/[\r\n]/);
    expect(dryRun.text).toContain('<script>alert(1)</script>');
  });

  test('payload inválido → 422 con errores por campo', async ({ request }) => {
    const r = await request.post('/api/contact', { data: { ...valid, email: 'no-es-email', tipo: 'Hackeo', nombre: '' } });
    expect(r.status()).toBe(422);
    const j = await r.json();
    expect(j.ok).toBe(false);
    expect(Object.keys(j.fields).sort()).toEqual(['email', 'nombre', 'tipo']);
  });

  test('largos máximos → 422', async ({ request }) => {
    const r = await request.post('/api/contact', { data: { ...valid, nombre: 'a'.repeat(81), empresa: 'b'.repeat(121), mensaje: 'c'.repeat(4001) } });
    expect(r.status()).toBe(422);
    expect(Object.keys((await r.json()).fields).sort()).toEqual(['empresa', 'mensaje', 'nombre']);
  });

  test('honeypot lleno → 200 silencioso sin envío', async ({ request }) => {
    const r = await request.post('/api/contact', { data: { ...valid, website: 'http://spam.example' } });
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
  });

  test('envío demasiado rápido (o sin tiempo) → 400', async ({ request }) => {
    for (const t of [200, undefined]) {
      const r = await request.post('/api/contact', { data: { ...valid, t } });
      expect(r.status()).toBe(400);
      expect(await r.json()).toMatchObject({ ok: false, error: expect.stringContaining('demasiado rápido') });
    }
  });

  test('sin RESEND_API_KEY → 503 con mensaje amable y alternativas', async ({ request }) => {
    const r = await request.post(`${NOKEY_BASE}/api/contact`, { data: valid });
    expect(r.status()).toBe(503);
    const j = await r.json();
    expect(j.ok).toBe(false);
    expect(j.error).toContain('WhatsApp');
    expect(j.error).toContain('contacto@southsoftware.cl');
    expect(j.dryRun).toBeUndefined();
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

test.describe('Instagram oficial (@southsoftwarecl)', () => {
  const IG = 'https://www.instagram.com/southsoftwarecl';
  test('footer, /contacto y JSON-LD sameAs; sin otras redes', async ({ page }) => {
    for (const path of ['/', '/contacto']) {
      await page.goto(path);
      const ft = page.locator('footer').getByRole('link', { name: 'Instagram de South Software (@southsoftwarecl)' });
      await expect(ft).toHaveAttribute('href', IG);
      await expect(ft).toHaveAttribute('target', '_blank');
      await expect(ft).toHaveAttribute('rel', 'me noopener');
      await expect(ft.locator('svg')).toHaveCount(1);
      // ninguna otra red social (perfiles inexistentes)
      const social = await page.locator('a[href*="instagram.com"], a[href*="facebook.com"], a[href*="linkedin.com"], a[href*="twitter.com"], a[href*="x.com/"], a[href*="tiktok.com"], a[href*="youtube.com"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
      expect(social.every((h) => h === IG)).toBe(true);
      const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
      const org = ld.map((t) => JSON.parse(t)).find((j) => j['@id']?.endsWith('/#org'));
      expect(org?.sameAs).toEqual([IG]);
    }
    const ch = page.locator('.channels').getByRole('link', { name: 'Instagram de South Software (@southsoftwarecl)' });
    await expect(ch).toHaveAttribute('href', IG);
    await expect(ch).toHaveAttribute('rel', 'me noopener');
    await expect(ch).toBeVisible();
  });
});
