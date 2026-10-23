import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import AuthLayout from '@/components/admin/AuthLayout';
import MfaEnroll from '@/components/admin/MfaEnroll';
import { adminStatus } from '@/lib/admin/auth';
import { authMode } from '@/lib/supabase/env';
import { ChallengeForm } from './Challenge';

export const metadata = { title: 'Verificación en dos pasos' };

async function Body() {
  await connection();
  if (authMode() !== 'supabase') redirect('/admin/login');
  const st = await adminStatus();
  if (st.me) redirect('/admin');
  if (!st.needMfa) redirect('/admin/login?e=acceso');
  if (!st.hasFactor) {
    // Exigencia activa pero sin factor: se enrola aquí en vez de quedar bloqueado.
    return (<><h1>Activa la verificación en dos pasos</h1><p className="sub">El panel ahora la exige. Registra tu app de autenticación para continuar.</p><MfaEnroll hasFactor={false} next="/admin" /></>);
  }
  return (<><h1>Verificación en dos pasos</h1><p className="sub">Escribe el código de 6 dígitos de tu app de autenticación.</p><ChallengeForm /></>);
}

export default function Mfa() {
  return <AuthLayout><Suspense fallback={null}><Body /></Suspense></AuthLayout>;
}
