/** Footer con logo gigante en parallax (MotionRoot) — idéntico al preview, con links reales. */
import Link from 'next/link';
import Image from 'next/image';
import { BRAND, SERVICES } from '@/content/site';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="ft">
          <div className="about">
            <Image src="/brand/logo.png" alt="South Software" width={600} height={187} sizes="141px" style={{ height: 44, width: 'auto', marginBottom: 22 }} />
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
      <div className="giant" aria-hidden="true"><span>SOUTH</span></div>
      <div className="legal">
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>© 2026 South Software</span><span>Hecho en Puerto Montt, Chile</span>
        </div>
      </div>
    </footer>
  );
}
