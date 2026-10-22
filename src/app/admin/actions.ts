'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminConfigured, createSession, safeEqual, SESSION_COOKIE, SESSION_TTL_S } from '@/lib/admin/session';

const tries = new Map<string, number[]>();
const WINDOW = 15 * 60 * 1000;

export async function login(_: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  if (!adminConfigured()) return { error: 'El panel está desactivado: faltan variables de entorno del servidor.' };
  const h = await headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  const now = Date.now();
  const list = (tries.get(ip) || []).filter((t) => now - t < WINDOW);
  if (list.length >= 5) return { error: 'Demasiados intentos. Espera 15 minutos.' };
  const pass = String(form.get('password') || '');
  if (!(await safeEqual(pass, process.env.ADMIN_PASSWORD!))) {
    list.push(now); tries.set(ip, list);
    return { error: 'Contraseña incorrecta.' };
  }
  tries.delete(ip);
  (await cookies()).set(SESSION_COOKIE, await createSession(), {
    httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' && !process.env.ADMIN_INSECURE_COOKIE, path: '/admin', maxAge: SESSION_TTL_S,
  });
  redirect('/admin');
}

export async function logout() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: '/admin' });
  redirect('/admin/login');
}
