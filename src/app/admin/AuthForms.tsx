'use client';
import { useActionState } from 'react';
import { requestReset, setPassword } from './auth-actions';

export function ResetForm() {
  const [s, action, pending] = useActionState(requestReset, undefined);
  if (s?.ok) return <p className="adm-ok" role="status">{s.ok}</p>;
  return (
    <form action={action}>
      <div aria-live="polite">{s?.error && <p className="adm-err">{s.error}</p>}</div>
      <div className="adm-field"><label htmlFor="email">Correo</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={160} /></div>
      <button className="adm-btn" type="submit" disabled={pending}>{pending ? 'Enviando…' : 'Enviar enlace'}</button>
    </form>
  );
}

export function PasswordForm() {
  const [s, action, pending] = useActionState(setPassword, undefined);
  return (
    <form action={action}>
      <div aria-live="polite">{s?.error && <p className="adm-err">{s.error}</p>}</div>
      <div className="adm-field"><label htmlFor="password">Nueva contraseña</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={72} aria-describedby="pw-hint" /></div>
      <p id="pw-hint" className="adm-note">Mínimo 10 caracteres, con letras y números.</p>
      <div className="adm-field"><label htmlFor="confirm">Repite la contraseña</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required maxLength={72} /></div>
      <button className="adm-btn" type="submit" disabled={pending}>{pending ? 'Guardando…' : 'Guardar y entrar'}</button>
    </form>
  );
}
