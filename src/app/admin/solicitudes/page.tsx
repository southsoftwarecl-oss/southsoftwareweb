import AdminShell, { Empty } from '../Shell';
import { STAGES, CHANNELS } from '@/lib/admin/model';

export const metadata = { title: 'Solicitudes' };

export default function Solicitudes() {
  return (
    <AdminShell current="/admin/solicitudes" title="Solicitudes">
      <Empty title="Aún no se guardan solicitudes">
        Hoy el formulario de contacto llega solo por correo y “Elegir pack” / “Arma tu pack” abren WhatsApp. En la fase 2 todo quedará guardado aquí. Canales previstos: {CHANNELS.map((c) => c.label).join(' · ')}.
      </Empty>
      <div className="adm-kanban" style={{ marginTop: 20 }} aria-label="Etapas">
        {STAGES.map((s) => <section key={s.id} className="adm-col" aria-label={s.label}><h2>{s.label}<span>0</span></h2><p>Sin solicitudes</p></section>)}
      </div>
    </AdminShell>
  );
}
