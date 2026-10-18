'use client';
/** Apps móviles: teléfono con 3 pantallas (login → catálogo → push que cae desde arriba), scroll-snap interno, puntos y auto-avance cada 3 s sin interacción. */
import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import DemoFrame from './DemoFrame';
import { useDemo } from './useDemo';
import { isReduced, useReducedMotion } from '../hooks';

const SCREENS = ['Inicio de sesión', 'Catálogo', 'Notificación push'];

export default function AppsDemo() {
  const root = useRef<HTMLDivElement>(null);
  const sc = useRef<HTMLDivElement>(null);
  const w = useRef(0); // ancho cacheado de una pantalla
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState<number | null>(null);
  const cur = idx ?? (reduced ? 2 : 0);
  const curRef = useRef(cur);
  useEffect(() => { curRef.current = cur; });

  const go = (i: number) => {
    const s = sc.current; if (!s) return;
    if (!w.current) w.current = s.clientWidth;
    s.scrollTo({ left: i * w.current, behavior: isReduced() ? 'auto' : 'smooth' });
  };
  const { paused, toggle, tl } = useDemo(root, (g) => {
    const t = g.timeline({ repeat: -1 });
    t.call(() => go((curRef.current + 1) % 3), [], 3);
    return t;
  });
  useEffect(() => {
    const s = sc.current; if (!s) return;
    const ro = new ResizeObserver(() => { w.current = s.clientWidth; });
    ro.observe(s);
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (w.current) setIdx(Math.round(s.scrollLeft / w.current)); }); };
    // interacción → reinicia la cuenta del auto-avance
    const touch = () => tl.current?.seek(0, false);
    s.addEventListener('scroll', onScroll, { passive: true });
    s.addEventListener('pointerdown', touch); s.addEventListener('wheel', touch, { passive: true }); s.addEventListener('touchstart', touch, { passive: true });
    if (isReduced()) s.scrollLeft = s.scrollWidth; // frame final: pantalla push
    return () => { ro.disconnect(); cancelAnimationFrame(raf); s.removeEventListener('scroll', onScroll); s.removeEventListener('pointerdown', touch); s.removeEventListener('wheel', touch); s.removeEventListener('touchstart', touch); };
  }, [tl]);
  // push que cae desde arriba al llegar a la 3.ª pantalla
  useEffect(() => {
    if (cur !== 2 || isReduced()) return;
    const b = root.current?.querySelector('.ap-push');
    if (!b) return;
    const tw = gsap.fromTo(b, { yPercent: -160, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'mercury', delay: 0.25 });
    return () => { tw.kill(); };
  }, [cur]);
  return (
    <DemoFrame slug="apps-moviles" root={root} paused={paused} onPause={toggle} className="dm-apps"
      controls={<div className="dm-dots" role="group" aria-label="Pantallas">
        {SCREENS.map((s, i) => <button type="button" key={s} className="dm-dot" aria-label={`Pantalla ${i + 1}: ${s}`} aria-current={cur === i ? 'true' : undefined} onClick={() => { go(i); tl.current?.seek(0, false); }} />)}
      </div>}>
      <div className="ap-phone">
        <i className="ap-notch" />
        <div className="ap-scroll" ref={sc} tabIndex={-1}>
          <div className="ap-scr ap-login">
            <i className="ap-logo" /><b>Bienvenido</b><i className="ap-field" /><i className="ap-field" /><span className="ap-btn">Entrar</span>
          </div>
          <div className="ap-scr ap-cat">
            <b>Catálogo</b>
            <div className="ap-grid">{[1, 2, 3, 4].map((n) => <span key={n}><i /><em /></span>)}</div>
          </div>
          <div className="ap-scr ap-home">
            <div className="ap-push"><i /><span><b>Tu pedido va en camino</b><small>Notificación push · ahora</small></span></div>
            <div className="ap-grid ap-dim">{[1, 2, 3, 4].map((n) => <span key={n}><i /><em /></span>)}</div>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}
