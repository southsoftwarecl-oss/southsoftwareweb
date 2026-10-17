/** Helpers SEO: metadata por página y JSON-LD (Organization / ProfessionalService / Service). */
import type { Metadata } from 'next';
import { BRAND, PACKS, SERVICES, SITE_URL } from '@/content/site';

const OG_IMAGE = { url: '/opengraph-image.jpg', width: 1200, height: 630, alt: 'South Software — desarrollo de software en Puerto Montt' };

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
  ...(BRAND.phone ? { telephone: BRAND.phone } : {}),
  address: { '@type': 'PostalAddress', addressLocality: BRAND.city, addressRegion: BRAND.region, addressCountry: 'CL' },
  geo: { '@type': 'GeoCoordinates', latitude: -41.4693, longitude: -72.9424 },
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
