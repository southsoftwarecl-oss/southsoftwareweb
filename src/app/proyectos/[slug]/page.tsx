/** Página de caso: RG Motors Chile, Salgado Automotriz, Frío Austral. Solo se muestran métricas validadas (value != null). */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Page from '@/components/Page';
import PageHero from '@/components/PageHero';
import { CaseMedia } from '@/components/sections/Cases';
import Final from '@/components/sections/Final';
import { ArrowIcon, SecHead } from '@/components/ui';
import { CASES, SITE_URL } from '@/content/site';
import { pageMeta } from '@/lib/seo';
import { JsonLd } from '@/components/ui';

export function generateStaticParams() {
  return CASES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = CASES.find((x) => x.slug === slug);
  if (!c) return {};
  return pageMeta({ title: `${c.name} — Caso`, description: `${c.summary} Proyecto de South Software (${c.meta}).`, path: `/proyectos/${c.slug}` });
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = CASES.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const c = CASES[i];
  const next = CASES[(i + 1) % CASES.length];
  const metrics = c.metrics.filter((m) => m.value);
  return (
    <Page>
      <PageHero crumb={[{ href: '/proyectos', label: 'Proyectos' }, { href: '', label: c.name }]} eyebrow={c.meta} title={c.name} lead={c.summary}>
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
      <section className="sec">
        <div className="wrap">
          <SecHead n={1} eyebrow="Lo que construimos" title={<>Cada pieza,<br /><span className="dim">con un propósito.</span></>}
            lead={c.challenge ?? undefined} />
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
          {c.note && <p className="fine">{c.note}</p>}
          <Link className="next-case" href={`/proyectos/${next.slug}`}>
            <span className="mono">Siguiente proyecto</span><span className="nc-t">{next.name}<ArrowIcon /></span>
          </Link>
        </div>
      </section>
      <Final n={metrics.length > 0 ? 3 : 2} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CreativeWork', name: c.name, about: c.summary, url: `${SITE_URL}/proyectos/${c.slug}`, creator: { '@id': `${SITE_URL}/#org` }, dateCreated: c.year, image: `${SITE_URL}${c.image}` }} />
    </Page>
  );
}
