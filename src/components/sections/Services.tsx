/**
 * Tarjetas de servicio que se expanden al hover, con íconos SVG que se dibujan.
 * `teaser`: versión compacta del home (3×2 en desktop, carrusel con scroll-snap en móvil)
 * con enlace a /servicios.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { SERVICES } from '@/content/site';
import { AIcon, ArrowIcon, Btn, SecHead } from '../ui';

export default function Services({ n = 1, title, linkToDetail = true, teaser = false }: { n?: number; title?: ReactNode; linkToDetail?: boolean; teaser?: boolean }) {
  return (
    <section className={`sec${teaser ? ' sec-teaser' : ''}`} id="servicios">
      <div className="wrap">
        <SecHead n={n} eyebrow="Servicios" title={title ?? <>Miles de detalles.<br /><span className="dim">Una sola visión.</span></>}
          lead="Diseñamos, programamos, protegemos y medimos. Todo bajo el mismo techo, con un solo interlocutor." />
        <div className={`svc${teaser ? ' svc-teaser' : ''}`} data-stagger>
          {SERVICES.map((s, i) => {
            const body = (<>
              <div className="num"><span>0{i + 1}</span><span>{s.tags[0]}</span></div>
              <div className="ico-row"><AIcon name={s.icon} /><span className="cue" aria-hidden="true">Explorar<ArrowIcon /></span></div>
              <h3>{s.title}</h3>
              <div className="more"><p>{s.desc}</p><div className="tags">{s.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div></div>
              <span className="plus" aria-hidden="true" />
            </>);
            return linkToDetail
              ? <Link className="item" key={s.slug} href={`/servicios#${s.slug}`}>{body}</Link>
              : <article className="item" key={s.slug}>{body}</article>;
          })}
        </div>
        {teaser && <div className="see-all" data-reveal><Btn href="/servicios" variant="ghost">Ver todos los servicios</Btn></div>}
      </div>
    </section>
  );
}
