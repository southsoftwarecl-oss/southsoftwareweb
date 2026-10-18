/**
 * ACTO 2 — Manifiesto. Desktop: pin CSS sticky (recorrido ≤ 120vh) y reveal palabra por palabra con
 * profundidad (scrub). Las frases clave se "cromean" al completarse. Móvil/tablet: líneas al entrar.
 * Sin JS / movimiento reducido: texto completo y frases clave ya cromadas.
 */
import { Fragment } from 'react';
import { MANIFESTO, MANIFESTO_KEYS, MANIFESTO_SIDE } from '@/content/site';

/** Parte el manifiesto en [texto, esClave][] respetando el texto exacto. */
function segments(text: string, keys: readonly string[]) {
  const out: [string, boolean][] = [];
  let rest = text;
  while (rest) {
    const hits = keys.map((k) => [k, rest.indexOf(k)] as const).filter(([, i]) => i >= 0).sort((a, b) => a[1] - b[1]);
    if (!hits.length) { out.push([rest, false]); break; }
    const [k, i] = hits[0];
    if (i > 0) out.push([rest.slice(0, i), false]);
    out.push([k, true]);
    rest = rest.slice(i + k.length);
  }
  return out;
}

export default function Manifesto({ n = 1 }: { n?: number }) {
  return (
    <section className="mf" id="manifiesto" aria-label="Manifiesto">
      <div className="mf-pin">
        <div className="wrap">
          <div className="eyebrow mf-eb"><b>({String(n).padStart(2, '0')})</b>Manifiesto</div>
          <div className="manifesto g12">
            <p className="m-big mf-text">
              {segments(MANIFESTO, MANIFESTO_KEYS).map(([t, key], i) => key ? <span className="kp" key={i}>{t}</span> : <Fragment key={i}>{t}</Fragment>)}
            </p>
            <div className="m-side mf-side">
              {MANIFESTO_SIDE.map(([k, v]) => (
                <div className="mf-plate" key={k}>
                  <svg className="mf-edge" aria-hidden="true" focusable="false"><rect x=".5" y=".5" rx="12" pathLength={1} /></svg>
                  <small className="mono">{k}</small><span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
