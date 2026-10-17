/** Tarjetas de servicio que se expanden al hover, con íconos SVG que se dibujan. */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { SERVICES } from '@/content/site';
import { AIcon, SecHead } from '../ui';

export default function Services({ n = 1, title, linkToDetail = true }: { n?: number; title?: ReactNode; linkToDetail?: boolean }) {
  return (
    <section className="sec" id="servicios">
      <div className="wrap">
        <SecHead n={n} eyebrow="Servicios" title={title ?? <>Miles de detalles.<br /><span className="dim">Una sola visión.</span></>}
          lead="Diseñamos, programamos, protegemos y medimos. Todo bajo el mismo techo, con un solo interlocutor." />
        <div className="svc" data-stagger>
          {SERVICES.map((s, i) => {
            const body = (<>
              <div className="num"><span>0{i + 1}</span><span>{s.tags[0]}</span></div>
              <AIcon name={s.icon} />
              <h3>{s.title}</h3>
              <div className="more"><p>{s.desc}</p><div className="tags">{s.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div></div>
              <span className="plus" aria-hidden="true" />
            </>);
            return linkToDetail
              ? <Link className="item" key={s.slug} href={`/servicios#${s.slug}`} data-cursor="Explorar">{body}</Link>
              : <article className="item" key={s.slug} data-cursor="Explorar">{body}</article>;
          })}
        </div>
      </div>
    </section>
  );
}
