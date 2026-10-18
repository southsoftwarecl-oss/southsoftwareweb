'use client';
/**
 * Formulario "brief" (mismo diseño del preview) conectado a /api/contact.
 * Estados animados: error por campo (shake), cargando (spinner), éxito.
 * - Validación inmediata en el cliente (lib/contact-rules) + validación real en el servidor (zod).
 * - Honeypot anti-spam ("website") y Cloudflare Turnstile opcional
 *   (se activa solo si existe NEXT_PUBLIC_TURNSTILE_SITE_KEY).
 * - Tiempo mínimo antes de enviar (CONTACT_MIN_MS): si el envío es muy rápido, se espera lo que falta.
 * - Si el servidor no puede enviar (sin RESEND_API_KEY o Resend falla) se muestra el error con WhatsApp/email.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { BUDGETS, PROJECT_TYPES, WA_URL } from '@/content/site';
import { CONTACT_MIN_MS, validateContact } from '@/lib/contact-rules';
import { trackLead } from '@/lib/analytics';

// Mensajes animados (Framer Motion) cargados solo cuando hacen falta
const FormFeedback = dynamic(() => import('./FormFeedback'), { ssr: false });

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
type Field = 'nombre' | 'empresa' | 'email' | 'tipo' | 'presupuesto' | 'mensaje';
type Status = 'idle' | 'loading' | 'done' | 'error';

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void } }
}

export default function ContactForm() {
  const uid = useId();
  const id = (f: string) => `${uid}-${f}`;
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverMsg, setServerMsg] = useState('');
  const shownAt = useRef(0);
  const tsRef = useRef<HTMLDivElement>(null);
  const tsToken = useRef('');
  const formRef = useRef<HTMLFormElement>(null);

  // Next mantiene las páginas visitadas ocultas (Activity): al ocultarse,
  // se limpia el formulario para no mostrar un éxito/errores antiguos al volver.
  useLayoutEffect(() => () => {
    if (formRef.current) formRef.current.reset();
    setStatus('idle'); setErrors({}); setServerMsg('');
  }, []);

  // Momento en que se mostró el formulario (para el tiempo mínimo de envío)
  useEffect(() => { shownAt.current = performance.now(); }, []);

  // Turnstile (opcional)
  useEffect(() => {
    if (!SITE_KEY || !tsRef.current) return;
    const render = () => window.turnstile && tsRef.current && window.turnstile.render(tsRef.current, {
      sitekey: SITE_KEY, theme: 'dark', language: 'es', callback: (t: string) => { tsToken.current = t; },
    });
    if (window.turnstile) { render(); return; }
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true; s.onload = render; document.head.appendChild(s);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'loading') return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      nombre: String(fd.get('nombre') || ''), empresa: String(fd.get('empresa') || ''), email: String(fd.get('email') || ''),
      tipo: String(fd.get('tipo') || ''), presupuesto: String(fd.get('presupuesto') || ''), mensaje: String(fd.get('mensaje') || ''),
      website: String(fd.get('website') || ''), turnstileToken: tsToken.current,
    };
    const errs = validateContact(payload);
    if (Object.keys(errs).length) {
      setErrors(errs);
      // micro-interacción de error (Web Animations API: sin cargar librerías)
      formRef.current?.animate({ translate: ['0', '-6px', '6px', '-4px', '3px', '0'] }, { duration: 500, easing: 'ease-out' });
      return;
    }
    setErrors({}); setStatus('loading'); setServerMsg('');
    const wait = CONTACT_MIN_MS + 200 - (performance.now() - shownAt.current);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, t: Math.round(performance.now() - shownAt.current) }) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Partial<Record<Field, string>> };
      if (res.ok && data.ok) { setStatus('done'); trackLead('home'); return; }
      if (data.fields) setErrors(data.fields);
      setServerMsg(data.error || 'No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos por WhatsApp.');
      setStatus('error');
      if (SITE_KEY) window.turnstile?.reset();
    } catch {
      setServerMsg('Sin conexión. Intenta de nuevo o escríbenos por WhatsApp.'); setStatus('error');
    }
  }

  const f = (k: Field) => `f${errors[k] ? ' err' : ''}`;
  const errNode = (k: Field) => errors[k] ? <span className="ferr" id={id(k) + '-e'} role="alert">{errors[k]}</span> : null;
  const aria = (k: Field) => ({ 'aria-invalid': !!errors[k] || undefined, 'aria-describedby': errors[k] ? id(k) + '-e' : undefined });

  return (
    <form ref={formRef} className={`brief${status === 'loading' ? ' loading' : ''}${status === 'done' ? ' done' : ''}`} noValidate onSubmit={onSubmit} data-reveal aria-label="Formulario de contacto">
      <div className={f('nombre')}><input id={id('n')} name="nombre" required autoComplete="name" placeholder=" " maxLength={80} {...aria('nombre')} /><label htmlFor={id('n')}>Nombre</label>{errNode('nombre')}</div>
      <div className={f('empresa')}><input id={id('e')} name="empresa" autoComplete="organization" placeholder=" " maxLength={120} /><label htmlFor={id('e')}>Empresa</label></div>
      <div className={`${f('email')} full`}><input id={id('m')} name="email" type="email" required autoComplete="email" placeholder=" " maxLength={160} {...aria('email')} /><label htmlFor={id('m')}>Email</label>{errNode('email')}</div>
      <div className={f('tipo')}>
        <select id={id('t')} name="tipo" required defaultValue="" {...aria('tipo')}><option value="" disabled hidden></option>{PROJECT_TYPES.map((x) => <option key={x}>{x}</option>)}</select>
        <label htmlFor={id('t')}>Tipo de proyecto</label><i className="chev" />{errNode('tipo')}
      </div>
      <div className={f('presupuesto')}>
        <select id={id('p')} name="presupuesto" defaultValue=""><option value="" disabled hidden></option>{BUDGETS.map((x) => <option key={x}>{x}</option>)}</select>
        <label htmlFor={id('p')}>Presupuesto</label><i className="chev" />
      </div>
      <div className={`${f('mensaje')} full`}><textarea id={id('x')} name="mensaje" placeholder=" " maxLength={4000} /><label htmlFor={id('x')}>Cuéntanos tu idea</label></div>
      {/* honeypot: invisible para personas */}
      <div className="hp" aria-hidden="true"><label htmlFor={id('w')}>Sitio web</label><input id={id('w')} name="website" tabIndex={-1} autoComplete="off" /></div>
      {SITE_KEY && <div className="full ts" ref={tsRef} />}
      <button className="btn btn-primary submit" type="submit" disabled={status === 'loading' || status === 'done'}>
        <span className="t"><span>Enviar brief</span><span aria-hidden="true">Enviar brief</span></span><i className="spin" aria-hidden="true" />
        <span className="sr-only" aria-live="polite">{status === 'loading' ? 'Enviando…' : ''}</span>
      </button>
      {(status === 'done' || status === 'error') && <FormFeedback status={status} serverMsg={serverMsg} waHref={WA_URL} />}
      <p className="note">Respondemos dentro de 24 horas hábiles. Usamos tus datos solo para responder tu solicitud.</p>
    </form>
  );
}
