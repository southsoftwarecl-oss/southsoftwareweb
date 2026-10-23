'use client';
/**
 * Tablero de solicitudes: kanban (arrastrar y soltar, teclado, menú "Mover a") y lista, con actualización optimista,
 * deshacer y errores legibles. En modo "Datos de ejemplo" todo es local: nunca llama al servidor.
 */
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Mail, MousePointerClick, Blocks, Ticket, PenLine, Clock, Sparkles, X, Copy, MessageCircle, ChevronRight, ChevronsLeftRight } from 'lucide-react';
import { moveRequestTo } from '@/app/admin/actions';
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
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
const labels = (l: Lead) => (l.builder as { labels?: string[] } | null)?.labels;
export const leadTitle = (l: Lead) => l.name || (l.channel === 'reservar_cupo' ? 'Cupo Fundador' : l.pack ? `Interés en ${l.pack}` : labels(l) ? 'Pack armado' : 'Solicitud');
const ago = (iso: string, now: number) => { const hh = Math.floor((now - new Date(iso).getTime()) / 3_600_000); return hh < 1 ? 'hace minutos' : hh < 24 ? `hace ${hh} h` : `hace ${Math.floor(hh / 24)} d`; };
const abs = (iso: string) => new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

type Toast = { id: number; text: string; undo?: () => void; error?: boolean };

