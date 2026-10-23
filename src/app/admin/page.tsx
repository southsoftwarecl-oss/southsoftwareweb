import Link from 'next/link';
import AdminShell, { Empty } from './Shell';
import { IllCalendar } from '@/components/admin/Illustrations';
import { FOUNDERS_PROMO } from '@/lib/admin/catalog';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { ageHours, listLeads } from '@/lib/admin/leads';

async function NewLeads() {
  await connection();
  const { leads, error } = await listLeads();
  if (error) return <><b className="kpi-v empty">Sin conexión</b><div className="adm-note">{error}</div></>;
  const n = leads.filter((l) => ageHours(l.createdAt) < 7 * 24).length;
  const pending = leads.filter((l) => l.stage === 'nuevo').length;
  return <><b className="kpi-v" data-testid="kpi-new">{n}</b><div className="adm-note">{pending} en “Nuevo” · <Link href="/admin/solicitudes">ver</Link></div></>;
}

export default function AdminHome() {
  return (
    <AdminShell current="/admin" title="Inicio" description="Resumen del día: solicitudes nuevas y cobros próximos.">
      <div className="adm-grid">
        <div className="adm-card adm-kpi"><small>Solicitudes (últimos 7 días)</small><Suspense fallback={<b>…</b>}><NewLeads /></Suspense></div>
        {['Ingreso mensual recurrente', 'Por cobrar este mes', 'Cobros vencidos'].map((k) => (
          <div key={k} className="adm-card adm-kpi"><small>{k}</small><b className="kpi-v empty">Aún no hay datos</b><div className="adm-note">Se calcula al registrar clientes</div></div>
        ))}
        <div className="adm-card adm-kpi"><small>Cupos Clientes Fundadores</small><b className="kpi-v empty">{FOUNDERS_PROMO.seats} cupos</b><div className="adm-note">Hasta el 30-11-2026 · se calculará con contratos reales</div></div>
      </div>
      <section className="adm-section">
        <h2>Hoy hay que cobrar</h2>
        <Empty ill={<IllCalendar />} title="Aún no hay cobros">Cuando registres el primer cliente, aquí verás lo que vence hoy y en los próximos 7 días. Mientras tanto puedes probar el <Link href="/admin/cobros">simulador de calendario</Link>.</Empty>
      </section>
    </AdminShell>
  );
}
