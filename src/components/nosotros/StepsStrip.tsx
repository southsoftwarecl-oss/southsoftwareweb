/**
 * ACTO 5 — "Cómo trabajamos": franja compacta de los 6 pasos (título + when de STEPS) con un riel
 * que se llena al entrar. El proceso completo vive en /servicios#proceso.
 */
import Link from 'next/link';
import { STEPS } from '@/content/site';

export default function StepsStrip({ n = 4 }: { n?: number }) {
  return (
    <section className="sec steps-sec" id="como-trabajamos" aria-labelledby="como-t">
      <div className="wrap">
        <div className="steps-head">
          <div className="eyebrow" data-reveal><b>({String(n).padStart(2, '0')})</b>Proceso</div>
          <h2 id="como-t" className="fx-h">Cómo trabajamos</h2>
          <Link className="steps-more" href="/servicios#proceso">Ver el proceso completo <span aria-hidden="true">→</span></Link>
        </div>
        <div className="steps-w">
        <div className="steps-rail" aria-hidden="true"><b /></div>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li className="stp" key={s.title}>
              <span className="stp-node" aria-hidden="true" />
              <span className="mono stp-n">0{i + 1}</span>
              <span className="stp-t">{s.title}</span>
              <span className="mono stp-w">{s.when}</span>
            </li>
          ))}
        </ol>
        </div>
      </div>
    </section>
  );
}
