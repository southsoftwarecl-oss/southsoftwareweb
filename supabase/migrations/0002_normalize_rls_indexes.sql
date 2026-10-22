-- 0002 · Normalización, índices, auditoría y RLS endurecida (sobre 0001).
begin;

-- ── Helpers de rol (security definer, search_path vacío, nombres calificados) ──
create or replace function public.staff_role() returns public.staff_role
  language sql stable security definer set search_path = ''
as $$ select s.role from public.staff s where s.user_id = (select auth.uid()) $$;

create or replace function public.is_staff() returns boolean
  language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.staff s where s.user_id = (select auth.uid())) $$;

create or replace function public.has_role(roles public.staff_role[]) returns boolean
  language sql stable security definer set search_path = ''
as $$ select coalesce((select s.role = any(roles) from public.staff s where s.user_id = (select auth.uid())), false) $$;

revoke all on function public.staff_role(), public.is_staff(), public.has_role(public.staff_role[]) from public, anon;
grant execute on function public.staff_role(), public.is_staff(), public.has_role(public.staff_role[]) to authenticated;

-- ── Normalización (3NF): sin datos derivables ni duplicados ──
-- launch_until se deriva de launch_date + price_versions.launch_months.
alter table public.subscriptions drop column if exists launch_until;
-- email_outbox: vínculo al cliente (el correo destino puede diferir del principal, se conserva).
alter table public.email_outbox add column if not exists client_id uuid references public.clients on delete set null;
-- requests.payload = registro crudo e inmutable de lo enviado (evidencia); las columnas name/email/phone/message son su versión validada para búsqueda.
-- Integridad extra
alter table public.clients add constraint clients_email_chk check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
alter table public.price_versions add constraint pv_amounts_chk check (coalesce(setup,0) >= 0 and coalesce(launch_monthly,0) >= 0 and coalesce(regular_monthly,0) >= 0 and coalesce(onboarding,0) >= 0 and (launch_months is null or launch_months between 1 and 24));
alter table public.subscriptions add constraint subs_amounts_chk check (setup_amount >= 0 and coalesce(launch_monthly,0) >= 0 and coalesce(regular_monthly,0) >= 0);
alter table public.subscription_changes add constraint subs_change_diff_chk check (from_pack is distinct from to_pack);
alter table public.promotions add constraint promo_pct_chk check (setup_discount_pct > 0 and setup_discount_pct <= 100 and (seats is null or seats > 0));
alter table public.staff add column if not exists updated_at timestamptz not null default now();

-- created_by por defecto = usuario actual
alter table public.clients alter column created_by set default auth.uid();
alter table public.subscriptions alter column created_by set default auth.uid();
alter table public.request_events alter column created_by set default auth.uid();

-- ── Índices: todas las FK + filtros frecuentes ──
create index if not exists clients_created_by_idx on public.clients (created_by);
create index if not exists clients_status_idx on public.clients (status) where deleted_at is null;
create index if not exists price_versions_pack_valid_idx on public.price_versions (pack_id, valid_from desc);
create index if not exists price_versions_approved_by_idx on public.price_versions (approved_by);
create index if not exists requests_pack_id_idx on public.requests (pack_id);
create index if not exists requests_owner_idx on public.requests (owner);
create index if not exists requests_client_id_idx on public.requests (client_id);
create index if not exists requests_created_at_idx on public.requests (created_at desc) where deleted_at is null;
create index if not exists requests_email_idx on public.requests (lower(email)) where email is not null;
create index if not exists request_events_request_idx on public.request_events (request_id, created_at desc);
create index if not exists request_events_created_by_idx on public.request_events (created_by);
create index if not exists subscriptions_client_idx on public.subscriptions (client_id);
create index if not exists subscriptions_pack_idx on public.subscriptions (pack_id);
create index if not exists subscriptions_price_version_idx on public.subscriptions (price_version_id);
create index if not exists subscriptions_request_idx on public.subscriptions (request_id);
create index if not exists subscriptions_created_by_idx on public.subscriptions (created_by);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscription_changes_sub_idx on public.subscription_changes (subscription_id, effective_date desc);
create index if not exists subscription_changes_from_idx on public.subscription_changes (from_pack);
create index if not exists subscription_changes_to_idx on public.subscription_changes (to_pack);
create index if not exists subscription_changes_approved_idx on public.subscription_changes (approved_by);
create index if not exists charges_subscription_idx on public.charges (subscription_id, due_date);
-- próximo cobro: solo pendientes
create index if not exists charges_next_due_idx on public.charges (due_date) where status in ('programado','por_cobrar','enviado','parcial','vencido');
create index if not exists payments_charge_idx on public.payments (charge_id);
create index if not exists payments_reconciled_idx on public.payments (reconciled_by);
create index if not exists payments_paid_on_idx on public.payments (paid_on desc);
create index if not exists email_outbox_approved_idx on public.email_outbox (approved_by);
create index if not exists email_outbox_client_idx on public.email_outbox (client_id);
create index if not exists email_outbox_status_idx on public.email_outbox (status, created_at desc);
create index if not exists audit_log_record_idx on public.audit_log (table_name, record_id, at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor);

