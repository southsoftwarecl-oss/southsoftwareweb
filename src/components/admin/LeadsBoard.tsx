'use client';
/**
 * Tablero de solicitudes: kanban (arrastrar y soltar, teclado, menú "Mover a") y lista, con actualización optimista,
 * deshacer y errores legibles. En modo "Datos de ejemplo" todo es local: nunca llama al servidor.
 */
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Mail, MousePointerClick, Blocks, Ticket, PenLine, Clock, Sparkles, X, Copy, MessageCircle, ChevronRight, ChevronsLeftRight, MoreHorizontal, ArrowRightLeft, PanelRightOpen } from 'lucide-react';
import { moveRequestTo } from '@/app/admin/actions';
import QuotesPanel from './QuotesPanel';
import type { Lead } from '@/lib/admin/leads';

type Stage = { id: string; label: string };
const CH: Record<string, { label: string; icon: typeof Mail }> = {
  form_contacto: { label: 'Formulario', icon: Mail }, elegir_pack: { label: 'Elegir pack', icon: MousePointerClick },
  arma_tu_pack: { label: 'Arma tu pack', icon: Blocks }, arma_tu_proyecto: { label: 'Arma tu proyecto', icon: Blocks },
  reservar_cupo: { label: 'Reservar cupo', icon: Ticket }, manual: { label: 'Ingreso manual', icon: PenLine },
};
const CH_LONG: Record<string, string> = { form_contacto: 'Formulario de contacto', reservar_cupo: 'Reservar cupo Fundador', manual: 'Ingreso manual' };
const clp = (n: number) => '$' + n.toLocaleString('es-CL');
const COLLAPSED = new Set(['pausado', 'cancelado']);
const labels = (l: Lead) => (l.builder as { labels?: string[] } | null)?.labels;
export const leadTitle = (l: Lead) => l.name || (l.channel === 'reservar_cupo' ? 'Cupo Fundador' : l.pack ? `Interés en ${l.pack}` : labels(l) ? 'Pack armado' : 'Solicitud');
const ago = (iso: string, now: number) => { const hh = Math.floor((now - new Date(iso).getTime()) / 3_600_000); return hh < 1 ? 'hace minutos' : hh < 24 ? `hace ${hh} h` : `hace ${Math.floor(hh / 24)} d`; };
const abs = (iso: string) => new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

let toastSeq = 0;
type Toast = { id: number; text: string; undo?: () => void; error?: boolean; action?: { label: string; run: () => void } };

