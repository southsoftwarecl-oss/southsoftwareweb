/**
 * Servicios (v3 "vivos"): selector de servicios con mini-demos + "Arma tu proyecto" (packs exactos de PACKS)
 * + proceso interactivo (#proceso) + stack vivo (#stack) + contacto. Misma información, menos alto.
 * La franja de precios se reemplazó por el configurador (muestra los precios de PACKS y enlaza a /packs).
 */
import Page from '@/components/Page';
import PageHero from '@/components/PageHero';
import Final from '@/components/sections/Final';
import Selector from '@/components/servicios/Selector';
import Configurator from '@/components/servicios/Configurator';
import ProcessLive from '@/components/servicios/ProcessLive';
import StackLive from '@/components/servicios/StackLive';
import MarketingServices from '@/components/marketing/MarketingServices';
import { JsonLd } from '@/components/ui';
import { pageMeta, servicesJsonLd } from '@/lib/seo';
import './servicios.css';

export const metadata = pageMeta({
  title: 'Servicios',
  description: 'Software & Marketing: software a medida, sitios web, apps, seguridad y datos, más gestión de redes sociales, captación de leads, Meta/Google Ads y contenido.',
  path: '/servicios',
});

export default function Servicios() {
  return (
    <Page>
      <div className="svp">
        <PageHero crumb={[{ href: '', label: 'Servicios' }]} eyebrow="Servicios" title={<>Software &amp; Marketing.<br /><span className="dim">Un solo equipo.</span></>}
          lead="Somos South Software. Diseñamos, programamos, protegemos y medimos, y además hacemos crecer tu marca con marketing digital. Todo bajo el mismo techo." />
        <section className="sec sv-sec" id="detalle" aria-label="Detalle de servicios">
          <div className="wrap">
            <div className="eyebrow sv-eyebrow"><b>(01)</b>Servicios · elige uno para verlo en acción</div>
            <Selector />
            <Configurator />
          </div>
        </section>
        <MarketingServices n={2} />
        <ProcessLive n={3} />
        <StackLive n={4} />
        <Final n={5} />
      </div>
      <JsonLd data={servicesJsonLd} />
    </Page>
  );
}
