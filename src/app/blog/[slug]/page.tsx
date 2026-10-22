/** Artículo del blog: Article schema, autor = organización, fecha, canonical y OG propio. */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Page from '@/components/Page';
import PageHero from '@/components/PageHero';
import Final from '@/components/sections/Final';
import { JsonLd } from '@/components/ui';
import { BLOG_AUTHOR, POSTS } from '@/content/blog';
import { SITE_URL } from '@/content/site';
import { pageMeta } from '@/lib/seo';

// Cache Components exige ≥1 param: sin posts se genera solo un 404 de marcador.
export function generateStaticParams() {
  return POSTS.length ? POSTS.map((p) => ({ slug: p.slug })) : [{ slug: 'pronto' }];
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = POSTS.find((x) => x.slug === slug);
  if (!p) return { robots: { index: false } };
  const m = pageMeta({ title: p.title, description: p.description, path: `/blog/${p.slug}` });
  const img = p.image ?? '/opengraph-image.jpg';
  return { ...m, openGraph: { ...m.openGraph, type: 'article', publishedTime: p.date, modifiedTime: p.updated ?? p.date, authors: [BLOG_AUTHOR], images: [img] }, twitter: { ...m.twitter, images: [img] } };
}

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = POSTS.find((x) => x.slug === slug);
  if (!p) notFound();
  const url = `${SITE_URL}/blog/${p.slug}`;
  return (
    <Page>
      <PageHero path={`/blog/${p.slug}`} crumb={[{ href: '/blog', label: 'Blog' }, { href: '', label: p.title }]} eyebrow={`${BLOG_AUTHOR} · ${p.date}`} title={p.title} lead={p.description} />
      <article className="sec"><div className="wrap" style={{ maxWidth: 760 }}>
        {p.body.map((t, i) => <p key={i} style={{ marginTop: i ? 18 : 0, lineHeight: 1.7 }}>{t}</p>)}
      </div></article>
      <Final n={1} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description, url, mainEntityOfPage: url,
        datePublished: p.date, dateModified: p.updated ?? p.date, image: `${SITE_URL}${p.image ?? '/opengraph-image.jpg'}`, inLanguage: 'es-CL',
        author: { '@type': 'Organization', '@id': `${SITE_URL}/#org`, name: BLOG_AUTHOR }, publisher: { '@id': `${SITE_URL}/#org` } }} />
    </Page>
  );
}
