/** Casos en marcos de navegador con distorsión al hover. Métricas = marcadores. */
import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { CASES } from '@/content/site';
import { Btn, SecHead } from '../ui';

export function CaseMedia({ c, priority = false }: { c: (typeof CASES)[number]; priority?: boolean }) {
  return (
    <>
      <div className="top"><i /><i /><i /><span>{c.url}</span></div>
      <div className="img"><Image src={c.image} alt={`Sitio web de ${c.name} desarrollado por South Software`} fill sizes="(max-width:1024px) 100vw, 60vw" priority={priority} /></div>
    </>
  );
}

export default function Cases({ n = 2, title, as = 'h2' }: { n?: number; title?: ReactNode; as?: 'h1' | 'h2' }) {
  return (
    <section className="sec" id="proyectos">
      <div className="wrap">
        <SecHead n={n} as={as} eyebrow="Proyectos" title={title ?? <>Hecho en el sur.<br /><span className="dim">Funcionando hoy.</span></>}
          lead="Proyectos reales construidos por nuestro equipo. Las métricas se publicarán cuando cada cliente las valide." />
        <div className="cases">
          {CASES.map((c, i) => (
            <article className="case" key={c.slug}>
              <Link className="media" href={`/proyectos/${c.slug}`} data-cursor="Ver caso" aria-label={`${c.url}: ver caso ${c.name}`}><CaseMedia c={c} priority={as === 'h1' && i === 0} /></Link>
              <div className="info" data-reveal>
                <span className="idx">0{i + 1} / 0{CASES.length} — {c.meta}</span>
                {/* en /proyectos el título de sección es h1 → los casos bajan a h2 */}
                {as === 'h1'
                  ? <h2 className="cn"><Link href={`/proyectos/${c.slug}`}>{c.name}</Link></h2>
                  : <h3><Link href={`/proyectos/${c.slug}`}>{c.name}</Link></h3>}
                <p>{c.summary}</p>
                <div className="kv">
                  <div><small>Stack</small><span>{c.stack.join(' · ')}</span></div>
                  <div><small>Servicio</small><span>{c.service}</span></div>
                  <div><small>Resultado</small><span className="ph">[Métrica por confirmar con el cliente]</span></div>
                  <div><small>Año</small><span>{c.year}</span></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Proyectos destacados del home: los 3 casos en una grilla compacta
 * (misma tarjeta de navegador con distorsión al hover) + enlace a /proyectos.
 */
export function FeaturedCases({ n = 2 }: { n?: number }) {
  return (
    <section className="sec sec-teaser" id="proyectos">
      <div className="wrap">
        <SecHead n={n} eyebrow="Proyectos" title={<>Hecho en el sur.<br /><span className="dim">Funcionando hoy.</span></>}
          lead="Proyectos reales construidos por nuestro equipo. Las métricas se publicarán cuando cada cliente las valide." />
        <div className="cases-feat" data-stagger>
          {CASES.map((c, i) => (
            <article className="case case-sm" key={c.slug}>
              <Link className="media" href={`/proyectos/${c.slug}`} data-cursor="Ver caso" aria-label={`${c.url}: ver caso ${c.name}`}><CaseMedia c={c} /></Link>
              <div className="info">
                <span className="idx">0{i + 1} / 0{CASES.length} — {c.meta}</span>
                <h3><Link href={`/proyectos/${c.slug}`}>{c.name}</Link></h3>
                <p>{c.summary}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="see-all" data-reveal><Btn href="/proyectos" variant="ghost">Ver todos los proyectos</Btn></div>
      </div>
    </section>
  );
}
