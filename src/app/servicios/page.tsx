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
import { JsonLd } from '@/components/ui';
import { pageMeta, servicesJsonLd } from '@/lib/seo';
import './servicios.css';

export const metadata = pageMeta({
  title: 'Servicios',
  description: 'Software a medida, software de escritorio, sitios web, apps móviles, seguridad informática y ciencia de datos. Desarrollo de software para todo Chile.',
  path: '/servicios',
});

export default function Servicios() {
  return (
    <Page>
      <div className="svp">
        <PageHero crumb={[{ href: '', label: 'Servicios' }]} eyebrow="Servicios" title={<>Seis disciplinas.<br /><span className="dim">Un solo equipo.</span></>}
          lead="Diseñamos, programamos, protegemos y medimos. Todo bajo el mismo techo, con un solo interlocutor que responde por el resultado." />
        <section className="sec sv-sec" id="detalle" aria-label="Detalle de servicios">
          <div className="wrap">
            <div className="eyebrow sv-eyebrow"><b>(01)</b>Servicios · elige uno para verlo en acción</div>
            <Selector />
            <Configurator />
          </div>
        </section>
        <ProcessLive n={2} />
        <StackLive n={3} />
        <Final n={4} />
      </div>
      <JsonLd data={servicesJsonLd} />
    </Page>
  );
}
