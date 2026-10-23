import AdminShell from '../../Shell';
import { CATALOG } from '@/lib/admin/catalog';
import NewRequestForm from './Form';
export const metadata = { title: 'Nueva solicitud' };
export default function NuevaSolicitud() {
  return (
    <AdminShell title="Nueva solicitud" description="Registra a alguien que llegó por WhatsApp, teléfono, referido o en persona.">
      <NewRequestForm packs={CATALOG.map((p) => ({ slug: p.slug, name: p.name }))} />
    </AdminShell>
  );
}
