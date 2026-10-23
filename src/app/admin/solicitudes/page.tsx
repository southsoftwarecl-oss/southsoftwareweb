import { connection } from 'next/server';
import { Suspense } from 'react';
import AdminShell, { Empty } from '../Shell';
import { IllInbox } from '@/components/admin/Illustrations';
import { moveRequest } from '../actions';
import { STAGES, CHANNELS } from '@/lib/admin/model';
import { ageHours, listLeads, type Lead } from '@/lib/admin/leads';
import { clp } from '@/lib/admin/billing';

export const metadata = { title: 'Solicitudes' };
const chan = (id: string) => CHANNELS.find((c) => c.id === id)?.label || id;
const ago = (iso: string) => {
  const h = Math.floor(ageHours(iso));
  return h < 1 ? 'hace minutos' : h < 24 ? `hace ${h} h` : `hace ${Math.floor(h / 24)} d`;
};
const when = (iso: string) => new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

function Card({ l }: { l: Lead }) {
  const p = l.payload as Record<string, string | string[] | undefined>;
  const title = l.name || (l.channel === 'reservar_cupo' ? 'Cupo Fundador (anónimo)' : l.pack ? `Interés en ${l.pack}` : 'Pack armado (anónimo)');
  const late = l.stage === 'nuevo' && ageHours(l.createdAt) > 24;
  return (
    <article className="adm-lead" data-testid="lead-card">
      <header><b>{title}</b>{late && <span className="adm-tag bad">+24 h sin contactar</span>}</header>
      {p.empresa && <div className="adm-note">{String(p.empresa)}</div>}
      <div className="adm-note">{chan(l.channel)} · <time dateTime={l.createdAt} title={when(l.createdAt)}>{ago(l.createdAt)}</time></div>
      {l.pack && <div>Pack: {l.pack}</div>}
      {Array.isArray((l.builder as { labels?: string[] } | null)?.labels) && <div>Armó: {((l.builder as { labels: string[] }).labels).join(', ')}</div>}
      {p.tipo && <div>Tipo: {String(p.tipo)}{p.presupuesto ? ` · ${String(p.presupuesto)}` : ''}</div>}
      {(l.setup != null || l.monthly != null) && <div className="adm-amt">{l.setup != null ? clp(l.setup) : 'sin pago inicial'} + {l.monthly != null ? clp(l.monthly) : 'sin mensualidad'}/mes</div>}
      {l.message && <p className="adm-msg">{l.message.length > 160 ? l.message.slice(0, 160) + '…' : l.message}</p>}
      {l.email && <div><a href={`mailto:${l.email}`}>{l.email}</a></div>}
      <form action={moveRequest} className="adm-move">
        <input type="hidden" name="id" value={l.id} />
        <label className="sr" htmlFor={`mv-${l.id}`}>Mover a</label>
        <select id={`mv-${l.id}`} name="stage" defaultValue="">
          <option value="" disabled>Mover a…</option>
          {STAGES.filter((s) => s.id !== l.stage && s.id !== 'activo').map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button type="submit" className="adm-btn ghost">Mover</button>
      </form>
    </article>
  );
}

async function Board() {
  await connection();
  const { leads, error } = await listLeads();
  return (
    <>
      {error && <p className="adm-err" role="alert">{error}</p>}
      {!error && leads.length === 0 && <Empty ill={<IllInbox />} title="Aún no llegan solicitudes">Cuando alguien use el formulario, “Elegir pack”, “Arma tu pack” o “Reservar cupo”, aparecerá aquí en Nuevo.</Empty>}
      <div className="adm-kanban" style={{ marginTop: 20 }}>
        {STAGES.map((s) => {
          const col = leads.filter((l) => l.stage === s.id);
          return (
            <section key={s.id} className="adm-col" aria-label={s.label} data-stage={s.id}>
              <h2>{s.label}<span>{col.length}</span></h2>
              {col.length ? col.map((l) => <Card key={l.id} l={l} />) : <p>Sin solicitudes</p>}
            </section>
          );
        })}
      </div>
      <p className="adm-note">“Activo” se asigna solo con “Dar de alta” (fase 3).</p>
    </>
  );
}

export default function Solicitudes() {
  return (
    <AdminShell current="/admin/solicitudes" title="Solicitudes">
      <Suspense fallback={<p className="adm-note">Cargando solicitudes…</p>}><Board /></Suspense>
    </AdminShell>
  );
}
