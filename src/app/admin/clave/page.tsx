import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { authMode } from '@/lib/supabase/env';
import { supabaseUser } from '@/lib/supabase/server';
import { PasswordForm } from '../AuthForms';
import AuthLayout from '@/components/admin/AuthLayout';

export const metadata = { title: 'Crear contraseña' };

async function Body({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  await connection();
  if (authMode() !== 'supabase') redirect('/admin/login');
  const { data: { user } } = await (await supabaseUser()).auth.getUser();
  if (!user) redirect('/admin/login?e=enlace');
  const nuevo = (await searchParams).nuevo === '1';
  return (
    <>
      <h1>{nuevo ? 'Bienvenido al panel' : 'Nueva contraseña'}</h1>
      <p className="sub">{nuevo ? 'Crea tu contraseña para ' : 'Cuenta: '}<b>{user.email}</b></p>
      <PasswordForm />
    </>
  );
}

export default function Clave(props: { searchParams: Promise<{ nuevo?: string }> }) {
  return <AuthLayout><Suspense fallback={null}><Body {...props} /></Suspense></AuthLayout>;
}
