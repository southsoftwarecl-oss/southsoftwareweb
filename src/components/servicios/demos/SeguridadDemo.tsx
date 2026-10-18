'use client';
/** Seguridad: "Simulación" de escaneo de tuempresa.cl. Un haz recorre 6 controles; cada uno pasa de "revisando…" a ✓ / ⚠ y el escudo se completa por segmentos. */
import { useRef } from 'react';
import DemoFrame from './DemoFrame';
import { useDemo } from './useDemo';

// resultado de EJEMPLO (simulación, no es un diagnóstico real)
const CHECKS: [string, boolean][] = [['HTTPS', true], ['SPF', true], ['DKIM', true], ['DMARC', false], ['Respaldos', true], ['Cabeceras', false]];
const SEG = ['M50,6 L86,18', 'M86,18 L86,46', 'M86,46 C86,70 70,84 50,94', 'M50,94 C30,84 14,70 14,46', 'M14,46 L14,18', 'M14,18 L50,6'];

export default function SeguridadDemo() {
  const root = useRef<HTMLDivElement>(null);
  const { paused, toggle } = useDemo(root, (g, el) => {
    const q = g.utils.selector(el);
    const rows = q('.se-row'), segs = q('.se-seg'), beam = q('.se-beam')[0], mark = q('.se-mark');
    const t = g.timeline({ repeat: -1, defaults: { ease: 'south' } });
    t.call(() => rows.forEach((r) => { r.dataset.state = 'scan'; }), [], 0)
      .set(segs, { strokeDashoffset: 1 }, 0)
      .set(mark, { opacity: 0, scale: 0.6 }, 0)
      .fromTo(beam, { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4 }, 0.1);
    rows.forEach((r, i) => {
      const at = 0.5 + i * 0.8;
      t.to(beam, { yPercent: i * 100, duration: 0.5, ease: 'power2.inOut' }, at)
        .call(() => { r.dataset.state = 'done'; }, [], at + 0.55)
        .to(segs[i], { strokeDashoffset: 0, duration: 0.45 }, at + 0.55);
    });
    t.to(beam, { opacity: 0, duration: 0.3 }, 5.4)
      .to(mark, { opacity: 1, scale: 1, duration: 0.6, ease: 'mercury' }, 5.4)
      .addLabel('final', 6)
      .to({}, { duration: 1.4 }, 'final');
    return t;
  });
  return (
    <DemoFrame slug="seguridad-informatica" root={root} paused={paused} onPause={toggle} className="dm-se">
      <div className="se-wrap">
        <div className="se-l">
          <p className="se-h"><span>Simulación</span>tuempresa.cl</p>
          <ul className="se-list">
            <i className="se-beam" />
            {CHECKS.map(([k, ok]) => (
              <li className="se-row" key={k} data-ok={ok}>
                <span>{k}</span>
                <small className="se-scan">revisando…</small>
                <small className="se-res">{ok ? '✓ correcto' : '⚠ revisar'}</small>
              </li>
            ))}
          </ul>
          <p className="se-foot">Resultado de ejemplo</p>
        </div>
        <svg className="se-shield" viewBox="0 0 100 100">
          <path className="se-base" d={`${SEG.join(' ')}`} />
          {SEG.map((d, i) => <path key={d} className="se-seg" data-ok={CHECKS[i][1]} pathLength={1} d={d} />)}
          <path className="se-mark" d="M36,50 l10,10 l18,-20" />
        </svg>
      </div>
    </DemoFrame>
  );
}
