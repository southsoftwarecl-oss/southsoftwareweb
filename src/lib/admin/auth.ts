/** ¿Quién está en el panel? Verificación SIEMPRE en servidor. */
import { cookies } from 'next/headers';
import { authMode } from '@/lib/supabase/env';
import { supabaseUser } from '@/lib/supabase/server';
import { SESSION_COOKIE, verifySession } from './session';

export type AdminUser = { email: string | null; name: string | null; role: 'owner' | 'admin' | 'ventas' | 'lectura' };

/** ¿Está activa la exigencia de MFA (aal2)? Solo con ADMIN_REQUIRE_MFA=1 y en modo Supabase. */
export const mfaEnforced = () => process.env.ADMIN_REQUIRE_MFA === '1' && authMode() === 'supabase';

/**
 * Estado completo: `me` = acceso concedido; `needMfa` = es del equipo con contraseña correcta pero falta el 2.º paso
 * (o enrolarse, si aún no tiene factor: así el owner nunca queda bloqueado al activar la exigencia).
 */
export async function adminStatus(): Promise<{ me: AdminUser | null; needMfa: boolean; hasFactor: boolean }> {
  if (authMode() === 'password') {
    const ok = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
    return { me: ok ? { email: null, name: null, role: 'owner' } : null, needMfa: false, hasFactor: false };
  }
  const sb = await supabaseUser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { me: null, needMfa: false, hasFactor: false };
  // Rol propio desde public.staff (RLS: solo el equipo ve filas de staff). Helpers de RLS viven en el esquema privado.
  const { data, error } = await sb.from('staff').select('role,display_name').eq('user_id', user.id).maybeSingle();
  if (error || !data) return { me: null, needMfa: false, hasFactor: false }; // autenticado pero no es parte del equipo
  const hasFactor = (user.factors || []).some((f) => f.status === 'verified');
  if (mfaEnforced()) {
    const { data: a } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (a?.currentLevel !== 'aal2') return { me: null, needMfa: true, hasFactor };
  }
  return { me: { email: user.email ?? null, name: (data as { display_name?: string | null }).display_name?.trim() || null, role: data.role as AdminUser['role'] }, needMfa: false, hasFactor };
}

export async function currentAdmin(): Promise<AdminUser | null> {
  return (await adminStatus()).me;
}
