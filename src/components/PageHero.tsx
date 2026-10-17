/** Encabezado de páginas internas (mismo lenguaje tipográfico del hero/CTA del preview). */
import Link from 'next/link';
import type { ReactNode } from 'react';

export default function PageHero({ crumb, eyebrow, title, lead, children }: { crumb?: { href: string; label: string }[]; eyebrow: string; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <section className="phero hero-lite">
      <div className="glow" aria-hidden="true" />
      <div className="wrap">
        {crumb && (
          <nav className="crumb mono" aria-label="Ruta" data-in=".05">
            <Link href="/">Inicio</Link>
            {crumb.map((c) => <span key={c.label}><i aria-hidden="true">/</i>{c.href ? <Link href={c.href}>{c.label}</Link> : c.label}</span>)}
          </nav>
        )}
        <div className="g12" style={{ alignItems: 'end' }}>
          <div className="ph-l">
            <div className="eyebrow" data-reveal><b>(00)</b>{eyebrow}</div>
            <h1 data-split="words">{title}</h1>
          </div>
          {lead && <p className="lead ph-r" data-reveal>{lead}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
