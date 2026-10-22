/**
 * Protege /admin/** (salvo /admin/login). Modo Supabase: refresca la sesión (cookies) y exige usuario; el rol se verifica en el servidor (Guard).
 * Modo contraseña (fase 1): exige la cookie firmada.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SESSION_COOKIE, verifySession } from '@/lib/admin/session';
import { authMode, sbPublishable, sbUrl } from '@/lib/supabase/env';

function toLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest) {
  const isLogin = req.nextUrl.pathname === '/admin/login';
  if (authMode() === 'password') {
    if (isLogin || (await verifySession(req.cookies.get(SESSION_COOKIE)?.value))) return NextResponse.next();
    return toLogin(req);
  }
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(sbUrl(), sbPublishable(), {
    cookieOptions: { path: '/admin', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && !process.env.ADMIN_INSECURE_COOKIE },
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user && !isLogin) return toLogin(req);
  return res;
}

export const config = { matcher: ['/admin', '/admin/:path*'] };
