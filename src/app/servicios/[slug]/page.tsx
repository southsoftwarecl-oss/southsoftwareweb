/**
 * Página por servicio (SEO): H1 propio, qué incluye, proceso, stack, casos relacionados reales, FAQ (si existe) y CTA.
 * Todo el contenido sale de content/site.ts y content/service-pages.ts (sin textos inventados).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Page from '@/components/Page';
import PageHero from '@/components/PageHero';
import Final from '@/components/sections/Final';
import { ArrowIcon, Btn, JsonLd, SecHead } from '@/components/ui';
import { CASES, MARKETING_SERVICES, SERVICES, SITE_URL, STEPS, waLink } from '@/content/site';
import { SERVICE_PAGES } from '@/content/service-pages';
import { pageMeta } from '@/lib/seo';
import '../servicios.css';

export function generateStaticParams() {
  return SERVICE_PAGES.map((s) => ({ slug: s.slug }));
}

function resolve(slug: string) {
  const p = SERVICE_PAGES.find((x) => x.slug === slug);
  if (!p) return null;
  const sw = SERVICES.find((x) => x.slug === slug);
  const mk = MARKETING_SERVICES.find((x) => x.slug === slug);
  const base = sw ?? mk;
  if (!base) return null;
  return { p, desc: base.desc, includes: base.includes, tags: sw?.tags ?? [], short: sw?.short ?? mk!.title };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = resolve(slug);
  if (!r) return {};
  return pageMeta({ title: r.p.title, description: r.p.seoDesc, path: `/servicios/${slug}` });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = resolve(slug);
  if (!r) notFound();
  const { p, desc, includes, tags, short } = r;
  const related = p.related.map((s) => CASES.find((c) => c.slug === s)).filter((c) => !!c);
  const others = SERVICE_PAGES.filter((x) => x.slug !== slug && x.kind === p.kind);
  const url = `${SITE_URL}/servicios/${slug}`;
  let n = 0;
  return (
    <Page>
      <PageHero path={`/servicios/${slug}`} crumb={[{ href: '/servicios', label: 'Servicios' }, { href: '', label: short }]}
        eyebrow={p.kind === 'marketing' ? 'Marketing digital' : 'Software'} title={p.h1} lead={desc} />
      {p.problem && (
        <section className="sec cs-ds"><div className="wrap cs-ds-g">
          <div className="cs-b"><span className="eyebrow-s mono">El problema</span><p>{p.problem}</p></div>
          <div className="cs-b"><span className="eyebrow-s mono">La solución</span><p>{desc}</p></div>
        </div></section>
      )}
      <section className="sec">
        <div className="wrap">
          <SecHead n={++n} eyebrow="Qué incluye" title={<>Lo que hacemos,<br /><span className="dim">paso a paso.</span></>} lead={tags.length ? `Stack habitual: ${tags.join(', ')}.` : undefined} />
          <div className="why" data-stagger>
            {includes.map((b, k) => <div className="w" key={b}><span className="mono">0{k + 1}</span><h3 className="h4">{b}</h3></div>)}
          </div>
        </div>
      </section>
      {p.kind === 'software' && (
        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <SecHead n={++n} eyebrow="Proceso" title={<>Cómo trabajamos,<br /><span className="dim">sin sorpresas.</span></>} />
            <ol className="why" data-stagger>
              {STEPS.map((s, k) => <li className="w" key={s.title}><span className="mono">0{k + 1} · {s.when}</span><h3 className="h4">{s.title}</h3><p>{s.desc}</p></li>)}
            </ol>
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <SecHead n={++n} eyebrow="Casos relacionados" title={<>Proyectos reales,<br /><span className="dim">funcionando hoy.</span></>} />
            <ul className="svc-links" data-stagger>
              {related.map((c) => <li key={c.slug}><Link href={`/proyectos/${c.slug}`}>{c.name}<ArrowIcon /></Link></li>)}
            </ul>
          </div>
        </section>
      )}
      {p.faq.length > 0 && (
        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <SecHead n={++n} eyebrow="Preguntas frecuentes" title="Preguntas frecuentes" />
            {p.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
          </div>
          <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }} />
        </section>
      )}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cs-cta">
            <Btn href={waLink(`Hola, quiero cotizar ${short.toLowerCase()} con South Software`)} external>Cotizar por WhatsApp</Btn>
            <Btn href="/packs" variant="ghost">Ver packs y precios</Btn>
          </div>
          <nav aria-label="Otros servicios" className="svc-others">
            <span className="mono">Otros servicios</span>
            <ul className="svc-links">{others.map((o) => <li key={o.slug}><Link href={`/servicios/${o.slug}`}>{o.h1}<ArrowIcon /></Link></li>)}</ul>
          </nav>
        </div>
      </section>
      <Final n={++n} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Service', '@id': `${url}#service`, name: p.h1, description: desc, url,
        serviceType: p.kind === 'marketing' ? 'Marketing digital' : p.h1, provider: { '@id': `${SITE_URL}/#org` }, areaServed: { '@type': 'Country', name: 'Chile' } }} />
    </Page>
  );
}
