/** Packs y precios: listado completo (valores exactos en content/site.ts) + contacto. */
import Page from '@/components/Page';
import PageHero from '@/components/PageHero';
import Packs from '@/components/sections/Packs';
import Final from '@/components/sections/Final';
import { JsonLd } from '@/components/ui';
import { packsJsonLd, pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Packs y precios',
  description: 'Precios publicados: sitios web, catálogos, e-commerce, apps, seguridad y datos. Pago inicial + mensualidad con hosting, dominio, respaldos y soporte. Puerto Montt, Chile.',
  path: '/packs',
});

export default function PacksPage() {
  return (
    <Page>
      <PageHero crumb={[{ href: '', label: 'Packs' }]} eyebrow="Packs y precios" title={<>Precio claro.<br /><span className="dim">Desde el primer día.</span></>}
        lead="Un pago inicial para construir y una mensualidad que cubre hosting, dominio, respaldos, cambios y soporte. Valores brutos con boleta de honorarios." />
      {/* el título ya está en el h1 de la página: la sección se muestra sin encabezado propio */}
      <Packs n={1} head={false} />
      <Final n={2} />
      <JsonLd data={packsJsonLd} />
    </Page>
  );
}
