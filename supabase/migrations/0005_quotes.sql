-- 0005 · Cotizaciones versionadas por solicitud + datos para reglas de etapa (Reunión, Cancelado).
-- Reglas:
--  * Una solicitud puede tener varias cotizaciones; cada cotización tiene versiones 1..n.
--  * Solo la ÚLTIMA versión de una cotización es editable, y solo mientras está en 'borrador'. Las anteriores son de solo lectura.
--  * Como máximo UNA versión 'aceptada' por solicitud (índice único parcial) y debe ser la vigente (última de su cotización).
--  * RLS igual al resto: lectura = equipo; insert/update = owner/admin/ventas; delete = owner. Auditoría con public.tg_audit().
-- NO APLICADA EN PRODUCCIÓN (pendiente de aprobación).
begin;

create type public.quote_status as enum ('borrador', 'enviada', 'aceptada', 'rechazada', 'reemplazada');

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users default auth.uid()
);
create index quotes_request_idx on public.quotes (request_id);

create table public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes on delete cascade,
  request_id uuid not null references public.requests on delete cascade, -- desnormalizado para la unicidad de 'aceptada'
  version int not null check (version >= 1),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and pg_column_size(items) < 32768),
  setup bigint not null default 0 check (setup >= 0),
  monthly bigint not null default 0 check (monthly >= 0),
  notes text check (char_length(notes) <= 2000),
  status public.quote_status not null default 'borrador',
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users default auth.uid(),
  unique (quote_id, version)
);
create index quote_versions_request_idx on public.quote_versions (request_id);
create unique index quote_versions_one_accepted on public.quote_versions (request_id) where status = 'aceptada';

-- Integridad: request_id coincide con la cotización; versión = siguiente; al crear versión nueva, la anterior queda 'reemplazada'
-- (si no estaba aceptada/rechazada); versiones antiguas inmutables; solo la última puede aceptarse.
create or replace function public.tg_quote_versions() returns trigger language plpgsql security definer set search_path = '' as $$
declare last int;
begin
  if tg_op = 'INSERT' then
    select q.request_id into new.request_id from public.quotes q where q.id = new.quote_id;
    select coalesce(max(v.version), 0) into last from public.quote_versions v where v.quote_id = new.quote_id;
    new.version := last + 1;
    if new.status <> 'borrador' then raise exception 'Una versión nueva parte en borrador'; end if;
    update public.quote_versions set status = 'reemplazada' where quote_id = new.quote_id and status in ('borrador', 'enviada');
    return new;
  end if;
  -- UPDATE
  if old.quote_id <> new.quote_id or old.request_id <> new.request_id or old.version <> new.version then raise exception 'No se puede mover una versión'; end if;
  if exists (select 1 from public.quote_versions v where v.quote_id = old.quote_id and v.version > old.version) then
    -- Solo el propio trigger (al crear la versión siguiente) puede marcarla como reemplazada.
    if not (new.status = 'reemplazada' and old.status in ('borrador', 'enviada') and new.items = old.items and new.setup = old.setup and new.monthly = old.monthly)
      then raise exception 'Las versiones anteriores son de solo lectura'; end if;
    return new;
  end if;
  if old.status <> 'borrador' and (new.items <> old.items or new.setup <> old.setup or new.monthly <> old.monthly or coalesce(new.notes,'') <> coalesce(old.notes,'')) then
    raise exception 'Solo los borradores se pueden editar; crea una versión nueva';
  end if;
  if old.status in ('aceptada', 'rechazada', 'reemplazada') and new.status <> old.status then raise exception 'La versión ya está cerrada'; end if;
  if new.status in ('aceptada', 'rechazada') and old.status <> new.status then new.decided_at := now(); end if;
  return new;
end $$;
revoke all on function public.tg_quote_versions() from public, anon, authenticated;
create trigger quote_versions_rules before insert or update on public.quote_versions for each row execute function public.tg_quote_versions();
create trigger audit after insert or update or delete on public.quotes for each row execute function public.tg_audit();
create trigger audit after insert or update or delete on public.quote_versions for each row execute function public.tg_audit();

alter table public.quotes enable row level security;
alter table public.quote_versions enable row level security;
revoke all on public.quotes, public.quote_versions from anon;
do $$ declare t text; begin
  foreach t in array array['quotes', 'quote_versions'] loop
    execute format('create policy %I on public.%I for select to authenticated using ((select private.is_staff()))', t || '_sel', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.has_role(''{owner,admin,ventas}'')))', t || '_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.has_role(''{owner,admin,ventas}''))) with check ((select private.has_role(''{owner,admin,ventas}'')))', t || '_upd', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.has_role(''{owner}'')))', t || '_del', t);
  end loop;
end $$;

-- Reglas de etapa en la BD (además del servidor): reunión con fecha, cancelado con motivo, propuesta/aceptado con cotización.
create or replace function public.tg_request_stage_rules() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.stage is distinct from old.stage then
    if new.stage = 'reunion' and new.next_action_at is null then raise exception 'Reunión requiere fecha y hora'; end if;
    if new.stage = 'cancelado' and coalesce(btrim(new.lost_reason), '') = '' then raise exception 'Cancelar requiere un motivo'; end if;
    if new.stage = 'propuesta' and not exists (select 1 from public.quote_versions v where v.request_id = new.id and v.status in ('borrador','enviada','aceptada')) then
      raise exception 'Propuesta requiere una cotización'; end if;
    if new.stage = 'aceptado' and not exists (select 1 from public.quote_versions v where v.request_id = new.id and v.status = 'aceptada') then
      raise exception 'Aceptado requiere una cotización aceptada'; end if;
  end if;
  return new;
end $$;
revoke all on function public.tg_request_stage_rules() from public, anon, authenticated;
create trigger request_stage_rules before update of stage on public.requests for each row execute function public.tg_request_stage_rules();

commit;
