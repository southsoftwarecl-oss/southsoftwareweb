'use client';
/** Software a medida: "Planilla Excel → Sistema → Reporte". Nodos con 'mercury', conectores que se dibujan y un dato (6 px) que viaja con MotionPath. */
import { useRef } from 'react';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import DemoFrame from './DemoFrame';
import { useDemo } from './useDemo';

export default function SoftwareDemo() {
  const root = useRef<HTMLDivElement>(null);
  const { paused, toggle } = useDemo(root, (g, el) => {
    g.registerPlugin(MotionPathPlugin);
    const q = g.utils.selector(el);
    const nodes = q('.sw-node'), lines = q('.sw-line'), dot = q('.sw-dot')[0], bars = q('.sw-bar');
    const [p1, p2] = lines as unknown as SVGPathElement[];
    const tl = g.timeline({ repeat: -1, defaults: { ease: 'south' } });
    tl.fromTo(nodes, { opacity: 0, y: 14, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'mercury', stagger: 0.35 })
      .fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, stagger: 0.4 }, 0.9)
      .set(bars, { scaleY: 0 }, 0) // barras vacías hasta que llega el dato
      .fromTo(dot, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 2)
      .to(dot, { duration: 1, ease: 'power1.inOut', motionPath: { path: p1, align: p1, alignOrigin: [0.5, 0.5] } }, 2)
      .to(nodes[1], { scale: 1.05, duration: 0.25, yoyo: true, repeat: 1 }, 3)
      .to(dot, { duration: 1, ease: 'power1.inOut', motionPath: { path: p2, align: p2, alignOrigin: [0.5, 0.5] } }, 3.3)
      .to(dot, { opacity: 0, duration: 0.2 }, 4.3)
      .to(bars, { scaleY: 1, duration: 0.6, ease: 'mercury', stagger: 0.1 }, 4.3)
      .addLabel('final', 5.2)
      .to([...nodes, ...lines], { opacity: 0, duration: 0.4, ease: 'south-in' }, 6.8)
      .set(lines, { opacity: 1, strokeDashoffset: 1 }, 7.2);
    return tl;
  });
  return (
    <DemoFrame slug="software-a-medida" root={root} paused={paused} onPause={toggle} className="dm-sw">
      <svg className="sw-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path className="sw-line" pathLength={1} d="M30,50 C32,36 36,36 38,50" vectorEffect="non-scaling-stroke" />
        <path className="sw-line" pathLength={1} d="M62,50 C64,36 68,36 70,50" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="sw-node sw-n1">
        <span className="sw-k">Planilla Excel</span>
        <span className="sw-grid">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</span>
      </div>
      <div className="sw-node sw-n2">
        <span className="sw-k">Sistema</span>
        <svg className="sw-ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M7 20h10M12 16v4M7 9h6M7 12h10" /></svg>
      </div>
      <div className="sw-node sw-n3">
        <span className="sw-k">Reporte</span>
        <span className="sw-bars"><i className="sw-bar" /><i className="sw-bar" /><i className="sw-bar" /><i className="sw-bar" /></span>
      </div>
      <i className="sw-dot" />
    </DemoFrame>
  );
}
