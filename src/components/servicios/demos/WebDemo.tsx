'use client';
/** Sitios web: el mismo layout (header, hero, 3 tarjetas) pasa de desktop → tablet → celular con Flip. 3 botones + rotación cada 2,5 s. */
import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, Flip } from '@/lib/gsap';
import DemoFrame from './DemoFrame';
import { useDemo } from './useDemo';
import { isReduced } from '../hooks';

const DEVS = [['desk', 'Escritorio'], ['tab', 'Tablet'], ['phone', 'Celular']] as const;
type Dev = (typeof DEVS)[number][0];
const NEXT: Record<Dev, Dev> = { desk: 'tab', tab: 'phone', phone: 'desk' };

export default function WebDemo() {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const [dev, setDev] = useState<Dev>('desk');
  const change = (d: Dev | ((p: Dev) => Dev)) => {
    const f = frame.current;
    if (f && !isReduced()) flipState.current = Flip.getState([f, ...f.querySelectorAll<HTMLElement>('[data-flip-id]')]);
    setDev(d);
  };
  const { paused, toggle, tl } = useDemo(root, (g) => {
    const t = g.timeline({ repeat: -1 });
    t.call(() => change((p) => NEXT[p]), [], 2.5).call(() => change((p) => NEXT[p]), [], 5).call(() => change((p) => NEXT[p]), [], 7.5);
    return t;
  });
  useLayoutEffect(() => {
    const s = flipState.current;
    if (!s) return;
    flipState.current = null;
    const f = frame.current!;
    Flip.from(s, { targets: [f, ...f.querySelectorAll<HTMLElement>('[data-flip-id]')], duration: 0.8, ease: 'south', nested: true });
    return () => { gsap.killTweensOf(f); };
  }, [dev]);
  return (
    <DemoFrame slug="sitios-web" root={root} paused={paused} onPause={toggle} className="dm-web"
      controls={<div className="dm-seg" role="group" aria-label="Dispositivo">
        {DEVS.map(([d, label]) => <button type="button" key={d} className="dm-btn" aria-pressed={dev === d} onClick={() => { change(d); tl.current?.seek(0, false); }}>{label}</button>)}
      </div>}>
      <div className={`wb-dev wb-${dev}`} ref={frame} data-flip-id="dev">
        <div className="wb-head" data-flip-id="head"><i className="wb-logo" /><span className="wb-nav"><i /><i /><i /></span><span className="wb-burger"><i /><i /></span></div>
        <div className="wb-hero" data-flip-id="hero"><i className="wb-l1" /><i className="wb-l2" /><i className="wb-cta" /></div>
        <div className="wb-cards">{[1, 2, 3].map((n) => <i className="wb-card" key={n} data-flip-id={`card${n}`} />)}</div>
      </div>
    </DemoFrame>
  );
}
