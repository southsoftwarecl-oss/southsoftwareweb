/** Proyectos: listado de casos (mismo diseño de la sección del home). */
import { JsonLd } from '@/components/ui';
import Page from '@/components/Page';
import Cases from '@/components/sections/Cases';
import Final from '@/components/sections/Final';
import { breadcrumbJsonLd, pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Proyectos de desarrollo web y software',
  description: 'Proyectos reales de desarrollo web de South Software: plataformas para automotoras, una academia online y una tienda con pagos. Mira los casos y cotiza.',
  path: '/proyectos',
});

export default function Proyectos() {
  return (
    <Page>
      <div className="page-top" />
      <Cases n={0} as="h1" title={<>Sitios que venden.<br /><span className="dim">Funcionando hoy.</span></>} />
      <Final n={1} />
      <JsonLd data={breadcrumbJsonLd([{ href: '', label: 'Proyectos' }], '/proyectos')} />
    </Page>
  );
}
