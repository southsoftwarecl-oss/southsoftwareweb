'use client';
/**
 * Formulario "brief" (mismo diseño del preview) conectado a /api/contact.
 * Estados animados: error por campo (shake), cargando (spinner), éxito.
 * - Validación inmediata en el cliente + validación real en el servidor (zod).
 * - Honeypot anti-spam ("website") y Cloudflare Turnstile opcional
 *   (se activa solo si existe NEXT_PUBLIC_TURNSTILE_SITE_KEY).
 * - Sin claves: el servidor responde en modo demo (no envía correo).
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { BUDGETS, PROJECT_TYPES } from '@/content/site';
import { contactSchema } from '@/lib/contact-schema';

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
  const [demo, setDemo] = useState(false);
  const shake = useAnimationControls();
  const tsRef = useRef<HTMLDivElement>(null);
  const tsToken = useRef('');
  const formRef = useRef<HTMLFormElement>(null);

  // Next mantiene las páginas visitadas ocultas (Activity): al ocultarse,
  // se limpia el formulario para no mostrar un éxito/errores antiguos al volver.
  useLayoutEffect(() => () => {
    if (formRef.current) formRef.current.reset();
    setStatus('idle'); setErrors({}); setServerMsg('');
  }, []);

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
    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Partial<Record<Field, string>> = {};
      for (const iss of parsed.error.issues) { const k = iss.path[0] as Field; if (!errs[k]) errs[k] = iss.message; }
      setErrors(errs);
      shake.start({ x: [-6, 6, -4, 3, 0], transition: { duration: 0.5 } });
      return;
    }
    setErrors({}); setStatus('loading'); setServerMsg('');
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; demo?: boolean; error?: string; fields?: Partial<Record<Field, string>> };
      if (res.ok && data.ok) { setDemo(!!data.demo); setStatus('done'); return; }
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
    <motion.form ref={formRef} className={`brief${status === 'loading' ? ' loading' : ''}${status === 'done' ? ' done' : ''}`} noValidate onSubmit={onSubmit} animate={shake} data-reveal aria-label="Formulario de contacto">
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
      <AnimatePresence>
        {status === 'done' && (
          <motion.div key="ok" className="ok" role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
            <span>¡Listo! Te contactamos dentro de 24 horas hábiles.{demo && <small className="demo"> Modo demo: el mensaje fue validado pero no enviado (falta configurar RESEND_API_KEY).</small>}</span>
          </motion.div>
        )}
        {status === 'error' && serverMsg && (
          <motion.div key="err" className="ko" role="alert" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{serverMsg}</motion.div>
        )}
      </AnimatePresence>
      <p className="note">Respondemos dentro de 24 horas hábiles. Usamos tus datos solo para responder tu solicitud.</p>
    </motion.form>
  );
}
