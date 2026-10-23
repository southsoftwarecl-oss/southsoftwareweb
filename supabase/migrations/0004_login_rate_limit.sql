-- 0004 · Límite de intentos de login compartido entre instancias (reemplaza el contador en memoria por instancia).
-- Diseño:
--  * Tabla en el esquema privado (no expuesto por la API REST); RLS activado y sin políticas → nadie la lee/escribe directo.
--  * Dos funciones SECURITY DEFINER en public, únicas puertas de entrada, ejecutables por anon/authenticated (el login ocurre sin sesión).
--  * La clave es un hash (SHA-256 con sal secreta del servidor, LEADS_IP_SALT) de la IP: nunca se guarda la IP ni el correo.
--    Sin la sal no se puede calcular la clave de otra persona → no se puede bloquear al dueño a propósito.
--  * Ventana 15 min, máximo 5 fallos por clave. Las filas viejas se purgan solas.
-- NO APLICADA EN PRODUCCIÓN (pendiente de aprobación).

create table if not exists private.login_attempts (
  id bigint generated always as identity primary key,
  key_hash text not null check (char_length(key_hash) between 16 and 128),
  at timestamptz not null default now()
);
create index if not exists login_attempts_key_at on private.login_attempts (key_hash, at desc);
alter table private.login_attempts enable row level security;
revoke all on private.login_attempts from public, anon, authenticated;

-- ¿Puede intentar? true si tiene menos de 5 fallos en los últimos 15 min.
create or replace function public.login_rate_allowed(p_key text)
returns boolean language sql stable security definer set search_path = '' as $$
  select count(*) < 5 from private.login_attempts
  where key_hash = p_key and at > now() - interval '15 minutes';
$$;

-- Registra un fallo (y purga lo vencido). Devuelve los fallos vigentes para esa clave.
create or replace function public.login_rate_fail(p_key text)
returns integer language plpgsql volatile security definer set search_path = '' as $$
declare n integer;
begin
  if p_key is null or char_length(p_key) not between 16 and 128 then raise exception 'clave inválida'; end if;
  delete from private.login_attempts where at < now() - interval '1 hour';
  insert into private.login_attempts (key_hash) values (p_key);
  select count(*) into n from private.login_attempts where key_hash = p_key and at > now() - interval '15 minutes';
  return n;
end $$;

revoke all on function public.login_rate_allowed(text) from public;
revoke all on function public.login_rate_fail(text) from public;
grant execute on function public.login_rate_allowed(text) to anon, authenticated;
grant execute on function public.login_rate_fail(text) to anon, authenticated;
