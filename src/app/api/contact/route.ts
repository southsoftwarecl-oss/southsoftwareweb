/**
 * POST /api/contact — recibe el brief del formulario y lo envía por Resend.
 *
 * Seguridad:
 *  - Solo JSON, máximo 16 KB, mismo origen (Origin/Host).
 *  - Validación estricta con zod (lib/contact-schema.ts): largos, email, opciones válidas.
 *  - Honeypot ("website"): si viene lleno, respondemos { ok: true } sin enviar (sin pistas al bot).
 *  - Tiempo mínimo para enviar (CONTACT_MIN_MS, medido desde que se mostró el formulario).
 *  - Rate limit básico en memoria (CONTACT_RATE_LIMIT envíos / 10 min por IP, por defecto 5).
 *    Con varias instancias es por instancia; si hiciera falta, pasar a Upstash/Redis o Cloudflare.
 *  - Cloudflare Turnstile: se verifica solo si TURNSTILE_SECRET_KEY existe.
 *
 * Envío: API REST de Resend (fetch, sin SDK) con RESEND_API_KEY (solo servidor, NUNCA NEXT_PUBLIC_).
 *  - from: South Software <formulario@southsoftware.cl>; to: CONTACT_TO_EMAIL (por defecto
 *    contacto@southsoftware.cl); reply_to: el email del visitante. Plantilla de marca en lib/email-template.ts.
 *  - Auto-reply al visitante ("Recibimos tu mensaje") desde contacto@southsoftware.cl, reply_to contacto@;
 *    no repite el mensaje del visitante. CONTACT_AUTOREPLY=0 lo desactiva. Si falla, el envío igual es ok.
 *  - Sin RESEND_API_KEY o si Resend falla → { ok: false, error } y la UI ofrece WhatsApp / email.
 *  - CONTACT_DRY_RUN=1 (SOLO tests e2e; ignorado en producción de Vercel): arma el correo y responde
 *    { ok: true, dryRun } sin llamar a Resend.
 * Panel: cada brief válido también se guarda en `requests` (lib/admin/leads.ts) antes de enviar el correo.
 * Ningún secreto llega al cliente.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { contactSchema, type ContactData } from '@/lib/contact-schema';
import { CONTACT_MIN_MS } from '@/lib/contact-rules';
import { BRAND } from '@/content/site';
import { renderAutoReply, renderContactNotification } from '@/lib/email-template';
import { hashIp, saveLead } from '@/lib/admin/leads';

const MAX_BYTES = 16 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const FROM = 'South Software <formulario@southsoftware.cl>';
const DEFAULT_TO = 'contacto@southsoftware.cl';
const AUTOREPLY_FROM = 'South Software <contacto@southsoftware.cl>';
const FALLBACK = `Escríbenos por WhatsApp o a ${BRAND.email}.`;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const max = Number(process.env.CONTACT_RATE_LIMIT) || 5;
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear(); // evita crecimiento ilimitado
  return list.length > max;
}

const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
/** Mensajes en español cuando falta un campo o viene con otro tipo (zod los da en inglés). */
const MISSING: Record<string, string> = { nombre: 'Ingresa tu nombre', email: 'Email no válido', tipo: 'Elige un tipo de proyecto' };

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

type Email = { from: string; to: string[]; reply_to: string; subject: string; html: string; text: string };

/** Aviso interno (plantilla de marca) + auto-reply al visitante (desde contacto@, sin repetir su mensaje). */
function buildEmails(d: ContactData, to: string): { notification: Email; autoReply: Email } {
  const n = renderContactNotification(d);
  const a = renderAutoReply(d);
  return {
    notification: { from: FROM, to: [to], reply_to: d.email, ...n },
    autoReply: { from: AUTOREPLY_FROM, to: [d.email], reply_to: BRAND.email, ...a },
  };
}

async function sendWithResend(email: Email, apiKey: string) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(email),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) console.error('[contact] Resend respondió', r.status, (await r.text().catch(() => '')).slice(0, 300));
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
  if (rateLimited(ip)) return json({ ok: false, error: `Demasiados envíos. Intenta en unos minutos. ${FALLBACK}` }, 429);

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return json({ ok: false, error: 'Mensaje demasiado largo.' }, 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return json({ ok: false, error: 'JSON inválido.' }, 400); }

  // honeypot lleno → OK silencioso, sin enviar (antes de validar: el bot no recibe pistas)
  if (body && typeof body === 'object' && 'website' in body && String((body as { website?: unknown }).website ?? '') !== '') return json({ ok: true });

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const iss of parsed.error.issues) {
      const k = String(iss.path[0]);
      if (!fields[k]) fields[k] = iss.code === 'invalid_type' ? MISSING[k] || 'Campo no válido' : iss.message;
    }
    return json({ ok: false, error: 'Revisa los campos marcados.', fields }, 422);
  }
  const data = parsed.data;

  // Enviado demasiado rápido (bots): el navegador real espera CONTACT_MIN_MS antes de enviar
  if (data.t < CONTACT_MIN_MS) return json({ ok: false, error: 'Envío demasiado rápido. Espera unos segundos e intenta de nuevo.' }, 400);

  const tsSecret = process.env.TURNSTILE_SECRET_KEY;
  if (tsSecret && !(await verifyTurnstile(data.turnstileToken, ip, tsSecret))) {
    return json({ ok: false, error: 'No pudimos verificar que eres una persona. Intenta de nuevo.' }, 400);
  }

  // Panel: guardar la solicitud (además del correo). Si falla, el correo igual sale: no se pierde el contacto.
  const stored = await saveLead({
    channel: 'form_contacto', name: data.nombre, email: data.email, phone: data.telefono || null, message: data.mensaje || null,
    payload: { nombre: data.nombre, empresa: data.empresa, email: data.email, telefono: data.telefono, tipo: data.tipo, presupuesto: data.presupuesto, mensaje: data.mensaje },
    ipHash: await hashIp(ip), userAgent: req.headers.get('user-agent'), referrer: req.headers.get('referer'),
  }).catch(() => false);
  if (!stored) console.error('[contact] la solicitud no quedó guardada en el panel');

  const { notification, autoReply } = buildEmails(data, (process.env.CONTACT_TO_EMAIL || '').trim() || DEFAULT_TO);
  const sendAutoReply = process.env.CONTACT_AUTOREPLY !== '0';

  // Solo tests: nunca en producción de Vercel
  if (process.env.CONTACT_DRY_RUN === '1' && process.env.VERCEL_ENV !== 'production') {
    return json({ ok: true, dryRun: notification, autoReply: sendAutoReply ? autoReply : null });
  }

  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    console.error('[contact] Falta RESEND_API_KEY: el mensaje no se envió');
    return json({ ok: false, error: `No pudimos enviar tu mensaje en este momento. ${FALLBACK}` }, 503);
  }
  const sent = await sendWithResend(notification, apiKey).catch((e) => { console.error('[contact] Error de red con Resend', String(e)); return false; });
  if (!sent) return json({ ok: false, error: `No pudimos enviar tu mensaje en este momento. ${FALLBACK}` }, 502);
  // La confirmación al visitante es secundaria: si falla, el brief ya llegó y respondemos ok igual.
  if (sendAutoReply) await sendWithResend(autoReply, apiKey).catch((e) => { console.error('[contact] Auto-reply falló', String(e)); return false; });
  return json({ ok: true });
}
