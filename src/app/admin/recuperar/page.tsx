import Link from 'next/link';
import { ResetForm } from '../AuthForms';
export const metadata = { title: 'Recuperar contraseña' };
export default function Recuperar() {
  return (
    <div className="adm-login"><div className="adm-card">
      <h1>Recuperar contraseña</h1>
      <p className="adm-note">Te enviaremos un enlace para crear una nueva.</p>
      <ResetForm />
      <p className="adm-note"><Link href="/admin/login">Volver a entrar</Link></p>
    </div></div>
  );
}
