import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { sbPublishable, sbUrl, serverSecretKey } from './env';

const url = sbUrl;
const pub = sbPublishable;

/** Cliente con la sesión del usuario del panel (RLS por rol). Cookies limitadas a /admin. */
export async function supabaseUser() {
  const store = await cookies();
  return createServerClient(url(), pub(), {
    cookieOptions: { path: '/admin', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && !process.env.ADMIN_INSECURE_COOKIE },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Server Component: lo refresca el proxy */ } },
    },
  });
}

/** Cliente para escribir solicitudes desde la web: secret key si existe; si no, publishable (política solo-INSERT). */
export function supabaseWriter() {
  const secret = serverSecretKey();
  return { client: createClient(url(), secret || pub(), { auth: { persistSession: false, autoRefreshToken: false } }), privileged: !!secret };
}
