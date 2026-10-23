'use server';
/** MFA TOTP (Supabase Auth). Enrolar ANTES de activar ADMIN_REQUIRE_MFA. Nada de esto toca configuración del proyecto. */
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { authMode } from '@/lib/supabase/env';
import { supabaseUser } from '@/lib/supabase/server';
import { adminStatus, mfaEnforced } from '@/lib/admin/auth';

export type EnrollStart = { factorId?: string; qr?: string; secret?: string; error?: string };
export type MfaResult = { ok?: boolean; error?: string } | undefined;
const CODE = /^\d{6}$/;
const clean = (v: FormDataEntryValue | null) => String(v || '').replace(/\s+/g, '');

/** Sesión del equipo con contraseña válida (aal1 basta: es la forma de enrolarse antes/durante la exigencia). */
async function staffSb() {
  if (authMode() !== 'supabase') return null;
  const st = await adminStatus();
  if (!st.me && !st.needMfa) return null;
  return { sb: await supabaseUser(), st };
}

export async function mfaStart(): Promise<EnrollStart> {
  const c = await staffSb();
  if (!c) return { error: 'La verificación en dos pasos requiere iniciar sesión con tu cuenta del equipo.' };
  // Con exigencia activa y un factor ya verificado, agregar otro exige haber entrado con el 2.º paso.
  if (c.st.needMfa && c.st.hasFactor) return { error: 'Primero verifica con tu app de autenticación.' };
  const { data: list } = await c.sb.auth.mfa.listFactors();
  for (const f of list?.all || []) if (f.status === 'unverified') await c.sb.auth.mfa.unenroll({ factorId: f.id }); // limpia intentos a medias
  const name = 'Panel ' + new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', dateStyle: 'short', timeStyle: 'short' }).format(new Date());
  const { data, error } = await c.sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: name, issuer: 'South Software' });
  if (error || !data) return { error: 'No se pudo iniciar el registro. Intenta de nuevo.' };
  // supabase-js entrega `data:image/svg+xml;utf-8,<svg…>` sin codificar; un "#" en el SVG corta el data URI. Se re-codifica.
  const raw = data.totp.qr_code.replace(/^data:image\/svg\+xml;utf-8,/, '');
  const qr = raw.startsWith('<') ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(raw) : data.totp.qr_code;
  return { factorId: data.id, qr, secret: data.totp.secret };
}

export async function mfaConfirm(factorId: string, _prev: MfaResult, form: FormData): Promise<MfaResult> {
  const code = clean(form.get('code'));
  if (!CODE.test(code)) return { error: 'Ingresa los 6 dígitos que muestra tu app.' };
  const c = await staffSb();
  if (!c) return { error: 'Tu sesión expiró. Vuelve a iniciar sesión.' };
  const { error } = await c.sb.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { error: 'Código incorrecto o vencido. Revisa la hora de tu teléfono y prueba con el siguiente.' };
  revalidatePath('/admin/seguridad');
  return { ok: true };
}

export async function mfaRemove(factorId: string): Promise<MfaResult> {
  const st = await adminStatus();
  if (!st.me || authMode() !== 'supabase') return { error: 'Sin permiso.' };
  const sb = await supabaseUser();
  const { data } = await sb.auth.mfa.listFactors();
  const verified = (data?.totp || []).filter((f) => f.status === 'verified');
  if (mfaEnforced() && verified.length <= 1) return { error: 'Con la verificación obligatoria activa no puedes quitar tu único factor (te quedarías sin acceso).' };
  const { error } = await sb.auth.mfa.unenroll({ factorId });
  if (error) return { error: 'No se pudo quitar. Para quitar un factor debes haber entrado con el 2.º paso.' };
  revalidatePath('/admin/seguridad');
  return { ok: true };
}

/** 2.º paso al entrar (solo se usa con ADMIN_REQUIRE_MFA=1). */
export async function mfaChallenge(_prev: MfaResult, form: FormData): Promise<MfaResult> {
  const code = clean(form.get('code'));
  if (!CODE.test(code)) return { error: 'Ingresa los 6 dígitos que muestra tu app.' };
  const c = await staffSb();
  if (!c) redirect('/admin/login?e=acceso');
  const { data } = await c.sb.auth.mfa.listFactors();
  const f = (data?.totp || []).find((x) => x.status === 'verified');
  if (!f) return { error: 'No tienes un factor registrado.' };
  const { error } = await c.sb.auth.mfa.challengeAndVerify({ factorId: f.id, code });
  if (error) return { error: 'Código incorrecto o vencido.' };
  redirect('/admin');
}
