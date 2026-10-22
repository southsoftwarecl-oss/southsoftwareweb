/**
 * /nosotros — motion de "Forjado" (se importa de forma diferida desde motion-runtime).
 *
 * Tiers (detectTier del hero 3D; QA: ?gl=high|mid|mobile|low):
 *   alto  desktop: todo (blur de profundidad en el manifiesto, displacement en hero y retratos)
 *   medio desktop modesto: sin blur ni displacement en retratos (solo máscara)
 *   bajo  móvil/tablet/low: sin filtros SVG animados, mapa ≤ 20 trazos; sin pin bajo 1025 px
 *         (en desktop modesto el pin CSS se mantiene: retirarlo tras detectar el tier causaba CLS)
 *   static (movimiento reducido / ?capture): sin animaciones; solo interacción (monolitos) y el reloj.
 * Filtros SVG animados: como máximo UNO a la vez (h1 en la apertura, fila de retratos en el equipo)
 * y se retiran (filter:none) al terminar. Se anima solo transform, opacity, clip-path/mask,
 * strokeDashoffset y custom properties registradas.
 */
import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap';
import { onIntro } from '@/lib/runtime';
import { detectTier } from '@/components/three/tiers';

type Opts = { STATIC: boolean; animateHero: boolean };
export type NosTier = 'high' | 'mid' | 'low' | 'static';

export function nosTier(STATIC: boolean): NosTier {
  if (STATIC) return 'static';
  if (innerWidth < 1025) return 'low';
  const t = detectTier();
  return t === 'high' ? 'high' : t === 'mid' ? 'mid' : 'low';
}

