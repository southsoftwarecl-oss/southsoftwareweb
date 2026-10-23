import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { Inbox, Clock, Wallet, Sparkles, ArrowUpRight, ArrowDownRight, CheckCircle2, Circle, MessageSquarePlus, AlertTriangle, CalendarClock, ChevronRight } from 'lucide-react';
import AdminShell, { Empty } from './Shell';
import { IllCalendar, IllCheck } from '@/components/admin/Illustrations';
import Spark from '@/components/admin/Spark';
import { FOUNDERS_PROMO } from '@/lib/admin/catalog';
import { CHANNELS } from '@/lib/admin/model';
import { currentAdmin } from '@/lib/admin/auth';
import { homeData, type HomeData } from '@/lib/admin/stats';

const clp = (n: number) => '$' + n.toLocaleString('es-CL');
const chan = (id: string) => CHANNELS.find((c) => c.id === id)?.label || id;
const ago = (iso: string, now: number) => {
  const m = Math.floor((now - new Date(iso).getTime()) / 60000);
  return m < 60 ? `hace ${Math.max(1, m)} min` : m < 1440 ? `hace ${Math.floor(m / 60)} h` : `hace ${Math.floor(m / 1440)} d`;
};
const leadTitle = (l: HomeData['leads'][number]) => l.name || (l.channel === 'reservar_cupo' ? 'Cupo Fundador' : l.pack ? l.pack : 'Pack armado');

function Kpi({ icon: I, tone, label, children, foot }: { icon: typeof Inbox; tone: string; label: string; children: React.ReactNode; foot?: React.ReactNode }) {
  return (
    <div className="adm-card kpi2">
      <div className="kpi2-h"><span className={`ichip ${tone}`}><I size={16} aria-hidden="true" /></span><span>{label}</span></div>
      {children}
      {foot && <div className="kpi2-f">{foot}</div>}
    </div>
  );
}

function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (prev <= 0) return null; // sin período previo no hay delta
  const pct = Math.round(((cur - prev) / prev) * 100);
  const up = pct >= 0;
  return <span className={`delta ${up ? 'up' : 'down'}`} title="vs. 7 días anteriores">{up ? <ArrowUpRight size={13} aria-hidden="true" /> : <ArrowDownRight size={13} aria-hidden="true" />}{Math.abs(pct)}%</span>;
}

