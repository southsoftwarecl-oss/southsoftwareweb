'use client';
/**
 * Tarjeta "Tu brief": se compone mientras el usuario escribe.
 * "Hola, soy <nombre> de <empresa>. Necesito <tipo> con un presupuesto de <presupuesto>. <mensaje (140)>…"
 * Los campos vacíos son líneas skeleton. aria-live="off": el resumen accesible se anuncia
 * solo al enviar (ver BriefStudio). Tras el envío muestra "Recibido ✓".
 */
import { useLayoutEffect, useRef } from 'react';
import { TYPE_PHRASE, type Budget, type ProjectType } from '@/content/contacto';

export type BriefData = { nombre: string; empresa: string; tipo: ProjectType | ''; presupuesto: Budget | ''; mensaje: string };
type Enter = (el: Element) => void;

export const clip = (s: string, n = 140) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s);
export const budgetClause = (b: Budget | '') =>
  b === 'Aún no lo sé' ? ['con un presupuesto ', 'aún por definir'] as const : ['con un presupuesto de ', b ? b.charAt(0).toLowerCase() + b.slice(1) : ''] as const;

/** Texto plano del brief (WhatsApp y resumen accesible). */
export function briefText(d: BriefData) {
  const parts = [d.nombre.trim() ? `Hola, soy ${d.nombre.trim()}${d.empresa.trim() ? ` de ${d.empresa.trim()}` : ''}.` : 'Hola, quiero cotizar un proyecto con South Software.'];
  if (d.tipo) { const [pre, v] = budgetClause(d.presupuesto); parts.push(`Necesito ${TYPE_PHRASE[d.tipo]}${d.presupuesto ? ` ${pre}${v}` : ''}.`); }
  if (d.mensaje.trim()) parts.push(clip(d.mensaje.trim()));
  return parts.join(' ');
}

/** Un valor del brief: skeleton si está vacío; al llenarse (o cambiar si es discreto) entra con yPercent 100→0. */
function Slot({ v, w, discrete, enter }: { v: string; w: number; discrete?: boolean; enter: Enter | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const key = discrete ? v : v ? '1' : '';
  const prev = useRef(key);
  useLayoutEffect(() => {
    if (key && key !== prev.current && ref.current) enter?.(ref.current);
    prev.current = key;
  }, [key, enter]);
  if (!v) return <span className="skel" style={{ width: `${w}ch` }} aria-hidden="true" />;
  return <span className="slot"><span className="sv" ref={ref}>{v}</span></span>;
}

export default function BriefCard({ d, enter, sealed, cardRef }: {
  d: BriefData; enter: Enter | null; sealed: boolean; cardRef?: React.Ref<HTMLDivElement>;
}) {
  const filled = [d.nombre.trim(), d.empresa.trim(), d.tipo, d.presupuesto, d.mensaje.trim()].filter(Boolean).length;
  const [pre, bv] = budgetClause(d.presupuesto);
  const msg = d.mensaje.trim();
  return (
    <div className={`bcard${sealed ? ' sealed' : ''}`} ref={cardRef} data-bcard aria-live="off">
      <div className="bc-body">
        <div className="bc-top"><span className="mono">Tu brief</span><span className="mono bc-n">{sealed ? 'Enviado' : `${filled} / 5`}</span></div>
        {sealed ? (
          <div className="bc-ok" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path pathLength={1} d="M20 6 9 17l-5-5" /></svg>
            <p><b>Recibido ✓</b><span>Respondemos dentro de 24 horas hábiles.</span></p>
          </div>
        ) : (
          <p className="bc-text">
            Hola, soy <Slot v={d.nombre.trim()} w={9} enter={enter} /> de <Slot v={d.empresa.trim()} w={11} enter={enter} />.{' '}
            Necesito <Slot v={d.tipo ? TYPE_PHRASE[d.tipo] : ''} w={12} discrete enter={enter} /> {pre}<Slot v={bv} w={10} discrete enter={enter} />.{' '}
            {msg ? <span className="bc-msg"><Slot v={clip(msg)} w={0} enter={enter} /></span> : <span className="skel-lines" aria-hidden="true"><span className="skel" /><span className="skel short" /></span>}
          </p>
        )}
      </div>
      <i className="bc-shine" aria-hidden="true"><i /></i>
      <div className="bc-env" aria-hidden="true"><i className="bc-flap" /></div>
    </div>
  );
}