export function startNosotros(root: HTMLElement, { STATIC, animateHero }: Opts): () => void {
  const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = root) => r.querySelector(s) as T | null;
  const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = root) => Array.from(r.querySelectorAll(s)) as T[];
  const tier = nosTier(STATIC);
  const desktop = innerWidth >= 1025;
  root.dataset.tier = tier;
  const off: (() => void)[] = [];
  const listen = (el: EventTarget, ev: string, fn: EventListener, o?: AddEventListenerOptions) => { el.addEventListener(ev, fn, o); off.push(() => el.removeEventListener(ev, fn, o)); };
  // QA: timelines activos de esta página (reduced motion → debe quedar en 0)
  const w = window as Window & { __nosTweens?: () => number };
  w.__nosTweens = () => gsap.globalTimeline.getChildren(true, true, false).filter((t) => t.isActive() && (t.targets?.() as Element[] | undefined)?.some?.((el) => el instanceof Element && root.contains(el))).length;

  // Mapa de Chile: en tier bajo solo quedan los trazos [data-lo] (≤ 20)
  if (tier === 'low') $$('.cmap path:not([data-lo])').forEach((p) => p.remove());

  const ctx = gsap.context(() => {
    /* ================= ACTO 1 ================= */
    const hero = $('.fhero');
    if (hero && !STATIC && animateHero) {
      const paths = $$<SVGPathElement>('.cmap-k path, .cmap-c path', hero);
      gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
      const clock = $('.fh-clock', hero); gsap.set(clock, { opacity: 0 });
      const h1 = $('.fh-title', hero)!; const words = $$('.fw', h1);
      const useFilter = tier !== 'low';
      const dm = $('#fh-mercury feDisplacementMap', hero);
      if (useFilter) gsap.set(words, { opacity: 0.25, y: '0.14em' });
      else gsap.set(words, { clipPath: 'inset(0% 0% 100% 0%)', y: '0.14em' });
      const lead = $('.fh-lead', hero)!;
      // Móvil: sin SplitText en el lead (es el LCP); entra solo con transform.
      const lines = innerWidth < 760 ? [lead] : new SplitText(lead, { type: 'lines', mask: 'lines', linesClass: 'sl', aria: 'none' }).lines;
      gsap.set(lines, innerWidth < 760 ? { yPercent: 8 } : { yPercent: 110 });

      off.push(onIntro(() => {
        // h1: un único filtro (en el h1) 60→0 con 'mercury'; palabras con stagger .12; luego filter:none
        if (useFilter && dm) {
          h1.style.filter = 'url(#fh-mercury)';
          const o = { s: 60 };
          gsap.to(o, { s: 0, duration: 1.6 + 0.12 * (words.length - 1), ease: 'mercury', onUpdate: () => dm.setAttribute('scale', o.s.toFixed(2)), onComplete: () => { h1.style.filter = 'none'; } });
          gsap.to(words, { opacity: 1, y: 0, duration: 1.6, ease: 'mercury', stagger: 0.12 });
        } else {
          gsap.to(words, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.2, ease: 'south', stagger: 0.12, clearProps: 'clipPath' });
        }
        gsap.to(lines, { yPercent: 0, duration: 1.1, ease: 'south', stagger: 0.08, delay: 0.45 });
        // costa de norte a sur: el orden del DOM ya va de lo más largo a lo más corto; stagger suave
        gsap.to(paths, { strokeDashoffset: 0, duration: 2.4, ease: 'south', stagger: { amount: 1.2 }, delay: 0.1 });
        gsap.to(clock, { opacity: 1, duration: 0.8, delay: 1.2 });
      }));
    }

    /* ================= ACTO 2 ================= */
    const mf = $('.mf');
    if (mf && !STATIC) {
      const p = $('.mf-text', mf)!; const kps = $$('.kp', mf);
      const plates = $$('.mf-plate', mf); const edges = $$('.mf-edge rect', mf);
      // pin en todo desktop (CSS sticky, barato): quitarlo tras detectar el tier provocaba CLS (Lighthouse 0.21)
      const pinned = desktop;
      if (!pinned) mf.classList.add('no-pin');
      mf.classList.add('is-anim');
      gsap.set(edges, { strokeDashoffset: 1 });
      gsap.set(plates, { opacity: 0, y: 16 });
      if (pinned) {
        const words = new SplitText(p, { type: 'words', wordsClass: 'mw', aria: 'none' }).words as HTMLElement[];
        words.forEach((wd) => { if (wd.closest('.kp')) wd.classList.add('kw'); });
        const blur = tier === 'high';
        gsap.set(words, { opacity: 0.12, z: -80, ...(blur ? { filter: 'blur(6px)' } : {}) });
        const N = words.length, D = 0.2, span = 0.78, each = (span - D) / (N - 1);
        // umbral de cromado por frase clave = cuando termina su última palabra
        const groups = kps.map((k) => { const ws = words.filter((wd) => k.contains(wd)); return { ws, at: words.indexOf(ws[ws.length - 1]) * each + D }; });
        let blurCleared = false;
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: mf, start: 'top 45%', end: 'bottom 104%', scrub: 0.5 },
          onUpdate: () => {
            const pr = tl.progress();
            groups.forEach((g) => g.ws.forEach((wd, j) => wd.classList.toggle('on', pr >= g.at + j * 0.004)));
            if (blur) {
              if (pr >= 0.999 && !blurCleared) { blurCleared = true; gsap.set(words, { filter: 'none' }); }
              else if (pr < 0.999) blurCleared = false;
            }
          },
        });
        tl.to(words, { opacity: 1, z: 0, ...(blur ? { filter: 'blur(0px)' } : {}), duration: D, stagger: each }, 0)
          .to(plates, { opacity: 1, y: 0, duration: 0.1, stagger: 0.03 }, 0.82)
          .to(edges, { strokeDashoffset: 0, duration: 0.14, stagger: 0.03 }, 0.82)
          .set({}, {}, 1);
      } else {
        mf.classList.add('lines');
        const lines = new SplitText(p, { type: 'lines', mask: 'lines', linesClass: 'sl', aria: 'none' }).lines;
        gsap.set(lines, { yPercent: 100 });
        ScrollTrigger.create({ trigger: p, start: 'top 82%', once: true, onEnter: () => {
          gsap.to(lines, { yPercent: 0, duration: 1.1, ease: 'south', stagger: 0.08, onComplete: () => {
            kps.forEach((k, i) => gsap.delayedCall(i * 0.15, () => k.classList.add('on')));
          } });
        } });
        ScrollTrigger.create({ trigger: $('.mf-side', mf)!, start: 'top 88%', once: true, onEnter: () => {
          gsap.to(plates, { opacity: 1, y: 0, duration: 0.9, ease: 'south', stagger: 0.1 });
          gsap.to(edges, { strokeDashoffset: 0, duration: 1.2, ease: 'south', stagger: 0.1, delay: 0.1 });
        } });
      }
    }

    /* ================= ACTO 3 ================= */
    const monos = $('.monos');
    if (monos) {
      monos.classList.add('js');
      const lis = $$('.mono-li', monos);
      const btns = lis.map((li) => $<HTMLButtonElement>('.mono-b', li)!);
      const fan = desktop && !STATIC;
      if (!desktop || STATIC) {
        btns.forEach((b) => b.setAttribute('aria-expanded', 'true'));
      }
      if (!desktop) {
        // indicador "1 / 6" del carrusel
        const count = $('.mono-count b');
        let raf = 0;
        listen(monos, 'scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
          const step = lis[1] ? lis[1].offsetLeft - lis[0].offsetLeft : 1;
          const i = Math.min(lis.length - 1, Math.max(0, Math.round(monos.scrollLeft / step)));
          if (count) count.textContent = String(i + 1);
        }); }, { passive: true });
        off.push(() => cancelAnimationFrame(raf));
      }
      if (fan) {
        // estado: hover > foco > fijada (Enter/click). aria-expanded = fijada.
        // la interacción más reciente gana (hover, foco o fijada); al terminar una, vuelve a la anterior válida
        type Src = 'hover' | 'focus' | 'pin';
        const st: Record<Src, { li: HTMLElement | null; t: number }> = { hover: { li: null, t: 0 }, focus: { li: null, t: 0 }, pin: { li: null, t: 0 } };
        let clock = 0, cur: HTMLElement | null = null;
        const set = (k: Src, li: HTMLElement | null) => { st[k] = { li, t: ++clock }; };
        const pick = () => (Object.values(st).filter((v) => v.li).sort((a, b) => b.t - a.t)[0]?.li) ?? null;
        const splits = STATIC ? [] : lis.map((li) => new SplitText([$('.mono-b', li)!, $('.mono-d', li)!], { type: 'words', mask: 'words', wordsClass: 'sw', aria: 'none' }).words);
        const render = () => {
          const next = pick(); const pinned = st.pin.li;
          lis.forEach((li) => li.classList.toggle('is-on', li === next));
          monos.classList.toggle('has-on', !!next);
          btns.forEach((b, i) => b.setAttribute('aria-expanded', String(lis[i] === pinned)));
          if (next && next !== cur && splits.length) {
            const ws = splits[lis.indexOf(next)];
            gsap.fromTo(ws, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'south', stagger: 0.02, overwrite: true });
          }
          cur = next;
        };
        lis.forEach((li, i) => {
          // pointermove (no pointerenter): un scroll que deja la placa bajo el puntero no le roba el foco al teclado
          listen(li, 'pointermove', () => { if (st.hover.li !== li) { set('hover', li); render(); } });
          listen(li, 'pointerleave', () => { if (st.hover.li === li) set('hover', null); render(); });
          listen(btns[i], 'focus', () => { set('focus', li); render(); });
          listen(btns[i], 'blur', () => { if (st.focus.li === li) set('focus', null); render(); });
          listen(btns[i], 'click', () => { set('pin', st.pin.li === li ? null : li); render(); });
        });
        listen(document, 'keydown', ((e: KeyboardEvent) => { if (e.key === 'Escape' && st.pin.li) { set('pin', null); render(); } }) as EventListener);
      }
      if (!STATIC) {
        const plates = lis.map((li) => $('.mono-p', li)!);
        if (fan) {
          gsap.set(plates, { clipPath: 'inset(0% 0% 100% 0%)' });
          gsap.set($$('.mono-n', monos), { opacity: 0 });
          ScrollTrigger.create({ trigger: monos, start: 'top 78%', once: true, onEnter: () => {
            gsap.to(plates, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'south', stagger: 0.1, clearProps: 'clipPath' });
            gsap.fromTo($$('.mono-sheen', monos), { yPercent: -120 }, { yPercent: 260, duration: 1.4, ease: 'power2.inOut', stagger: 0.1, delay: 0.15 });
            gsap.to($$('.mono-n', monos), { opacity: 1, duration: 0.9, stagger: 0.1, delay: 0.6 });
          } });
          // reflejo especular ligado al scroll (no al cursor)
          const setSpec = gsap.quickSetter(monos, '--spec', '%');
          ScrollTrigger.create({ trigger: monos, start: 'top bottom', end: 'bottom top', onUpdate: (s) => setSpec(-40 + s.progress * 130) });
        } else {
          gsap.set(plates, { opacity: 0, y: 24 });
          ScrollTrigger.create({ trigger: monos, start: 'top 85%', once: true, onEnter: () => {
            gsap.to(plates, { opacity: 1, y: 0, duration: 0.9, ease: 'south', stagger: 0.08 });
          } });
        }
      }
    }

    /* ================= ACTO 5 ================= */
    const steps = $('.steps');
    if (steps && !STATIC) {
      steps.classList.add('js');
      const rail = $('.steps-rail b'); const items = $$('.stp', steps);
      gsap.set(rail, { scaleX: 0 });
      ScrollTrigger.create({ trigger: steps, start: 'top 86%', once: true, onEnter: () => {
        gsap.to(rail, { scaleX: 1, duration: 1.4, ease: 'south' });
        items.forEach((it, i) => gsap.delayedCall(0.15 + i * 0.18, () => it.classList.add('on')));
      } });
    }
  }, root);

  ScrollTrigger.refresh();
  return () => { off.forEach((f) => f()); ctx.revert(); delete w.__nosTweens; };
}
