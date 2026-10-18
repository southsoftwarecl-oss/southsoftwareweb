'use client';
/** Escritorio: ventana de app con toggle "Sin conexión / En línea". Offline: ventas en cola; online: suben a la nube y "Sincronizado ✓". */
import { useRef, useState } from 'react';
import DemoFrame from './DemoFrame';
import { useDemo } from './useDemo';
import { useReducedMotion } from '../hooks';

export default function EscritorioDemo() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [online, setOnline] = useState<boolean | null>(null);
  const on = online ?? reduced; // frame final (reduced): en línea y sincronizado
  const { paused, toggle, tl } = useDemo(root, (g, el) => {
    const q = g.utils.selector(el);
    const rows = q('.es-row'), synced = q('.es-sync'), queue = q('.es-queue'), cloud = q('.es-cloud');
    const t = g.timeline({ repeat: -1, defaults: { ease: 'south' } });
    t.call(() => setOnline(false), [], 0)
      .set(synced, { opacity: 0 }, 0)
      .fromTo(queue, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.1)
      .fromTo(rows, { opacity: 0, x: -16, y: 0, scale: 1 }, { opacity: 1, x: 0, duration: 0.55, stagger: 0.3 }, 0.2)
      .addLabel('sync', 3.2)
      .call(() => setOnline(true), [], 'sync')
      .to(queue, { opacity: 0, duration: 0.2 }, 'sync')
      .to(rows, { x: 60, y: -40, scale: 0.7, opacity: 0, duration: 0.55, ease: 'south-in', stagger: 0.18 }, 'sync+=0.2')
      .fromTo(cloud, { scale: 1 }, { scale: 1.12, duration: 0.2, yoyo: true, repeat: 1 }, 'sync+=0.9')
      .fromTo(synced, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, ease: 'mercury' }, 'sync+=1.3')
      .addLabel('final', 5)
      .to({}, { duration: 2 }, 'final');
    return t;
  });
  const flip = () => {
    const next = !on;
    setOnline(next);
    tl.current?.seek(next ? 'sync' : 0, false);
  };
  return (
    <DemoFrame slug="software-de-escritorio" root={root} paused={paused} onPause={toggle} className="dm-es"
      controls={<button type="button" className="dm-btn dm-switch" aria-pressed={on} onClick={flip}><i aria-hidden="true" />{on ? 'En línea' : 'Sin conexión'}</button>}>
      <div className="es-win" data-online={on}>
        <div className="es-bar"><i /><i /><i /><span>Caja · punto de venta</span><b>{on ? 'En línea' : 'Sin conexión'}</b></div>
        <div className="es-body">
          <ul className="es-list">
            {['Venta 1', 'Venta 2', 'Venta 3'].map((v) => <li className="es-row" key={v}><span>{v}</span><small>en cola</small></li>)}
          </ul>
          <div className="es-side">
            <svg className="es-cloud" viewBox="0 0 48 32"><path d="M14 28h22a9 9 0 0 0 0-18 12 12 0 0 0-23-1A9.5 9.5 0 0 0 14 28z" /></svg>
            <p className="es-queue">3 pendientes · ejemplo</p>
            <p className="es-sync">Sincronizado ✓</p>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}
