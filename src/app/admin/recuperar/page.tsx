import Link from 'next/link';
import { ResetForm } from '../AuthForms';
import AuthLayout from '@/components/admin/AuthLayout';
export const metadata = { title: 'Recuperar contraseña' };
export default function Recuperar() {
  return (
    <AuthLayout>
      <h1>Recuperar contraseña</h1>
      <p className="sub">Te enviaremos un enlace para crear una nueva. Vence en 24 horas.</p>
      <ResetForm />
      <div className="auth-links"><Link href="/admin/login">← Volver a entrar</Link></div>
    </AuthLayout>
  );
}
