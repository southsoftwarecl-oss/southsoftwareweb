import { connection } from 'next/server';
import { Suspense } from 'react';
import AdminShell, { Empty } from '../Shell';
import { IllCalendar } from '@/components/admin/Illustrations';
import Simulador from './Simulador';

export const metadata = { title: 'Cobros' };

async function Sim() {
  await connection();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date());
  return <Simulador today={today} />;
}

export default function Cobros() {
  return (
    <AdminShell current="/admin/cobros" title="Cobros">
      <section className="adm-section">
        <h2>Próximos cobros</h2>
        <Empty ill={<IllCalendar />} title="Aún no hay cobros registrados">Aquí aparecerán los cobros programados, los que vencen en 7 días y los vencidos (en rojo).</Empty>
      </section>
      <section className="adm-section">
        <h2>Simulador de calendario</h2>
        <p className="adm-note">Calcula con los precios publicados. El pago inicial se cobra en la fecha de alta. La primera mensualidad cae en el día de cobro elegido, al menos un mes después del lanzamiento (si no eliges lanzamiento, se usa la fecha de alta).</p>
        <Suspense fallback={null}><Sim /></Suspense>
      </section>
    </AdminShell>
  );
}
