/** Footer con logo gigante en parallax (MotionRoot) — idéntico al preview, con links reales. */
import Link from 'next/link';
import Logo from './Logo';
import { BRAND, SERVICES } from '@/content/site';
import { GA_ID } from '@/lib/analytics';
import CookiePrefsLink from './CookiePrefsLink';
import InstagramLink from './InstagramLink';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="ft">
          <div className="about">
            <Logo />
            <p>Software &amp; Marketing. Software a medida, apps, web, seguridad, datos y marketing digital.</p>
          </div>
          <div className="col">
            <h2 className="h5">Servicios</h2>
            <ul>
              {SERVICES.map((s) => <li key={s.slug}><Link href={`/servicios/${s.slug}`}>{s.short}</Link></li>)}
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
            <h2 className="h5">Cobertura</h2>
            <ul>
              <li>Todo {BRAND.country}</li>
              <li>Por videollamada o en persona</li>
              <li><a href={`mailto:${BRAND.email}`}>{BRAND.email}</a></li>
              <li><a href={`tel:${BRAND.phoneE164}`}>{BRAND.phone}</a></li>
              <li><InstagramLink /></li>
            </ul>
          </div>
        </div>
      </div>
      {/* Wordmark completo en SVG: textLength lo ajusta exacto al ancho (sin recortes en ningún viewport) */}
      <div className="giant" aria-hidden="true"><div className="wrap">
        <svg viewBox="0 0 1000 256" role="presentation" focusable="false">
          <text x="500" y="140" textAnchor="middle" fontSize="180" textLength="992" lengthAdjust="spacingAndGlyphs">SOUTH</text>
          <text x="500" y="244" textAnchor="middle" fontSize="97" textLength="992" lengthAdjust="spacingAndGlyphs">SOFTWARE</text>
        </svg>
      </div></div>
      <div className="legal">
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>© 2026 South Software</span>
          {GA_ID && <CookiePrefsLink />}
          <span>Hecho en Chile</span>
        </div>
      </div>
    </footer>
  );
}
