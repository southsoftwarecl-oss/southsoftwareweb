/** Packs: listado completo (contenido en content/site.ts) + contacto. Sin montos públicos. */
import Page from '@/components/Page';
import PageHero from '@/components/PageHero';
import Packs from '@/components/sections/Packs';
import Final from '@/components/sections/Final';
import ArmaTuPack from '@/components/marketing/ArmaTuPack';
import PackGroup from '@/components/marketing/PackGroup';
import PackTabs from '@/components/marketing/PackTabs';
import Compare from '@/components/marketing/Compare';
import { ADS_NOTE, COMBO_PACKS, MARKETING_ONBOARDING, MARKETING_PACKS } from '@/content/site';
import { JsonLd } from '@/components/ui';
import { packsJsonLd, pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Packs de desarrollo web y marketing en Chile',
  description: 'Packs de desarrollo web, software y marketing digital: combinados, solo marketing o solo software. Elige tu pack y cotízalo por WhatsApp hoy.',
  path: '/packs',
});

export default function PacksPage() {
  return (
    <Page>
      <PageHero crumb={[{ href: '', label: 'Packs' }]} eyebrow="Nuestros packs" title={<>Elige tu pack.<br /><span className="dim">Cotiza por WhatsApp.</span></>}
        lead="Somos South Software: Software & Marketing. Elige un pack combinado, solo marketing o solo software. Te cotizamos por WhatsApp." />
      <ArmaTuPack />
      <PackTabs tabs={[{ id: 'combinados', label: 'Combinados' }, { id: 'solo-marketing', label: 'Marketing' }, { id: 'solo-software', label: 'Software' }]}>
      <PackGroup id="combinados" title="Combinados"
        lead="Web o app + marketing en un solo plan, más conveniente que contratarlos por separado."
        packs={COMBO_PACKS} note={ADS_NOTE} />
      <PackGroup id="solo-marketing" title="Solo marketing"
        lead={`Redes, captación de leads y anuncios. El onboarding único incluye ${MARKETING_ONBOARDING.includes.toLowerCase()}.`}
        packs={MARKETING_PACKS} note={ADS_NOTE} />
      <div id="solo-software" className="pk-panel">
        <div className="wrap mkp-head" style={{ marginTop: 40 }}><h2 className="h3" id="solo-software-t">Solo software</h2><p className="lead">Sitios, catálogos, tiendas, apps, seguridad, datos y software a medida.</p></div>
        <Packs n={1} head={false} />
      </div>
      </PackTabs>
      <Compare />
      <Final n={2} />
      <JsonLd data={packsJsonLd} />
    </Page>
  );
}
