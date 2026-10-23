import { connection } from 'next/server';
import { Suspense } from 'react';
import Link from 'next/link';
import { adminConfigured } from '@/lib/admin/session';
import { authMode } from '@/lib/supabase/env';
import LoginForm from './LoginForm';
import AuthLayout from '@/components/admin/AuthLayout';

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
      {mode === 'supabase' && <div className="auth-links"><Link href="/admin/recuperar">¿Olvidaste tu contraseña?</Link></div>}
    </>
  );
}

export default function LoginPage(props: { searchParams: Promise<{ e?: string }> }) {
  return (
    <AuthLayout>
      <h1>Panel South Software</h1>
      <p className="sub">Entra con tu cuenta del equipo.</p>
        <Suspense fallback={null}><Body {...props} /></Suspense>
    </AuthLayout>
  );
}