export default function LeadsBoard({ leads: initial, stages, view, sample, now, canMove, openId }: { leads: Lead[]; stages: Stage[]; view: 'kanban' | 'lista'; sample: boolean; now: number; canMove: boolean; openId?: string }) {
  const [leads, setLeads] = useState(initial);
  useEffect(() => setLeads(initial), [initial]); // eslint-disable-line react-hooks/set-state-in-effect -- sincroniza con el servidor tras revalidar
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [live, setLive] = useState('');
  const [picked, setPicked] = useState<string | null>(null); // movimiento por teclado
  const [detail, setDetail] = useState<string | null>(openId || null);
  const [, start] = useTransition();
  const tid = useRef(0);

  const toast = (t: Omit<Toast, 'id'>) => { const id = ++tid.current; setToasts((x) => [...x.slice(-2), { ...t, id }]); setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), t.error ? 8000 : 6000); };
  const label = (id: string) => stages.find((s) => s.id === id)?.label || id;

  const move = (id: string, to: string, opts: { silent?: boolean } = {}) => {
    const l = leads.find((x) => x.id === id);
    if (!l || l.stage === to) return;
    if (to === 'activo') { toast({ text: '“Activo” se asigna al dar de alta al cliente.', error: true }); return; }
    const from = l.stage;
    setLeads((xs) => xs.map((x) => (x.id === id ? { ...x, stage: to as Lead['stage'] } : x)));
    setLive(`${leadTitle(l)} movida a ${label(to)}.`);
    const undo = () => move(id, from, { silent: true });
    if (sample) { if (!opts.silent) toast({ text: `Movida a ${label(to)} (ejemplo, no se guarda).`, undo }); return; }
    start(async () => {
      const r = await moveRequestTo(id, to);
      if (!r.ok) { setLeads((xs) => xs.map((x) => (x.id === id ? { ...x, stage: from } : x))); toast({ text: r.error || 'No se pudo mover.', error: true }); return; }
      if (!opts.silent) toast({ text: `Movida a ${label(to)}.`, undo });
    });
  };

  // Teclado en tarjeta: Espacio levanta/suelta, ←/→ cambia de columna, Esc cancela, M enfoca "Mover a", Enter abre el detalle.
  const onCardKey = (e: React.KeyboardEvent, l: Lead) => {
    if ((e.target as HTMLElement).closest('select,button,a,input')) return;
    const idx = stages.findIndex((s) => s.id === l.stage);
    if (e.key === ' ') { e.preventDefault(); if (picked === l.id) { setPicked(null); setLive(`Soltada en ${label(l.stage)}.`); } else { setPicked(l.id); setLive(`${leadTitle(l)} levantada. Usa flechas izquierda y derecha, Espacio para soltar, Escape para cancelar.`); } }
    else if (picked === l.id && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      let j = idx + (e.key === 'ArrowRight' ? 1 : -1);
      if (stages[j]?.id === 'activo') j += e.key === 'ArrowRight' ? 1 : -1;
      if (stages[j]) { move(l.id, stages[j].id); requestAnimationFrame(() => document.getElementById(`card-${l.id}`)?.focus()); }
    } else if (e.key === 'Escape') { setPicked(null); setDetail(null); }
    else if (e.key.toLowerCase() === 'm') { e.preventDefault(); document.getElementById(`mv-${l.id}`)?.focus(); }
    else if (e.key === 'Enter') setDetail(l.id);
  };

  const cols = useMemo(() => stages.map((s) => ({ ...s, items: leads.filter((l) => l.stage === s.id) })), [stages, leads]);
  const current = leads.find((l) => l.id === detail);

  const card = (l: Lead) => {
    const ch = CH[l.channel] || CH.form_contacto;
    const p = l.payload as Record<string, unknown>;
    const late = l.stage === 'nuevo' && now - new Date(l.createdAt).getTime() > 86_400_000;
    const anon = !l.name;
    return (
      <article key={l.id} id={`card-${l.id}`} className={`lc${picked === l.id ? ' picked' : ''}${drag === l.id ? ' dragging' : ''}`} data-testid="lead-card" tabIndex={0}
        aria-roledescription="tarjeta movible" aria-label={`${leadTitle(l)}, ${label(l.stage)}`}
        draggable={canMove} onDragStart={(e) => { setDrag(l.id); e.dataTransfer.setData('text/plain', l.id); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => { setDrag(null); setOver(null); }}
        onKeyDown={(e) => onCardKey(e, l)} onDoubleClick={() => setDetail(l.id)}>
        <div className="lc-h">
          <span className="lc-av" aria-hidden="true">{anon ? '?' : initials(l.name!)}</span>
          <button type="button" className={`lc-t${anon ? ' anon' : ''}`} onClick={() => setDetail(l.id)}>{leadTitle(l)}</button>
          {l.channel === 'reservar_cupo' && <span className="chip gold sm"><Sparkles size={11} aria-hidden="true" /> Fundador</span>}
        </div>
        {typeof p.empresa === 'string' && <div className="lc-sub">{p.empresa}</div>}
        <div className="lc-src"><span className="src"><ch.icon size={12} aria-hidden="true" />{CH_LONG[l.channel] || ch.label}</span>{l.pack && <b>{l.pack}</b>}{labels(l) && <b title={labels(l)!.join(', ')}>Armó: {labels(l)!.join(', ')}</b>}</div>
        {typeof p.tipo === 'string' && <div className="lc-sub">Tipo: {p.tipo}{typeof p.presupuesto === 'string' ? ` · ${p.presupuesto}` : ''}</div>}
        {(l.setup != null || l.monthly != null) && <div className="lc-amt adm-amt"><b>{l.setup != null ? clp(l.setup) : 'Sin pago inicial'}</b>{l.monthly != null && <span> + {clp(l.monthly)}/mes</span>}</div>}
        <div className="lc-f">
          <span className={late ? 'late' : ''} title={abs(l.createdAt)}>{late && <Clock size={12} aria-hidden="true" />}{late ? '+24 h sin contactar' : ago(l.createdAt, now)}</span>
          {canMove && (
            <form className="adm-move" onSubmit={(e) => { e.preventDefault(); const v = (new FormData(e.currentTarget).get('stage') as string) || ''; if (v) move(l.id, v); }}>
              <label className="sr" htmlFor={`mv-${l.id}`}>Mover a</label>
              <select id={`mv-${l.id}`} name="stage" defaultValue="" key={l.stage}>
                <option value="" disabled>Mover a…</option>
                {stages.filter((s) => s.id !== l.stage && s.id !== 'activo').map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button type="submit" className="btn-a secondary sm">Mover</button>
            </form>
          )}
        </div>
      </article>
    );
  };

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
            {current.message && <><h3>Mensaje</h3><p className="sheet-msg">{current.message}</p></>}
            {sample && <p className="adm-note">Datos de ejemplo: nada de esto existe en la base de datos.</p>}
            <div className="sheet-f"><Link href="/admin/solicitudes" className="btn-a ghost sm" onClick={() => setDetail(null)}>Cerrar</Link>
              {canMove && current.stage === 'nuevo' && <button type="button" className="btn-a primary sm" onClick={() => move(current.id, 'contactado')}>Marcar contactado <ChevronRight size={14} aria-hidden="true" /></button>}</div>
          </aside>
        </div>
      )}

      <div className="toasts" aria-live="polite">{toasts.map((t) => (
        <div key={t.id} className={`toast${t.error ? ' err' : ''}`} role={t.error ? 'alert' : 'status'}>
          <span>{t.text}</span>
          {t.undo && <button type="button" onClick={() => { t.undo!(); setToasts((x) => x.filter((y) => y.id !== t.id)); }}>Deshacer</button>}
          <button type="button" aria-label="Cerrar aviso" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}><X size={14} /></button>
        </div>
      ))}</div>
    </>
  );
}
