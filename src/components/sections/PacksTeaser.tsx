/**
 * Franja de packs del home: nombre, CTA de cotización y desplegable "Ver qué incluye".
 * (lista HOME_PACKS en content/site.ts) + enlaces a /packs. Sin montos públicos.
 */
import '../marketing/marketing.css';
import { HOME_PACKS, PACKS } from '@/content/site';
import { Btn } from '../ui';

export default function PacksTeaser({ n = 4 }: { n?: number }) {
  const items = HOME_PACKS.map((name) => PACKS.find((p) => p.name === name)).filter((p): p is (typeof PACKS)[number] => !!p);
  return (
    <section className="sec sec-strip" id="precios" aria-labelledby="precios-t">
      <div className="wrap">
        <div className="strip">
          <div className="strip-h">
            <div className="eyebrow" data-reveal><b>({String(n).padStart(2, '0')})</b>Nuestros packs</div>
            <h2 className="h3" id="precios-t" data-split="words">Elige tu pack.<br /><span className="dim">Cotiza por WhatsApp.</span></h2>
          </div>
          <ul className="strip-p" data-stagger>
            {items.map((p) => (
              <li key={p.name} className={p.featured ? 'feat' : undefined}>
                <span className="mono">{p.name}</span>
                <b>Pide tu cotización</b>
                <small>Cotiza por WhatsApp</small>
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
