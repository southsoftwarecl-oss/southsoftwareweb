/**
 * ACTO 3 — Los 6 principios (WHY) como monolitos de cromo.
 * Desktop: abanico 3D (rotateY −18°→18°). Hover/focus gira la placa a 0° y la adelanta; Enter/click
 * (botón de disclosure dentro del h3) la fija con aria-expanded. Reflejo especular ligado al scroll.
 * Móvil/tablet: carrusel con scroll-snap, descripción visible e indicador "1 / 6".
 * Sin JS: :hover/:focus-within muestran el contenido (CSS).
 */
import { WHY } from '@/content/site';

export default function Monoliths({ n = 2 }: { n?: number }) {
  return (
    <section className="sec mono-sec" id="principios" aria-labelledby="principios-t">
      <div className="wrap">
        <div className="fx-head">
          <div className="eyebrow" data-reveal><b>({String(n).padStart(2, '0')})</b>Por qué nosotros</div>
          <h2 id="principios-t" className="fx-h" data-split="words">Confianza que se <span className="dim">firma por escrito.</span></h2>
          <span className="mono mono-count" aria-hidden="true"><b>1</b> / {WHY.length}</span>
        </div>
        <ul className="monos" role="list">
          {WHY.map(([t, d], i) => (
            <li className="mono-li" key={t} style={{ ['--i' as string]: i, ['--ry' as string]: `${-18 + (36 * i) / (WHY.length - 1)}deg` }}>
              <article className="mono-p">
                <span className="mono-n" aria-hidden="true">0{i + 1}</span>
                <span className="mono-sheen" aria-hidden="true" />
                <div className="mono-c">
                  <h3 className="mono-t"><button type="button" className="mono-b" aria-expanded="false" aria-controls={`mono-d${i}`}>{t}</button></h3>
                  <p className="mono-d" id={`mono-d${i}`}>{d}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
