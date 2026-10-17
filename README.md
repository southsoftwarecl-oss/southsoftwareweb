# South Software — sitio web

Sitio de **South Software** (Puerto Montt): port 1:1 del preview 10 "Partículas"
(14.000 partículas que forman SOUTH SOFTWARE, esquivan el mouse y se transforman en esfera con el scroll).

**Stack:** Next.js 16 (App Router, Cache Components, View Transitions) · TypeScript · Tailwind v4 ·
GSAP + ScrollTrigger + SplitText · Lenis · React Three Fiber + drei · Framer Motion · zod.

## Instalación

Requiere Node 20.9+ (recomendado 22).

```bash
npm install
cp .env.example .env.local   # opcional: sin claves funciona en modo demo
npm run dev                  # http://localhost:3000
npm run build && npm run start   # producción
```

| Script | Qué hace |
|---|---|
| `npm run dev` | desarrollo |
| `npm run build` / `npm run start` | build y servidor de producción |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run test:e2e` | Playwright (levanta `next start` en el puerto 3300; requiere `npm run build` antes) |

Playwright usa `/usr/bin/google-chrome` en Linux (o `CHROME_PATH`). En otros sistemas: `npx playwright install chromium`.

## Variables de entorno

Ver `.env.example`. Ninguna clave secreta llega al navegador: solo las `NEXT_PUBLIC_*`.

- `RESEND_API_KEY` + `CONTACT_TO_EMAIL` → el formulario envía correos con Resend. Sin ellas responde en **modo demo** (valida pero no envía, y lo indica en pantalla).
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` → activa Cloudflare Turnstile (y su dominio en la CSP).
- `NEXT_PUBLIC_SITE_URL` → canonical, sitemap, Open Graph y JSON-LD.
- `CONTACT_RATE_LIMIT` → envíos por IP cada 10 min (límite en memoria; en serverless con varias instancias conviene un store compartido).

## Estructura

```
src/
  app/                    rutas (App Router)
    page.tsx              home (orden idéntico al preview)
    servicios/ proyectos/ proyectos/[slug]/ nosotros/ contacto/
    not-found.tsx         404 animado con partículas
    api/contact/route.ts  endpoint del formulario (validación zod, honeypot, rate limit, Turnstile, Resend)
    sitemap.ts robots.ts  SEO; opengraph-image.jpg / twitter-image.jpg / icon.png
    globals.css           TODOS los estilos (portados del preview) + extensiones
    layout.tsx            fuentes, preloader, nav, footer, JSON-LD Organization
  content/site.ts         ← TODOS LOS TEXTOS, servicios, packs, precios, proyectos y placeholders
  components/
    sections/             secciones del home (Hero, Services, Cases, Packs, …)
    three/                hero 3D (ParticleScene: shaders y muestreo del texto; HeroCanvas: carga diferida)
    MotionRoot.tsx        puente React → lib/motion-runtime.ts (se carga tras el primer pintado)
    Nav, Footer, ContactForm, MobileMenu, FormFeedback, Preloader, PageHero, Page, ui
  lib/
    motion-runtime.ts     animaciones (Lenis, reveals SplitText, parallax, contadores, cursor, magnéticos…)
    runtime.ts            modos (reduced motion, static), sincronía con el preloader
    contact-schema.ts     validación servidor (zod) · contact-rules.ts validación cliente (liviana)
    seo.ts fonts.ts gsap.ts
  fonts/                  woff2 self-hosted + licencias
e2e/                      tests Playwright (navegación y formulario)
scripts/                  shoot.py (capturas) · record-home.py (video del home)
audit/                    Semgrep (reporte y reglas propias)
```

## Cómo editar

- **Textos, servicios, packs y precios:** `src/content/site.ts` (`SERVICES`, `PACKS`, `STEPS`, `WHY`, `FOUNDERS`, …).
- **Proyectos:** agrega un objeto en `CASES` (`src/content/site.ts`) y su imagen en `public/cases/`.
  La página `/proyectos/<slug>` se genera sola (y entra al sitemap). Para métricas reales, cambia `value: null` por el dato.
- **WhatsApp / teléfono:** `WHATSAPP_NUMBER` y `BRAND.phone` en `src/content/site.ts`.
- **Colores:** variables al inicio de `src/app/globals.css` (`--bg`, `--fg`, `--muted`, `--dim`) y el bloque
  "Concept 10" (`--accent: #7C5CFF`, `--accent-rgb`, `--accent-fill`). El color de las partículas sale de `--accent`.
- **Tipografías:** `src/lib/fonts.ts` (Satoshi titulares, Inter cuerpo, JetBrains Mono etiquetas, Michroma logo/partículas).
- **Imagen para redes:** reemplaza `src/app/opengraph-image.jpg` y `twitter-image.jpg` (1200×630).

## Rendimiento, accesibilidad y seguridad

- 3D con code-splitting: se carga tras la intro (desktop) o a la primera interacción (móviles/equipos modestos), con 7.000 partículas en móvil, DPR limitado, pausa fuera de pantalla y fallback sin WebGL.
- `prefers-reduced-motion`: sin preloader, sin Lenis, sin animaciones de scroll; partículas estáticas.
- Cabeceras (next.config.ts): CSP, HSTS (2 años, preload), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP.
- Auditoría Semgrep: `audit/SEMGREP.md`.

## Placeholders pendientes (marcados en el sitio)

- WhatsApp `56900000000` y teléfono `+56 9 XXXX XXXX (por definir)`.
- Testimonios: 3 tarjetas con texto reservado ("Aquí irá el testimonio real…"); usar solo testimonios reales y autorizados.
- Métricas y "el desafío" de cada caso (RG Motors Chile, Salgado Automotriz, Frío Austral).
- Frío Austral: "Propuesta de diseño. Ubicación y alcance por confirmar con el cliente."
- Cargo y biografía del equipo en /nosotros.
- Dominio `southsoftware.cl` (supuesto) y correo `contacto@southsoftware.cl`.
