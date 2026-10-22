'use client';
import { useActionState } from 'react';
import { login } from '../actions';

export default function LoginForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action}>
      <div aria-live="polite">{state?.error && <p className="adm-err">{state.error}</p>}</div>
      <div className="adm-field">
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required disabled={!enabled} />
      </div>
      <button className="adm-btn" type="submit" disabled={pending || !enabled}>{pending ? 'Entrando…' : 'Entrar'}</button>
    </form>
  );
}
