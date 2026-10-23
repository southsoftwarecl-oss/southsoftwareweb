'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { adminConfigured, createSession, safeEqual, SESSION_COOKIE, SESSION_TTL_S } from '@/lib/admin/session';
import { authMode } from '@/lib/supabase/env';
import { supabaseUser } from '@/lib/supabase/server';
import { adminStatus, currentAdmin } from '@/lib/admin/auth';
import { moveLead, saveManualLead } from '@/lib/admin/leads';
import { METHODS, registerPayment, type MethodId } from '@/lib/admin/charges';
import { createQuote, listQuotes, newVersion, quoteState, setVersionStatus } from '@/lib/admin/quotes';
import { loginAllowed, loginFailed, loginKey, loginSucceeded } from '@/lib/admin/ratelimit';
import { STAGES, type StageId } from '@/lib/admin/model';


export async function login(_: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  const key = await loginKey(ip);
  if (!(await loginAllowed(key))) return { error: 'Demasiados intentos. Espera 15 minutos.' };
  const pass = String(form.get('password') || '');

  if (authMode() === 'supabase') {
    const email = String(form.get('email') || '').trim().slice(0, 160);
    const sb = await supabaseUser();
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) { await loginFailed(key); return { error: 'Correo o contraseña incorrectos.' }; }
    const st = await adminStatus();
    if (st.needMfa) { loginSucceeded(key); redirect('/admin/mfa'); }
    if (!st.me) { await sb.auth.signOut(); return { error: 'Tu cuenta no tiene acceso al panel.' }; }
    loginSucceeded(key);
    redirect('/admin');
  }

  if (!adminConfigured()) return { error: 'El panel está desactivado: faltan variables de entorno del servidor.' };
  if (!(await safeEqual(pass, process.env.ADMIN_PASSWORD!))) {
    await loginFailed(key);
    return { error: 'Contraseña incorrecta.' };
  }
  loginSucceeded(key);
  (await cookies()).set(SESSION_COOKIE, await createSession(), {
    httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' && !process.env.ADMIN_INSECURE_COOKIE, path: '/admin', maxAge: SESSION_TTL_S,
  });
  redirect('/admin');
}

export async function logout() {
  if (authMode() === 'supabase') await (await supabaseUser()).auth.signOut({ scope: 'global' });
  (await cookies()).delete({ name: SESSION_COOKIE, path: '/admin' });
  redirect('/admin/login');
}

/** Mover una solicitud de etapa (kanban). "Activo" solo vía "Dar de alta" (fase 3). */
export async function moveRequest(form: FormData) {
  const me = await currentAdmin();
  if (!me || me.role === 'lectura') return;
  const id = String(form.get('id') || '');
  const stage = String(form.get('stage') || '') as StageId;
  if (!STAGES.some((s) => s.id === stage) || stage === 'activo' || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await moveLead(id, stage);
  revalidatePath('/admin/solicitudes');
}

export type FormState = { error?: string; ok?: string; fields?: Record<string, string> } | undefined;
const str = (f: FormData, k: string, max = 200) => String(f.get(k) || '').trim().slice(0, max);

/** + Crear → Nueva solicitud (canal manual). Solo owner/admin/ventas (también lo exige RLS). */
export async function createManualRequest(_: FormState, form: FormData): Promise<FormState> {
  const me = await currentAdmin();
  if (!me || me.role === 'lectura') return { error: 'Tu rol no puede crear solicitudes.' };
  const name = str(form, 'name', 120), email = str(form, 'email', 160), phone = str(form, 'phone', 40);
  const company = str(form, 'company', 120), pack = str(form, 'pack', 80), message = str(form, 'message', 2000), source = str(form, 'source', 40);
  const fields = { name, email, phone, company, pack, message, source };
  if (!name) return { error: 'Escribe el nombre de la persona o empresa.', fields };
  if (!email && !phone) return { error: 'Agrega al menos un correo o un teléfono.', fields };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'El correo no parece válido.', fields };
  const ok = await saveManualLead({ name, email: email || null, phone: phone || null, message: message || null, pack: pack || null, payload: { empresa: company || undefined, origen: source || 'manual', creado_por: me.email ?? 'equipo' } });
  if (!ok) return { error: 'No se pudo guardar. Intenta de nuevo.', fields };
  revalidatePath('/admin/solicitudes'); revalidatePath('/admin');
  redirect('/admin/solicitudes?creada=1');
}

/** + Crear → Registrar pago sobre un cobro existente (total o parcial, cualquier medio). RLS: owner/admin. */
export async function recordPayment(_: FormState, form: FormData): Promise<FormState> {
  const me = await currentAdmin();
  if (!me || (me.role !== 'owner' && me.role !== 'admin')) return { error: 'Solo dueño o administrador pueden registrar pagos.' };
  const chargeId = str(form, 'charge', 40), method = str(form, 'method', 20) as MethodId, paidOn = str(form, 'paid_on', 10), note = str(form, 'note', 300);
  const amount = Number(str(form, 'amount', 15).replace(/[^\d]/g, ''));
  const fields = { charge: chargeId, method, paid_on: paidOn, note, amount: amount ? String(amount) : '' };
  if (!/^[0-9a-z-]{8,40}$/i.test(chargeId)) return { error: 'Elige el cobro.', fields };
  if (!METHODS.some((m) => m.id === method)) return { error: 'Elige el medio de pago.', fields };
  if (!Number.isSafeInteger(amount) || amount <= 0) return { error: 'Ingresa un monto mayor a cero.', fields };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) return { error: 'Ingresa la fecha del pago.', fields };
  if (method === 'otro' && !note) return { error: 'Con "Otro", describe el medio en la nota.', fields };
  const r = await registerPayment({ chargeId, amount, paidOn, method, note: note || null });
  if (!r.ok) return { error: r.error, fields };
  revalidatePath('/admin/cobros'); revalidatePath('/admin');
  return { ok: r.status === 'pagado' ? 'Pago registrado. El cobro quedó pagado.' : 'Pago parcial registrado. El cobro quedó con saldo pendiente.' };
}

