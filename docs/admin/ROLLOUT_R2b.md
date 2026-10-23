# Plan de paso a producción: R1b, R2 y R2b (NO EJECUTADO, requiere aprobación de Mathias)

Rama: `feat/admin-premium`, basada en `main` 9b38ec5. Proyecto Supabase: `pjcwsfsapvsqptuarfyh`.

## Qué se probó (sin tocar producción)

| Pieza | Cómo se probó | Resultado |
|---|---|---|
| Migraciones 0001–0005 | Postgres 17 desechable en local, con stub de `auth` (`supabase/tests/run_local.sh`). No se usó Supabase branching porque es de pago. | Todas se aplican limpias en orden |
| Comportamiento de 0004 y 0005 | `supabase/tests/0004_0005_behavior.sql`: rate limit, RLS por rol (sin equipo, lectura, owner), versionado, solo lectura, una aceptada por solicitud, reglas de etapa | OK |
| Correos v2 | `python3 supabase/templates/v2/apply.py`, en modo simulación | Solo muestra asuntos y tamaños (invite 4798 y recovery 4734 caracteres). No envía nada |
| App | Suite completa de Playwright, incluido un servidor con `ADMIN_REQUIRE_MFA=1` contra un mock | Ver reporte |

Limitaciones: el stub no replica el esquema `auth` real de Supabase, ni los grants por defecto, ni `pg_net` o `pgsodium`. Antes del paso 3 conviene revisar el SQL en el editor de Supabase. 0005 no es reejecutable (falla en `create type`), pero corre dentro de `begin/commit`, así que si falla no queda a medias.

## Orden exacto

0. **Respaldo.** Desde Supabase Dashboard → Database → Backups, confirmar que existe un respaldo de hoy o descargar uno.
1. **Revisión.** Mathias revisa `0004_login_rate_limit.sql` y `0005_quotes.sql`.
2. **Migración 0004** (rate limit compartido del login). Pegarla en el SQL editor de producción y ejecutarla. Verificar con `select public.login_rate_allowed(repeat('x',32));`, que debe devolver `true`. Es inocua: si la app no la encuentra, usa el límite en memoria.
3. **Migración 0005** (cotizaciones y reglas de etapa). Ejecutarla en el SQL editor. Verificar:
   - existen `select count(*) from public.quotes;` y `public.quote_versions`;
   - las políticas aparecen con `select policyname from pg_policies where tablename in ('quotes','quote_versions');` (4 por tabla);
   - existe el trigger `request_stage_rules` en `requests`.

   Las solicitudes que ya están en Propuesta o Aceptado no se ven afectadas: el trigger solo actúa cuando cambia la etapa. **Debe ir ANTES del deploy**, porque la app nueva consulta `quotes` al mover a Propuesta o Aceptado.
4. **Variables en Vercel (Production).** No cambia ninguna. `ADMIN_REQUIRE_MFA` se queda **sin definir**. Si se quiere un salt propio para el rate limit, revisar si `LEADS_IP_SALT` ya existe (A CONFIRMAR).
5. **Merge y deploy.** Con aprobación: PR de `feat/admin-premium` → `main`, deploy preview en Vercel y una prueba rápida con la cuenta de owner:
   - login;
   - Inicio;
   - Solicitudes: menú "⋯", mover a Reunión pidiendo fecha;
   - crear una cotización sobre una solicitud de prueba;
   - Seguridad.

   Después, promover a producción.
6. **MFA, paso 1 (enrolar).** Mathias entra a `/admin/seguridad` → "Activar verificación en dos pasos", escanea el QR y confirma el código. Si hay más miembros del equipo, cada uno hace lo mismo. Requiere que TOTP esté habilitado en Supabase Auth → MFA (viene así por defecto; A CONFIRMAR en el dashboard).
7. **MFA, paso 2 (exigir).** Solo cuando todos se hayan enrolado: en Vercel, `ADMIN_REQUIRE_MFA=1` y redeploy. Aunque alguien no tenga factor, no queda bloqueado: al entrar va a `/admin/mfa` y se enrola ahí. Rollback: borrar la variable y redeploy.
8. **Correos v2.** `SUPABASE_ACCESS_TOKEN=… python3 supabase/templates/v2/apply.py --apply` solo modifica los asuntos y el contenido de invite y recovery. Verificar enviando una recuperación a la propia cuenta de Mathias. Rollback: `supabase/templates/apply_auth_config.py` contiene las plantillas v1 que están en producción hoy (revisar el script antes de usarlo, porque también imprime parte de la config).

## Rollback por paso

| Paso | Rollback |
|---|---|
| 0004 | `drop function public.login_rate_allowed(text), public.login_rate_fail(text); drop table private.login_attempts;` |
| 0005 | `drop trigger request_stage_rules on public.requests; drop function public.tg_request_stage_rules(); drop table public.quote_versions, public.quotes; drop type public.quote_status; drop function public.tg_quote_versions();` Primero hay que revertir el deploy, porque la app nueva espera estas tablas |
| Deploy | Hacer "Promote" del deploy anterior en Vercel |
| MFA | Quitar `ADMIN_REQUIRE_MFA` |

## A CONFIRMAR
- Que TOTP esté habilitado en Supabase Auth → Multi-Factor (enroll y verify).
- Si existe un `LEADS_IP_SALT` propio en Vercel, o si se usa el de respaldo.
- Si hay otros miembros del equipo que deban enrolarse antes del paso 7.
