/** /blog — listado de artículos (enlazado desde el menú y el footer). Sin artículos: noindex y fuera del sitemap. */
import Link from 'next/link';
import Page from '@/components/Page';
import PageHero from '@/components/PageHero';
import Final from '@/components/sections/Final';
import { POSTS } from '@/content/blog';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Blog de desarrollo web, software y marketing',
  description: 'Guías de South Software sobre desarrollo web, desarrollo de software a medida y marketing digital para pymes en Chile. Lee y aplícalo en tu negocio.',
  path: '/blog',
  noindex: POSTS.length === 0,
});

const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

export default function Blog() {
  return (
    <Page>
      <PageHero path="/blog" crumb={[{ href: '', label: 'Blog' }]} eyebrow="Blog" title={<>Ideas que sirven.<br /><span className="dim">Sin relleno.</span></>}
        lead={POSTS.length ? 'Guías prácticas de desarrollo web, software y marketing digital.' : 'Estamos preparando los primeros artículos.'} />
      {POSTS.length > 0 && (
        <section className="sec"><div className="wrap"><ul className="blog-list">
          {POSTS.map((p) => (
            <li key={p.slug}><Link href={`/blog/${p.slug}`}><h2 className="h4">{p.title}</h2><p>{p.description}</p><time dateTime={p.date}>{fmt(p.date)}</time></Link></li>
          ))}
        </ul></div></section>
      )}
      <Final n={1} />
    </Page>
  );
}
