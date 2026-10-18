'use client';
/**
 * /contacto · "brief conversacional": columna izquierda (encabezado + tarjeta "Tu brief")
 * y formulario conectado a /api/contact (mismos campos y valores que antes: la API y zod no cambian).
 * - Tipo de proyecto: radio group de chips (name="tipo") con "gota" de --accent-fill.
 * - Presupuesto: control segmentado (name="presupuesto") con indicador de cromo (Flip).
 * - Packs de referencia según el tipo (precios exactos de PACKS).
 * - Sin JS: los radios son nativos y el formulario cae a mailto (CSP form-action lo permite).
 * El motion (lib/contact-motion.ts) se carga en idle; sin él, los cambios son instantáneos.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BRAND, BUDGETS, PROJECT_TYPES, WHATSAPP_NUMBER } from '@/content/site';
import { TYPE_GUIDE, TYPE_ICON, packsFor, type Budget, type ProjectType } from '@/content/contacto';
import { validateContact } from '@/lib/contact-rules';
import { AIcon } from '@/components/ui';
import BriefCard, { briefText, type BriefData } from './BriefCard';

const FormFeedback = dynamic(() => import('../FormFeedback'), { ssr: false });

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
type Field = 'nombre' | 'empresa' | 'email' | 'tipo' | 'presupuesto' | 'mensaje';
type Status = 'idle' | 'loading' | 'sealing' | 'done' | 'error';
type Motion = typeof import('@/lib/contact-motion');

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void } }
}

const EMPTY: BriefData = { nombre: '', empresa: '', tipo: '', presupuesto: '', mensaje: '' };
let motionP: Promise<Motion> | null = null;
const loadMotion = () => (motionP ??= import('@/lib/contact-motion'));

export default function BriefStudio({ head }: { head: ReactNode }) {
  const uid = useId();
  const id = (f: string) => `${uid}-${f}`;
  const [d, setD] = useState<BriefData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverMsg, setServerMsg] = useState('');
  const [demo, setDemo] = useState(false);
  const [summary, setSummary] = useState('');
  const [mobOpen, setMobOpen] = useState(false);
  const [mo, setMo] = useState<Motion | null>(null);
  const tsRef = useRef<HTMLDivElement>(null);
  const tsToken = useRef('');
  const formRef = useRef<HTMLFormElement>(null);
  const deskCard = useRef<HTMLDivElement>(null);
  const mobCard = useRef<HTMLDivElement>(null);
  const tap = useRef<{ x: number; y: number } | null>(null);
  const budState = useRef<ReturnType<Motion['flipState']> | null>(null);
  const indRef = useRef<HTMLElement>(null);

  // Motion en idle (≤ 15 KB gzip): gota, Flip, entradas, sello.
  useEffect(() => {
    let alive = true;
    type RIC = (cb: () => void, o?: { timeout: number }) => number;
    const ric = (window as Window & { requestIdleCallback?: RIC }).requestIdleCallback;
    const go = () => loadMotion().then((m) => { if (alive) setMo(m); });
    if (ric) ric(go, { timeout: 2500 }); else window.setTimeout(go, 1200);
    return () => { alive = false; };
  }, []);

  // Next mantiene las páginas visitadas ocultas (Activity): al ocultarse, se limpia todo.
  useLayoutEffect(() => () => {
    formRef.current?.reset();
    setD(EMPTY); setStatus('idle'); setErrors({}); setServerMsg(''); setSummary('');
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

  const set = (k: keyof BriefData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.currentTarget.value;
    setD((p) => ({ ...p, [k]: v }));
  };

  function pickType(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const t = input.value as ProjectType;
    setD((p) => ({ ...p, tipo: t }));
    if (errors.tipo) setErrors((x) => ({ ...x, tipo: undefined }));
    const fill = input.parentElement?.querySelector<HTMLElement>('.fill');
    if (fill && mo) {
      const r = fill.getBoundingClientRect();
      const p = tap.current ?? { x: r.width / 2, y: r.height / 2 };
      mo.drop(fill, p.x, p.y);
    }
    tap.current = null;
  }
  const onChipDown = (e: React.PointerEvent<HTMLLabelElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    tap.current = { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function pickBudget(e: React.ChangeEvent<HTMLInputElement>) {
    budState.current = mo ? mo.flipState('[data-flip-id="bud-ind"]') : null;
    const v = e.currentTarget.value as Budget;
    setD((p) => ({ ...p, presupuesto: v }));
  }
  useLayoutEffect(() => {
    if (!d.presupuesto || !mo || !indRef.current) return;
    if (budState.current) mo.flipFrom(budState.current, indRef.current);
    budState.current = null;
  }, [d.presupuesto, mo]);

  const enter = useCallback((el: Element) => mo?.enter(el), [mo]);

  function shakeErrors() {
    const rails = Array.from(formRef.current?.querySelectorAll<HTMLElement>('.f.err input, .f.err textarea, .fset.err .chips') ?? []);
    if (mo) mo.shake(rails);
    else if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
      rails.forEach((r) => r.animate({ translate: ['0', '-4px', '4px', '-4px', '4px', '-4px', '4px', '0'] }, { duration: 300 }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'loading' || status === 'sealing') return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      nombre: String(fd.get('nombre') || ''), empresa: String(fd.get('empresa') || ''), email: String(fd.get('email') || ''),
      tipo: String(fd.get('tipo') || ''), presupuesto: String(fd.get('presupuesto') || ''), mensaje: String(fd.get('mensaje') || ''),
      website: String(fd.get('website') || ''), turnstileToken: tsToken.current,
    };
    const errs = validateContact(payload);
    if (Object.keys(errs).length) {
      setErrors(errs);
      requestAnimationFrame(shakeErrors);
      return;
    }
    setErrors({}); setStatus('loading'); setServerMsg('');
    const m = await loadMotion().catch(() => null);
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; demo?: boolean; error?: string; fields?: Partial<Record<Field, string>> };
      if (res.ok && data.ok) {
        setDemo(!!data.demo);
        const card = [deskCard.current, mobOpen ? mobCard.current : null].find((c) => c && c.offsetParent !== null);
        if (m && card && !m.reduced()) { setStatus('sealing'); await m.seal(card); }
        setSummary(`Resumen de tu brief: ${briefText(d)}`);
        setStatus('done');
        return;
      }
      if (data.fields) { setErrors(data.fields); requestAnimationFrame(shakeErrors); }
      setServerMsg(data.error || 'No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos por WhatsApp.');
      setStatus('error');
      if (SITE_KEY) window.turnstile?.reset();
    } catch {
      setServerMsg('Sin conexión. Intenta de nuevo o escríbenos por WhatsApp.'); setStatus('error');
    }
  }

  // Tras el sello: la tarjeta vuelve a su sitio en estado "Recibido ✓"
  useLayoutEffect(() => {
    if (status !== 'done') return;
    [deskCard.current, mobCard.current].forEach((c) => { if (c && mo) { mo.settle(c); mo.drawCheck(c.querySelector('.bc-ok path')); } });
  }, [status, mo]);

  const f = (k: Field, extra = '') => `f${extra}${errors[k] ? ' err' : ''}`;
  const errNode = (k: Field) => errors[k] ? <span className="ferr" id={id(k) + '-e'} role="alert">{errors[k]}</span> : null;
  const aria = (k: Field) => ({ 'aria-invalid': !!errors[k] || undefined, 'aria-describedby': errors[k] ? id(k) + '-e' : undefined });
  const busy = status === 'loading' || status === 'sealing';
  const sealed = status === 'done';
  const packs = d.tipo ? packsFor(d.tipo) : null;
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(briefText(d))}`;
  const card = (ref: React.Ref<HTMLDivElement>) => <BriefCard d={d} enter={mo ? enter : null} sealed={sealed} demo={demo} cardRef={ref} />;

  return (
    <>
      <div className="l">
        {head}
        <div className="bc-desk">{card(deskCard)}</div>
      </div>
      <form ref={formRef} className={`brief brief-v2${busy ? ' loading' : ''}${sealed ? ' done' : ''}`} noValidate onSubmit={onSubmit}
        action={`mailto:${BRAND.email}`} method="post" encType="text/plain" aria-label="Formulario de contacto">
        <div className={f('nombre')}><input id={id('n')} name="nombre" required autoComplete="name" placeholder=" " maxLength={80} onChange={set('nombre')} {...aria('nombre')} /><label htmlFor={id('n')}>Nombre</label>{errNode('nombre')}</div>
        <div className={f('empresa')}><input id={id('e')} name="empresa" autoComplete="organization" placeholder=" " maxLength={120} onChange={set('empresa')} /><label htmlFor={id('e')}>Empresa</label></div>
        <div className={f('email', ' full')}><input id={id('m')} name="email" type="email" required autoComplete="email" placeholder=" " maxLength={160} {...aria('email')} /><label htmlFor={id('m')}>Email</label>{errNode('email')}</div>

        <fieldset className={`fset full${errors.tipo ? ' err' : ''}`} role="radiogroup" aria-labelledby={id('tl')} aria-required="true" {...aria('tipo')}>
          <legend id={id('tl')} className="flegend">Tipo de proyecto</legend>
          <div className="chips">
            {PROJECT_TYPES.map((t) => (
              <label className="chip" key={t} onPointerDown={onChipDown}>
                <input type="radio" name="tipo" value={t} checked={d.tipo === t} onChange={pickType} required />
                <i className="fill" aria-hidden="true" />
                <AIcon name={TYPE_ICON[t]} /><span>{t}</span>
              </label>
            ))}
          </div>
          {errNode('tipo')}
        </fieldset>

        <fieldset className="fset full" role="radiogroup" aria-labelledby={id('pl')}>
          <legend id={id('pl')} className="flegend">Presupuesto <small>(opcional)</small></legend>
          <div className="seg">
            {BUDGETS.map((b) => (
              <label className="seg-o" key={b}>
                <input type="radio" name="presupuesto" value={b} checked={d.presupuesto === b} onChange={pickBudget} />
                {d.presupuesto === b && <i className="ind" data-flip-id="bud-ind" ref={indRef} aria-hidden="true" />}
                <span className="t">{b}</span>
              </label>
            ))}
          </div>
          <p className="packref">
            <span className="mono">Packs de referencia</span>
            {!packs ? <span className="dim">Elige un tipo para ver packs.</span>
              : packs.length ? packs.map((p) => <span key={p.name} className="pk"><b>{p.name}</b> {p.setup} + {p.monthly}/mes</span>)
              : <span className="pk"><b>Software a medida</b> Cotización</span>}
            <Link href="/packs" className="arw">Ver packs <i aria-hidden="true">→</i></Link>
          </p>
        </fieldset>

        <div className={f('mensaje', ` full${d.tipo ? ' guided' : ''}`)}>
          <textarea id={id('x')} name="mensaje" placeholder={d.tipo ? TYPE_GUIDE[d.tipo] : ' '} maxLength={4000} onChange={set('mensaje')} {...aria('mensaje')} />
          <label htmlFor={id('x')}>Cuéntanos tu idea</label>{errNode('mensaje')}
        </div>
        {/* honeypot: invisible para personas */}
        <div className="hp" aria-hidden="true"><label htmlFor={id('w')}>Sitio web</label><input id={id('w')} name="website" tabIndex={-1} autoComplete="off" /></div>
        {SITE_KEY && <div className="full ts" ref={tsRef} />}

        {/* móvil/tablet: tarjeta del brief colapsable arriba del botón */}
        <div className="bc-mob full">
          <button type="button" className="bc-tog" aria-expanded={mobOpen} aria-controls={id('bc')} onClick={() => setMobOpen((o) => !o)}>
            <span className="mono">Tu brief</span><span className="mono">{mobOpen ? 'Ocultar' : 'Ver'}</span>
          </button>
          <div id={id('bc')} role="region" aria-label="Tu brief" hidden={!mobOpen}>{card(mobCard)}</div>
        </div>

        <div className="actions full">
          <button className="btn btn-primary submit" type="submit" disabled={busy || sealed}>
            <span className="t"><span>Enviar brief</span><span aria-hidden="true">Enviar brief</span></span><i className="ring" aria-hidden="true" />
            <span className="sr-only" aria-live="polite">{busy ? 'Enviando…' : ''}</span>
          </button>
          <a className="btn btn-ghost wa-send" href={waHref} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a>
        </div>
        <div className="recv full" role="status">
          {sealed && <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
            <span><b>Recibido ✓</b> Respondemos dentro de 24 horas hábiles.
              {demo && <small className="demo"> Modo demo: el mensaje fue validado pero no enviado (falta configurar RESEND_API_KEY).</small>}
              <span className="sr-only"> {summary}</span></span>
          </>}
        </div>
        {status === 'error' && <FormFeedback status={status} serverMsg={serverMsg} demo={demo} />}
        <p className="note">Respondemos dentro de 24 horas hábiles. Usamos tus datos solo para responder tu solicitud.</p>
      </form>
    </>
  );
}
