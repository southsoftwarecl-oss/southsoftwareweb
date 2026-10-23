'use client';
import { useActionState, useState } from 'react';
import { requestReset, setPassword } from './auth-actions';
import { EmailField, PasswordField, PasswordRules } from '@/components/admin/Fields';

export function ResetForm() {
  const [s, action, pending] = useActionState(requestReset, undefined);
  if (s?.ok) return <p className="adm-ok" role="status">{s.ok}</p>;
  return (
    <form action={action}>
      <div aria-live="polite">{s?.error && <p className="adm-err">{s.error}</p>}</div>
      <EmailField />
      <button className="btn-a primary lg block" type="submit" disabled={pending}>{pending ? 'Enviando…' : 'Enviar enlace'}</button>
    </form>
  );
}

export function PasswordForm() {
  const [s, action, pending] = useActionState(setPassword, undefined);
  const [pw, setPw] = useState('');
  const [cf, setCf] = useState('');
  return (
    <form action={action}>
      <div aria-live="polite">{s?.error && <p className="adm-err">{s.error}</p>}</div>
      <PasswordField id="password" label="Nueva contraseña" autoComplete="new-password" minLength={10} maxLength={72} describedBy="pw-hint" onValue={setPw} />
      <PasswordField id="confirm" label="Repite la contraseña" autoComplete="new-password" maxLength={72} onValue={setCf} />
      <PasswordRules value={pw} confirm={cf} />
      <button className="btn-a primary lg block" type="submit" disabled={pending}>{pending ? 'Guardando…' : 'Guardar y entrar'}</button>
    </form>
  );
}
