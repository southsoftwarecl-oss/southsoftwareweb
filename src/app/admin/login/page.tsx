import { connection } from 'next/server';
import { Suspense } from 'react';
import { adminConfigured } from '@/lib/admin/session';
import LoginForm from './LoginForm';

export const metadata = { title: 'Entrar' };

async function Body() {
  await connection();
  const enabled = adminConfigured();
  return (
    <>
      {!enabled && <p className="adm-err" role="alert">Panel desactivado: falta configurar el acceso en el servidor.</p>}
      <LoginForm enabled={enabled} />
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="adm-login">
      <div className="adm-card">
        <h1>Panel South Software</h1>
        <Suspense fallback={null}><Body /></Suspense>
        <p className="adm-note">Acceso provisorio de fase 1. En la versión final: correo + contraseña y verificación en dos pasos.</p>
      </div>
    </div>
  );
}
