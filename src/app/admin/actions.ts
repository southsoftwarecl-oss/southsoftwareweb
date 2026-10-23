'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { adminConfigured, createSession, safeEqual, SESSION_COOKIE, SESSION_TTL_S } from '@/lib/admin/session';
import { authMode } from '@/lib/supabase/env';
import { supabaseUser } from '@/lib/supabase/server';
import { currentAdmin } from '@/lib/admin/auth';
import { moveLead } from '@/lib/admin/leads';
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
