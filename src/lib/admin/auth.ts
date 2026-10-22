/** ¿Quién está en el panel? Verificación SIEMPRE en servidor. */
import { cookies } from 'next/headers';
import { authMode } from '@/lib/supabase/env';
import { supabaseUser } from '@/lib/supabase/server';
import { SESSION_COOKIE, verifySession } from './session';

export type AdminUser = { email: string | null; role: 'owner' | 'admin' | 'ventas' | 'lectura' };

export async function currentAdmin(): Promise<AdminUser | null> {
  if (authMode() === 'password') {
    return (await verifySession((await cookies()).get(SESSION_COOKIE)?.value)) ? { email: null, role: 'owner' } : null;
  }
  const sb = await supabaseUser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  if (process.env.ADMIN_REQUIRE_MFA === '1') {
    const { data } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.currentLevel !== 'aal2') return null;
  }
  const { data: role, error } = await sb.rpc('staff_role');
  if (error || !role) return null; // autenticado pero no es parte del equipo
  return { email: user.email ?? null, role };
}
