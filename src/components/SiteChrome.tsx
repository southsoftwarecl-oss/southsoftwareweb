/** Chrome del sitio público (antes en el layout raíz). Lo usan app/(site)/layout.tsx y app/not-found.tsx. */
import Preloader from '@/components/Preloader';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import WaFloat from '@/components/WaFloat';
import MotionRoot from '@/components/MotionRoot';
import { JsonLd } from '@/components/ui';
import Analytics from '@/components/Analytics';
import { GA_ID } from '@/lib/analytics';
import { orgJsonLd, websiteJsonLd } from '@/lib/seo';

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <Preloader />
      <div id="top" />
      <Nav />
      <main id="contenido">{children}</main>
      <Footer />
      <WaFloat />
      <div className="grain" aria-hidden="true" />
      <MotionRoot />
      <JsonLd data={orgJsonLd} />
      <JsonLd data={websiteJsonLd} />
      {/* GA4 + aviso de cookies: nada se renderiza sin NEXT_PUBLIC_GA_ID */}
      {GA_ID && <Analytics gaId={GA_ID} />}
    </>
  );
}
