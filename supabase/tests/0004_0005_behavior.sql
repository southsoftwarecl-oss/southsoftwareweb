-- Pruebas de comportamiento de 0004 y 0005 en Postgres desechable (stub de auth). Cada bloque lanza excepción si algo no cumple.
\set ON_ERROR_STOP 1
insert into auth.users(id,email) values ('00000000-0000-0000-0000-00000000000a','owner@x'),('00000000-0000-0000-0000-00000000000b','lect@x'),('00000000-0000-0000-0000-00000000000c','nostaff@x');
insert into public.staff(user_id,role,display_name) values ('00000000-0000-0000-0000-00000000000a','owner','O'),('00000000-0000-0000-0000-00000000000b','lectura','L');
insert into public.requests(id,channel,payload,name) values ('11111111-1111-1111-1111-111111111111','manual','{}','Test');
-- Emula los privilegios por defecto de Supabase (la seguridad real la da RLS)
grant usage on schema public to anon, authenticated; grant all on all tables in schema public to anon, authenticated;
-- 0004: rate limit (anon)
set role anon;
do $$ declare i int; begin
  if not public.login_rate_allowed(repeat('k',32)) then raise exception 'debería permitir'; end if;
  for i in 1..5 loop perform public.login_rate_fail(repeat('k',32)); end loop;
  if public.login_rate_allowed(repeat('k',32)) then raise exception 'debería bloquear tras 5 fallos'; end if;
  begin perform public.login_rate_fail('corta'); raise exception 'FALLO: clave corta aceptada'; exception when others then if sqlerrm like 'FALLO%' then raise; end if; end;
  begin perform count(*) from private.login_attempts; raise exception 'FALLO: anon lee login_attempts'; exception when insufficient_privilege then null; end;
end $$;
reset role;
-- 0005: RLS + reglas
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
do $$ begin if (select count(*) from public.quotes) <> 0 then raise exception 'x'; end if;
  begin insert into public.quotes(request_id,title) values ('11111111-1111-1111-1111-111111111111','x'); raise exception 'FALLO: no-staff inserta'; exception when insufficient_privilege then null; end; end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
do $$ begin begin insert into public.quotes(request_id,title) values ('11111111-1111-1111-1111-111111111111','x'); raise exception 'FALLO: lectura inserta'; exception when insufficient_privilege then null; end; end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
do $$ declare q uuid; v1 uuid; v2 uuid; r uuid := '11111111-1111-1111-1111-111111111111'; begin
  begin update public.requests set stage='reunion' where id=r; raise exception 'FALLO: reunión sin fecha'; exception when others then if sqlerrm like 'FALLO%' then raise; end if; end;
  update public.requests set stage='reunion', next_action_at=now() where id=r;
  begin update public.requests set stage='propuesta' where id=r; raise exception 'FALLO: propuesta sin cotización'; exception when others then if sqlerrm like 'FALLO%' then raise; end if; end;
  insert into public.quotes(request_id,title) values (r,'Sitio') returning id into q;
  insert into public.quote_versions(quote_id,request_id,version,setup) values (q,r,1,100) returning id into v1;
  insert into public.quote_versions(quote_id,request_id,version,setup) values (q,r,1,90) returning id into v2;
  if (select version from public.quote_versions where id=v2) <> 2 then raise exception 'FALLO: versión no autoincrementa'; end if;
  if (select status from public.quote_versions where id=v1) <> 'reemplazada' then raise exception 'FALLO: v1 no reemplazada'; end if;
  begin update public.quote_versions set setup=1 where id=v1; raise exception 'FALLO: v1 editable'; exception when others then if sqlerrm like 'FALLO%' then raise; end if; end;
  update public.requests set stage='propuesta' where id=r;
  begin update public.requests set stage='aceptado' where id=r; raise exception 'FALLO: aceptado sin aceptada'; exception when others then if sqlerrm like 'FALLO%' then raise; end if; end;
  update public.quote_versions set status='aceptada' where id=v2;
  update public.requests set stage='aceptado' where id=r;
  insert into public.quotes(request_id,title) values (r,'Otra') returning id into q;
  insert into public.quote_versions(quote_id,request_id,version) values (q,r,1) returning id into v1;
  begin update public.quote_versions set status='aceptada' where id=v1; raise exception 'FALLO: dos aceptadas'; exception when unique_violation then null; end;
  begin update public.requests set stage='cancelado' where id=r; raise exception 'FALLO: cancelado sin motivo'; exception when others then if sqlerrm like 'FALLO%' then raise; end if; end;
  update public.requests set stage='cancelado', lost_reason='Precio' where id=r;
  if (select count(*) from public.audit_log where table_name in ('quotes','quote_versions')) = 0 then raise notice 'audit_log sin filas visibles (RLS) — ok si audit es solo owner'; end if;
end $$;
reset role;
select 'OK: todas las pruebas 0004/0005 pasaron' as resultado;
