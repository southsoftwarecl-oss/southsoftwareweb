/** "Confianza que se firma por escrito": 6 tarjetas planas de alto contraste, solo números (sin íconos ni glass). */
import { WHY } from '@/content/site';

export default function Monoliths({ n = 2 }: { n?: number }) {
  return (
    <section className="sec trust-sec" id="principios" aria-labelledby="principios-t">
      <div className="wrap">
        <div className="eyebrow" data-reveal><b>({String(n).padStart(2, '0')})</b>Por qué nosotros</div>
        <h2 id="principios-t" className="fx-h" data-split="words">Confianza que se <span className="dim">firma por escrito.</span></h2>
        <ul className="trust" role="list" data-stagger>
          {WHY.map(([t, d], i) => (
            <li className="trust-c" key={t}>
              <span className="trust-n mono" aria-hidden="true">0{i + 1}</span>
              <h3>{t}</h3><p>{d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
