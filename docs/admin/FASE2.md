# Fase 2 — estado
- Auth Supabase (correo + contraseña) para /admin cuando hay SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY; exige fila en `staff` (rol). MFA opcional con ADMIN_REQUIRE_MFA=1. Sin env de Supabase → modo contraseña provisorio de fase 1.
- Guardado de solicitudes: /api/contact guarda en `requests` y sigue enviando por Resend; "Elegir pack"/"Conversemos"/"Reservar cupo"/"Arma tu pack" envían sendBeacon a /api/leads (montos recalculados en servidor) y siguen abriendo WhatsApp.
- Escritura: SUPABASE_SECRET_KEY si existe; si no, publishable key + política `requests_anon_insert` (solo INSERT, sin lectura).
- Kanban con datos reales y "Mover a…" accesible por teclado (sin drag & drop aún). "Activo" reservado a "Dar de alta" (fase 3).
- Reglas confirmadas en esquema/cálculo: launch_date; billing_day 1–28 elegido por cliente (por defecto día del lanzamiento); 1.ª mensualidad = primer día de cobro ≥ lanzamiento + 1 mes. doc_type boleta/factura (factura exige RUT, razón social, giro, dirección). payment_method: transferencia, efectivo, debito, credito, link_pago, otro + nota.
- BLOQUEADO: la migración no se pudo aplicar desde el box (salida a puertos 5432/6543 bloqueada; la MCP de Supabase no tiene acceso a este proyecto). Ver supabase/preflight_check_empty.sql y 0001_admin_init.sql.
