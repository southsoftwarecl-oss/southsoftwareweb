# Panel admin South Software — Arquitectura (Fase 1)

## Decisiones
| Tema | Decisión | Estado |
|---|---|---|
| Ubicación | Mismo proyecto Next.js, ruta `/admin` (layout propio, sin Three.js/GA/chrome público, `noindex`, fuera de robots/sitemap) | Hecho |
| Separación del sitio | Páginas públicas en grupo `app/(site)` + `components/SiteChrome`; `/proyectos` fuera del grupo con su propio layout para no cambiar la URL de su opengraph-image | Hecho, 213/213 e2e |
| Auth fase 1 | Contraseña única por env (`ADMIN_PASSWORD`) + cookie HMAC firmada (`ADMIN_SESSION_SECRET`), httpOnly, SameSite=Strict, path `/admin`, 8 h. Doble chequeo: `src/proxy.ts` + `Guard` en servidor. 5 intentos/15 min. Sin env → panel desactivado | Hecho (provisorio) |
| Auth final | Supabase Auth (correo+contraseña) + MFA TOTP obligatorio (aal2), roles en `staff` (owner/admin/ventas/lectura), sin registro público | Fase 2, requiere Supabase |
| Datos | Postgres en Supabase, esquema en `supabase/migrations/0001_admin_init.sql` (borrador, NO aplicado), RLS en todas las tablas, precios versionados, `audit_log` append-only | Requiere aprobar proyecto |
| Captura de solicitudes | `/api/contact` sigue enviando por Resend **y además** guardará en `requests` (service role, solo servidor). "Elegir pack", "Arma tu pack" (incluye ítems + total mostrado + combo 15 %) y "Reservar cupo" hoy abren WhatsApp: se agregará un `POST /api/leads` en paralelo (best‑effort, sin bloquear el WhatsApp) | Fase 2 |
| Catálogo | Fase 1: el panel lee `site.ts`/`arma.ts` (una sola fuente). Fase 5: BD → web con `public_catalog` + revalidación | Hecho (lectura) |
| Correos a clientes | Solo borradores en `email_outbox` con aprobación humana | Diseño |
| Cobros | Manual (transferencia). Cálculo en `src/lib/admin/billing.ts`: inicial (Fundadores −30 % solo inicial si alta ≤ 30‑11‑2026), lanzamiento 3 meses → regular, hitos 30/30/30/10 para App | Hecho (simulador) |
| Alertas | Vista "Hoy hay que cobrar" + job diario 08:00 Santiago (Vercel Cron o pg_cron) que marca vencidos y crea borradores | Fase 4 |

## Fases siguientes
2. Conectar Supabase (tras aprobación), aplicar migración + seed del catálogo desde site.ts, Auth+MFA, guardar solicitudes desde la web, bandeja kanban.
3. Clientes/contratos: dar de alta, cambiar pack con historial y prorrateo, generar cobros.
4. Cobros: calendario, registrar pagos, vencidos, cron, borradores de recordatorio.
5. Catálogo editable con versiones, web leyendo de la BD, dashboard con KPIs reales.
6. QA (Semgrep, npm audit, advisors, Lighthouse), PR y deploy solo con OK de Mathias.

## Variables de entorno (solo nombres)
`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (fase 1) · `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (fase 2, la última solo servidor).
