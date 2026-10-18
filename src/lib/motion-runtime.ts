/**
 * Runtime de animación del sitio (port 1:1 de `common.js` del preview 10).
 * Se carga con import() dinámico desde components/MotionRoot.tsx para que GSAP
 * y Lenis no formen parte del JS crítico de hidratación.
 *
 * startGlobal(): Lenis, mouse, cursor contextual, nav que se oculta, botón
 *   flotante de WhatsApp, scroll suave a anclas y sincronización con el preloader.
 * startRoute(root): reveals SplitText con máscara, [data-in], [data-reveal],
 *   [data-stagger], parallax, contadores, historia fijada, línea de proceso,
 *   spotlight, tilt, botones magnéticos y distorsión de imágenes, limitados a `root`.
 * Ambas devuelven una función de limpieza (gsap.context().revert()).
 */
import Lenis from 'lenis';
import { gsap, ScrollTrigger, SplitText, setupGsap } from '@/lib/gsap';
import { RT, detectModes, initIntro, onIntro } from '@/lib/runtime';

let lenis: Lenis | null = null;
let routeCount = 0;

export function startGlobal(): () => void {
    detectModes();
    setupGsap();
    const root = document.documentElement;
    if (RT.capture) root.classList.add('capture');
    if (RT.reduced) root.classList.add('rm');
    const off: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(t: Window | Document, ev: K | string, fn: EventListener, opts?: AddEventListenerOptions) => {
      t.addEventListener(ev, fn, opts); off.push(() => t.removeEventListener(ev, fn, opts));
    };

    // Mouse normalizado (lo usa el hero 3D)
    on(window, 'pointermove', ((e: PointerEvent) => {
      const m = RT.mouse; m.moved = true; m.x = e.clientX; m.y = e.clientY;
      m.nx = (e.clientX / innerWidth) * 2 - 1; m.ny = -((e.clientY / innerHeight) * 2 - 1);
    }) as EventListener, { passive: true });

    // Lenis (smooth scroll) — detenido mientras corre el preloader
    let tick: ((t: number) => void) | null = null;
    if (!RT.static) {
      lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1.1, touchMultiplier: 1.2, smoothWheel: true, syncTouch: false });
      lenis.on('scroll', ScrollTrigger.update);
      tick = (t: number) => lenis?.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    // Sincroniza con el preloader CSS (ver Preloader.tsx): Lenis arranca cuando se abre
    const { remaining } = initIntro();
    if (remaining > 0) {
      lenis?.stop();
      const t2 = window.setTimeout(() => lenis?.start(), remaining);
      off.push(() => clearTimeout(t2));
    }

    // Scroll suave a anclas (#seccion o /#seccion estando en el home)
    on(document, 'click', ((e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || e.metaKey || e.ctrlKey || e.button !== 0) return;
      const href = a.getAttribute('href') || '';
      const hash = href.startsWith('#') ? href : href.startsWith('/#') && location.pathname === '/' ? href.slice(1) : '';
      if (hash.length < 2) return;
      // Con Cache Components las páginas anteriores quedan ocultas (Activity): usar la visible
      const target = Array.from(document.querySelectorAll<HTMLElement>(hash)).find((el) => el.offsetParent !== null);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target as HTMLElement, { duration: 1.8, easing: (x) => 1 - Math.pow(1 - x, 4) });
      else target.scrollIntoView();
    }) as EventListener);

    // Cursor contextual (solo puntero fino y con movimiento)
    if (!RT.static && matchMedia('(hover:hover)').matches) {
      const d = document.createElement('div'); d.className = 'cursor';
      const r = document.createElement('div'); r.className = 'cursor-ring'; r.append(document.createElement('span'));
      document.body.append(d, r);
      const label = r.querySelector('span')!;
      const xd = gsap.quickTo(d, 'x', { duration: 0.15, ease: 'power3' }), yd = gsap.quickTo(d, 'y', { duration: 0.15, ease: 'power3' });
      const xr = gsap.quickTo(r, 'x', { duration: 0.55, ease: 'power3' }), yr = gsap.quickTo(r, 'y', { duration: 0.55, ease: 'power3' });
      on(window, 'pointermove', ((e: PointerEvent) => {
        document.body.classList.add('cursor-on'); xd(e.clientX); yd(e.clientY); xr(e.clientX); yr(e.clientY);
      }) as EventListener, { passive: true });
      on(document, 'pointerover', ((e: PointerEvent) => {
        const t = e.target as Element;
        const ctx = t.closest?.('[data-cursor]') as HTMLElement | null;
        const link = !ctx && !!t.closest?.('a,button,select,input,textarea');
        // hero/404 ([data-cursor-hide]): sin anillo ni punto, solo el puntero nativo (salvo sobre links/botones)
        const hide = !ctx && !link && !!t.closest?.('[data-cursor-hide]');
        r.classList.toggle('big', !!ctx);
        if (ctx) label.textContent = ctx.dataset.cursor || '';
        r.classList.toggle('link', link);
        document.body.classList.toggle('cursor-hide', hide);
      }) as EventListener, { passive: true });
      off.push(() => { d.remove(); r.remove(); document.body.classList.remove('cursor-on', 'cursor-hide'); });
    }

    // Nav que se esconde al bajar + botón flotante de WhatsApp
    const nav = document.querySelector('.nav');
    const wa = document.querySelector('.wa-float');
    let last = 0;
    const st = ScrollTrigger.create({
      onUpdate: (s) => {
        const y = s.scroll();
        if (!RT.static) nav?.classList.toggle('hide', y > last && y > 400);
        wa?.classList.toggle('show', RT.static || y > innerHeight * 0.7);
        last = y;
      },
    });
    if (RT.static) wa?.classList.add('show');

    return () => {
      off.forEach((f) => f());
      st.kill();
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy(); lenis = null;
    };
}

