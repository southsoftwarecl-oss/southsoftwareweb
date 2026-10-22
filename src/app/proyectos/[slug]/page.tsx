/** Página de caso (desafío, solución, lo construido, captura real y CTA). Solo se muestran métricas validadas (value != null). */
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Page from '@/components/Page';
import PageHero from '@/components/PageHero';
import { CaseMedia } from '@/components/sections/Cases';
import Final from '@/components/sections/Final';
import { ArrowIcon, Btn, SecHead } from '@/components/ui';
import { CASES, SITE_URL, waLink } from '@/content/site';
import { pageMeta } from '@/lib/seo';
import { JsonLd } from '@/components/ui';

export function generateStaticParams() {
  return CASES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = CASES.find((x) => x.slug === slug);
  if (!c) return {};
  return pageMeta({ title: `${c.name} — Caso de desarrollo web`, description: c.seoDesc, path: `/proyectos/${c.slug}` });
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = CASES.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const c = CASES[i];
  const ni = (i + 1) % CASES.length;
  const next = CASES[ni];
  const metrics = c.metrics.filter((m) => m.value);
  return (
    <Page>
      <PageHero path={`/proyectos/${c.slug}`} crumb={[{ href: '/proyectos', label: 'Proyectos' }, { href: '', label: c.name }]} eyebrow={c.meta} title={c.name} lead={c.summary}>
        <div className="case-kv" data-reveal>
          <div><small>Servicio</small><span>{c.service}</span></div>
          <div><small>Stack</small><span>{c.stack.join(' · ')}</span></div>
          <div><small>Año</small><span>{c.year}</span></div>
          <div><small>Sitio</small><span>{c.url}</span></div>
        </div>
      </PageHero>
      <section className="case case-hero" aria-label={`Captura de ${c.name}`}>
        <div className="wrap"><div className="media"><CaseMedia c={c} priority /></div></div>
      </section>
      {c.challenge && (
        <section className="sec cs-ds">
          <div className="wrap cs-ds-g" data-stagger>
            <div className="cs-b"><span className="eyebrow-s mono">Desafío</span><p>{c.challenge}</p></div>
            {c.solution && <div className="cs-b"><span className="eyebrow-s mono">Solución</span><p>{c.solution}</p></div>}
          </div>
        </section>
      )}
      <section className="sec">
        <div className="wrap">
          <SecHead n={1} eyebrow="Lo que construimos" title={<>Cada pieza,<br /><span className="dim">con un propósito.</span></>}
            lead={`Resultado: ${c.built.length} funcionalidades en producción con ${c.stack.join(', ')}.`} />
          <div className="why" data-stagger>
            {c.built.map((b, k) => <div className="w" key={b}><span className="mono">0{k + 1}</span><h3 className="h4">{b}</h3></div>)}
          </div>
        </div>
      </section>
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {metrics.length > 0 && <>
            <SecHead n={2} eyebrow="Resultados" title={<>Métricas reales,<br /><span className="dim">validadas por el cliente.</span></>} />
            <div className="counters metrics" data-stagger>
              {metrics.map((m) => <div className="counter" key={m.label}><b>{m.value}</b><span>{m.label}</span></div>)}
            </div>
          </>}
          <div className="cs-cta"><Btn href={waLink(`Hola, vi el caso ${c.name} y quiero cotizar un proyecto con South Software`)} external>Quiero un proyecto así</Btn></div>
          <Link className="next-case" href={`/proyectos/${next.slug}`} aria-label={`Siguiente proyecto: ${next.name}`}>
            <span className="nc-top"><span className="mono">Siguiente proyecto</span><span className="mono nc-n">{String(ni + 1).padStart(2, '0')} <i>/</i> {String(CASES.length).padStart(2, '0')}</span></span>
            <span className="nc-body">
              <span className="nc-txt">
                <span className="mono nc-cat">{next.meta}</span>
                <span className="nc-t">{next.name}</span>
                <span className="nc-go"><span>Ver caso</span><span className="nc-arr"><ArrowIcon /><ArrowIcon /></span></span>
              </span>
              <span className="nc-img"><Image src={next.image} alt={`Vista previa de ${next.name}`} width={1200} height={750} sizes="(max-width: 860px) 100vw, 46vw" /></span>
            </span>
          </Link>
        </div>
      </section>
      <Final n={metrics.length > 0 ? 3 : 2} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CreativeWork', name: c.name, about: c.summary, url: `${SITE_URL}/proyectos/${c.slug}`, creator: { '@id': `${SITE_URL}/#org` }, dateCreated: c.year, image: `${SITE_URL}${c.image}` }} />
    </Page>
  );
}
