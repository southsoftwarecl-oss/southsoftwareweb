'use client';
/**
 * Selector de servicios con panel de demo (reemplaza las 6 filas).
 * - ≥1025 px: tablist vertical (col 1–5) + tabpanel con placa de cromo (col 6–12). Barra activa con Flip.
 * - <1025 px: acordeón (button aria-expanded + region), el primero abierto, altura animada con Flip.
 * Un solo DOM para ambos modos (el CSS decide el layout, el JS solo cambia roles ARIA):
 * los 6 servicios y sus h2 van en el HTML del SSR; los paneles inactivos llevan `hidden`.
 * /servicios#<slug> abre ese tab; cambiar de tab hace history.replaceState.
 */
import dynamic from 'next/dynamic';
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type KeyboardEvent } from 'react';
import { SERVICES } from '@/content/site';
import { AIcon } from '../ui';
import { isReduced, useHash, useNarrow } from './hooks';

type G = typeof import('@/lib/gsap');
const none = () => null;
// cada demo es un chunk propio; solo se monta la del tab activo (una sola corre a la vez)
const DEMOS: Record<string, ComponentType> = {
  'software-a-medida': dynamic(() => import('./demos/SoftwareDemo'), { ssr: false, loading: none }),
  'software-de-escritorio': dynamic(() => import('./demos/EscritorioDemo'), { ssr: false, loading: none }),
  'sitios-web': dynamic(() => import('./demos/WebDemo'), { ssr: false, loading: none }),
  'apps-moviles': dynamic(() => import('./demos/AppsDemo'), { ssr: false, loading: none }),
  'seguridad-informatica': dynamic(() => import('./demos/SeguridadDemo'), { ssr: false, loading: none }),
  'ciencia-de-datos': dynamic(() => import('./demos/DatosDemo'), { ssr: false, loading: none }),
};
const idxOf = (slug: string) => SERVICES.findIndex((s) => s.slug === slug);
/** Avisa al Stack qué servicio está activo (resalta sus tecnologías). */
const announce = (i: number) => document.dispatchEvent(new CustomEvent('sv:service', { detail: i >= 0 ? SERVICES[i].slug : '' }));

const Check = () => <svg className="sv-chk" viewBox="0 0 16 16" aria-hidden="true"><path pathLength={1} d="M3 8.5l3.2 3L13 4.5" /></svg>;

