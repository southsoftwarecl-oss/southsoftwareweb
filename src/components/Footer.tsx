/** Footer con logo gigante en parallax (MotionRoot) — idéntico al preview, con links reales. */
import Link from 'next/link';
import Logo from './Logo';
import { BRAND, SERVICES } from '@/content/site';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="ft">
          <div className="about">
            <Logo />
            <p>Software a medida, apps, web, seguridad y datos. Desde Puerto Montt para todo Chile.</p>
          </div>
          <div className="col">
            <h2 className="h5">Servicios</h2>
            <ul>
              {SERVICES.map((s) => <li key={s.slug}><Link href={`/servicios#${s.slug}`}>{s.short}</Link></li>)}
            </ul>
          </div>
          <div className="col">
            <h2 className="h5">Estudio</h2>
            <ul>
              <li><Link href="/proyectos">Proyectos</Link></li>
              <li><Link href="/nosotros">Nosotros</Link></li>
              <li><Link href="/servicios#proceso">Proceso</Link></li>
              <li><Link href="/packs">Packs</Link></li>
              <li><Link href="/contacto">Contacto</Link></li>
            </ul>
          </div>
          <div className="col">
            <h2 className="h5">{BRAND.city}</h2>
            <ul>
              <li>{BRAND.region}</li>
              <li>{BRAND.country}</li>
              <li className="mono" style={{ fontSize: 11, color: 'var(--dim)' }}>{BRAND.coords}</li>
              <li><a href={`mailto:${BRAND.email}`}>{BRAND.email}</a></li>
            </ul>
          </div>
        </div>
      </div>
      {/* Wordmark completo en SVG: textLength lo ajusta exacto al ancho (sin recortes en ningún viewport) */}
      <div className="giant" aria-hidden="true"><div className="wrap">
        <svg viewBox="0 0 1000 256" role="presentation" focusable="false">
          <defs>
            <linearGradient id="giant-chrome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="gc1" />
              <stop offset=".46" className="gc2" />
              <stop offset=".54" className="gc3" />
              <stop offset="1" className="gc1" />
            </linearGradient>
          </defs>
          <text x="500" y="140" textAnchor="middle" fontSize="180" textLength="992" lengthAdjust="spacingAndGlyphs">SOUTH</text>
          <text x="500" y="244" textAnchor="middle" fontSize="97" textLength="992" lengthAdjust="spacingAndGlyphs">SOFTWARE</text>
        </svg>
      </div></div>
      <div className="legal">
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>© 2026 South Software</span><span>Hecho en Puerto Montt, Chile</span>
        </div>
      </div>
    </footer>
  );
}
