#!/usr/bin/env bash
# Prueba 0001–0005 en un Postgres 17 DESECHABLE local (nunca contra producción).
set -euo pipefail
D=$(mktemp -d); B=/usr/lib/postgresql/17/bin; H=$(dirname "$0")
$B/initdb -D $D/data -A trust -U postgres >/dev/null
$B/pg_ctl -D $D/data -o "-p 5499 -k $D -c listen_addresses=''" -l $D/log start >/dev/null
trap '$B/pg_ctl -D $D/data stop -m fast >/dev/null; rm -rf $D' EXIT
P="psql -h $D -p 5499 -U postgres -v ON_ERROR_STOP=1 -q"
$P -c "create database t"; $P -d t -f $H/supabase_stub.sql
for f in $H/../migrations/*.sql; do echo "aplicando $(basename $f)"; $P -d t -f $f >/dev/null; done
$P -d t -f $H/0004_0005_behavior.sql
