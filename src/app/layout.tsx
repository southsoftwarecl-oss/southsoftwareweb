/**
 * Layout raíz: fuentes self-hosted, metadata global, preloader, nav, footer,
 * WhatsApp flotante, grano, runtime de animación y analítica (GA4 con consentimiento). Cada página se envuelve en
 * <Page> (view transitions).
 */
import type { Metadata, Viewport } from 'next';
import './globals.css';
import './premium.css';
import { fontVars } from '@/lib/fonts';
import { BRAND, SITE_URL } from '@/content/site';
import { orgJsonLd } from '@/lib/seo';
import Preloader from '@/components/Preloader';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import WaFloat from '@/components/WaFloat';
import MotionRoot from '@/components/MotionRoot';
import { JsonLd } from '@/components/ui';
import Analytics from '@/components/Analytics';
import { GA_ID, GSC_VERIFICATION } from '@/lib/analytics';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Favicon con URLs estables (sin hash): public/favicon.ico, favicon.svg, apple-touch-icon.png
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
  title: { default: `South Software — ${BRAND.tagline}`, template: '%s · South Software' },
  description: BRAND.description,
  applicationName: 'South Software',
  keywords: ['desarrollo de software Chile', 'software a medida', 'páginas web Chile', 'apps móviles Chile', 'ciberseguridad pymes', 'ciencia de datos', 'marketing digital', 'gestión de redes sociales', 'captación de leads', 'Meta Ads', 'publicidad en Facebook e Instagram'],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'es_CL', url: '/', siteName: 'South Software', title: `South Software — ${BRAND.tagline}`, description: BRAND.description },
  twitter: { card: 'summary_large_image', title: `South Software — ${BRAND.tagline}`, description: BRAND.description },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
  // Google Search Console: <meta name="google-site-verification"> solo si hay token configurado
  ...(GSC_VERIFICATION ? { verification: { google: GSC_VERIFICATION } } : {}),
};

export const viewport: Viewport = { themeColor: '#0A0A0B', colorScheme: 'dark' };

/** Se ejecuta antes del primer pintado: marca modo captura / movimiento reducido. */
const MODE_SCRIPT = `(function(){var d=document.documentElement;if(/capture/.test(location.search+location.hash))d.classList.add('capture');if(matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('rm')})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" className={fontVars} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger -- script estático propio, sin datos de usuario */}
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      <body>
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
        {/* GA4 + aviso de cookies: nada se renderiza sin NEXT_PUBLIC_GA_ID */}
        {GA_ID && <Analytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
