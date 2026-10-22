import Link from 'next/link';
import { Suspense } from 'react';
import Guard from './Guard';
import { logout } from './actions';

const NAV = [
  { href: '/admin', label: 'Inicio' },
  { href: '/admin/solicitudes', label: 'Solicitudes' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/cobros', label: 'Cobros' },
  { href: '/admin/catalogo', label: 'Catálogo' },
];

/** Marco común de las vistas protegidas. `current` = href activo. */
export default function AdminShell({ current, title, children }: { current: string; title: string; children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="adm-loading" role="status">Cargando…</div>}>
      <Guard>
        <div className="adm-app">
          <header className="adm-top">
            <Link href="/admin" className="adm-brand">South Software <span>· Panel</span></Link>
            <nav aria-label="Panel">
              {NAV.map((n) => <Link key={n.href} href={n.href} aria-current={n.href === current ? 'page' : undefined}>{n.label}</Link>)}
            </nav>
            <form action={logout}><button type="submit" className="adm-btn ghost">Salir</button></form>
          </header>
          <div className="adm-banner" role="note">Vista previa · fase 2. Solicitudes con datos reales; clientes, cobros y edición de catálogo llegan en las próximas fases. El catálogo se lee del sitio publicado.</div>
          <main className="adm-main">
            <h1>{title}</h1>
            {children}
          </main>
        </div>
      </Guard>
    </Suspense>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return <div className="adm-empty"><strong>{title}</strong>{children && <p>{children}</p>}</div>;
}
