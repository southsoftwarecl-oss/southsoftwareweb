/**
 * Home (v2, compacto): Hero → Proof → Servicios (teaser) → Historia fijada →
 * Proyectos destacados → Franja de precios → CTA/contacto. Proceso, Stack y
 * "Por qué" viven en /servicios y /nosotros; los packs completos en /packs.
 */
import Page from '@/components/Page';
import Hero from '@/components/sections/Hero';
import Proof from '@/components/sections/Proof';
import Services from '@/components/sections/Services';
import Story from '@/components/sections/Story';
import { FeaturedCases } from '@/components/sections/Cases';
import PacksTeaser from '@/components/sections/PacksTeaser';
import Final from '@/components/sections/Final';
import LegacyHash from '@/components/LegacyHash';

export default function Home() {
  return (
    <Page>
      <LegacyHash />
      <Hero />
      <Proof />
      <Services n={1} teaser />
      <Story />
      <FeaturedCases n={2} />
      <PacksTeaser n={3} />
      <Final n={4} />
    </Page>
  );
}