export default function Selector() {
  const narrow = useNarrow();
  const hash = useHash();
  const fromHash = idxOf(hash);
  const [userSel, setUserSel] = useState<number | null>(null); // tab seleccionado por el usuario
  const [userCur, setUserCur] = useState<number | null>(null); // panel visible (cambia tras la salida)
  const sel = userSel ?? (fromHash >= 0 ? fromHash : 0);
  const cur = userCur ?? (fromHash >= 0 ? fromHash : 0); // -1 = acordeón todo cerrado
  const vis = narrow ? cur : cur < 0 ? sel : cur;

  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const g = useRef<G | null>(null);
  const out = useRef<gsap.core.Tween | null>(null);
  const barState = useRef<Flip.FlipState | null>(null);
  const accState = useRef<Flip.FlipState | null>(null);
  const prevPlate = useRef<HTMLElement | null>(null);
  const animIn = useRef(false);
  const scrollTo = useRef<number | null>(null);

  // GSAP diferido (no entra en el JS crítico); con reduced motion los cambios son instantáneos
  useEffect(() => { let on = true; import('@/lib/gsap').then((m) => { if (on) { m.setupGsap(); g.current = m; } }); return () => { on = false; }; }, []);
  // Activity (Next oculta la página al navegar): al ocultarse vuelve a mandar el hash
  useLayoutEffect(() => () => { setUserSel(null); setUserCur(null); }, []);
  useEffect(() => { announce(vis); }, [vis]);
  // links a /servicios#slug estando ya en /servicios (Next usa pushState: no hay hashchange)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href*="#"]') as HTMLAnchorElement | null;
      if (!a || a.pathname !== location.pathname) return;
      const i = idxOf(a.hash.slice(1));
      if (i < 0) return;
      setUserSel(i); setUserCur(i);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  // con hash en móvil: llevar el ítem abierto a la vista una vez hidratado
  useEffect(() => {
    if (fromHash < 0) return;
    const el = document.getElementById(SERVICES[fromHash].slug);
    if (el && matchMedia('(max-width: 1024px)').matches) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
  }, [fromHash]);

  const plateOf = (i: number) => root.current?.querySelector<HTMLElement>(`#svp-${SERVICES[i]?.slug} .sv-plate`) ?? null;
  const setHash = (i: number) => {
    if (i < 0) return;
    history.replaceState(history.state, '', `${location.pathname}${location.search}#${SERVICES[i].slug}`);
  };

  /** Tabs (escritorio): selección inmediata, panel tras la salida (0.25 s 'south-in'). */
  const select = (i: number, focus = false) => {
    if (focus) tabs.current[i]?.focus();
    if (i === sel && i === vis) return;
    const m = g.current, motion = !!m && !isReduced();
    if (motion && root.current) barState.current = m!.Flip.getState(root.current.querySelectorAll('.sv-bar'));
    setUserSel(i); setHash(i);
    out.current?.kill();
    const p = plateOf(vis);
    if (!motion || !p) { setUserCur(i); return; }
    prevPlate.current = p;
    out.current = m!.gsap.to(p, { opacity: 0, scale: 0.98, duration: 0.25, ease: 'south-in', onComplete: () => { animIn.current = true; setUserCur(i); } });
  };
  /** Acordeón (móvil): uno abierto a la vez, altura animada con Flip (0.45 s 'south'). */
  const toggleAcc = (i: number) => {
    const next = vis === i ? -1 : i;
    const m = g.current;
    if (m && !isReduced() && root.current) accState.current = m.Flip.getState(root.current.querySelectorAll('.sv-item'));
    scrollTo.current = next;
    setUserCur(next); setUserSel(next < 0 ? sel : next); setHash(next);
    if (next >= 0) animIn.current = !!accState.current;
  };

  useLayoutEffect(() => {
    const m = g.current, el = root.current;
    if (!m || !el) return;
    const s = barState.current; barState.current = null;
    if (s) m.Flip.from(s, { targets: el.querySelectorAll('.sv-bar'), duration: 0.5, ease: 'south' });
  }, [sel]);

  useLayoutEffect(() => {
    const m = g.current, el = root.current;
    if (prevPlate.current) { m?.gsap.set(prevPlate.current, { clearProps: 'opacity,transform,scale' }); prevPlate.current = null; }
    if (!m || !el) return;
    const tw: (gsap.core.Animation | { revert: () => void })[] = [];
    const a = accState.current; accState.current = null;
    if (a) tw.push(m.Flip.from(a, { targets: el.querySelectorAll('.sv-item'), duration: 0.45, ease: 'south', nested: true }));
    // llevar el encabezado del acordeón a la vista si quedó fuera (medido en el layout final)
    const si = scrollTo.current; scrollTo.current = null;
    if (si != null && si >= 0) {
      const head = el.querySelector<HTMLElement>(`#sva-${SERVICES[si].slug}`);
      const top = head ? head.getBoundingClientRect().top - (a ? 0 : 0) : 0;
      if (head && (top < 70 || top > innerHeight * 0.55)) window.scrollTo({ top: scrollY + top - 84, behavior: isReduced() ? 'auto' : 'smooth' });
    }
    if (!animIn.current || vis < 0) return;
    animIn.current = false;
    const p = plateOf(vis);
    if (!p) return;
    if (!narrow) tw.push(m.gsap.fromTo(p, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: 'mercury', clearProps: 'opacity,transform' }));
    // includes: palabras con SplitText (stagger .02) y checks que se dibujan
    const items = p.querySelectorAll<HTMLElement>('.sv-inc-t');
    const split = new m.SplitText(items, { type: 'words', wordsClass: 'sv-w' });
    tw.push(split);
    tw.push(m.gsap.fromTo(split.words, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.02, delay: 0.15, ease: 'south', onComplete: () => split.revert() }));
    tw.push(m.gsap.fromTo(p.querySelectorAll('.sv-chk path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, stagger: 0.08, delay: 0.2, ease: 'south', clearProps: 'strokeDashoffset' }));
    return () => { tw.forEach((t) => ('kill' in t ? (t as gsap.core.Animation).kill() : t.revert())); split.revert(); };
  }, [vis, narrow]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = SERVICES.length;
    const k = e.key;
    const i = k === 'ArrowDown' || k === 'ArrowRight' ? (sel + 1) % n : k === 'ArrowUp' || k === 'ArrowLeft' ? (sel - 1 + n) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
    if (i < 0) return;
    e.preventDefault();
    select(i, true);
  };

  return (
    <div className="sv" ref={root} data-mode={narrow ? 'acc' : 'tabs'}>
      <div className="sv-tabs" role="tablist" aria-orientation="vertical" aria-label="Servicios" onKeyDown={onKey}>
        {SERVICES.map((s, i) => (
          <button key={s.slug} ref={(b) => { tabs.current[i] = b; }} type="button" role="tab" id={`svt-${s.slug}`}
            aria-selected={sel === i} aria-controls={`svp-${s.slug}`} tabIndex={sel === i ? 0 : -1}
            className="sv-tab" onClick={() => select(i)}>
            {sel === i && <i className="sv-bar" data-flip-id="sv-bar" aria-hidden="true" />}
            <span className="mono">0{i + 1}</span><AIcon name={s.icon} /><span className="sv-tt">{s.title}</span>
          </button>
        ))}
        <p className="sv-note">Demos ilustrativas: los números que aparecen en ellas son de ejemplo.</p>
      </div>
      <div className="sv-panels">
        {SERVICES.map((s, i) => {
          const open = vis === i;
          const Demo = DEMOS[s.slug];
          return (
            <div className="sv-item" id={s.slug} key={s.slug} data-open={open}>
              <button type="button" className="sv-acc" id={`sva-${s.slug}`} aria-expanded={open} aria-controls={`svp-${s.slug}`} onClick={() => toggleAcc(i)}>
                <span className="mono">0{i + 1}</span><AIcon name={s.icon} /><span className="sv-tt">{s.title}</span><i className="sv-plus" aria-hidden="true" />
              </button>
              <div className="sv-panel" id={`svp-${s.slug}`} role={narrow ? 'region' : 'tabpanel'} aria-labelledby={narrow ? `sva-${s.slug}` : `svt-${s.slug}`}
                tabIndex={narrow ? undefined : 0} hidden={!open}>
                <div className="sv-plate"><div className="sv-plate-in">
                  <div className="sv-demo">{open && Demo ? <Demo /> : null}</div>
                  <div className="sv-info">
                    <h2>{s.title}</h2>
                    <p>{s.desc}</p>
                    <div className="tags">{s.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
                    <ul className="sv-inc">{s.includes.map((x) => <li key={x}><Check /><span className="sv-inc-t">{x}</span></li>)}</ul>
                  </div>
                </div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
