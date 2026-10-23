'use client';
import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Check, Circle } from 'lucide-react';

export function EmailField({ label = 'Correo' }: { label?: string }) {
  return (
    <div className="adm-field"><label htmlFor="email">{label}</label>
      <div className="inp-ic"><Mail size={16} aria-hidden="true" /><input id="email" name="email" type="email" autoComplete="username" required maxLength={160} placeholder="nombre@southsoftware.cl" /></div></div>
  );
}

export function PasswordField({ id, label, autoComplete, disabled, onValue, describedBy, minLength, maxLength }: { id: string; label: string; autoComplete: string; disabled?: boolean; onValue?: (v: string) => void; describedBy?: string; minLength?: number; maxLength?: number }) {
  const [show, setShow] = useState(false);
  return (
    <div className="adm-field"><label htmlFor={id}>{label}</label>
      <div className="inp-ic"><Lock size={16} aria-hidden="true" />
        <input id={id} name={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} required disabled={disabled} minLength={minLength} maxLength={maxLength} aria-describedby={describedBy} onChange={(e) => onValue?.(e.target.value)} style={{ paddingRight: 36 }} />
        <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar lo escrito' : 'Mostrar lo escrito'} aria-pressed={show} disabled={disabled}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
      </div></div>
  );
}

/** Requisitos en vivo (mismas reglas que valida el servidor: 10+ caracteres, letras y números). */
export function PasswordRules({ value, confirm }: { value: string; confirm: string }) {
  const rules = [
    { ok: value.length >= 10, t: 'Mínimo 10 caracteres' },
    { ok: /[a-zA-Z]/.test(value) && /\d/.test(value), t: 'Incluye letras y números' },
    { ok: !!confirm && confirm === value, t: 'Ambas coinciden' },
  ];
  const score = rules.slice(0, 2).filter((r) => r.ok).length + (value.length >= 14 ? 1 : 0);
  const color = ['var(--bad)', 'var(--warn)', 'var(--ok)', 'var(--ok)'][score];
  return (
    <>
      <div className="meter" aria-hidden="true"><i style={{ width: `${(score / 3) * 100}%`, background: color }} /></div>
      <ul className="pw-req" id="pw-hint">
        {rules.map((r) => <li key={r.t} className={r.ok ? 'ok' : ''}>{r.ok ? <Check size={13} aria-hidden="true" /> : <Circle size={13} aria-hidden="true" />}{r.t}</li>)}
      </ul>
    </>
  );
}
