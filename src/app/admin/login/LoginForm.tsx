'use client';
import { useActionState } from 'react';
import { login } from '../actions';

export default function LoginForm({ enabled, mode }: { enabled: boolean; mode: 'supabase' | 'password' }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action}>
      <div aria-live="polite">{state?.error && <p className="adm-err">{state.error}</p>}</div>
      {mode === 'supabase' && (
        <div className="adm-field">
          <label htmlFor="email">Correo</label>
          <input id="email" name="email" type="email" autoComplete="username" required maxLength={160} />
        </div>
      )}
      <div className="adm-field">
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required disabled={!enabled} />
      </div>
      <button className="adm-btn" type="submit" disabled={pending || !enabled}>{pending ? 'Entrando…' : 'Entrar'}</button>
    </form>
  );
}
