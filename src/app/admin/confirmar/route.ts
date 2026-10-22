/**
 * GET /admin/confirmar?token_hash=…&type=invite|recovery — enlace de los correos de invitación y recuperación.
 * Verifica el token en Supabase (servidor), deja la sesión en cookies y lleva a "Crear contraseña".
 */
import { NextResponse, type NextRequest } from 'next/server';
import { authMode } from '@/lib/supabase/env';
import { supabaseUser } from '@/lib/supabase/server';

const TYPES = new Set(['invite', 'recovery']);

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const token = url.searchParams.get('token_hash') || '';
  const type = url.searchParams.get('type') || '';
  const go = (path: string, search = '') => { const u = url.clone(); u.pathname = path; u.search = search; return NextResponse.redirect(u); };
  if (authMode() !== 'supabase' || !token || token.length > 512 || !TYPES.has(type)) return go('/admin/login', '?e=enlace');
  const sb = await supabaseUser();
  const { error } = await sb.auth.verifyOtp({ token_hash: token, type: type as 'invite' | 'recovery' });
  if (error) return go('/admin/login', '?e=enlace');
  return go('/admin/clave', type === 'invite' ? '?nuevo=1' : '');
}
