/**
 * Home (v2, compacto): Hero → Proof → Servicios (teaser) → Historia fijada →
 * Proyectos destacados → Franja de precios → CTA/contacto. Proceso, Stack y
 * "Por qué" viven en /servicios y /nosotros; los packs completos en /packs.
 */
import Page from '@/components/Page';
import { pageMeta } from '@/lib/seo';

/** SEO del home (búsqueda + marca). El layout conserva el título por defecto para el resto. */
export const metadata = pageMeta({
  title: 'South Software — Desarrollo de Software & Marketing Digital',
  description: 'Software & marketing digital: webs, apps y software a medida + redes sociales y Meta Ads para pymes en Chile. Arma tu pack y cotiza en minutos.',
  path: '/',
  absolute: true,
});
import Hero from '@/components/sections/Hero';
import Proof from '@/components/sections/Proof';
import Services from '@/components/sections/Services';
import Story from '@/components/sections/Story';
import { FeaturedCases } from '@/components/sections/Cases';
import PacksTeaser from '@/components/sections/PacksTeaser';
import Final from '@/components/sections/Final';
import MarketingServices from '@/components/marketing/MarketingServices';
import LegacyHash from '@/components/LegacyHash';

export default function Home() {
  return (
    <Page>
      <LegacyHash />
      <Hero />
      <Proof />
      <Services n={1} teaser />
      <MarketingServices n={2} compact />
      <Story />
      <FeaturedCases n={3} />
      <PacksTeaser n={4} />
      <Final n={5} />
    </Page>
  );
}
