import { connection } from 'next/server';
import { Suspense } from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import AdminShell from '../Shell';
import MfaEnroll from '@/components/admin/MfaEnroll';
import MfaRemove from '@/components/admin/MfaRemove';
import { authMode } from '@/lib/supabase/env';
import { supabaseUser } from '@/lib/supabase/server';
import { mfaEnforced } from '@/lib/admin/auth';

export const metadata = { title: 'Seguridad' };
const fmt = (s: string) => new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', dateStyle: 'medium' }).format(new Date(s));

async function Body() {
  await connection();
  if (authMode() !== 'supabase') {
    return <div className="adm-card form-card"><h2>Verificación en dos pasos</h2><p className="muted">Disponible solo con cuentas del equipo (Supabase Auth). Este entorno usa la contraseña de respaldo.</p></div>;
  }
  const sb = await supabaseUser();
  const { data } = await sb.auth.mfa.listFactors();
  const factors = (data?.totp || []).filter((f) => f.status === 'verified');
  const enforced = mfaEnforced();
  return (
    <div className="adm-card form-card mfa-card">
      <h2>Verificación en dos pasos</h2>
      <p className="muted">Además de tu contraseña, al entrar se pedirá un código de 6 dígitos de una app en tu teléfono.</p>
      <div className={`mfa-state ${factors.length ? 'on' : 'off'}`} data-testid="mfa-state">
        {factors.length ? <ShieldCheck size={18} aria-hidden="true" /> : <ShieldAlert size={18} aria-hidden="true" />}
        <div><b>{factors.length ? 'Activada en tu cuenta' : 'Aún no activada en tu cuenta'}</b>
          <span>{enforced ? 'Obligatoria para todo el equipo.' : 'Todavía no es obligatoria para el panel: se activará cuando el equipo haya registrado su app.'}</span></div>
      </div>
      {factors.length > 0 && (
        <ul className="mfa-list" aria-label="Apps registradas">
          {factors.map((f) => <li key={f.id}><span><b>{f.friendly_name || 'App de autenticación'}</b><small>Registrada el {fmt(f.created_at)}</small></span><MfaRemove id={f.id} name={f.friendly_name || 'App de autenticación'} /></li>)}
        </ul>
      )}
      <MfaEnroll hasFactor={factors.length > 0} />
    </div>
  );
}

export default function Seguridad() {
  return (
    <AdminShell title="Seguridad" description="Protege tu cuenta del panel.">
      <Suspense fallback={<div className="adm-card form-card" style={{ height: 240 }} aria-busy="true" />}><Body /></Suspense>
    </AdminShell>
  );
}