async function Home() {
  await connection();
  const [d, me] = await Promise.all([homeData(), currentAdmin()]);
  const first = me?.name?.split(/\s+/)[0];
  const hello = d.hour < 12 ? 'Buenos días' : d.hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const used = d.foundersUsed;
  const daysLeft = Math.max(0, Math.ceil((new Date(FOUNDERS_PROMO.until + 'T23:59:59-03:00').getTime() - d.now) / 86_400_000));
  const steps = [
    { ok: true, t: 'Cuenta del equipo creada' },
    { ok: d.leads.length > 0, t: 'Primera solicitud recibida', href: '/admin/solicitudes' },
    { ok: (d.clients ?? 0) > 0, t: 'Primer cliente dado de alta' },
    { ok: (d.payments ?? 0) > 0, t: 'Primer pago registrado', href: '/admin/cobros/pago' },
  ];
  const pending = steps.filter((s) => !s.ok).length;
  const primary = d.dueToday.length || d.overdue.length
    ? <Link href="/admin/cobros/pago" className="btn-a primary"><Wallet size={15} aria-hidden="true" /> Registrar pago</Link>
    : <Link href="/admin/solicitudes" className="btn-a primary"><Inbox size={15} aria-hidden="true" /> Ver solicitudes nuevas</Link>;

  return (
    <>
      <div className="hello">
        <div><h2>{hello}{first ? `, ${first}` : ''}</h2><p>{d.longDate.charAt(0).toUpperCase() + d.longDate.slice(1)}</p></div>
        {primary}
      </div>

      <div className="kgrid">
        <Kpi icon={Inbox} tone="brand" label="Solicitudes (últimos 7 días)" foot={<>{d.newCount} en “Nuevo” · <Link href="/admin/solicitudes">ver</Link></>}>
          {d.leadsError ? <div className="kv empty">Sin conexión</div> : (
            <div className="kv-row"><b className="kv" data-testid="kpi-new">{d.week}</b><Delta cur={d.week} prev={d.prevWeek} />{d.spark && <Spark data={d.spark} label="Solicitudes por día, últimos 30 días" />}</div>
          )}
        </Kpi>
        <Kpi icon={Clock} tone={d.stale.length ? 'warn' : 'ok'} label="Sin contactar > 24 h" foot={d.stale.length ? 'Respóndelas primero' : 'Todo respondido a tiempo'}>
          <div className="kv-row"><b className="kv">{d.stale.length}</b></div>
        </Kpi>
        {d.charges.length ? (
          <>
            <Kpi icon={CalendarClock} tone="brand" label="Por cobrar este mes"><b className="kv">{clp(d.monthDue ?? 0)}</b></Kpi>
            <Kpi icon={AlertTriangle} tone={d.overdue.length ? 'bad' : 'ok'} label="Cobros vencidos" foot={`${d.overdue.length} cobro${d.overdue.length === 1 ? '' : 's'}`}><b className="kv">{clp(d.overdueSum ?? 0)}</b></Kpi>
          </>
        ) : (
          <div className="adm-card kmoney">
            <span className="ichip neutral"><Wallet size={16} aria-hidden="true" /></span>
            <div><strong>Aún no hay datos de ingresos</strong><p>Ingreso mensual, por cobrar y vencidos aparecen cuando des de alta el primer cliente.</p></div>
            <Link href="/admin/cobros" className="btn-a secondary sm">Probar el simulador</Link>
          </div>
        )}
        <div className="adm-card kfound">
          <div className="kpi2-h"><span className="ichip gold"><Sparkles size={16} aria-hidden="true" /></span><span>Promoción Clientes Fundadores</span></div>
          {used === null ? <div className="kv empty">Sin conexión</div> : (
            <>
              <div className="kv-row"><b className="kv">{used}</b><span className="kv-of">de {FOUNDERS_PROMO.seats} cupos usados</span></div>
              <div className="prog" role="progressbar" aria-valuemin={0} aria-valuemax={FOUNDERS_PROMO.seats} aria-valuenow={used} aria-label="Cupos Fundadores usados"><i style={{ width: `${(used / FOUNDERS_PROMO.seats) * 100}%` }} /></div>
            </>
          )}
          <div className="kpi2-f">−30 % en el pago inicial · quedan {daysLeft} días (hasta el 30-11-2026)</div>
        </div>
      </div>

      <div className="hgrid">
        <section className="adm-card hcard" aria-labelledby="hoy">
          <header><h2 id="hoy">Hoy</h2><Link href="/admin/cobros" className="btn-a ghost sm">Cobros <ChevronRight size={14} aria-hidden="true" /></Link></header>
          <h3 className="hsub">Hoy hay que cobrar</h3>
          {d.overdue.length + d.dueToday.length ? (
            <ul className="rows">{[...d.overdue, ...d.dueToday].map((c) => (
              <li key={c.id}><div><b>{c.client}</b><small>{c.concept}</small></div><span className={`chip ${c.due && c.due < d.today ? 'bad' : 'warn'}`}>{c.due && c.due < d.today ? 'Vencido' : 'Vence hoy'}</span><b className="num">{clp(c.amount - c.paid)}</b><Link href={`/admin/cobros/pago?cobro=${c.id}`} className="btn-a primary sm">Registrar pago</Link></li>
            ))}</ul>
          ) : <Empty ill={<IllCalendar />} title="Aún no hay cobros">Cuando registres el primer cliente, aquí verás lo que vence hoy y en los próximos 7 días. Mientras tanto puedes probar el <Link href="/admin/cobros">simulador de calendario</Link>.</Empty>}
          <h3 className="hsub">Seguimientos</h3>
          {d.stale.length ? (
            <ul className="rows">{d.stale.slice(0, 6).map((l) => (
              <li key={l.id}><div><b>{leadTitle(l)}</b><small>{chan(l.channel)} · {ago(l.createdAt, d.now)}</small></div><span className="chip warn">+24 h en Nuevo</span><Link href="/admin/solicitudes" className="btn-a secondary sm">Abrir</Link></li>
            ))}</ul>
          ) : <div className="allgood"><IllCheck /><span>Todo al día. No hay solicitudes esperando respuesta.</span></div>}
        </section>

        <aside className="hside">
          {pending > 0 && (
            <section className="adm-card hcard" aria-labelledby="pasos">
              <header><h2 id="pasos">Primeros pasos</h2><span className="adm-note">{steps.length - pending}/{steps.length}</span></header>
              <div className="prog sm"><i style={{ width: `${((steps.length - pending) / steps.length) * 100}%` }} /></div>
              <ul className="steps">{steps.map((s) => <li key={s.t} className={s.ok ? 'ok' : ''}>{s.ok ? <CheckCircle2 size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}{s.href && !s.ok ? <Link href={s.href}>{s.t}</Link> : s.t}</li>)}</ul>
            </section>
          )}
          <section className="adm-card hcard" aria-labelledby="act">
            <header><h2 id="act">Actividad reciente</h2></header>
            {d.leads.length ? (
              <ul className="feed">{d.leads.slice(0, 6).map((l) => (
                <li key={l.id}><span className="ichip brand sm"><MessageSquarePlus size={13} aria-hidden="true" /></span><div>Llegó una solicitud: <b>{leadTitle(l)}</b><small>{chan(l.channel)} · <time dateTime={l.createdAt}>{ago(l.createdAt, d.now)}</time></small></div></li>
              ))}</ul>
            ) : <p className="adm-note">Aún no hay actividad. Las solicitudes de la web aparecerán aquí apenas lleguen.</p>}
          </section>
        </aside>
      </div>
    </>
  );
}

function HomeSkeleton() {
  return <div className="kgrid" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="adm-card sk" style={{ height: 132, gridColumn: i > 1 ? 'span 4' : 'span 2' }} />)}</div>;
}

export default function AdminHome() {
  return (
    <AdminShell current="/admin" title="Inicio">
      <Suspense fallback={<HomeSkeleton />}><Home /></Suspense>
    </AdminShell>
  );
}
