-- South Software · panel admin · esquema inicial (BORRADOR FASE 1 — NO APLICADO a ningún proyecto Supabase).
-- Montos CLP en bigint. RLS en todas las tablas; la web pública nunca escribe con anon (solo vía /api/leads con service role en servidor).
create extension if not exists pgcrypto;

create type staff_role as enum ('owner','admin','ventas','lectura');
create type request_channel as enum ('form_contacto','elegir_pack','arma_tu_pack','arma_tu_proyecto','reservar_cupo','manual');
create type request_stage as enum ('nuevo','contactado','reunion','propuesta','aceptado','activo','pausado','cancelado');
create type pack_category as enum ('combinado','marketing','software');
create type subscription_status as enum ('pendiente_alta','activo','pausado','cancelado');
create type charge_status as enum ('programado','por_cobrar','enviado','pagado','parcial','vencido','anulado');
create type charge_kind as enum ('inicial','mensual','hito','ajuste','pauta');

create table staff (user_id uuid primary key references auth.users on delete cascade, role staff_role not null, display_name text not null, created_at timestamptz not null default now());

create or replace function public.staff_role() returns staff_role language sql stable security definer set search_path = public, pg_temp
as $$ select role from staff where user_id = auth.uid() $$;

create table clients (
  id uuid primary key default gen_random_uuid(), name text not null, company text, rut text, email text, phone text,
  source text, is_founder boolean not null default false, status text not null default 'prospecto' check (status in ('prospecto','activo','ex_cliente')),
  notes text, deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users);
create index on clients (lower(email)); create index on clients (phone);

create table pack_catalog (
  id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, category pack_category not null, tag text,
  features jsonb not null default '[]', featured boolean not null default false, sort int not null default 0, visible boolean not null default true,
  is_from boolean not null default false, milestones int[], cta text not null default 'elegir', created_at timestamptz not null default now(), updated_at timestamptz not null default now());

-- Precios versionados: nunca se sobrescriben.
create table price_versions (
  id uuid primary key default gen_random_uuid(), pack_id uuid not null references pack_catalog on delete restrict,
  setup bigint, launch_monthly bigint, launch_months int, regular_monthly bigint, onboarding bigint,
  valid_from timestamptz not null default now(), valid_to timestamptz, reason text, approved_by uuid references auth.users, created_at timestamptz not null default now(),
  check (valid_to is null or valid_to > valid_from));

create table pricing_rules (id uuid primary key default gen_random_uuid(), code text unique not null, description text not null, params jsonb not null, valid_from timestamptz not null default now(), valid_to timestamptz);
create table promotions (id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, setup_discount_pct numeric(5,2) not null, seats int, valid_until date not null, active boolean not null default true);

create table requests (
  id uuid primary key default gen_random_uuid(), client_id uuid references clients, channel request_channel not null, stage request_stage not null default 'nuevo',
  payload jsonb not null,               -- lo que envió el visitante, tal cual
  pack_id uuid references pack_catalog, builder_config jsonb,  -- ítems + total mostrado + versión de precios
  shown_setup bigint, shown_monthly bigint, name text, email text, phone text, message text,
  owner uuid references auth.users, next_action text, next_action_at timestamptz, lost_reason text,
  utm jsonb, referrer text, ip_hash text, user_agent text, deleted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index on requests (stage, created_at desc);

create table request_events (id uuid primary key default gen_random_uuid(), request_id uuid not null references requests on delete cascade, kind text not null, data jsonb, created_at timestamptz not null default now(), created_by uuid references auth.users);

create table subscriptions (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references clients, pack_id uuid not null references pack_catalog,
  price_version_id uuid not null references price_versions, request_id uuid references requests, status subscription_status not null default 'pendiente_alta',
  start_date date, billing_day int check (billing_day between 1 and 31), setup_amount bigint not null, launch_monthly bigint, launch_until date, regular_monthly bigint,
  founders_applied boolean not null default false, notice_given_at date, end_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users);

create table subscription_changes (
  id uuid primary key default gen_random_uuid(), subscription_id uuid not null references subscriptions, from_pack uuid references pack_catalog, to_pack uuid not null references pack_catalog,
  effective_date date not null, reason text not null, proration jsonb, approved_by uuid references auth.users, created_at timestamptz not null default now());

create table charges (
  id uuid primary key default gen_random_uuid(), subscription_id uuid not null references subscriptions, kind charge_kind not null, concept text not null,
  amount bigint not null check (amount >= 0), due_date date, status charge_status not null default 'programado', tax_doc_number text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index on charges (status, due_date);

create table payments (id uuid primary key default gen_random_uuid(), charge_id uuid not null references charges, amount bigint not null check (amount > 0), paid_on date not null, method text not null, receipt_path text, reconciled_by uuid references auth.users, created_at timestamptz not null default now());

-- Correos a clientes: SOLO borradores; salen tras aprobación humana.
create table email_outbox (id uuid primary key default gen_random_uuid(), to_email text not null, subject text not null, body text not null, status text not null default 'borrador' check (status in ('borrador','aprobado','enviado','fallido')), approved_by uuid references auth.users, created_at timestamptz not null default now());

create table audit_log (id bigserial primary key, actor uuid, action text not null, table_name text, record_id uuid, diff jsonb, ip_hash text, at timestamptz not null default now());

-- RLS
do $$ declare t text; begin
  foreach t in array array['staff','clients','pack_catalog','price_versions','pricing_rules','promotions','requests','request_events','subscriptions','subscription_changes','charges','payments','email_outbox','audit_log'] loop
    execute format('alter table %I enable row level security', t);
  end loop; end $$;

create policy staff_read on staff for select using (staff_role() is not null);
create policy staff_owner on staff for all using (staff_role() = 'owner') with check (staff_role() = 'owner');
do $$ declare t text; begin
  foreach t in array array['clients','requests','request_events'] loop
    execute format('create policy %I_read on %I for select using (staff_role() is not null)', t, t);
    execute format('create policy %I_write on %I for all using (staff_role() in (''owner'',''admin'',''ventas'')) with check (staff_role() in (''owner'',''admin'',''ventas''))', t, t);
  end loop;
  foreach t in array array['pack_catalog','price_versions','pricing_rules','promotions','subscriptions','subscription_changes','charges','payments','email_outbox'] loop
    execute format('create policy %I_read on %I for select using (staff_role() is not null)', t, t);
    execute format('create policy %I_write on %I for all using (staff_role() in (''owner'',''admin'')) with check (staff_role() in (''owner'',''admin''))', t, t);
  end loop; end $$;
create policy audit_read on audit_log for select using (staff_role() in ('owner','admin'));
-- audit_log append-only: sin políticas de update/delete; inserción solo por trigger security definer.
revoke update, delete on audit_log from authenticated, anon;

-- Catálogo público (solo visible + precio vigente) para la web en fase 5.
create view public_catalog with (security_invoker = false) as
  select p.slug, p.name, p.category, p.tag, p.features, p.featured, p.sort, p.is_from, v.setup, v.launch_monthly, v.launch_months, v.regular_monthly
  from pack_catalog p join lateral (select * from price_versions pv where pv.pack_id = p.id and pv.valid_from <= now() and (pv.valid_to is null or pv.valid_to > now()) order by valid_from desc limit 1) v on true
  where p.visible;
grant select on public_catalog to anon;
