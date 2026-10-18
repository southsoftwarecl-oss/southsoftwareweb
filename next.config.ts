import type { NextConfig } from 'next';

/**
 * Cabeceras de seguridad (CSP, HSTS, etc.).
 * - CSP estricta por origen. 'unsafe-inline' en script-src es necesario para los
 *   scripts inline de hidratación de Next en páginas estáticas (sin nonce).
 *   Ver docs: node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
 * - Cloudflare Turnstile se habilita en la CSP solo si hay site key configurada.
 * - Google Analytics 4: script-src / connect-src / img-src (gtag.js solo carga tras consentimiento).
 */
const isDev = process.env.NODE_ENV === 'development';
const turnstile = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? ' https://challenges.cloudflare.com' : '';
/** Google Analytics 4 (gtag.js): script desde GTM, hits a *.google-analytics.com / *.analytics.google.com. */
const gaScript = ' https://www.googletagmanager.com';
const gaHits = ' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}${gaScript}${turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${gaHits}`,
  "font-src 'self'",
  `connect-src 'self'${gaHits}${turnstile}`,
  `frame-src${turnstile || " 'none'"}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  // mailto: fallback del brief de /contacto cuando no hay JavaScript
  "form-action 'self' mailto:",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig: NextConfig = {
  // Solo para e2e: build paralelo con GA de prueba (SOUTH_DIST_DIR=.next-ga). Producción usa .next.
  ...(process.env.SOUTH_DIST_DIR ? { distDir: process.env.SOUTH_DIST_DIR } : {}),
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Source maps públicos: facilitan auditoría y depuración (Lighthouse: valid-source-maps)
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  images: { formats: ['image/avif', 'image/webp'] },
  turbopack: {
    rules: {
      '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' },
    },
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
