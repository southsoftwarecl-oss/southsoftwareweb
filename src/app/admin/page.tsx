import Link from 'next/link';
import AdminShell, { Empty } from './Shell';
import { FOUNDERS_PROMO } from '@/lib/admin/catalog';

export default function AdminHome() {
  return (
    <AdminShell current="/admin" title="Inicio">
      <div className="adm-grid">
        {['Solicitudes nuevas (7 días)', 'Ingreso mensual recurrente', 'Por cobrar este mes', 'Cobros vencidos'].map((k) => (
          <div key={k} className="adm-card adm-kpi"><small>{k}</small><b>—</b><div className="adm-note">Aún no hay datos</div></div>
        ))}
        <div className="adm-card adm-kpi"><small>Cupos Clientes Fundadores</small><b>— / {FOUNDERS_PROMO.seats}</b><div className="adm-note">Hasta el 30-11-2026 · se calculará con contratos reales</div></div>
      </div>
      <section className="adm-section">
        <h2>Hoy hay que cobrar</h2>
        <Empty title="Aún no hay cobros">Cuando registres el primer cliente, aquí verás lo que vence hoy y en los próximos 7 días. Mientras tanto puedes probar el <Link href="/admin/cobros">simulador de calendario</Link>.</Empty>
      </section>
    </AdminShell>
  );
}
