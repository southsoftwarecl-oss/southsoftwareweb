-- Ejecutar ANTES de 0001: debe devolver 0 filas. Si devuelve tablas/tipos, NO aplicar la migración y avisar.
select 'table' as kind, table_name as name from information_schema.tables where table_schema = 'public'
union all
select 'type', t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typtype = 'e';
