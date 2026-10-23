'use client';
import { useActionState } from 'react';
import { login } from '../actions';
import { EmailField, PasswordField } from '@/components/admin/Fields';

export default function LoginForm({ enabled, mode }: { enabled: boolean; mode: 'supabase' | 'password' }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action}>
      <div aria-live="polite">{state?.error && <p className="adm-err">{state.error}</p>}</div>
      {mode === 'supabase' && <EmailField />}
      <PasswordField id="password" label="Contraseña" autoComplete="current-password" disabled={!enabled} />
      <button className="btn-a primary lg block" type="submit" disabled={pending || !enabled}>{pending ? 'Entrando…' : 'Entrar'}</button>
    </form>
  );
}
