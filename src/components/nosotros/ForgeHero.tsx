/**
 * ACTO 1 — Apertura "Forjado en el sur" (100svh, sin pin).
 * - h1 en cromo líquido: visible en el SSR (LCP); nosotros-motion lo "reforja" encima con un único
 *   filtro SVG de mercurio (feTurbulence + feDisplacementMap 60→0) que se retira al asentarse.
 * - Contorno REAL de Chile (Natural Earth) + curvas de nivel de los Andes que se trazan.
 * - Hora de Chile en vivo (America/Santiago). Sin ciudades ni coordenadas (decisión de Mathias).
 */
import Link from 'next/link';
import LocalClock from '../LocalClock';

export default function ForgeHero() {
  return (
    <section className="phero fhero" aria-labelledby="fh-title">
      <svg className="fh-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="fh-mercury" x="-10%" y="-25%" width="120%" height="150%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".008 .02" numOctaves={2} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={0} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* degradado de cromo compartido por los bordes que se dibujan (placas del manifiesto, equipo) */}
        <linearGradient id="nos-chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EEF2F6" /><stop offset=".45" stopColor="#7F8894" /><stop offset=".7" stopColor="#EEF2F6" /><stop offset="1" stopColor="#A4ADB8" />
        </linearGradient>
      </svg>
      <div className="fh-clock"><LocalClock className="mono" /></div>
      <div className="wrap">
        <nav className="crumb mono" aria-label="Ruta" data-in=".05">
          <Link href="/">Inicio</Link>
          <span><i aria-hidden="true">/</i>Nosotros</span>
        </nav>
        <div className="g12" style={{ alignItems: 'end' }}>
          <div className="ph-l">
            <div className="eyebrow" data-reveal><b>(00)</b>Nosotros</div>
            <h1 id="fh-title" className="fh-title">
              <span className="fw">Software</span> <span className="fw">hecho</span><br />
              <span className="fw">en</span> <span className="fw">el</span> <span className="fw">sur.</span>
            </h1>
          </div>
          <p className="lead ph-r fh-lead">Somos South Software: Software &amp; Marketing. Construimos software, web y apps, y hacemos crecer tu marca con redes, leads y Meta Ads, para empresas de todo Chile.</p>
        </div>
      </div>
    </section>
  );
}
