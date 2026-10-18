import type { NextConfig } from 'next';

/**
 * Cabeceras de seguridad (CSP, HSTS, etc.).
 * - CSP estricta por origen. 'unsafe-inline' en script-src es necesario para los
 *   scripts inline de hidratación de Next en páginas estáticas (sin nonce).
 *   Ver docs: node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
 * - Cloudflare Turnstile se habilita en la CSP solo si hay site key configurada.
 */
const isDev = process.env.NODE_ENV === 'development';
const turnstile = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? ' https://challenges.cloudflare.com' : '';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}${turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${turnstile}`,
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
