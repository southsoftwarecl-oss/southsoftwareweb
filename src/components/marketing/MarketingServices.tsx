/** Marketing digital : home y /servicios. Textos en content/site.ts. */
import './marketing.css';
import { MARKETING_SERVICES } from '@/content/site';
import { Btn, SecHead } from '../ui';

export default function MarketingServices({ n, compact = false }: { n: number; compact?: boolean }) {
  return (
    <section className={`sec mk-sec${compact ? ' mk-compact' : ''}`} id="marketing" aria-labelledby="marketing-t">
      <div className="wrap">
        <SecHead n={n} eyebrow="Marketing digital · Impulsamos tu negocio"
          title={<span id="marketing-t">Software &amp; Marketing.<br /><span className="dim">Tu web, y quien la haga crecer.</span></span>}
          lead={compact ? undefined : `Somos South Software: además de construir tu software, gestionamos tus redes, captamos clientes y administramos tus anuncios.`} />
        <div className="mk-grid">
          {MARKETING_SERVICES.map((s, i) => (
            <article className="mk-card" key={s.slug} id={`mk-${s.slug}`}>
              <span className="mono mk-n">M{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {compact ? <a className="mk-link" href="/servicios#marketing">Ver más</a> : null}
              {!compact && <p className="mk-inc">{s.includes.join(' · ')}</p>}
            </article>
          ))}
        </div>
        {!compact && <div className="see-all"><Btn href="/packs#solo-marketing" variant="ghost">Ver packs de marketing</Btn></div>}
      </div>
    </section>
  );
}
