/**
 * Nosotros — "Forjado en el sur": narrativa en 5 actos.
 *  1 Apertura (cromo líquido + contorno real de Chile) · 2 Manifiesto (pin) · 3 Principios (monolitos)
 *  4 Las personas (TEAM_READY; se omite si no hay nadie listo) · 5 Cómo trabajamos (franja) + CTA final.
 * Motion: lib/nosotros-motion.ts (carga diferida desde el runtime). Estilos: ./nosotros.css.
 * Todo el texto está en el SSR; sin JS o con movimiento reducido la página se ve completa.
 */
import './nosotros.css';
import Page from '@/components/Page';
import ForgeHero from '@/components/nosotros/ForgeHero';
import Manifesto from '@/components/nosotros/Manifesto';
import Monoliths from '@/components/nosotros/Monoliths';
import Team, { hasTeam } from '@/components/nosotros/Team';
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
        {hasTeam && <Team n={3} />}
        <Timeline n={hasTeam ? 4 : 3} />
        <StepsStrip n={hasTeam ? 5 : 4} />
        <Final n={hasTeam ? 6 : 5} />
      </div>
    </Page>
  );
}
