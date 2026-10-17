import type { MetadataRoute } from 'next';
import { CASES, SITE_URL } from '@/content/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date('2026-10-17');
  const pages = ['', '/servicios', '/proyectos', '/packs', '/nosotros', '/contacto'];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: 'monthly' as const, priority: p === '' ? 1 : 0.8 })),
    ...CASES.map((c) => ({ url: `${SITE_URL}/proyectos/${c.slug}`, lastModified: now, changeFrequency: 'yearly' as const, priority: 0.6 })),
  ];
}
