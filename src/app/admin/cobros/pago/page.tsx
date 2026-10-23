import { connection } from 'next/server';
import { Suspense } from 'react';
import Link from 'next/link';
import AdminShell, { Empty } from '../../Shell';
import { IllCalendar } from '@/components/admin/Illustrations';
import { listOpenCharges } from '@/lib/admin/charges';
import PaymentForm from './Form';

export const metadata = { title: 'Registrar pago' };
const todayCL = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date());

async function Body({ searchParams }: { searchParams: Promise<{ cobro?: string }> }) {
  await connection();
  const { charges, error } = await listOpenCharges();
  if (error) return <p className="adm-err" role="alert">{error}</p>;
  if (!charges.length) return <Empty ill={<IllCalendar />} title="No hay cobros pendientes" actions={<Link href="/admin/cobros" className="btn-a secondary sm">Probar el simulador</Link>}>Los cobros se generan al dar de alta un cliente. Cuando haya uno pendiente, aquí podrás registrar su pago.</Empty>;
  return <PaymentForm charges={charges} today={todayCL()} preselect={(await searchParams).cobro} />;
}

export default function RegistrarPago(props: { searchParams: Promise<{ cobro?: string }> }) {
  return (
    <AdminShell title="Registrar pago" description="Pago total o parcial sobre un cobro existente. No se envía nada al cliente.">
      <Suspense fallback={<div className="adm-card form-card" style={{ height: 280 }} aria-busy="true" />}><Body {...props} /></Suspense>
    </AdminShell>
  );
}