/** Mover desde el tablero (drag & drop, teclado o menú). Reglas validadas en servidor (y en BD con 0005). */
export async function moveRequestTo(id: string, stage: string, extra: { meetingAt?: string; reason?: string } = {}): Promise<{ ok: boolean; error?: string; need?: 'fecha' | 'motivo' | 'cotizacion' | 'aceptada' }> {
  const me = await currentAdmin();
  if (!me) return { ok: false, error: 'Tu sesión expiró. Vuelve a entrar.' };
  if (me.role === 'lectura') return { ok: false, error: 'Tu rol es de solo lectura.' };
  if (!UUID.test(id) || !STAGES.some((s) => s.id === stage)) return { ok: false, error: 'Movimiento no válido.' };
  if (stage === 'activo') return { ok: false, error: '“Activo” se asigna al dar de alta al cliente.' };
  const clean: { meetingAt?: string; reason?: string } = {};
  if (stage === 'reunion') {
    const d = extra.meetingAt ? new Date(extra.meetingAt) : null;
    if (!d || Number.isNaN(d.getTime())) return { ok: false, need: 'fecha', error: 'Para pasar a Reunión indica fecha y hora.' };
    clean.meetingAt = d.toISOString();
  }
  if (stage === 'cancelado') {
    const r = (extra.reason || '').trim().slice(0, 300);
    if (!r) return { ok: false, need: 'motivo', error: 'Para cancelar indica el motivo.' };
    clean.reason = r;
  }
  if (stage === 'propuesta' || stage === 'aceptado') {
    const q = await quoteState(id);
    if (stage === 'propuesta' && !q.any) return { ok: false, need: 'cotizacion', error: 'Para pasar a Propuesta crea primero una cotización.' };
    if (stage === 'aceptado' && !q.accepted) return { ok: false, need: 'aceptada', error: 'Para pasar a Aceptado marca una cotización como aceptada.' };
  }
  const ok = await moveLead(id, stage as StageId, clean);
  if (ok) revalidatePath('/admin/solicitudes');
  return ok ? { ok } : { ok, error: 'No se pudo mover. Intenta de nuevo.' };
}

const UUID = /^[0-9a-f-]{36}$/i;
const canWrite = async () => { const me = await currentAdmin(); return !!me && me.role !== 'lectura'; };
const parseDraft = (d: { items?: unknown; setup?: unknown; monthly?: unknown; notes?: unknown }) => {
  const items = (Array.isArray(d.items) ? d.items : []).map((x) => String(x).trim().slice(0, 200)).filter(Boolean).slice(0, 40);
  const setup = Math.round(Number(d.setup) || 0), monthly = Math.round(Number(d.monthly) || 0);
  if (!items.length) return { error: 'Agrega al menos un ítem.' } as const;
  if (setup < 0 || monthly < 0 || !Number.isSafeInteger(setup) || !Number.isSafeInteger(monthly)) return { error: 'Montos no válidos.' } as const;
  if (setup === 0 && monthly === 0) return { error: 'Indica pago inicial o mensualidad.' } as const;
  return { draft: { items, setup, monthly, notes: d.notes ? String(d.notes).trim().slice(0, 2000) : null } } as const;
};

export async function getQuotes(requestId: string) {
  if (!(await currentAdmin()) || !UUID.test(requestId)) return { quotes: [], error: 'Sin acceso.' };
  return listQuotes(requestId);
}
export async function addQuote(requestId: string, title: string, d: { items: string[]; setup: number; monthly: number; notes?: string }) {
  if (!(await canWrite())) return { ok: false, error: 'Tu rol no puede crear cotizaciones.' };
  if (!UUID.test(requestId)) return { ok: false, error: 'Solicitud no válida.' };
  const p = parseDraft(d); if ('error' in p) return { ok: false, error: p.error };
  return createQuote(requestId, (title || 'Cotización').trim().slice(0, 160), p.draft);
}
export async function addQuoteVersion(quoteId: string, d: { items: string[]; setup: number; monthly: number; notes?: string }) {
  if (!(await canWrite())) return { ok: false, error: 'Tu rol no puede editar cotizaciones.' };
  if (!UUID.test(quoteId)) return { ok: false, error: 'Cotización no válida.' };
  const p = parseDraft(d); if ('error' in p) return { ok: false, error: p.error };
  return newVersion(quoteId, p.draft);
}
export async function decideQuote(versionId: string, status: string) {
  if (!(await canWrite())) return { ok: false, error: 'Tu rol no puede cambiar cotizaciones.' };
  if (!UUID.test(versionId) || !['enviada', 'aceptada', 'rechazada'].includes(status)) return { ok: false, error: 'Cambio no válido.' };
  return setVersionStatus(versionId, status as 'enviada' | 'aceptada' | 'rechazada');
}
