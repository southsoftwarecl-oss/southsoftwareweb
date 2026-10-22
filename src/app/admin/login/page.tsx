import { connection } from 'next/server';
import { Suspense } from 'react';
import { adminConfigured } from '@/lib/admin/session';
import { authMode } from '@/lib/supabase/env';
import LoginForm from './LoginForm';

export const metadata = { title: 'Entrar' };

async function Body() {
  await connection();
  const mode = authMode();
  const enabled = mode === 'supabase' || adminConfigured();
  return (
    <>
      {!enabled && <p className="adm-err" role="alert">Panel desactivado: falta configurar el acceso en el servidor.</p>}
      <LoginForm enabled={enabled} mode={mode} />
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="adm-login">
      <div className="adm-card">
        <h1>Panel South Software</h1>
        <Suspense fallback={null}><Body /></Suspense>
      </div>
    </div>
  );
}
