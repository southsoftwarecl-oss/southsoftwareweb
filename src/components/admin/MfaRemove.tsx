'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { mfaRemove } from '@/app/admin/mfa-actions';

export default function MfaRemove({ id, name }: { id: string; name: string }) {
  const [err, setErr] = useState<string | null>(null);
  const [pending, go] = useTransition();
  const router = useRouter();
  return (
    <span className="mfa-rm">
      <button type="button" className="btn-a ghost sm" disabled={pending} aria-label={`Quitar ${name}`}
        onClick={() => { if (!confirm(`¿Quitar "${name}"? Ya no podrás usar esa app para entrar.`)) return; go(async () => { const r = await mfaRemove(id); if (r?.error) setErr(r.error); else router.refresh(); }); }}>Quitar</button>
      {err && <span className="adm-err sm" role="alert">{err}</span>}
    </span>
  );
}
