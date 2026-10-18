'use client';
/**
 * "Arma tu proyecto": 3 radio groups (chips) → mini-tarjeta con el pack EXACTO de PACKS.
 * La tarjeta se arma con Flip desde el chip elegido ('mercury'). Estado en la URL (?necesito=&tamano=).
 */
import Link from 'next/link';
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { NEEDS, SIZES, WHENS, packFor, waHref, type Need, type Size, type When } from '@/content/servicios';
import { isReduced } from './hooks';

type G = typeof import('@/lib/gsap');
const subQ = (cb: () => void) => { addEventListener('popstate', cb); return () => removeEventListener('popstate', cb); };
const readQ = () => location.search;

function Group({ name, k, legend, opts, value, onPick }: { name: string; k: string; legend: string; opts: readonly { v: string; label: string }[]; value: string | null; onPick: (v: string, el: HTMLInputElement) => void }) {
  return (
    <fieldset className="cfg-q">
      <legend><span className="mono">{k}</span>{legend}</legend>
      <div className="cfg-chips">
        {opts.map((o) => (
          <label className="chip" key={o.v}>
            <input type="radio" name={`${name}-${k}`} value={o.v} checked={value === o.v} onChange={(e) => onPick(o.v, e.currentTarget)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function Configurator() {
  const id = useId();
  const search = useSyncExternalStore(subQ, readQ, () => '');
  const q = new URLSearchParams(search);
  const qNeed = NEEDS.find((n) => n.v === q.get('necesito'))?.v ?? null;
  const qSize = SIZES.find((n) => n.v === q.get('tamano'))?.v ?? null;
  const [need, setNeed] = useState<Need | null | undefined>(undefined);
  const [size, setSize] = useState<Size | null | undefined>(undefined);
  const [when, setWhen] = useState<When | null>(null);
  const N = need === undefined ? qNeed : need;
  const S = size === undefined ? qSize : size;
  const pack = N ? packFor(N, S) : null;
  const answers = [NEEDS.find((x) => x.v === N)?.label, SIZES.find((x) => x.v === S)?.label, WHENS.find((x) => x.v === when)?.label].filter(Boolean) as string[];
  const cta = WHENS.find((x) => x.v === when)?.cta ?? 'Hablar por WhatsApp';

  const root = useRef<HTMLDivElement>(null);
  const g = useRef<G | null>(null);
  const flip = useRef<{ state: Flip.FlipState } | null>(null);
  useEffect(() => { let on = true; import('@/lib/gsap').then((m) => { if (on) { m.setupGsap(); g.current = m; } }); return () => { on = false; }; }, []);

  const sync = (n: Need | null, s: Size | null) => {
    const u = new URL(location.href);
    if (n) u.searchParams.set('necesito', n); else u.searchParams.delete('necesito');
    if (s) u.searchParams.set('tamano', s); else u.searchParams.delete('tamano');
    history.replaceState(history.state, '', u.pathname + u.search + u.hash);
  };
  const capture = (input: HTMLInputElement) => {
    const m = g.current, chip = input.closest('label');
    if (!m || !chip || isReduced()) return;
    chip.setAttribute('data-flip-id', 'cfg-pick');
    flip.current = { state: m.Flip.getState(chip) };
    chip.removeAttribute('data-flip-id');
  };
  const pickNeed = (v: Need, el: HTMLInputElement) => { capture(el); setNeed(v); sync(v, S); };
  const pickSize = (v: Size, el: HTMLInputElement) => { capture(el); setSize(v); sync(N, v); };

  useLayoutEffect(() => {
    const m = g.current, f = flip.current, el = root.current;
    flip.current = null;
    if (!m || !f || !el) return;
    const card = el.querySelector<HTMLElement>('.cfg-card');
    if (!card) return;
    card.setAttribute('data-flip-id', 'cfg-pick');
    // la tarjeta "sale" del chip elegido y se asienta con 'mercury'; luego entran sus líneas
    const tw = m.Flip.from(f.state, { targets: card, duration: 0.6, ease: 'mercury', scale: true, props: 'opacity' });
    const li = m.gsap.fromTo(card.querySelectorAll('.cfg-li'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, delay: 0.25, clearProps: 'opacity,transform' });
    card.removeAttribute('data-flip-id');
    return () => { tw.kill(); li.kill(); m.gsap.set(card, { clearProps: 'all' }); };
  }, [pack?.name, S]);

  return (
    <div className="cfg" ref={root} id="arma-tu-proyecto" aria-labelledby={`${id}-t`}>
      <div className="cfg-l">
        <div className="cfg-h"><h2 id={`${id}-t`}>Arma tu proyecto</h2><p>Tres preguntas y te mostramos el pack que calza, con su precio publicado.</p></div>
        <Group name={id} k="01" legend="¿Qué necesitas?" opts={NEEDS} value={N} onPick={(v, el) => pickNeed(v as Need, el)} />
        <Group name={id} k="02" legend="¿Tamaño?" opts={SIZES} value={S} onPick={(v, el) => pickSize(v as Size, el)} />
        <Group name={id} k="03" legend="¿Para cuándo?" opts={WHENS} value={when} onPick={(v) => setWhen(v as When)} />
      </div>
      <div className="cfg-r" aria-live="polite">
        {pack ? (
          <div className="cfg-card" data-pack={pack.name}>
            <span className="mono">{pack.quote ? 'A medida' : 'Pack recomendado'}</span>
            <h3 className="cfg-name">{pack.name}</h3>
            {pack.quote
              ? <p className="cfg-price"><b>Cotización</b><small>Sin precio fijo: depende del alcance.</small></p>
              : <p className="cfg-price"><b className="cfg-setup">{pack.setup}</b><small>pago inicial + <span className="cfg-monthly">{pack.monthly}</span> / mes</small></p>}
            <ul>{pack.includes.map((x) => <li className="cfg-li" key={x}>{x}</li>)}</ul>
            <div className="cfg-cta">
              <a className="btn btn-primary cfg-wa" href={waHref(pack.name, answers)} target="_blank" rel="noopener noreferrer"><span className="t"><span>{cta}</span><span aria-hidden="true">{cta}</span></span></a>
              <Link className="btn btn-ghost" href="/packs"><span className="t"><span>Ver todos los packs</span><span aria-hidden="true">Ver todos los packs</span></span></Link>
            </div>
          </div>
        ) : (
          <div className="cfg-card cfg-empty">
            <span className="mono">Tu pack</span>
            <h3 className="cfg-name">Elige qué necesitas</h3>
            <p>Precios exactos de nuestros packs, sin “cotiza para saber”. Si es un sistema a medida, lo cotizamos en una reunión de 30 minutos.</p>
            <div className="cfg-cta"><Link className="btn btn-ghost" href="/packs"><span className="t"><span>Ver todos los packs</span><span aria-hidden="true">Ver todos los packs</span></span></Link></div>
          </div>
        )}
      </div>
    </div>
  );
}
