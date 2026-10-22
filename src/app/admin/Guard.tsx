/** Verificación en servidor (además del proxy): sin sesión válida ni rol de equipo no se renderiza nada del panel. */
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { currentAdmin } from '@/lib/admin/auth';

export default async function Guard({ children }: { children: React.ReactNode }) {
  await connection();
  if (!(await currentAdmin())) redirect('/admin/login?e=acceso');
  return <>{children}</>;
}
