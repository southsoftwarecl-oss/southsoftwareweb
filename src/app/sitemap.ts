import type { MetadataRoute } from 'next';
import { CASES, SITE_URL } from '@/content/site';
import { SERVICE_PAGES } from '@/content/service-pages';
import { POSTS } from '@/content/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date('2026-10-22');
  const pages = ['', '/servicios', '/proyectos', '/packs', '/nosotros', '/contacto'];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: 'monthly' as const, priority: p === '' ? 1 : 0.8 })),
    ...SERVICE_PAGES.map((s) => ({ url: `${SITE_URL}/servicios/${s.slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...(POSTS.length ? [{ url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.5 }] : []),
    ...POSTS.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: new Date(p.updated ?? p.date), changeFrequency: 'yearly' as const, priority: 0.5 })),
    ...CASES.map((c) => ({ url: `${SITE_URL}/proyectos/${c.slug}`, lastModified: now, changeFrequency: 'yearly' as const, priority: 0.6 })),
  ];
}