export default function LeadsBoard({ leads: initial, stages, view, sample, now, canMove, openId }: { leads: Lead[]; stages: Stage[]; view: 'kanban' | 'lista'; sample: boolean; now: number; canMove: boolean; openId?: string }) {
  const [leads, setLeads] = useState(initial);
  useEffect(() => setLeads(initial), [initial]); // eslint-disable-line react-hooks/set-state-in-effect -- sincroniza con el servidor tras revalidar
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [live, setLive] = useState('');
  const [picked, setPickedState] = useState<string | null>(null); // movimiento por teclado
  const pickedRef = useRef<string | null>(null);
  const setPicked = (v: string | null) => { pickedRef.current = v; setPickedState(v); };
  const [detail, setDetail] = useState<string | null>(openId || null);
  const [, start] = useTransition();

  const toast = (t: Omit<Toast, 'id'>) => { const id = ++toastSeq; setToasts((x) => [...x.slice(-2), { ...t, id }]); setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), t.error ? 8000 : 6000); };
  const label = (id: string) => stages.find((s) => s.id === id)?.label || id;

  const [ask, setAsk] = useState<null | { id: string; to: 'reunion' | 'cancelado' }>(null);
  const [tab, setTab] = useState<'resumen' | 'cotizaciones'>('resumen');
  const [menu, setMenu] = useState<null | { id: string; x: number; y: number }>(null);

  const move = (id: string, to: string, opts: { silent?: boolean; extra?: { meetingAt?: string; reason?: string } } = {}) => {
    const l = leads.find((x) => x.id === id);
    if (!l || l.stage === to) return;
    if (to === 'activo') { toast({ text: '“Activo” se asigna al dar de alta al cliente.', error: true }); return; }
    // Reunión y Cancelado piden un dato antes de mover (también en ejemplo, para mostrar el flujo).
    if ((to === 'reunion' && !opts.extra?.meetingAt) || (to === 'cancelado' && !opts.extra?.reason)) { if (!opts.silent) { setAsk({ id, to }); return; } }
    const from = l.stage;
    setLeads((xs) => xs.map((x) => (x.id === id ? { ...x, stage: to as Lead['stage'], updatedAt: new Date().toISOString() } : x)));
    setLive(`${leadTitle(l)} movida a ${label(to)}.`);
    const undo = () => move(id, from, { silent: true, extra: { meetingAt: l.meetingAt || undefined, reason: l.lostReason || undefined } });
    if (sample) { if (!opts.silent) toast({ text: `Movida a ${label(to)} (ejemplo, no se guarda).`, undo }); return; }
    start(async () => {
      const r = await moveRequestTo(id, to, opts.extra);
      if (!r.ok) {
        setLeads((xs) => xs.map((x) => (x.id === id ? { ...x, stage: from } : x)));
        const openQuotes = r.need === 'cotizacion' || r.need === 'aceptada' ? () => { setDetail(id); setTab('cotizaciones'); } : undefined;
        toast({ text: r.error || 'No se pudo mover.', error: true, action: openQuotes ? { label: 'Abrir cotizaciones', run: openQuotes } : undefined });
        return;
      }
      if (!opts.silent) toast({ text: `Movida a ${label(to)}.`, undo });
    });
  };

  // Teclado en tarjeta: Espacio levanta/suelta, ←/→ cambia de columna, Esc cancela, M enfoca "Mover a", Enter abre el detalle.
  const onCardKey = (e: React.KeyboardEvent, l: Lead) => {
    if ((e.target as HTMLElement).closest('select,button,a,input')) return;
    const idx = stages.findIndex((s) => s.id === l.stage);
    if (e.key === ' ') { e.preventDefault(); if (pickedRef.current === l.id) { setPicked(null); setLive(`Soltada en ${label(l.stage)}.`); } else { setPicked(l.id); setLive(`${leadTitle(l)} levantada. Usa flechas izquierda y derecha, Espacio para soltar, Escape para cancelar.`); } }
    else if (pickedRef.current === l.id && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      let j = idx + (e.key === 'ArrowRight' ? 1 : -1);
      if (stages[j]?.id === 'activo') j += e.key === 'ArrowRight' ? 1 : -1;
      if (stages[j]) { move(l.id, stages[j].id); requestAnimationFrame(() => document.getElementById(`card-${l.id}`)?.focus()); }
    } else if (e.key === 'Escape') { setPicked(null); setDetail(null); }
    else if (e.key.toLowerCase() === 'm' && canMove) { e.preventDefault(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ id: l.id, x: r.right - 8, y: r.top + 32 }); }
    else if (e.key === 'Enter') setDetail(l.id);
  };

  const cols = useMemo(() => stages.map((s) => ({ ...s, items: leads.filter((l) => l.stage === s.id) })), [stages, leads]);
  const current = leads.find((l) => l.id === detail);

  const openMenu = (id: string, x: number, y: number) => setMenu({ id, x: Math.min(x, window.innerWidth - 230), y: Math.min(y, window.innerHeight - 340) });
  const card = (l: Lead) => {
    const ch = CH[l.channel] || CH.form_contacto;
    const since = l.updatedAt && l.stage !== 'nuevo' ? l.updatedAt : l.createdAt;
    const late = l.stage === 'nuevo' && now - new Date(l.createdAt).getTime() > 86_400_000;
    const anon = !l.name;
    const what = l.pack || (labels(l) ? labels(l)!.join(', ') : null);
    return (
      <article key={l.id} id={`card-${l.id}`} className={`lc${picked === l.id ? ' picked' : ''}${drag === l.id ? ' dragging' : ''}`} data-testid="lead-card" tabIndex={0}
        aria-roledescription="tarjeta movible" aria-label={`${leadTitle(l)}, ${label(l.stage)}`}
        draggable={canMove} onDragStart={(e) => { setDrag(l.id); e.dataTransfer.setData('text/plain', l.id); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => { setDrag(null); setOver(null); }}
        onKeyDown={(e) => onCardKey(e, l)} onDoubleClick={() => setDetail(l.id)}
        onContextMenu={(e) => { if (!canMove) return; e.preventDefault(); openMenu(l.id, e.clientX, e.clientY); }}>
        <div className="lc-h">
          <button type="button" className={`lc-t${anon ? ' anon' : ''}`} onClick={() => { setDetail(l.id); setTab('resumen'); }}>{leadTitle(l)}</button>
          {l.channel === 'reservar_cupo' && <span className="chip gold sm a-tip" data-tip="Cliente Fundador"><Sparkles size={11} aria-hidden="true" /><span className="sr">Fundador</span></span>}
          {canMove && <button type="button" className="lc-more a-tip" data-tip="Acciones (M)" aria-label={`Acciones: ${leadTitle(l)}`} aria-haspopup="menu" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); openMenu(l.id, r.right - 220, r.bottom + 4); }}><MoreHorizontal size={15} /></button>}
        </div>
        {what && <div className="lc-pack" title={what}>{l.pack ? what : `Armó: ${what}`}</div>}
        {(l.setup != null || l.monthly != null) && <div className="lc-amt adm-amt"><b>{l.setup != null ? clp(l.setup) : 'Sin pago inicial'}</b>{l.monthly != null && <span> + {clp(l.monthly)}/mes</span>}</div>}
        <div className="lc-f">
          <span className="src"><ch.icon size={12} aria-hidden="true" />{CH_LONG[l.channel] || ch.label}</span>
          <span className={late ? 'late' : ''} title={abs(since)}>{late && <Clock size={12} aria-hidden="true" />}{late ? '+24 h' : ago(since, now)}</span>
        </div>
      </article>
    );
  };

  // Esc cierra el detalle aunque el foco haya quedado fuera del panel (p. ej. tras guardar)
  useEffect(() => {
    if (!detail) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[role=menu]')) setDetail(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [detail]);

  return (
    <>
      <div className="sr" aria-live="assertive">{live}</div>
      {view === 'kanban' ? (
        <div className="kb" role="list" aria-label="Etapas">
          {cols.map((c) => {
            const collapsed = COLLAPSED.has(c.id) && !open.has(c.id) && !c.items.length && drag === null;
            const sum = c.items.reduce((a, l) => a + (l.setup || 0), 0);
            const invalid = drag !== null && c.id === 'activo';
            return (
              <section key={c.id} role="listitem" className={`kc${collapsed ? ' collapsed' : ''}${over === c.id && !invalid ? ' over' : ''}${invalid ? ' invalid' : ''}`} aria-label={c.label} data-stage={c.id}
                onDragOver={(e) => { if (!invalid) { e.preventDefault(); setOver(c.id); } }} onDragLeave={() => setOver((o) => (o === c.id ? null : o))}
                onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); setOver(null); setDrag(null); if (id) move(id, c.id); }}>
                {collapsed ? (
                  <button type="button" className="kc-v" onClick={() => setOpen((s) => new Set(s).add(c.id))} aria-label={`Expandir ${c.label}`}><ChevronsLeftRight size={14} aria-hidden="true" /><span>{c.label}</span><b>{c.items.length}</b></button>
                ) : (
                  <>
                    <h2><i className={`dot st-${c.id}`} aria-hidden="true" />{c.label}<span>{c.items.length}</span></h2>
                    {sum > 0 && <div className="kc-sum">{clp(sum)} iniciales</div>}
                    {c.items.map(card)}
                    {drag !== null && !c.items.length && !invalid && <div className="kc-drop">Suelta aquí</div>}
                    {c.id === 'activo' && !c.items.length && drag === null && <div className="kc-hint">Se llena al dar de alta clientes.</div>}
                  </>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="tbl-wrap">
          <table className="adm-table cards lt">
            <thead><tr><th>Solicitud</th><th>Origen</th><th>Pack</th><th className="n">Inicial</th><th className="n">Mensual</th><th>Etapa</th><th>Llegó</th></tr></thead>
            <tbody>{leads.map((l) => (
              <tr key={l.id} data-testid="lead-row" tabIndex={0} onClick={() => setDetail(l.id)} onKeyDown={(e) => { if (e.key === 'Enter') setDetail(l.id); }}>
                <td data-l="Solicitud"><b className={l.name ? '' : 'anon'}>{leadTitle(l)}</b></td>
                <td data-l="Origen">{CH_LONG[l.channel] || CH[l.channel]?.label}</td>
                <td data-l="Pack">{l.pack || (labels(l) ? labels(l)!.join(', ') : 'Sin definir')}</td>
                <td data-l="Inicial" className="n">{l.setup != null ? clp(l.setup) : 'No indica'}</td>
                <td data-l="Mensual" className="n">{l.monthly != null ? clp(l.monthly) : 'No indica'}</td>
                <td data-l="Etapa"><span className={`stchip st-${l.stage}`}><i className={`dot st-${l.stage}`} />{label(l.stage)}</span></td>
                <td data-l="Llegó"><time dateTime={l.createdAt} title={abs(l.createdAt)}>{ago(l.createdAt, now)}</time></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {current && (
        <div className="sheet-ovl" onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}>
          <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-t" onKeyDown={(e) => e.key === 'Escape' && setDetail(null)}>
            <div className="sheet-h">
              <div><h2 id="sheet-t">{leadTitle(current)}</h2><span className={`stchip st-${current.stage}`}><i className={`dot st-${current.stage}`} />{label(current.stage)}</span></div>
              <button type="button" className="btn-a ghost icon sm a-tip" data-tip="Cerrar (Esc)" aria-label="Cerrar detalle" onClick={() => setDetail(null)} autoFocus><X size={16} /></button>
            </div>
            <div className="tabs" role="tablist" aria-label="Secciones">
              <button type="button" role="tab" aria-selected={tab === 'resumen'} onClick={() => setTab('resumen')}>Resumen</button>
              <button type="button" role="tab" aria-selected={tab === 'cotizaciones'} onClick={() => setTab('cotizaciones')}>Cotizaciones</button>
            </div>
            {tab === 'cotizaciones' ? <QuotesPanel requestId={current.id} sample={sample} canWrite={canMove} onChange={(m) => toast({ text: m })} /> : (<>
            <dl className="sheet-dl">
              <dt>Origen</dt><dd>{CH_LONG[current.channel] || CH[current.channel]?.label}</dd>
              <dt>Llegó</dt><dd>{abs(current.createdAt)}</dd>
              {current.email && <><dt>Correo</dt><dd><a href={`mailto:${current.email}`}>{current.email}</a> <button type="button" className="btn-a ghost icon sm a-tip" data-tip="Copiar correo" aria-label="Copiar correo" onClick={() => { navigator.clipboard?.writeText(current.email!); toast({ text: 'Correo copiado.' }); }}><Copy size={14} /></button></dd></>}
              {current.phone && <><dt>Teléfono</dt><dd>{current.phone} <a className="btn-a ghost icon sm a-tip" data-tip="Abrir WhatsApp" aria-label="Abrir WhatsApp" href={`https://wa.me/${current.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /></a></dd></>}
              {current.pack && <><dt>Pack</dt><dd>{current.pack}</dd></>}
              {labels(current) && <><dt>Armó</dt><dd>{labels(current)!.join(', ')}</dd></>}
              {(current.setup != null || current.monthly != null) && <><dt>Montos mostrados</dt><dd className="adm-amt">{current.setup != null ? clp(current.setup) : 'Sin pago inicial'}{current.monthly != null ? ` + ${clp(current.monthly)}/mes` : ''}</dd></>}
              {Object.entries(current.payload || {}).filter(([k, v]) => ['empresa', 'tipo', 'presupuesto', 'origen'].includes(k) && typeof v === 'string').map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k[0].toUpperCase() + k.slice(1)}</dt><dd>{String(v)}</dd></div>)}
            </dl>
            {current.meetingAt && <p className="adm-note">Reunión: {abs(current.meetingAt)}</p>}
            {current.lostReason && <p className="adm-note">Motivo de cancelación: {current.lostReason}</p>}
            {current.message && <><h3>Mensaje</h3><p className="sheet-msg">{current.message}</p></>}
            </>)}
            {sample && <p className="adm-note">Datos de ejemplo: nada de esto existe en la base de datos.</p>}
            <div className="sheet-f"><Link href="/admin/solicitudes" className="btn-a ghost sm" onClick={() => setDetail(null)}>Cerrar</Link>
              {canMove && current.stage === 'nuevo' && <button type="button" className="btn-a primary sm" onClick={() => move(current.id, 'contactado')}>Marcar contactado <ChevronRight size={14} aria-hidden="true" /></button>}</div>
          </aside>
        </div>
      )}

      {menu && (() => { const l = leads.find((x) => x.id === menu.id); if (!l) return null; return (
        <>
          <div className="ctx-ovl" onMouseDown={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
          <div className="menu ctx" role="menu" aria-label={`Acciones: ${leadTitle(l)}`} style={{ left: menu.x, top: menu.y }} onKeyDown={(e) => {
            if (e.key === 'Escape') { setMenu(null); document.getElementById(`card-${l.id}`)?.focus(); }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const it = [...e.currentTarget.querySelectorAll<HTMLElement>('[role=menuitem]:not([disabled])')]; const i = it.indexOf(document.activeElement as HTMLElement); it[(i + (e.key === 'ArrowDown' ? 1 : -1) + it.length) % it.length]?.focus(); }
          }}>
            <button role="menuitem" type="button" autoFocus onClick={() => { setMenu(null); setDetail(l.id); setTab('resumen'); }}><PanelRightOpen size={15} aria-hidden="true" /> Ver detalle</button>
            <button role="menuitem" type="button" onClick={() => { setMenu(null); setDetail(l.id); setTab('cotizaciones'); }}><Blocks size={15} aria-hidden="true" /> Cotizaciones</button>
            <div className="a-lbl"><ArrowRightLeft size={12} aria-hidden="true" /> Mover a</div>
            {stages.filter((st) => st.id !== l.stage).map((st) => (
              <button key={st.id} role="menuitem" type="button" disabled={st.id === 'activo'} title={st.id === 'activo' ? 'Se asigna al dar de alta' : undefined} onClick={() => { setMenu(null); move(l.id, st.id); }}><i className={`dot st-${st.id}`} aria-hidden="true" /> {st.label}</button>
            ))}
          </div>
        </>
      ); })()}

      {ask && (() => { const l = leads.find((x) => x.id === ask.id); return (
        <div className="ovl" onMouseDown={(e) => e.target === e.currentTarget && setAsk(null)}>
          <form className="ask" role="dialog" aria-modal="true" aria-labelledby="ask-t" onSubmit={(e) => {
            e.preventDefault(); const f = new FormData(e.currentTarget);
            const extra = ask.to === 'reunion' ? { meetingAt: new Date(String(f.get('when'))).toISOString() } : { reason: String(f.get('reason') || '').trim() };
            if (ask.to === 'cancelado' && !extra.reason) return;
            setAsk(null); move(ask.id, ask.to, { extra });
          }} onKeyDown={(e) => e.key === 'Escape' && setAsk(null)}>
            <h2 id="ask-t">{ask.to === 'reunion' ? 'Agendar reunión' : 'Cancelar solicitud'}</h2>
            <p className="adm-note">{l ? leadTitle(l) : ''}</p>
            {ask.to === 'reunion'
              ? <div className="adm-field"><label htmlFor="ask-when">Fecha y hora de la reunión</label><input id="ask-when" name="when" type="datetime-local" required autoFocus /></div>
              : <div className="adm-field"><label htmlFor="ask-reason">Motivo</label><select id="ask-reason" name="reason" required autoFocus defaultValue=""><option value="" disabled>Elige un motivo…</option><option>Precio</option><option>Eligió otra opción</option><option>No respondió</option><option>No era el momento</option><option>Fuera de alcance</option><option>Duplicada</option><option>Otro</option></select></div>}
            <div className="form-acts"><button type="button" className="btn-a ghost" onClick={() => setAsk(null)}>Volver</button><button type="submit" className={`btn-a ${ask.to === 'cancelado' ? 'danger' : 'primary'}`}>{ask.to === 'reunion' ? 'Mover a Reunión' : 'Cancelar solicitud'}</button></div>
          </form>
        </div>
      ); })()}

      <div className="toasts" aria-live="polite">{toasts.map((t) => (
        <div key={t.id} className={`a-toast${t.error ? ' err' : ''}`} role={t.error ? 'alert' : 'status'}>
          <span>{t.text}</span>
          {t.undo && <button type="button" onClick={() => { t.undo!(); setToasts((x) => x.filter((y) => y.id !== t.id)); }}>Deshacer</button>}
          {t.action && <button type="button" onClick={() => { t.action!.run(); setToasts((x) => x.filter((y) => y.id !== t.id)); }}>{t.action.label}</button>}
          <button type="button" aria-label="Cerrar aviso" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}><X size={14} /></button>
        </div>
      ))}</div>
    </>
  );
}
