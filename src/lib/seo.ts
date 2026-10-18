/** Helpers SEO: metadata por página y JSON-LD (Organization / ProfessionalService / Service). */
import type { Metadata } from 'next';
import { BRAND, PACKS, SERVICES, SITE_URL } from '@/content/site';

const OG_IMAGE = { url: '/opengraph-image.jpg', width: 1200, height: 630, alt: 'South Software — desarrollo de software para todo Chile' };

export function pageMeta({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: { title: `${title} · South Software`, description, url: path, type: 'website', locale: 'es_CL', siteName: 'South Software', images: [OG_IMAGE] },
    twitter: { card: 'summary_large_image', title: `${title} · South Software`, description, images: [OG_IMAGE.url] },
  };
}

export const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': `${SITE_URL}/#org`,
  name: BRAND.name,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/logo.png`,
  image: `${SITE_URL}/opengraph-image.jpg`,
  description: BRAND.description,
  email: BRAND.email,
  telephone: BRAND.phoneE164,
  address: { '@type': 'PostalAddress', addressCountry: 'CL' },
  areaServed: { '@type': 'Country', name: 'Chile' },
  knowsAbout: SERVICES.map((s) => s.title),
};

/** Convierte "$349.990" o "desde $1.490.000" a número CLP. */
const clp = (s: string) => Number(s.replace(/[^\d]/g, ''));

export const servicesJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    ...SERVICES.map((s) => ({
      '@type': 'Service', '@id': `${SITE_URL}/servicios#${s.slug}`, name: s.title, description: s.desc, serviceType: s.title,
      provider: { '@id': `${SITE_URL}/#org` }, areaServed: { '@type': 'Country', name: 'Chile' },
    })),
    {
      '@type': 'OfferCatalog', name: 'Packs South Software',
      itemListElement: PACKS.map((p) => ({
        '@type': 'Offer', name: `Pack ${p.name}`, priceCurrency: 'CLP',
        priceSpecification: { '@type': 'PriceSpecification', price: clp(p.setup), priceCurrency: 'CLP', ...(p.setup.startsWith('desde') ? { minPrice: clp(p.setup) } : {}) },
        description: p.includes.join('. '), seller: { '@id': `${SITE_URL}/#org` },
      })),
    },
  ],
};

/** /packs: catálogo de ofertas (Service + Offer) con los precios publicados en PACKS. */
export const packsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${SITE_URL}/packs#service`,
  name: 'Packs de desarrollo web y software',
  serviceType: 'Desarrollo de sitios web, apps y software',
  provider: { '@id': `${SITE_URL}/#org` },
  areaServed: { '@type': 'Country', name: 'Chile' },
  url: `${SITE_URL}/packs`,
  hasOfferCatalog: {
    '@type': 'OfferCatalog', name: 'Packs South Software',
    itemListElement: PACKS.map((p) => ({
      '@type': 'Offer', name: `Pack ${p.name}`, priceCurrency: 'CLP', url: `${SITE_URL}/packs`,
      priceSpecification: { '@type': 'PriceSpecification', price: clp(p.setup), priceCurrency: 'CLP', ...(p.setup.startsWith('desde') ? { minPrice: clp(p.setup) } : {}) },
      description: p.includes.join('. '), seller: { '@id': `${SITE_URL}/#org` },
    })),
  },
};
