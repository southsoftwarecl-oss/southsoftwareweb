import AdminShell, { Empty } from '../Shell';
import { IllPeople } from '@/components/admin/Illustrations';
export const metadata = { title: 'Clientes' };
export default function Clientes() {
  return (
    <AdminShell current="/admin/clientes" title="Clientes">
      <Empty ill={<IllPeople />} title="Aún no hay clientes">Cada cliente tendrá su pack contratado, pago inicial, mensualidad, fecha de alta, día de cobro, estado e historial de cambios de pack. Se habilita al conectar la base de datos (fase 2–3).</Empty>
    </AdminShell>
  );
}