export function startRoute(root: HTMLElement): () => void {
    // Todas las consultas se limitan a ESTA página: Next mantiene las páginas
    // visitadas montadas pero ocultas (Activity), así que document.* encontraría duplicados.
    const $$ = <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel) as NodeListOf<T>);
    detectModes(); setupGsap(); initIntro();
    const isFirst = routeCount++ === 0;
    if (!isFirst) lenis?.scrollTo(0, { immediate: true, force: true });
    const STATIC = RT.static;
    // En la primera carga, si el JS llegó tarde, el hero ya está visible: no lo escondemos.
    const animateHero = !STATIC && !(isFirst && RT.lateIntro);
    const off: (() => void)[] = [];
    const listen = (el: Element, ev: string, fn: EventListener) => { el.addEventListener(ev, fn); off.push(() => el.removeEventListener(ev, fn)); };
    let alive = true;

    const ctx = gsap.context(() => {
      /* ---- elementos de entrada del hero ---- */
      $$('.hero [data-in]').forEach((el) => {
        if (!animateHero) return;
        gsap.set(el, { opacity: 0, y: 24 });
        off.push(onIntro(() => gsap.to(el, { opacity: 1, y: 0, duration: 1.2, delay: parseFloat(el.dataset.in || '.3') })));
      });
    });

    /* ---- titulares SplitText con máscara ---- */
    const split = (heroOnly: boolean) => ctx.add(() => {
      $$('[data-split]').forEach((el) => {
        const type = el.dataset.split || 'words';
        const inHero = !!el.closest('.hero, .phero');
        if (inHero !== heroOnly) return;
        // Si no se va a animar, no partimos el texto: evita re-pintar el LCP sin necesidad.
        if (STATIC || (inHero && !animateHero)) return;
        const st = new SplitText(el, {
          type: type === 'chars' ? 'words,chars' : type === 'lines' ? 'lines' : 'words',
          mask: type === 'chars' ? 'words' : type === 'lines' ? 'lines' : 'words',
          wordsClass: 'sw', charsClass: 'sc', linesClass: 'sl',
        });
        const parts = type === 'chars' ? st.chars : type === 'lines' ? st.lines : st.words;
        const v = { yPercent: 0, duration: 1.2, stagger: type === 'chars' ? 0.022 : 0.06, ease: 'south' };
        gsap.set(parts, { yPercent: 115 });
        if (inHero) off.push(onIntro(() => gsap.to(parts, { ...v, ease: el.closest('.hero') ? 'mercury' : 'south', delay: parseFloat(el.dataset.delay || '0') })));
        else gsap.to(parts, { ...v, scrollTrigger: { trigger: el, start: 'top 86%' } });
      });
    });

    /* ---- resto de la página (bajo el pliegue): en idle, para no alargar la hidratación ---- */
    const rest = () => { if (!alive) return; split(false); ctx.add(() => {
      if (!STATIC) {
        $$('[data-reveal]').forEach((el) =>
          gsap.from(el, { opacity: 0, y: 40, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 88%' } }));
        $$('[data-stagger]').forEach((g) =>
          gsap.from(g.children, { opacity: 0, y: 50, duration: 1.1, stagger: 0.07, scrollTrigger: { trigger: g, start: 'top 85%' } }));
        $$('[data-parallax]').forEach((el) =>
          gsap.fromTo(el, { yPercent: -parseFloat(el.dataset.parallax || '0') }, {
            yPercent: parseFloat(el.dataset.parallax || '0'), ease: 'none',
            scrollTrigger: { trigger: el.closest('section,footer') || el, start: 'top bottom', end: 'bottom top', scrub: true },
          }));
        $$('.case .media img').forEach((img) =>
          gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: img.closest('.case, .case-hero') || img, start: 'top bottom', end: 'bottom top', scrub: true } }));
        const giant = document.querySelector('.giant');
        if (giant) gsap.fromTo(giant, { yPercent: 55 }, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
      }

      /* ---- contadores (solo datos reales) ---- */
      $$('[data-count]').forEach((el) => {
        const end = +(el.dataset.count || 0), pad = +(el.dataset.pad || 0);
        const f = (v: number) => String(Math.round(v)).padStart(pad, '0');
        if (STATIC) { el.textContent = f(end); return; }
        el.textContent = f(0);
        const o = { v: 0 };
        ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true,
          onEnter: () => { gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = f(o.v); } }); } });
      });

      /* ---- historia fijada: código → interfaz → producto ---- */
      const story = root.querySelector<HTMLElement>('.story');
      if (story && !STATIC && innerWidth > 1024) {
        const lines = story.querySelectorAll('.code .ln'), steps = story.querySelectorAll('.step'), bars = story.querySelectorAll('.progress b');
        gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: story, start: 'top top', end: 'bottom bottom', scrub: 0.8 } })
          .to(lines, { opacity: 1, stagger: 0.12, duration: 0.2 }, 0).to(bars[0], { scaleX: 1, duration: 1.1 }, 0)
          .to(steps[0], { opacity: 0, y: -30, duration: 0.25 }, 1.1).fromTo(steps[1], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25 }, 1.25)
          .to(story.querySelector('.code'), { opacity: 0, scale: 0.96, duration: 0.3 }, 1.1).fromTo(story.querySelector('.wire'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 1.2)
          .fromTo(story.querySelectorAll('.wire .side,.wire .blk'), { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.05, duration: 0.3 }, 1.25).to(bars[1], { scaleX: 1, duration: 1 }, 1.1)
          .to(steps[1], { opacity: 0, y: -30, duration: 0.25 }, 2.2).fromTo(steps[2], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25 }, 2.35)
          .fromTo(story.querySelector('.prod'), { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.6 }, 2.2)
          .fromTo(story.querySelector('.prod .chart path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6 }, 2.5).to(bars[2], { scaleX: 1, duration: 0.9 }, 2.2)
          .to(story.querySelector('.device'), { rotateY: -6, rotateX: 4, duration: 3.2, transformPerspective: 1400 }, 0);
      }

      /* ---- línea de proceso que se dibuja ---- */
      const tlEl = root.querySelector('.tl');
      if (tlEl) {
        const rail = tlEl.querySelector('.rail b'); const sts = tlEl.querySelectorAll<HTMLElement>('.st');
        if (STATIC) sts.forEach((s) => s.classList.add('on'));
        else {
          gsap.to(rail, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: tlEl, start: 'top 60%', end: 'bottom 60%', scrub: 0.6 } });
          sts.forEach((s) => {
            ScrollTrigger.create({ trigger: s, start: 'top 62%', onEnter: () => s.classList.add('on'), onLeaveBack: () => s.classList.remove('on') });
            gsap.from(s.querySelector('.c'), { opacity: 0, x: s.matches(':nth-child(odd)') ? 40 : -40, duration: 1.1, scrollTrigger: { trigger: s, start: 'top 80%' } });
          });
        }
      }

      /* ---- spotlight en tarjetas de servicio ---- */
      $$('.svc .item,.spot').forEach((c) => listen(c, 'pointermove', ((e: PointerEvent) => {
        const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px');
      }) as EventListener));

      if (!STATIC) {
        /* ---- tilt ---- */
        $$('[data-tilt]').forEach((c) => {
          const qx = gsap.quickTo(c, 'rotationY', { duration: 0.8 }), qy = gsap.quickTo(c, 'rotationX', { duration: 0.8 });
          gsap.set(c, { transformPerspective: 1200 });
          listen(c, 'pointermove', ((e: PointerEvent) => { const r = c.getBoundingClientRect(); qx(((e.clientX - r.left) / r.width - 0.5) * 7); qy(((e.clientY - r.top) / r.height - 0.5) * -7); }) as EventListener);
          listen(c, 'pointerleave', () => { qx(0); qy(0); });
        });
        /* ---- botones magnéticos ---- */
        if (matchMedia('(hover:hover)').matches) $$('.btn,.magnetic,.orb').forEach((el) => {
          const isOrb = el.classList.contains('orb'); const s = isOrb ? 0.45 : 0.28;
          const qx = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3' }), qy = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3' });
          const zone = isOrb && el.parentElement ? el.parentElement : el;
          listen(zone, 'pointermove', ((e: PointerEvent) => { const r = el.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * s); qy((e.clientY - r.top - r.height / 2) * s); }) as EventListener);
          listen(zone, 'pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1,.45)' }); });
        });
        /* ---- distorsión SVG al pasar sobre los casos ---- */
        $$('.case .media').forEach((m, i) => {
          const id = `dz${Math.random().toString(36).slice(2, 8)}${i}`; const NS = 'http://www.w3.org/2000/svg';
          const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true'); svg.style.position = 'absolute';
          const filter = document.createElementNS(NS, 'filter'); filter.id = id;
          const turb = document.createElementNS(NS, 'feTurbulence');
          Object.entries({ type: 'fractalNoise', baseFrequency: '0.012 0.04', numOctaves: '2', seed: String(i + 3), result: 'n' }).forEach(([k, v]) => turb.setAttribute(k, v));
          const dm = document.createElementNS(NS, 'feDisplacementMap');
          Object.entries({ in: 'SourceGraphic', in2: 'n', scale: '0', xChannelSelector: 'R', yChannelSelector: 'G' }).forEach(([k, v]) => dm.setAttribute(k, v));
          filter.append(turb, dm); svg.append(filter); document.body.appendChild(svg); off.push(() => svg.remove());
          const img = m.querySelector('img'); const o = { s: 0 };
          if (img) listen(m, 'pointerenter', () => {
            img.style.filter = `url(#${id})`;
            gsap.fromTo(o, { s: 0 }, { s: 18, duration: 0.35, ease: 'power2.out', yoyo: true, repeat: 1, onUpdate: () => dm.setAttribute('scale', String(o.s)), onComplete: () => { img.style.filter = ''; } });
          });
        });
      }
    });

    ScrollTrigger.refresh();
    // recalcula posiciones cuando terminan de cargar las imágenes (una sola vez, con debounce)
    let rt = 0;
    const onImg = () => { clearTimeout(rt); rt = window.setTimeout(() => ScrollTrigger.refresh(), 120); };
    $$<HTMLImageElement>('img').forEach((img) => { if (!img.complete) { img.addEventListener('load', onImg, { once: true }); off.push(() => img.removeEventListener('load', onImg)); } });
    off.push(() => clearTimeout(rt));
  };

    type RIC = (cb: () => void, o?: { timeout: number }) => number;
    const ric = (window as Window & { requestIdleCallback?: RIC }).requestIdleCallback;
    document.fonts.ready.then(() => {
      if (!alive) return;
      split(true);
      if (ric) ric(rest, { timeout: 300 }); else window.setTimeout(rest, 60);
    });
    const onLoad = () => ScrollTrigger.refresh();
    if (document.readyState !== 'complete') { window.addEventListener('load', onLoad, { once: true }); off.push(() => window.removeEventListener('load', onLoad)); }

    return () => { alive = false; off.forEach((f) => f()); ctx.revert(); };
}
