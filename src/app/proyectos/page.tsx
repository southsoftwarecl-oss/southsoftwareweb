/** Proyectos: listado de casos (mismo diseño de la sección del home). */
import Page from '@/components/Page';
import Cases from '@/components/sections/Cases';
import Final from '@/components/sections/Final';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Proyectos',
  description: 'Proyectos reales de South Software: RG Motors Chile, Salgado Automotriz y Frío Austral. Plataformas web, catálogos y tiendas online funcionando hoy.',
  path: '/proyectos',
});

export default function Proyectos() {
  return (
    <Page>
      <div className="page-top" />
      <Cases n={0} as="h1" title={<>Sitios que venden.<br /><span className="dim">Funcionando hoy.</span></>} />
      <Final n={1} />
    </Page>
  );
}
