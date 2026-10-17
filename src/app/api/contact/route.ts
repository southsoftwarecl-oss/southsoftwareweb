/**
 * POST /api/contact — recibe el brief del formulario.
 *
 * Seguridad:
 *  - Solo JSON, máximo 16 KB, mismo origen (Origin/Host).
 *  - Validación estricta con zod (lib/contact-schema.ts); honeypot.
 *  - Rate limit básico en memoria (5 envíos / 10 min por IP). En producción
 *    con varias instancias, reemplazar por Upstash/Redis o Cloudflare.
 *  - Cloudflare Turnstile: se verifica solo si TURNSTILE_SECRET_KEY existe.
 *  - Envío por Resend (API HTTP) solo si RESEND_API_KEY y CONTACT_TO_EMAIL existen.
 *    Sin claves → modo demo: valida y responde { ok: true, demo: true } sin enviar.
 * Ningún secreto llega al cliente (solo variables NEXT_PUBLIC_*).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { contactSchema, type ContactData } from '@/lib/contact-schema';

const MAX_BYTES = 16 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = Number(process.env.CONTACT_RATE_LIMIT || 5);
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear(); // evita crecimiento ilimitado
  return list.length > MAX_PER_WINDOW;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function verifyTurnstile(token: string, ip: string, secret: string) {
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip !== 'unknown') body.set('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body, signal: AbortSignal.timeout(8000) });
    const d = (await r.json()) as { success?: boolean };
    return !!d.success;
  } catch { return false; }
}

async function sendWithResend(d: ContactData, apiKey: string, to: string) {
  const from = process.env.CONTACT_FROM_EMAIL || 'South Software <onboarding@resend.dev>';
  const rows: [string, string][] = [['Nombre', d.nombre], ['Empresa', d.empresa || '—'], ['Email', d.email], ['Tipo de proyecto', d.tipo], ['Presupuesto', d.presupuesto || '—'], ['Mensaje', d.mensaje || '—']];
  const html = `<h2>Nuevo brief desde southsoftware.cl</h2><table cellpadding="6">${rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], reply_to: d.email, subject: `Brief: ${d.tipo} — ${d.nombre}`.slice(0, 150), html, text }),
    signal: AbortSignal.timeout(10000),
  });
  return r.ok;
}

export async function POST(req: NextRequest) {
  // Mismo origen
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (origin) {
    try { if (new URL(origin).host !== host) return json({ ok: false, error: 'Origen no permitido.' }, 403); }
    catch { return json({ ok: false, error: 'Origen no permitido.' }, 403); }
  }
  if (!(req.headers.get('content-type') || '').includes('application/json')) return json({ ok: false, error: 'Formato no soportado.' }, 415);

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  if (rateLimited(ip)) return json({ ok: false, error: 'Demasiados envíos. Intenta en unos minutos o escríbenos por WhatsApp.' }, 429);

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return json({ ok: false, error: 'Mensaje demasiado largo.' }, 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return json({ ok: false, error: 'JSON inválido.' }, 400); }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const iss of parsed.error.issues) { const k = String(iss.path[0]); if (!fields[k]) fields[k] = iss.message; }
    // honeypot lleno → respondemos OK sin hacer nada (no damos pistas al bot)
    if (fields.website) return json({ ok: true });
    return json({ ok: false, error: 'Revisa los campos marcados.', fields }, 422);
  }
  const data = parsed.data;

  const tsSecret = process.env.TURNSTILE_SECRET_KEY;
  if (tsSecret && !(await verifyTurnstile(data.turnstileToken, ip, tsSecret))) {
    return json({ ok: false, error: 'No pudimos verificar que eres una persona. Intenta de nuevo.' }, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) return json({ ok: true, demo: true });

  const sent = await sendWithResend(data, apiKey, to).catch(() => false);
  if (!sent) return json({ ok: false, error: 'El servicio de correo no respondió. Escríbenos por WhatsApp o a contacto@southsoftware.cl.' }, 502);
  return json({ ok: true });
}
