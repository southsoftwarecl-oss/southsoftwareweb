/**
 * Packs v3 — "Forja de cromo". Placas de acero que se forjan al entrar y reflejan la luz del cursor.
 *
 * Entrada (ScrollTrigger once 'top 80%'): vertido de cromo (mask con --p -12%→100%, 0.9 s 'mercury', stagger 0.08
 * en orden de lectura) + banda de brillo (::after, --g) → odómetro de precios (columnas 0–9, translateY %, 0.8 s
 * 'south', stagger 0.03 de derecha a izquierda) → checks SVG (strokeDashoffset 1→0, 0.35 s, stagger 0.06) → badge
 * "Recomendado" (scale .9→1 'mercury' + destello 0.6 s) al final.
 * Puntero fino ≥1025 px: luz especular (--mx/--my con quickSetter), borde cónico que sigue al cursor (--ang),
 * tilt ±4° (quickTo .6 'south', vuelta a 0 con 'mercury' 0.9 s). rAF throttling; el rect se cachea en pointerenter
 * (y se invalida si hay scroll). Pyme: borde que gira 360° en 9 s, pausado fuera del viewport.
 * Móvil <760 px: carrusel scroll-snap que abre centrado en Pyme, puntos + contador aria-live, flechas de teclado,
 * entrada solo para la tarjeta visible (IntersectionObserver con root = carrusel) y barrido de luz al tocar.
 * STATIC (reduced motion / captura): sin vertido, odómetro, tilt ni giro; solo la navegación del carrusel.
 * El precio final SIEMPRE es el del SSR (PACKS): el JS solo lo envuelve (aria-label + texto sr-only; columnas aria-hidden).
 */
import { gsap, ScrollTrigger } from '@/lib/gsap';

const MOBILE = '(max-width: 759px)';
const FINE = '(hover: hover) and (pointer: fine) and (min-width: 1025px)';
const REEL = '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0';
const STEPS = 11; // 0–9 + un 0 final (el 0 también rueda una vuelta)

type Reel = { el: HTMLElement; to: number };

/** Envuelve "$349.990" en columnas; devuelve las columnas y una función que restaura el texto original. */
function wrapOdo(el: HTMLElement): { reels: Reel[]; restore: () => void } {
  const v = el.dataset.odo || el.textContent || '';
  const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = v;
  const cols = document.createElement('span'); cols.className = 'cols'; cols.setAttribute('aria-hidden', 'true');
  const reels: Reel[] = [];
  for (const ch of v) {
    if (/\d/.test(ch)) {
      const d = +ch;
      const dg = document.createElement('span'); dg.className = 'dg';
      const reel = document.createElement('span'); reel.className = 'reel'; reel.textContent = REEL;
      dg.append(reel); cols.append(dg);
      reels.push({ el: reel, to: -((d === 0 ? 10 : d) / STEPS) * 100 });
    } else cols.append(document.createTextNode(ch));
  }
  el.setAttribute('aria-label', v);
  el.replaceChildren(sr, cols);
  return { reels, restore: () => { el.textContent = v; el.removeAttribute('aria-label'); } };
}

type Card = { el: HTMLElement; reels: Reel[][]; paths: SVGPathElement[]; items: HTMLElement[]; badge: HTMLElement | null };

