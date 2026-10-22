-- 0003 · Helpers de rol fuera del esquema expuesto por la API (advisor: authenticated_security_definer_function_executable).
-- Las políticas usan private.is_staff()/private.has_role(); el panel lee su propio rol desde public.staff.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_staff() returns boolean
  language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.staff s where s.user_id = (select auth.uid())) $$;
create or replace function private.has_role(roles public.staff_role[]) returns boolean
  language sql stable security definer set search_path = ''
as $$ select coalesce((select s.role = any(roles) from public.staff s where s.user_id = (select auth.uid())), false) $$;
revoke all on function private.is_staff(), private.has_role(public.staff_role[]) from public, anon;
grant execute on function private.is_staff(), private.has_role(public.staff_role[]) to authenticated;

-- Reescribir políticas para usar private.*
do $$ declare r record; q text; w text; begin
  for r in select tablename, policyname, cmd, roles, qual, with_check from pg_policies where schemaname = 'public' and (qual like '%is_staff%' or qual like '%has_role%' or with_check like '%has_role%') loop
    q := replace(replace(r.qual, 'public.is_staff()', 'private.is_staff()'), 'public.has_role(', 'private.has_role(');
    q := replace(replace(q, ' is_staff()', ' private.is_staff()'), ' has_role(', ' private.has_role(');
    w := replace(replace(r.with_check, 'public.has_role(', 'private.has_role('), ' has_role(', ' private.has_role(');
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
    execute format('create policy %I on public.%I for %s to authenticated %s %s', r.policyname, r.tablename, r.cmd,
      case when q is not null then 'using (' || q || ')' else '' end,
      case when w is not null then 'with check (' || w || ')' else '' end);
  end loop; end $$;

drop function public.is_staff();
drop function public.has_role(public.staff_role[]);
drop function public.staff_role();

-- Índice redundante con el parcial charges_next_due_idx + charges_subscription_idx
drop index if exists public.charges_status_due_date_idx;
commit;
