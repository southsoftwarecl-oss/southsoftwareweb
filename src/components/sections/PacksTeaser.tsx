/**
 * Franja de precios del home: "Desde $X" para los packs principales
 * (lista HOME_PACKS en content/site.ts; valores tomados tal cual de PACKS) + CTA a /packs.
 * Cada tarjeta trae un desplegable "Ver qué incluye" con el arreglo `includes` del pack (independientes entre sí; tarjetas alineadas arriba).
 */
import '../marketing/marketing.css';
import { HOME_PACKS, PACKS } from '@/content/site';
import { Btn } from '../ui';

export default function PacksTeaser({ n = 4 }: { n?: number }) {
  const items = HOME_PACKS.map((name) => PACKS.find((p) => p.name === name)).filter((p): p is (typeof PACKS)[number] => !!p);
  // "desde $1.490.000" ya trae el "desde" → no duplicar
  const from = (v: string) => (/^desde/i.test(v) ? v.replace(/^desde/i, 'Desde') : `Desde ${v}`);
  return (
    <section className="sec sec-strip" id="precios" aria-labelledby="precios-t">
      <div className="wrap">
        <div className="strip">
          <div className="strip-h">
            <div className="eyebrow" data-reveal><b>({String(n).padStart(2, '0')})</b>Packs y precios</div>
            <h2 className="h3" id="precios-t" data-split="words">Precio claro.<br /><span className="dim">Desde el primer día.</span></h2>
          </div>
          <ul className="strip-p" data-stagger>
            {items.map((p) => (
              <li key={p.name} className={p.featured ? 'feat' : undefined}>
                <span className="mono">{p.name}</span>
                <b>{from(p.setup)}</b>
                <small>+ {p.monthly} / mes</small>
                {/* desplegable nativo (<details>): teclado, lector de pantalla y sin JS; lista = includes de PACKS, tal cual */}
                <details className="strip-inc" data-pack={p.name}>
                  <summary><span>Ver qué incluye</span><i aria-hidden="true" /></summary>
                  <ul aria-label={`Qué incluye ${p.name}`}>{p.includes.map((x) => <li key={x}>{x}</li>)}</ul>
                </details>
              </li>
            ))}
          </ul>
          <div className="strip-cta" data-reveal><Btn href="/packs">Ver todos los packs</Btn><Btn href="/packs#arma-tu-pack" variant="ghost">Arma tu pack</Btn></div>
        </div>
      </div>
    </section>
  );
}
