'use client';
import { useActionState } from 'react';
import { mfaChallenge } from '../mfa-actions';
import { CodeField } from '@/components/admin/MfaEnroll';

export function ChallengeForm() {
  const [s, action, pending] = useActionState(mfaChallenge, undefined);
  return (
    <form action={action}>
      <div aria-live="polite">{s?.error && <p className="adm-err">{s.error}</p>}</div>
      <CodeField />
      <button className="btn-a primary lg block" type="submit" disabled={pending}>{pending ? 'Verificando…' : 'Entrar'}</button>
    </form>
  );
}
