import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { Plus, Search, LayoutGrid, List, FlaskConical } from 'lucide-react';
import AdminShell, { Empty } from '../Shell';
import { IllInbox } from '@/components/admin/Illustrations';
import LeadsBoard from '@/components/admin/LeadsBoard';
import { STAGES, CHANNELS } from '@/lib/admin/model';
import { listLeads, nowMs } from '@/lib/admin/leads';
import { sampleLeads } from '@/lib/admin/sample';
import { currentAdmin } from '@/lib/admin/auth';

export const metadata = { title: 'Solicitudes' };
type SP = { vista?: string; q?: string; canal?: string; ejemplo?: string; creada?: string; solicitud?: string };
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

async function Board({ searchParams }: { searchParams: Promise<SP> }) {
  await connection();
  const sp = await searchParams;
  const sample = sp.ejemplo === '1';
  const view = sp.vista === 'lista' ? 'lista' : 'kanban';
  const now = nowMs();
  const [{ leads: real, error }, me] = await Promise.all([listLeads(), currentAdmin()]);
  const all = sample ? sampleLeads(now) : real;
  const q = norm((sp.q || '').trim());
  const leads = all.filter((l) => (!sp.canal || l.channel === sp.canal) && (!q || norm([l.name, l.email, l.phone, l.pack, l.message, (l.payload as { empresa?: string })?.empresa].filter(Boolean).join(' ')).includes(q)));
  const qs = (o: Partial<SP>) => { const u = new URLSearchParams(); const m = { vista: sp.vista, q: sp.q, canal: sp.canal, ejemplo: sp.ejemplo, ...o }; Object.entries(m).forEach(([k, v]) => v && u.set(k, v)); const s = u.toString(); return '/admin/solicitudes' + (s ? '?' + s : ''); };
  const filtered = !!(q || sp.canal);
  return (
    <>
      {sample && <div className="sample-band" role="note"><FlaskConical size={15} aria-hidden="true" /> Estás viendo <b>datos de ejemplo</b>. Nada se guarda. <Link href={qs({ ejemplo: undefined })}>Volver a los datos reales</Link></div>}
      {sp.creada === '1' && !sample && <p className="adm-ok" role="status">Solicitud creada en “Nuevo”.</p>}
      <form className="toolbar" action="/admin/solicitudes" role="search">
        {sp.vista && <input type="hidden" name="vista" value={sp.vista} />}{sample && <input type="hidden" name="ejemplo" value="1" />}
        <div className="inp-ic tb-q"><Search size={15} aria-hidden="true" /><input name="q" defaultValue={sp.q} placeholder="Buscar nombre, correo, pack…" aria-label="Buscar solicitudes" /></div>
        <select name="canal" defaultValue={sp.canal || ''} aria-label="Filtrar por origen" className="fld tb-sel"><option value="">Todos los orígenes</option>{CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        <button type="submit" className="btn-a secondary sm">Filtrar</button>
        <span className="count-chip">{leads.length} {leads.length === 1 ? 'solicitud' : 'solicitudes'}</span>
        <div className="seg" role="group" aria-label="Vista">
          <Link href={qs({ vista: undefined })} aria-current={view === 'kanban' ? 'true' : undefined}><LayoutGrid size={14} aria-hidden="true" /> Kanban</Link>
          <Link href={qs({ vista: 'lista' })} aria-current={view === 'lista' ? 'true' : undefined}><List size={14} aria-hidden="true" /> Lista</Link>
        </div>
        <Link href={qs({ ejemplo: sample ? undefined : '1' })} className={`toggle${sample ? ' on' : ''}`} role="switch" aria-checked={sample}><i aria-hidden="true" />Datos de ejemplo</Link>
      </form>
      {error && !sample && <p className="adm-err" role="alert">{error}</p>}
      {!error && !sample && real.length === 0 && <Empty ill={<IllInbox />} title="Aún no llegan solicitudes" actions={<><Link href="/admin/solicitudes/nueva" className="btn-a primary sm">Nueva solicitud</Link><Link href={qs({ ejemplo: '1' })} className="btn-a ghost sm">Ver con datos de ejemplo</Link></>}>Cuando alguien use el formulario, “Elegir pack”, “Arma tu pack” o “Reservar cupo”, aparecerá aquí en Nuevo.</Empty>}
      {filtered && leads.length === 0 && all.length > 0 && <Empty title="Sin resultados para estos filtros" actions={<Link href={qs({ q: undefined, canal: undefined })} className="btn-a secondary sm">Limpiar filtros</Link>} />}
      {(all.length > 0 || (!error && real.length === 0 && !sample)) && !(filtered && leads.length === 0) && (
        <LeadsBoard leads={leads} stages={STAGES.map((s) => ({ id: s.id, label: s.label }))} view={view} sample={sample} now={now} canMove={!!me && me.role !== 'lectura'} openId={sp.solicitud} />
      )}
    </>
  );
}

function BoardSkeleton() {
  return <div className="kb" aria-busy="true">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="kc"><div className="sk" style={{ height: 14, width: 80, borderRadius: 4 }} /><div className="sk" style={{ height: 96, borderRadius: 8, marginTop: 12 }} /></div>)}</div>;
}

export default function Solicitudes(props: { searchParams: Promise<SP> }) {
  return (
    <AdminShell current="/admin/solicitudes" title="Solicitudes" description="Todo lo que pide la gente desde la web, WhatsApp y en persona."
      actions={<Link href="/admin/solicitudes/nueva" className="btn-a primary"><Plus size={15} aria-hidden="true" /> Nueva solicitud</Link>}>
      <Suspense fallback={<BoardSkeleton />}><Board {...props} /></Suspense>
    </AdminShell>
  );
}
