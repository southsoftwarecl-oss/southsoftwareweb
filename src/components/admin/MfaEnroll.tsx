'use client';
import { useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Copy, Check } from 'lucide-react';
import { mfaConfirm, mfaStart, type EnrollStart } from '@/app/admin/mfa-actions';

export function CodeField({ label = 'Código de 6 dígitos' }: { label?: string }) {
  return (
    <div className="adm-field"><label htmlFor="code">{label}</label>
      <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required className="mfa-code" placeholder="000 000" /></div>
  );
}

function Confirm({ start, onDone }: { start: EnrollStart; onDone: () => void }) {
  const [s, action, pending] = useActionState(mfaConfirm.bind(null, start.factorId!), undefined);
  const [copied, setCopied] = useState(false);
  if (s?.ok) { onDone(); return null; }
  return (
    <div className="mfa-enroll">
      <ol className="mfa-steps">
        <li>Abre tu app de autenticación (Google Authenticator, 1Password, Authy…) y escanea este código.
          <img className="mfa-qr" src={start.qr} alt="Código QR para registrar la app de autenticación" width={184} height={184} />
          <details><summary>¿No puedes escanear? Ingresa la clave a mano</summary>
            <code className="mfa-secret">{start.secret}</code>
            <button type="button" className="btn-a ghost sm" onClick={() => { navigator.clipboard?.writeText(start.secret || ''); setCopied(true); }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copiada' : 'Copiar clave'}</button>
          </details>
        </li>
        <li>Escribe el código que muestra la app para confirmar.
          <form action={action}>
            <div aria-live="polite">{s?.error && <p className="adm-err">{s.error}</p>}</div>
            <CodeField />
            <button className="btn-a primary" type="submit" disabled={pending}>{pending ? 'Verificando…' : 'Confirmar y activar'}</button>
          </form>
        </li>
      </ol>
    </div>
  );
}

export default function MfaEnroll({ hasFactor, next }: { hasFactor: boolean; next?: string }) {
  const [start, setStart] = useState<EnrollStart | null>(null);
  const [done, setDone] = useState(false);
  const [pending, go] = useTransition();
  const router = useRouter();
  if (done) return <p className="adm-ok" role="status"><ShieldCheck size={16} aria-hidden="true" /> Listo: tu app quedó registrada. Desde ahora puedes usarla como segundo paso.</p>;
  if (start?.factorId) return <Confirm start={start} onDone={() => { setDone(true); if (next) router.push(next); else router.refresh(); }} />;
  return (
    <div>
      {start?.error && <p className="adm-err" role="alert">{start.error}</p>}
      <button type="button" className="btn-a primary" disabled={pending} onClick={() => go(async () => setStart(await mfaStart()))}>
        <ShieldCheck size={16} aria-hidden="true" />{pending ? 'Preparando…' : hasFactor ? 'Agregar otra app' : 'Activar verificación en dos pasos'}
      </button>
    </div>
  );
}
