'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { adminConfigured, createSession, safeEqual, SESSION_COOKIE, SESSION_TTL_S } from '@/lib/admin/session';
import { authMode } from '@/lib/supabase/env';
import { supabaseUser } from '@/lib/supabase/server';
import { currentAdmin } from '@/lib/admin/auth';
import { moveLead, saveManualLead } from '@/lib/admin/leads';
import { METHODS, registerPayment, type MethodId } from '@/lib/admin/charges';
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
    if (!(await currentAdmin())) { await sb.auth.signOut(); return { error: 'Tu cuenta no tiene acceso al panel.' }; }
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

/** Mover desde el tablero (drag & drop, teclado o menú). Reglas validadas en servidor; devuelve error legible. */
export async function moveRequestTo(id: string, stage: string): Promise<{ ok: boolean; error?: string }> {
  const me = await currentAdmin();
  if (!me) return { ok: false, error: 'Tu sesión expiró. Vuelve a entrar.' };
  if (me.role === 'lectura') return { ok: false, error: 'Tu rol es de solo lectura.' };
  if (!/^[0-9a-f-]{36}$/i.test(id) || !STAGES.some((s) => s.id === stage)) return { ok: false, error: 'Movimiento no válido.' };
  if (stage === 'activo') return { ok: false, error: '“Activo” se asigna al dar de alta al cliente.' };
  const ok = await moveLead(id, stage as StageId);
  if (ok) revalidatePath('/admin/solicitudes');
  return ok ? { ok } : { ok, error: 'No se pudo mover. Intenta de nuevo.' };
}
