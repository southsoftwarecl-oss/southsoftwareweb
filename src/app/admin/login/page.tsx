import { connection } from 'next/server';
import { Suspense } from 'react';
import Link from 'next/link';
import { adminConfigured } from '@/lib/admin/session';
import { authMode } from '@/lib/supabase/env';
import LoginForm from './LoginForm';

export const metadata = { title: 'Entrar' };

async function Body({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  await connection();
  const { e } = await searchParams;
  const mode = authMode();
  const enabled = mode === 'supabase' || adminConfigured();
  return (
    <>
      {!enabled && <p className="adm-err" role="alert">Panel desactivado: falta configurar el acceso en el servidor.</p>}
      {e === 'enlace' && <p className="adm-err" role="alert">El enlace no es válido o expiró. Pide uno nuevo.</p>}
      <LoginForm enabled={enabled} mode={mode} />
      {mode === 'supabase' && <p className="adm-note"><Link href="/admin/recuperar">¿Olvidaste tu contraseña?</Link></p>}
    </>
  );
}

export default function LoginPage(props: { searchParams: Promise<{ e?: string }> }) {
  return (
    <div className="adm-login">
      <div className="adm-card">
        <h1>Panel South Software</h1>
        <Suspense fallback={null}><Body {...props} /></Suspense>
      </div>
    </div>
  );
}
