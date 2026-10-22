/** /proyectos queda fuera del grupo (site) para conservar la URL estable de su opengraph-image (en grupos Next le agrega un hash). */
import SiteChrome from '@/components/SiteChrome';

export default function ProyectosLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
