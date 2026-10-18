'use client';
/** Datos: toggle "Planilla → Dashboard". Una tabla de 5 filas se reordena con Flip en 3 KPIs + un gráfico que se dibuja (valores de ejemplo). */
import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, Flip } from '@/lib/gsap';
import DemoFrame from './DemoFrame';
import { useDemo } from './useDemo';
import { isReduced, useReducedMotion } from '../hooks';

// valores de EJEMPLO (no son datos de clientes)
const ROWS = [['Ventas del mes', '1.240'], ['Pedidos', '318'], ['Ticket medio', '$3.900'], ['Stock crítico', '12'], ['Clientes nuevos', '46']];
const SERIES = [22, 38, 30, 52, 64, 58, 80];
const PTS = SERIES.map((v, i) => `${(i / (SERIES.length - 1)) * 100},${100 - v}`).join(' ');

export default function DatosDemo() {
  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const reduced = useReducedMotion();
  const [dash, setDash] = useState<boolean | null>(null);
  const on = dash ?? reduced; // frame final: dashboard
  const set = (v: boolean | ((p: boolean) => boolean)) => {
    const b = box.current;
    if (b && !isReduced()) flipState.current = Flip.getState(b.querySelectorAll('[data-flip-id]'));
    setDash((p) => (typeof v === 'function' ? v(p ?? false) : v));
  };
  const { paused, toggle, tl } = useDemo(root, (g) => {
    const t = g.timeline({ repeat: -1 });
    t.call(() => set(true), [], 3).call(() => set(false), [], 7);
    return t;
  });
  useLayoutEffect(() => {
    const s = flipState.current, b = box.current;
    if (!s || !b) return;
    flipState.current = null;
    const tw = Flip.from(s, {
      targets: b.querySelectorAll('[data-flip-id]'), duration: 0.7, ease: 'south', absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.4 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.25 }),
    });
    const line = b.querySelector('.da-line');
    if (on && line) gsap.fromTo(line, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'south', delay: 0.35 });
    return () => { tw.kill(); if (line) gsap.killTweensOf(line); };
  }, [on]);
  return (
    <DemoFrame slug="ciencia-de-datos" root={root} paused={paused} onPause={toggle} className="dm-da"
      controls={<button type="button" className="dm-btn dm-switch" aria-pressed={on} onClick={() => { set(!on); tl.current?.seek(0, false); }}><i aria-hidden="true" />Planilla → Dashboard</button>}>
      <div className={`da-box ${on ? 'is-dash' : 'is-sheet'}`} ref={box}>
        {ROWS.map(([k, v], i) => (
          <div className={`da-row da-r${i}`} key={k} data-flip-id={`r${i}`}><span>{k}</span><b>{v}</b></div>
        ))}
        <div className="da-chart" data-flip-id="chart">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline className="da-line" pathLength={1} points={PTS} vectorEffect="non-scaling-stroke" /></svg>
        </div>
        <small className="da-note">Valores de ejemplo</small>
      </div>
    </DemoFrame>
  );
}