-- ── updated_at automático ──
create or replace function public.tg_set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['staff','clients','pack_catalog','requests','subscriptions','charges'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.tg_set_updated_at()', t);
  end loop; end $$;

-- ── Auditoría append-only por trigger ──
create or replace function public.tg_audit() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (actor, action, table_name, record_id, diff)
  values ((select auth.uid()), lower(tg_op), tg_table_name,
          coalesce((case when tg_op = 'DELETE' then old.id else new.id end), null),
          case tg_op when 'INSERT' then jsonb_build_object('new', to_jsonb(new))
                     when 'UPDATE' then jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
                     else jsonb_build_object('old', to_jsonb(old)) end);
  return coalesce(new, old);
end $$;
revoke all on function public.tg_audit(), public.tg_set_updated_at() from public, anon, authenticated;
do $$ declare t text; begin
  foreach t in array array['clients','pack_catalog','price_versions','pricing_rules','promotions','subscriptions','subscription_changes','charges','payments','email_outbox'] loop
    execute format('drop trigger if exists audit on public.%I', t);
    execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.tg_audit()', t);
  end loop;
  -- requests/request_events: solo cambios del equipo (los INSERT anónimos de la web no se auditan para no inflar el log)
  execute 'drop trigger if exists audit on public.requests';
  execute 'create trigger audit after update or delete on public.requests for each row execute function public.tg_audit()';
  execute 'drop trigger if exists audit on public.staff';
  execute 'create trigger audit after insert or update or delete on public.staff for each row execute function public.tg_audit()';
end $$;
-- staff no tiene columna id: usar user_id
create or replace function public.tg_audit_staff() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (actor, action, table_name, record_id, diff)
  values ((select auth.uid()), lower(tg_op), 'staff', coalesce(new.user_id, old.user_id),
          jsonb_build_object('old', case when tg_op <> 'INSERT' then to_jsonb(old) end, 'new', case when tg_op <> 'DELETE' then to_jsonb(new) end));
  return coalesce(new, old);
end $$;
revoke all on function public.tg_audit_staff() from public, anon, authenticated;
drop trigger if exists audit on public.staff;
create trigger audit after insert or update or delete on public.staff for each row execute function public.tg_audit_staff();

-- ── RLS: borrar políticas de 0001 y recrear una por comando (sin permisivas superpuestas) ──
do $$ declare r record; begin
  for r in select tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop; end $$;

-- Privilegios base: anon NO tiene nada salvo INSERT en requests
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on functions from anon;
alter default privileges in schema public revoke all on sequences from anon;
grant insert (channel, payload, pack_id, builder_config, shown_setup, shown_monthly, name, email, phone, message, utm, referrer, ip_hash, user_agent) on public.requests to anon;

do $$ declare t text;
  ventas text[] := array['clients','requests','request_events'];
  admin  text[] := array['pack_catalog','price_versions','pricing_rules','promotions','subscriptions','subscription_changes','charges','payments','email_outbox'];
begin
  foreach t in array ventas || admin loop
    execute format('create policy %I on public.%I for select to authenticated using ((select public.is_staff()))', t||'_sel', t);
  end loop;
  foreach t in array ventas loop
    execute format('create policy %I on public.%I for insert to authenticated with check ((select public.has_role(''{owner,admin,ventas}'')))', t||'_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select public.has_role(''{owner,admin,ventas}''))) with check ((select public.has_role(''{owner,admin,ventas}'')))', t||'_upd', t);
  end loop;
  foreach t in array admin loop
    execute format('create policy %I on public.%I for insert to authenticated with check ((select public.has_role(''{owner,admin}'')))', t||'_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select public.has_role(''{owner,admin}''))) with check ((select public.has_role(''{owner,admin}'')))', t||'_upd', t);
  end loop;
  -- Borrado duro: solo owner (clientes/solicitudes usan soft delete con deleted_at)
  foreach t in array ventas || admin loop
    execute format('create policy %I on public.%I for delete to authenticated using ((select public.has_role(''{owner}'')))', t||'_del', t);
  end loop;
end $$;

-- staff: el equipo ve el equipo; solo owner gestiona
create policy staff_sel on public.staff for select to authenticated using ((select public.is_staff()));
create policy staff_ins on public.staff for insert to authenticated with check ((select public.has_role('{owner}')));
create policy staff_upd on public.staff for update to authenticated using ((select public.has_role('{owner}'))) with check ((select public.has_role('{owner}')));
create policy staff_del on public.staff for delete to authenticated using ((select public.has_role('{owner}')));

-- audit_log: lectura owner/admin; sin insert/update/delete directos (solo triggers security definer)
create policy audit_log_sel on public.audit_log for select to authenticated using ((select public.has_role('{owner,admin}')));
revoke insert, update, delete, truncate on public.audit_log from authenticated;

-- requests: la web (anon) solo INSERTA solicitudes nuevas; nunca lee ni modifica
create policy requests_anon_ins on public.requests for insert to anon with check (
  channel <> 'manual' and stage = 'nuevo' and client_id is null and owner is null and deleted_at is null and lost_reason is null
  and pg_column_size(payload) < 16384);

-- ── Vista de catálogo: security_invoker (respeta RLS); sin acceso anon por ahora (la web lee site.ts hasta fase 5) ──
drop view if exists public.public_catalog;
create view public.public_catalog with (security_invoker = true) as
  select p.slug, p.name, p.category, p.tag, p.features, p.featured, p.sort, p.is_from, v.setup, v.launch_monthly, v.launch_months, v.regular_monthly
  from public.pack_catalog p
  join lateral (select pv.* from public.price_versions pv where pv.pack_id = p.id and pv.valid_from <= now() and (pv.valid_to is null or pv.valid_to > now()) order by pv.valid_from desc limit 1) v on true
  where p.visible;
revoke all on public.public_catalog from anon;

-- Vista de próximos cobros (para el panel)
create view public.v_billing_calendar with (security_invoker = true) as
  select c.id, c.due_date, c.status, c.kind, c.concept, c.amount, s.id as subscription_id, cl.id as client_id, cl.name as client_name, cl.company
  from public.charges c join public.subscriptions s on s.id = c.subscription_id join public.clients cl on cl.id = s.client_id
  where c.status not in ('pagado','anulado');
revoke all on public.v_billing_calendar from anon;

commit;