export function startPacks(grid: HTMLElement, STATIC: boolean): () => void {
  const section = (grid.closest('section') as HTMLElement) || grid.parentElement!;
  const cards = Array.from(grid.querySelectorAll<HTMLElement>(':scope > .pack'));
  const nav = section.querySelector<HTMLElement>('.pk-nav');
  const dots = nav ? Array.from(nav.querySelectorAll<HTMLButtonElement>('.pk-dots button')) : [];
  const count = nav?.querySelector<HTMLElement>('.pk-count') ?? null;
  const featIdx = Math.max(0, cards.findIndex((c) => c.classList.contains('feat')));
  if (navigator.webdriver) (window as unknown as { __gsap: typeof gsap }).__gsap = gsap; // QA (e2e/packs.spec.ts)

  const mm = gsap.matchMedia();
  mm.add({ mobile: MOBILE, fine: FINE }, (c) => {
    const { mobile, fine } = c.conditions as { mobile: boolean; fine: boolean };
    const off: (() => void)[] = [];
    const listen = (t: EventTarget, ev: string, fn: EventListener, o: AddEventListenerOptions = { passive: true }) => {
      t.addEventListener(ev, fn, o); off.push(() => t.removeEventListener(ev, fn, o));
    };
    grid.dataset.forja = STATIC ? 'static' : 'pending';

    /* ---------------- carrusel móvil (también con reduced motion: es navegación) ---------------- */
    if (mobile) {
      grid.setAttribute('role', 'region');
      grid.setAttribute('aria-roledescription', 'carrusel');
      grid.setAttribute('aria-label', 'Packs');
      grid.tabIndex = 0;
      let cur = -1;
      const left = (i: number) => cards[i].offsetLeft - (grid.clientWidth - cards[i].offsetWidth) / 2;
      const mark = (i: number) => {
        if (i === cur) return; cur = i;
        dots.forEach((d, k) => { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
        if (count) count.textContent = `${i + 1} / ${cards.length}`;
      };
      const go = (i: number) => {
        const k = Math.max(0, Math.min(cards.length - 1, i));
        grid.scrollTo({ left: left(k), behavior: STATIC ? 'auto' : 'smooth' });
      };
      // abre centrado en Pyme, sin animación
      grid.style.scrollBehavior = 'auto'; grid.scrollLeft = left(featIdx); grid.style.scrollBehavior = '';
      mark(featIdx);
      let raf = 0;
      listen(grid, 'scroll', () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const mid = grid.scrollLeft + grid.clientWidth / 2;
          let best = 0, bd = Infinity;
          cards.forEach((el, k) => { const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = k; } });
          mark(best);
        });
      });
      off.push(() => cancelAnimationFrame(raf));
      dots.forEach((d, k) => listen(d, 'click', () => go(k)));
      listen(grid, 'keydown', ((e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
        else if (e.key === 'Home') { e.preventDefault(); go(0); }
        else if (e.key === 'End') { e.preventDefault(); go(cards.length - 1); }
      }) as EventListener, { passive: false });
      off.push(() => { ['role', 'aria-roledescription', 'aria-label', 'tabindex'].forEach((a) => grid.removeAttribute(a)); });
    }
    if (STATIC) return () => off.forEach((f) => f());

    /* ---------------- preparación de la entrada ---------------- */
    const restores: (() => void)[] = [];
    const data: Card[] = cards.map((el) => {
      const reels = Array.from(el.querySelectorAll<HTMLElement>('.odo')).map((o) => { const w = wrapOdo(o); restores.push(w.restore); return w.reels; });
      return { el, reels, paths: Array.from(el.querySelectorAll<SVGPathElement>('.ck path')), items: Array.from(el.querySelectorAll<HTMLElement>('li > span')), badge: el.querySelector<HTMLElement>('.badge') };
    });
    off.push(() => restores.forEach((f) => f()));
    data.forEach((d) => {
      d.el.classList.add('forging');
      gsap.set(d.el, { '--p': '-12%', '--g': 1 });
      d.reels.flat().forEach((r) => gsap.set(r.el, { yPercent: 0 }));
      gsap.set(d.paths, { strokeDashoffset: 1 });
      gsap.set(d.items, { opacity: 0, x: 6 });
      if (d.badge) { gsap.set(d.badge, { scale: 0.9, opacity: 0 }); gsap.set(d.badge.querySelector('i'), { xPercent: -120 }); }
    });
    off.push(() => data.forEach((d) => d.el.classList.remove('forging')));

    /** Vertido de cromo + banda de brillo de una tarjeta, en `at` del timeline. */
    const pour = (tl: gsap.core.Timeline, d: Card, at: number) => {
      tl.to(d.el, { '--p': '100%', duration: 0.9, ease: 'mercury' }, at)
        .to(d.el, { '--g': 0, duration: 0.3, ease: 'south' }, at + 0.62)
        .call(() => d.el.classList.remove('forging'), undefined, at + 0.9);
    };
    /** Odómetro (tras el vertido) + checks que se dibujan; `at` = inicio del vertido de esa tarjeta. */
    const details = (tl: gsap.core.Timeline, d: Card, at: number) => {
      d.reels.forEach((rs) => {
        if (rs.length) tl.to(rs.map((r) => r.el), { yPercent: (i: number) => rs[i].to, duration: 0.8, ease: 'south', stagger: { each: 0.03, from: 'end' } }, at + 0.9);
      });
      tl.to(d.paths, { strokeDashoffset: 0, duration: 0.35, ease: 'south', stagger: 0.06 }, at + 0.55)
        .to(d.items, { opacity: 1, x: 0, duration: 0.35, ease: 'south', stagger: 0.06, clearProps: 'opacity,transform' }, at + 0.6);
    };
    const badgeIn = (tl: gsap.core.Timeline, d: Card) => {
      if (!d.badge) return;
      tl.to(d.badge, { scale: 1, opacity: 1, duration: 0.6, ease: 'mercury', clearProps: 'transform,opacity' })
        .to(d.badge.querySelector('i'), { xPercent: 120, duration: 0.6, ease: 'south' }, '<0.1');
    };

    if (!mobile) {
      const tl = gsap.timeline({ paused: true, onComplete: () => { grid.dataset.forja = 'done'; } });
      data.forEach((d, i) => { pour(tl, d, i * 0.08); details(tl, d, i * 0.08); });
      const f = data.find((d) => d.badge); if (f) badgeIn(tl, f);
      ScrollTrigger.create({ trigger: grid, start: 'top 80%', once: true, onEnter: () => { tl.play(); } });
    } else {
      // Solo la tarjeta visible del carrusel (root = carrusel), una vez que el carrusel entra al viewport.
      // Las vecinas que se asoman se vierten apenas asoman (así nunca se ve un hueco vacío al costado);
      // odómetro, checks y badge corren recién cuando la tarjeta está ≥60% visible.
      let io: IntersectionObserver | null = null;
      let left = data.length;
      const poured = new Set<Card>(), done = new Set<Card>();
      ScrollTrigger.create({ trigger: grid, start: 'top 80%', once: true, onEnter: () => {
        io = new IntersectionObserver((es) => es.forEach((e) => {
          const d = data.find((x) => x.el === e.target); if (!d || !e.isIntersecting) return;
          if (!poured.has(d)) { poured.add(d); const tl = gsap.timeline(); pour(tl, d, 0); }
          if (e.intersectionRatio >= 0.6 && !done.has(d)) {
            done.add(d); io?.unobserve(d.el);
            const tl = gsap.timeline({ onComplete: () => { if (--left === 0) grid.dataset.forja = 'done'; } });
            details(tl, d, 0); badgeIn(tl, d);
          }
        }), { root: grid, threshold: [0, 0.6] });
        data.forEach((d) => io!.observe(d.el));
      } });
      off.push(() => io?.disconnect());
      // al tocar: un barrido único de la luz especular (0.6 s)
      cards.forEach((el) => listen(el, 'pointerdown', ((e: PointerEvent) => {
        if (e.pointerType === 'mouse') return;
        const r = el.getBoundingClientRect();
        el.classList.add('lit');
        gsap.fromTo(el, { '--mx': `${e.clientX - r.left}px`, '--my': '-160px' }, { '--my': `${r.height + 160}px`, duration: 0.6, ease: 'south', overwrite: 'auto',
          onComplete: () => { el.classList.remove('lit'); gsap.set(el, { clearProps: '--mx,--my' }); } });
      }) as EventListener));
    }

    /* ---------------- Pyme: borde de cromo que gira (9 s, loop), pausado fuera del viewport ---------------- */
    const feat = cards[featIdx]?.classList.contains('feat') ? cards[featIdx] : null;
    let spin: gsap.core.Tween | null = null;
    if (feat) {
      // el ángulo del cónico gira 0→360° en 9 s: se rota el cuadrado que lo contiene (transform, sin repintar)
      spin = gsap.fromTo(feat.querySelector('.rim i'), { rotation: 0 }, { rotation: 360, duration: 9, ease: 'none', repeat: -1, paused: true });
      // lado del cuadrado que gira = diagonal de la tarjeta (cubre el borde en cualquier ángulo, sin sobredimensionar)
      const sq = feat.querySelector<HTMLElement>('.rim i');
      const ro = new ResizeObserver(([e]) => { const { width: w, height: h } = e.contentRect; sq?.style.setProperty('width', `${Math.ceil(Math.hypot(w + 58, h + 58)) + 4}px`); });
      ro.observe(feat); off.push(() => { ro.disconnect(); sq?.style.removeProperty('width'); });
      const vis = new IntersectionObserver(([e]) => { if (e.isIntersecting && !feat.matches(':hover')) spin?.play(); else spin?.pause(); });
      vis.observe(feat); off.push(() => vis.disconnect());
    }

    /* ---------------- puntero fino: luz especular + borde que sigue al cursor + tilt ±4° ---------------- */
    if (fine) {
      let scrolled = false;
      listen(window, 'scroll', () => { scrolled = true; });
      cards.forEach((el) => {
        let rect: DOMRect | null = null, raf = 0, px = 0, py = 0;
        let qx: gsap.QuickToFunc | null = null, qy: gsap.QuickToFunc | null = null;
        const setX = gsap.quickSetter(el, '--mx', 'px') as (v: number) => void;
        const setY = gsap.quickSetter(el, '--my', 'px') as (v: number) => void;
        const setA = gsap.quickSetter(el, '--ang', 'deg') as (v: number) => void;
        const apply = () => {
          raf = 0;
          if (!rect || scrolled) { rect = el.getBoundingClientRect(); scrolled = false; }
          const x = px - rect.left, y = py - rect.top, w = rect.width, h = rect.height;
          setX(x); setY(y);
          setA((Math.atan2(y - h / 2, x - w / 2) * 180) / Math.PI + 90);
          const nx = Math.max(0, Math.min(1, x / w)), ny = Math.max(0, Math.min(1, y / h));
          qx?.((nx - 0.5) * 8); qy?.((0.5 - ny) * 8);
        };
        listen(el, 'pointerenter', ((e: PointerEvent) => {
          rect = el.getBoundingClientRect(); scrolled = false;
          if (el === feat) spin?.pause();
          gsap.killTweensOf(el, 'rotationX,rotationY');
          gsap.set(el, { transformPerspective: 1200 });
          qx = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'south' });
          qy = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'south' });
          px = e.clientX; py = e.clientY; apply();
        }) as EventListener);
        listen(el, 'pointermove', ((e: PointerEvent) => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(apply); }) as EventListener);
        listen(el, 'pointerleave', () => {
          cancelAnimationFrame(raf); raf = 0; rect = null; qx = qy = null;
          gsap.killTweensOf(el, 'rotationX,rotationY');
          gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.9, ease: 'mercury', onComplete: () => { gsap.set(el, { clearProps: 'transform' }); } });
          if (el === feat) spin?.play();
        });
        off.push(() => cancelAnimationFrame(raf));
      });
    }

    return () => off.forEach((f) => f());
  });

  return () => mm.revert();
}
