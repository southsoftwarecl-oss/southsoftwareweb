/**
 * Nosotros — "Forjado": narrativa en 4 actos.
 *  1 Apertura (cromo líquido + contorno real de Chile) · 2 Manifiesto (pin) · 3 Principios (monolitos)
 *  4 Cómo trabajamos (franja) + CTA final.
 * Motion: lib/nosotros-motion.ts (carga diferida desde el runtime). Estilos: ./nosotros.css.
 * Todo el texto está en el SSR; sin JS o con movimiento reducido la página se ve completa.
 */
import './nosotros.css';
import Page from '@/components/Page';
import ForgeHero from '@/components/nosotros/ForgeHero';
import Manifesto from '@/components/nosotros/Manifesto';
import Monoliths from '@/components/nosotros/Monoliths';
import StepsStrip from '@/components/nosotros/StepsStrip';
import Final from '@/components/sections/Final';
import Timeline from '@/components/nosotros/Timeline';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Nosotros',
  description: 'Somos South Software: Software & Marketing. Software a medida, web y apps, más redes sociales, leads y Meta Ads, con precio publicado y trato directo.',
  path: '/nosotros',
});

export default function Nosotros() {
  return (
    <Page>
      <div className="forge">
        <ForgeHero />
        <Manifesto n={1} />
        <Monoliths n={2} />
        <Timeline n={3} />
        <StepsStrip n={4} />
        <Final n={5} />
      </div>
    </Page>
  );
}
