'use client';
/**
 * Proceso interactivo (#proceso). Escritorio: stepper horizontal de 6 nodos; el riel se llena con el scroll
 * (scrub 0.6, SIN pin) y click/teclado en un nodo muestra su panel. Móvil: lista compacta que se expande al tocar.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { STEPS } from '@/content/site';
import { isReduced } from './hooks';

export default function ProcessLive({ n }: { n: number }) {
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState<number>(-1);
  const rail = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let kill = () => {};
    let on = true;
    import('@/lib/gsap').then(({ gsap, setupGsap }) => {
      if (!on) return;
      setupGsap();
      const fill = el.querySelector('.ps-fill');
      if (isReduced()) { gsap.set(fill, { scaleX: 1 }); return; }
      const tw = gsap.fromTo(fill, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 30%', scrub: 0.6 } });
      kill = () => { tw.scrollTrigger?.kill(); tw.kill(); };
    });
    return () => { on = false; kill(); };
  }, []);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = e.key, L = STEPS.length;
    const i = k === 'ArrowRight' ? (sel + 1) % L : k === 'ArrowLeft' ? (sel - 1 + L) % L : k === 'Home' ? 0 : k === 'End' ? L - 1 : -1;
    if (i < 0) return;
    e.preventDefault(); setSel(i); tabs.current[i]?.focus();
  };

  return (
    <section className="sec ps-sec" id="proceso" aria-labelledby="ps-t">
      <div className="wrap">
        <div className="ps-head">
          <div className="eyebrow"><b>({String(n).padStart(2, '0')})</b>Proceso</div>
          <h2 id="ps-t" className="ps-h">Seis pasos. <span className="dim">Cero sorpresas.</span></h2>
          <p className="ps-lead">Sabes qué pasa, cuándo y cuánto cuesta en cada etapa. Plazos referenciales para un sitio Pyme.</p>
        </div>
        {/* escritorio: stepper */}
        <div className="ps-d">
          <div className="ps-rail" ref={rail} aria-hidden="true"><i className="ps-fill" /></div>
          <div className="ps-nodes" role="tablist" aria-label="Pasos del proceso" onKeyDown={onKey}>
            {STEPS.map((s, i) => (
              <button key={s.title} ref={(b) => { tabs.current[i] = b; }} type="button" role="tab" id={`pst-${i}`} aria-selected={sel === i} aria-controls={`psp-${i}`}
                tabIndex={sel === i ? 0 : -1} className="ps-node" onClick={() => setSel(i)}>
                <i aria-hidden="true" /><span className="mono">0{i + 1}</span><b>{s.title}</b>
              </button>
            ))}
          </div>
          {STEPS.map((s, i) => (
            <div key={s.title} className="ps-panel" role="tabpanel" id={`psp-${i}`} aria-labelledby={`pst-${i}`} hidden={sel !== i} tabIndex={0}>
              <span className="mono">0{i + 1} · {s.when}</span><h3>{s.title}</h3><p>{s.desc}</p>
            </div>
          ))}
        </div>
        {/* móvil: lista compacta que se expande */}
        <ol className="ps-m">
          {STEPS.map((s, i) => (
            <li key={s.title} data-open={open === i}>
              <button type="button" aria-expanded={open === i} aria-controls={`psm-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>
                <i aria-hidden="true" /><span className="mono">0{i + 1}</span><b>{s.title}</b><small>{s.when}</small>
              </button>
              <div id={`psm-${i}`} role="region" aria-label={s.title} hidden={open !== i}><p>{s.desc}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
