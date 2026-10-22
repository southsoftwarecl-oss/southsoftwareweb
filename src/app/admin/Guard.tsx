/** Verificación en servidor (además del proxy): sin sesión válida no se renderiza nada del panel. */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySession } from '@/lib/admin/session';

export default async function Guard({ children }: { children: React.ReactNode }) {
  if (!(await verifySession((await cookies()).get(SESSION_COOKIE)?.value))) redirect('/admin/login');
  return <>{children}</>;
}
