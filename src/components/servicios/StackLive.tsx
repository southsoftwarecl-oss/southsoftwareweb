'use client';
/**
 * Stack vivo (#stack): chips de filtro por la columna "cat" de STACK con reordenamiento Flip,
 * luz especular de cromo (radial-gradient con --mx/--my), tooltip con hover, :focus-visible y tap (aria-expanded).
 * Resalta las tecnologías del servicio activo en el selector (evento "sv:service").
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { STACK } from '@/content/site';
import { STACK_CATS, STACK_FOR } from '@/content/servicios';
import { isReduced } from './hooks';

type G = typeof import('@/lib/gsap');
const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');

export default function StackLive({ n }: { n: number }) {
  const [cat, setCat] = useState('Todos');
  const [tip, setTip] = useState<string | null>(null);
  const [svc, setSvc] = useState('software-a-medida');
  const grid = useRef<HTMLUListElement>(null);
  const g = useRef<G | null>(null);
  const state = useRef<Flip.FlipState | null>(null);
  const hot = new Set(STACK_FOR[svc] ?? []);

  useEffect(() => { let on = true; import('@/lib/gsap').then((m) => { if (on) { m.setupGsap(); g.current = m; } }); return () => { on = false; }; }, []);
  useEffect(() => {
    const f = (e: Event) => setSvc((e as CustomEvent<string>).detail);
    document.addEventListener('sv:service', f);
    return () => document.removeEventListener('sv:service', f);
  }, []);
  useEffect(() => {
    if (!tip) return;
    const close = (e: Event) => { if (!(e.target as Element).closest?.('.stk-t')) setTip(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setTip(null); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [tip]);

  const filter = (c: string) => {
    const m = g.current;
    // reserva el alto de la grilla completa: filtrar nunca mueve lo que viene debajo (CLS 0)
    if (grid.current && !grid.current.style.minHeight) grid.current.style.minHeight = `${grid.current.offsetHeight}px`;
    if (m && grid.current && !isReduced()) state.current = m.Flip.getState(grid.current.querySelectorAll('.stk-t'));
    setCat(c); setTip(null);
  };
  useLayoutEffect(() => {
    const m = g.current, s = state.current, el = grid.current;
    state.current = null;
    if (!m || !s || !el) return;
    const tw = m.Flip.from(s, {
      targets: el.querySelectorAll('.stk-t'), duration: 0.55, ease: 'south', scale: true, absolute: true,
      onEnter: (els) => m.gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'south' }),
      onLeave: (els) => m.gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.3, ease: 'south-in' }),
    });
    return () => { tw.kill(); };
  }, [cat]);

  const spec = (e: React.PointerEvent<HTMLElement>) => {
    const t = e.currentTarget, r = t.getBoundingClientRect();
    t.style.setProperty('--mx', `${e.clientX - r.left}px`); t.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <section className="sec stk-sec" id="stack" aria-labelledby="stk-h">
      <div className="wrap">
        <div className="stk-head">
          <div className="eyebrow"><b>({String(n).padStart(2, '0')})</b>Stack</div>
          <h2 id="stk-h" className="ps-h">Herramientas serias. <span className="dim">Elegidas por una razón.</span></h2>
          <div className="stk-chips" role="group" aria-label="Filtrar por categoría">
            {['Todos', ...STACK_CATS].map((c) => (
              <button type="button" key={c} className="chip-b" aria-pressed={cat === c} onClick={() => filter(c)}>{c}</button>
            ))}
          </div>
        </div>
        <ul className="stk" ref={grid}>
          {STACK.map(([name, c, desc]) => {
            const id = `stk-${slugify(name)}`;
            const show = cat === 'Todos' || c === cat;
            return (
              <li key={name} className="stk-t" data-flip-id={id} hidden={!show} data-hot={hot.has(name) || undefined} data-name={name}>
                <button type="button" aria-expanded={tip === name} aria-describedby={`${id}-tip`} onPointerMove={spec}
                  onClick={() => setTip(tip === name ? null : name)}>
                  <small>{c}</small><b>{name}</b>
                </button>
                <span className="stk-tip" role="tooltip" id={`${id}-tip`}>{desc}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
