'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authMode } from '@/lib/supabase/env';
import { supabaseUser } from '@/lib/supabase/server';

type S = { error?: string; ok?: string } | undefined;
const hits = new Map<string, number[]>();
async function limited(key: string, max: number) {
  const ip = ((await headers()).get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  const k = key + ':' + ip, now = Date.now();
  const l = (hits.get(k) || []).filter((t) => now - t < 15 * 60_000); l.push(now); hits.set(k, l);
  return l.length > max;
}

/** Pide el correo de recuperación. Respuesta siempre genérica (no revela si el correo existe). */
export async function requestReset(_: S, form: FormData): Promise<S> {
  if (authMode() !== 'supabase') return { error: 'La recuperación de contraseña no está disponible en este entorno.' };
  const email = String(form.get('email') || '').trim().slice(0, 160);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Ingresa un correo válido.' };
  if (await limited('reset', 3)) return { error: 'Demasiados intentos. Espera 15 minutos.' };
  const sb = await supabaseUser();
  await sb.auth.resetPasswordForEmail(email).catch(() => null);
  return { ok: 'Si el correo pertenece al equipo, te enviamos un enlace para crear una nueva contraseña. Revisa tu bandeja (y spam).' };
}

/** Crea / cambia la contraseña del usuario con sesión (tras invitación o recuperación). */
export async function setPassword(_: S, form: FormData): Promise<S> {
  if (authMode() !== 'supabase') return { error: 'No disponible en este entorno.' };
  const p1 = String(form.get('password') || ''), p2 = String(form.get('confirm') || '');
  if (p1.length < 10) return { error: 'La contraseña debe tener al menos 10 caracteres.' };
  if (p1.length > 72) return { error: 'Máximo 72 caracteres.' };
  if (!/[A-Za-z]/.test(p1) || !/\d/.test(p1)) return { error: 'Usa letras y números.' };
  if (p1 !== p2) return { error: 'Las contraseñas no coinciden.' };
  const sb = await supabaseUser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'El enlace expiró. Pide uno nuevo en “¿Olvidaste tu contraseña?”.' };
  const { error } = await sb.auth.updateUser({ password: p1 });
  if (error) return { error: error.code === 'same_password' ? 'Usa una contraseña distinta a la anterior.' : 'No se pudo guardar la contraseña. Intenta de nuevo.' };
  redirect('/admin');
}
