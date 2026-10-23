import { Suspense } from 'react';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/admin/AppShell';
import { currentAdmin } from '@/lib/admin/auth';
import { listLeads } from '@/lib/admin/leads';
import { logout } from './actions';

/** Esqueleto con la misma geometría del shell (sin spinner de página). */
function Skeleton() {
  return (
    <div className="sh" aria-busy="true" aria-label="Cargando">
      <aside className="sb" /><div className="a-main"><header className="tb" /><main className="content"><div style={{ height: 32, width: 180, borderRadius: 6, background: 'var(--bg-muted)' }} /></main></div>
    </div>
  );
}

/** Verificación en servidor (además del proxy): sin sesión válida ni rol de equipo no se renderiza nada del panel. */
async function Guarded(props: { title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  await connection();
  const me = await currentAdmin();
  if (!me) redirect('/admin/login?e=acceso');
  const { leads } = await listLeads();
  const badges = { solicitudes: leads.filter((l) => l.stage === 'nuevo').length };
  return <AppShell {...props} badges={badges} user={{ email: me.email, name: me.name, role: me.role }} logout={logout} />;
}

/** Marco común de las vistas protegidas. `current` se mantiene por compatibilidad (el activo se deduce de la ruta). */
export default function AdminShell({ title, description, actions, children }: { current?: string; title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return <Suspense fallback={<Skeleton />}><Guarded title={title} description={description} actions={actions}>{children}</Guarded></Suspense>;
}

export function Empty({ title, children, ill, actions }: { title: string; children?: React.ReactNode; ill?: React.ReactNode; actions?: React.ReactNode }) {
  return <div className="adm-empty">{ill}<strong>{title}</strong>{children && <p>{children}</p>}{actions && <div className="acts">{actions}</div>}</div>;
}
