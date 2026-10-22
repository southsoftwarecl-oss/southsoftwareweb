/**
 * Layout raíz: fuentes self-hosted, metadata global y CSS base. El "chrome" del sitio público (preloader, nav,
 * footer, WhatsApp, runtime de animación, analítica) vive en components/SiteChrome y lo usa app/(site)/layout.tsx;
 * /admin tiene su propio layout sin nada de eso (ni Three.js ni GA en el panel).
 */
import type { Metadata, Viewport } from 'next';
import './globals.css';
import './premium.css';
import { fontVars } from '@/lib/fonts';
import { BRAND, SITE_URL } from '@/content/site';
import { GSC_VERIFICATION } from '@/lib/analytics';

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
        {children}
      </body>
    </html>
  );
}
