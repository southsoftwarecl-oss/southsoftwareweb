/**
 * Story v3 — "Del commit al cliente". Timeline maestro normalizado a 1.0, scrubbed por scroll:
 *   labels codigo 0 · interfaz .36 · producto .68 · fin 1
 *   Paso 1 0→.34 (tipeo SplitText chars + caret + toast) · 1→2 .30→.42 (tokens → UI con Flip.fit)
 *   Paso 2 .36→.66 (la UI se arma en capas) · 2→3 .62→.74 (paquete + aviso WhatsApp + cambio de layout)
 *   Paso 3 .68→1 (panel en vivo, hero shot final).
 * Solo se animan transform, opacity, clip-path y strokeDashoffset (+ blur del código, que se apaga
 * si el ticker mide <50 fps sostenidos). Las medidas (caret, Flip.fit, curva del paquete) se cachean
 * en onRefresh; onUpdate solo usa quickSetter. Bajo 1025px: tarjetas que se animan una vez.
 * Todo número del panel es DATO DE EJEMPLO.
 */
import { gsap, ScrollTrigger, SplitText, Flip } from '@/lib/gsap';

type Lenis = { scrollTo: (t: number, o?: { duration?: number }) => void } | null;
const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');
const LABELS = { codigo: 0, interfaz: 0.36, producto: 0.68, fin: 1 };
const TOKENS = ['crearPedido', 'cliente', 'items', 'total', 'notificar'];

export function startStory(story: HTMLElement, STATIC: boolean, getLenis: () => Lenis): () => void {
  const off: (() => void)[] = [];
  if (STATIC) return () => {};
  const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = story) => r.querySelector(s) as T;
  const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = story) => Array.from(r.querySelectorAll(s)) as T[];

  /* ================= móvil / tablet: tarjetas que se animan una vez ================= */
  if (innerWidth <= 1024) {
    const cards = $$('.card');
    cards.forEach((c) => gsap.fromTo(c, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'south', scrollTrigger: { trigger: c, start: 'top 80%', once: true } }));
    const chars = new SplitText($$('.c-code .row.key .ln'), { type: 'chars', charsClass: 'ch' }).chars;
    gsap.set(chars, { visibility: 'hidden' });
    ScrollTrigger.create({ trigger: cards[0], start: 'top 80%', once: true, onEnter: () => {
      gsap.to(chars, { visibility: 'visible', duration: 0.001, stagger: 1 / 40, ease: 'none', delay: 0.3 }); } });
    const ui = cards[1];
    const sum = $('[data-sum]', ui); const total = +(sum.dataset.sum || 0); sum.textContent = clp(0);
    ScrollTrigger.create({ trigger: ui, start: 'top 80%', once: true, onEnter: () => {
      gsap.fromTo($$('.m-b,.m-tot,.m-cta', ui), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'south', delay: 0.15 });
      const o = { v: 0 }; gsap.to(o, { v: total, duration: 1.2, ease: 'south', delay: 0.5, onUpdate: () => { sum.textContent = clp(o.v); } });
    } });
    const dash = cards[2];
    const kp = $$('[data-kpi]', dash); kp.forEach((k) => { k.textContent = k.dataset.pre ? clp(0) : '0'; });
    const line = $('.chart-svg .line', dash), area = $('.chart-svg .area', dash);
    gsap.set(line, { strokeDashoffset: 1 }); gsap.set(area, { opacity: 0 });
    ScrollTrigger.create({ trigger: dash, start: 'top 80%', once: true, onEnter: () => {
      kp.forEach((k) => { const end = +(k.dataset.kpi || 0); const o = { v: 0 };
        gsap.to(o, { v: end, duration: 1.2, ease: 'south', delay: 0.2, onUpdate: () => { k.textContent = k.dataset.pre ? clp(o.v) : String(Math.round(o.v)); } }); });
      gsap.to(line, { strokeDashoffset: 0, duration: 1.2, ease: 'south', delay: 0.2 });
      gsap.to(area, { opacity: 1, duration: 1, ease: 'south', delay: 0.6 });
    } });
    return () => {};
  }

  /* ================= desktop ================= */
  const D = $('.sdev'), body = $('.sdev .body'), codeL = $('.sdev .code'), caret = $('.caret'), hl = $('.code .hl');
  const rows = $$('.sdev .code .row'), toast = $('.toast'), app = $('.sdev .app'), side = $('.sdev .side'), head = $('.sdev .head');
  const form = $('.sdev .form'), dash = $('.sdev .dash'), cta = $('.sdev .cta'), pkt = $('.sdev .pkt'), wa = $('.sdev .wa'), fly = $('.sdev .fly');
  const steps = $$('.step'), bars = $$('.sprog b'), btns = $$<HTMLButtonElement>('.sprog button');

  // SplitText: una sola vez (se revierte con ctx.revert del runtime)
  const chars = new SplitText($$('.sdev .code .ln'), { type: 'chars', charsClass: 'ch' }).chars as HTMLElement[];
  const titleLines = steps.map((s) => new SplitText($('h3', s), { type: 'lines', mask: 'lines', linesClass: 'sl' }).lines);
  const uiWords = new SplitText($$('.sdev .form .w,.sdev .side .w,.sdev .head .w'), { type: 'words', mask: 'words', wordsClass: 'sw' }).words;
  const n = chars.length, each = 0.28 / n;
  const charRow = chars.map((c) => rows.indexOf(c.closest('.row') as HTMLElement));

  // clones de los 5 tokens fuente (morph código → UI)
  const srcs = TOKENS.map((t) => $(`.sdev .code [data-tok="${t}"]`));
  const dests = TOKENS.map((t) => $(`.sdev [data-dest="${t}"]`));
  const clones = srcs.map((s) => { const c = document.createElement('span'); c.textContent = s.textContent; if (s.className) c.classList.add(s.className); fly.append(c); return c; });
  off.push(() => clones.forEach((c) => c.remove()));
  const cs = clones.map((c) => ({ x: gsap.quickSetter(c, 'x', 'px'), y: gsap.quickSetter(c, 'y', 'px'), sx: gsap.quickSetter(c, 'scaleX'), sy: gsap.quickSetter(c, 'scaleY') }));
  const fits = clones.map(() => ({ x: 0, y: 0, sx: 1, sy: 1 }));

  // estado inicial
  gsap.set(D, { rotateY: -8, rotateX: 6, transformPerspective: 1600, transformOrigin: '60% 50%' });
  gsap.set(chars, { visibility: 'hidden' });
  titleLines.slice(1).forEach((l) => gsap.set(l, { yPercent: 110 }));
  gsap.set(uiWords, { yPercent: 110 });
  const kp = $$('.sdev [data-kpi]'); kp.forEach((k) => { k.textContent = k.dataset.pre ? clp(0) : '0'; });
  const sum = $('.sdev .sum'), TOTAL = +(sum.dataset.sum || 0); sum.textContent = clp(0);
  gsap.set($('.sdev .chart-svg .line'), { strokeDashoffset: 1 }); gsap.set($('.sdev .chart-svg .area'), { opacity: 0 });

  // cachés (onRefresh)
  const cx: number[] = [], cy: number[] = [], ry: number[] = []; let x0 = 40, y0 = 0, headK = 1;
  const pk = { ax: 0, ay: 0, bx: 0, by: 0, cx: 0, cy: 0 };
  const setCX = gsap.quickSetter(caret, 'x', 'px'), setCY = gsap.quickSetter(caret, 'y', 'px'), setHL = gsap.quickSetter(hl, 'y', 'px');
  const setPX = gsap.quickSetter(pkt, 'x', 'px'), setPY = gsap.quickSetter(pkt, 'y', 'px');
  const setBar = bars.map((b) => gsap.quickSetter(b, 'scaleX'));

  const rel = (el: Element, r0: DOMRect) => { const r = el.getBoundingClientRect(); return { x: r.left - r0.left, y: r.top - r0.top, w: r.width, h: r.height }; };
  let built = false;
  const measure = () => {
    if (!built) return;
    // caret / resaltado: offsets (no dependen de transforms)
    const lh = rows[0].offsetHeight, ch = parseFloat(getComputedStyle(codeL).fontSize) * 1.1;
    rows.forEach((r, i) => { ry[i] = r.offsetTop; });
    chars.forEach((c, i) => { cx[i] = c.offsetLeft + c.offsetWidth; cy[i] = ry[charRow[i]] + (lh - ch) / 2; });
    x0 = (rows[0].firstElementChild as HTMLElement).offsetWidth; y0 = ry[0] + (lh - ch) / 2;
    headK = (head.offsetWidth + 88) / head.offsetWidth;
    // Flip.fit precalculado con la ventana sin rotación y la UI en su estado armado
    const t = tl.time(), tr = D.style.transform;
    tl.time(0.29, true); D.style.transform = 'none';
    let b0 = body.getBoundingClientRect();
    srcs.forEach((s, i) => { const r = rel(s, b0); const c = clones[i];
      c.style.fontSize = getComputedStyle(s).fontSize; c.style.left = r.x + 'px'; c.style.top = r.y + 'px'; });
    tl.time(0.58, true); D.style.transform = 'none'; b0 = body.getBoundingClientRect();
    clones.forEach((c, i) => {
      gsap.set(c, { x: 0, y: 0, scaleX: 1, scaleY: 1 });
      const v = Flip.fit(c, dests[i], { scale: true, getVars: true }) as { x?: number; y?: number; scaleX?: number; scaleY?: number } | null;
      if (v && typeof v.x === 'number') fits[i] = { x: v.x, y: v.y || 0, sx: v.scaleX ?? 1, sy: v.scaleY ?? 1 };
      else { const a = c.getBoundingClientRect(), d = dests[i].getBoundingClientRect(); fits[i] = { x: d.left - a.left, y: d.top - a.top, sx: d.width / a.width, sy: d.height / a.height }; }
    });
    const a = rel(cta, b0), row = rel($('.sdev .tr.new'), b0);
    pk.ax = a.x + 10; pk.ay = a.y + 2; pk.bx = row.x - 88 + 4; pk.by = row.y; pk.cx = (pk.ax + pk.bx) / 2 + 40; pk.cy = Math.min(pk.ay, pk.by) - 70;
    tl.time(t, true); D.style.transform = tr;
  };

  const snap = navigator.webdriver ? undefined : { snapTo: 'labelsDirectional' as const, duration: { min: 0.25, max: 0.6 }, ease: 'south', delay: 0.05 };
  let active = -1, lastRow = -1;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: story, start: 'top top', end: 'bottom bottom', scrub: 0.6, snap, onRefresh: () => measure() },
    onUpdate: () => {
      const t = tl.time();
      // caret + línea activa
      const k = Math.max(0, Math.min(n, Math.floor((t - 0.02) / each) + 1));
      const r = k ? charRow[k - 1] : 0;
      setCX(k ? cx[k - 1] + 1 : x0); setCY(k ? cy[k - 1] : y0);
      if (r !== lastRow) { rows[lastRow]?.classList.remove('on'); rows[r].classList.add('on'); setHL(ry[r]); lastRow = r; }
      // progreso con etiquetas
      setBar[0](Math.min(1, t / 0.36)); setBar[1](Math.max(0, Math.min(1, (t - 0.36) / 0.32))); setBar[2](Math.max(0, Math.min(1, (t - 0.68) / 0.32)));
      const a = t < 0.36 ? 0 : t < 0.68 ? 1 : 2;
      if (a !== active) { btns.forEach((b, i) => { if (i === a) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); active = a; }
    },
  });
  Object.entries(LABELS).forEach(([l, v]) => tl.addLabel(l, v));
  tl.set({}, {}, 1); // duración total = 1.0

  /* ---- Paso 1: código (0 → .34) ---- */
  tl.to(chars, { visibility: 'visible', duration: 0.0001, stagger: each }, 0.02)
    .fromTo(D, { '--sw': '-120%' }, { '--sw': '120%', duration: 0.08, ease: 'south' }, 0.28)
    .fromTo(toast, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.02, ease: 'south' }, 0.30)
    .to($$('p', toast)[0], { opacity: 1, duration: 0.01, ease: 'south' }, 0.305)
    .to($$('p', toast)[1], { opacity: 1, duration: 0.01, ease: 'south' }, 0.325)
    .to([toast, caret, hl], { opacity: 0, duration: 0.02, ease: 'south-in' }, 0.345);

  /* ---- Transición 1→2 (.30 → .42): tokens → UI ---- */
  const m = { p: 0 };
  const applyFly = () => { const p = m.p; for (let i = 0; i < cs.length; i++) { const f = fits[i]; cs[i].x(f.x * p); cs[i].y(f.y * p); cs[i].sx(1 + (f.sx - 1) * p); cs[i].sy(1 + (f.sy - 1) * p); } };
  tl.set(clones, { opacity: 1 }, 0.305)
    .to(m, { p: 1, duration: 0.1, ease: 'mercury', onUpdate: applyFly }, 0.31)
    .to(clones, { opacity: 0, duration: 0.015, ease: 'south' }, 0.405)
    .to(rows, { opacity: 0, y: -12, duration: 0.05, stagger: 0.004, ease: 'south' }, 0.31);
  const blurTw = gsap.fromTo(codeL, { filter: 'blur(0px)' }, { filter: 'blur(4px)', duration: 0.07, ease: 'south', immediateRender: false });
  tl.add(blurTw, 0.31)
    .to(D, { rotateY: 0, rotateX: 2, duration: 0.12, ease: 'south' }, 0.30);

  /* ---- Paso 2: interfaz (.36 → .66) ---- */
  const formBlks = [side, head, ...$$('.sdev .form .blk'), cta];
  tl.to(app, { opacity: 1, duration: 0.02 }, 0.34)
    .fromTo(formBlks, { z: -60, opacity: 0, transformPerspective: 1600 }, { z: 0, opacity: 1, duration: 0.1, stagger: 0.012, ease: 'mercury' }, 0.36)
    .to($$('.sdev .form .bd,.sdev .side>.bd,.sdev .head>.bd'), { opacity: 0, duration: 0.06, stagger: 0.012, ease: 'south' }, 0.42)
    .to($$('.sdev .form .bs,.sdev .side>.bs,.sdev .head>.bs'), { opacity: 1, duration: 0.06, stagger: 0.012, ease: 'south' }, 0.42)
    .to(uiWords, { yPercent: 0, duration: 0.05, stagger: 0.006, ease: 'south' }, 0.395);
  const o = { v: 0 };
  tl.to(o, { v: TOTAL, duration: 0.1, ease: 'south', onUpdate: () => { sum.textContent = clp(o.v); } }, 0.5)
    .to(cta, { scale: 0.96, duration: 0.015, ease: 'south' }, 0.6)
    .to(cta, { scale: 1, duration: 0.03, ease: 'mercury' }, 0.615);

  /* ---- Transición 2→3 (.62 → .74): del clic al dato ---- */
  const pm = { p: 0 };
  tl.set(pkt, { opacity: 1 }, 0.625)
    .to(pm, { p: 1, duration: 0.09, ease: 'south', onUpdate: () => { const t = pm.p, u = 1 - t;
      setPX(u * u * pk.ax + 2 * u * t * pk.cx + t * t * pk.bx); setPY(u * u * pk.ay + 2 * u * t * pk.cy + t * t * pk.by); } }, 0.625)
    .to(pkt, { opacity: 0, duration: 0.01 }, 0.712)
    .fromTo(wa, { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.03, ease: 'south' }, 0.63)
    .to(wa, { y: -8, opacity: 0, duration: 0.02, ease: 'south-in' }, 0.71)
    // cambio de layout formulario → panel (sidebar a íconos, header se extiende)
    .fromTo(side, { clipPath: 'inset(0px 0px 0px 0px round 10px)' }, { clipPath: 'inset(0px 88px 0px 0px round 10px)', duration: 0.08, ease: 'south' }, 0.64)
    .to($$('.sdev .side .w'), { opacity: 0, duration: 0.03, ease: 'south-in' }, 0.63)
    .to(head, { x: -88, duration: 0.08, ease: 'south' }, 0.64)
    .to($$('.sdev .head>.bd,.sdev .head>.bs'), { scaleX: () => headK, transformOrigin: '0 50%', duration: 0.08, ease: 'south' }, 0.64)
    .to(form, { opacity: 0, y: -10, duration: 0.04, ease: 'south-in' }, 0.64)
    .to($('.sdev .t-form'), { yPercent: -110, opacity: 0, duration: 0.03, ease: 'south-in' }, 0.65)
    .fromTo($('.sdev .t-dash'), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.04, ease: 'south' }, 0.67)
    .to(dash, { opacity: 1, duration: 0.03 }, 0.68);

  /* ---- Paso 3: producto (.68 → 1) ---- */
  tl.fromTo($$('.sdev .dash .blk'), { z: -60, transformPerspective: 1600 }, { z: 0, duration: 0.1, stagger: 0.015, ease: 'mercury' }, 0.68);
  kp.forEach((k, i) => { const end = +(k.dataset.kpi || 0), v = { v: 0 };
    tl.to(v, { v: end, duration: 0.14, ease: 'south', onUpdate: () => { k.textContent = k.dataset.pre ? clp(v.v) : String(Math.round(v.v)); } }, 0.72 + i * 0.01); });
  const trs = $$('.sdev .tr');
  tl.fromTo($('.sdev .chart-svg .line'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.18, ease: 'south' }, 0.72)
    .to($('.sdev .chart-svg .area'), { opacity: 1, duration: 0.14, ease: 'south' }, 0.78)
    .fromTo(trs, { yPercent: -100 }, { yPercent: 0, duration: 0.05, ease: 'south' }, 0.71)
    .fromTo(trs[0], { opacity: 0 }, { opacity: 1, duration: 0.04, ease: 'south' }, 0.71)
    .fromTo($('.sdev .tr .hi'), { opacity: 1 }, { opacity: 0, duration: 0.16, ease: 'south' }, 0.76)
    .to(D, { rotateY: -11, rotateX: 6.6, z: 44, duration: 0.18, ease: 'south' }, 0.74)
    .to(D, { rotateY: -10, rotateX: 6, z: 40, duration: 0.08, ease: 'mercury' }, 0.92)
    .to($('.sdev .rim'), { opacity: 1, duration: 0.04, ease: 'south' }, 0.8)
    .fromTo(D, { '--rp': '-60%' }, { '--rp': '160%', duration: 0.18, ease: 'south' }, 0.82)
    .to($('.floor'), { opacity: 1, duration: 0.14, ease: 'south' }, 0.76);

  /* ---- Copy: títulos con máscara, sin cross-fade (un solo .step visible) ---- */
  const meta = steps.map((s) => [$('.mono', s), $('p', s)]);
  [[0, 0.31, 0.345], [1, 0.63, 0.665]].forEach(([i, out, sw]) => {
    tl.to(titleLines[i], { yPercent: -110, duration: 0.03, stagger: 0.004, ease: 'south-in' }, out)
      .to(meta[i], { opacity: 0, y: -12, duration: 0.03, ease: 'south-in' }, out)
      .set(steps[i], { opacity: 0 }, sw).set(steps[i + 1], { opacity: 1 }, sw)
      .fromTo(titleLines[i + 1], { yPercent: 110 }, { yPercent: 0, duration: 0.05, stagger: 0.006, ease: 'south' }, sw + 0.015)
      .fromTo(meta[i + 1], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.04, ease: 'south' }, sw + 0.025);
  });

  const st = tl.scrollTrigger!;
  // botones del indicador → label del timeline
  btns.forEach((b, i) => { const go = () => { const y = st.start + (st.end - st.start) * [0, 0.36, 0.68][i] + 2; const l = getLenis(); if (l) l.scrollTo(y, { duration: 1.2 }); else window.scrollTo(0, y); };
    b.addEventListener('click', go); off.push(() => b.removeEventListener('click', go)); });

  // caret parpadea solo con el scroll quieto; blur se apaga con <50 fps sostenidos
  let acc = 0, frames = 0, low = 0, blurOn = true, blink = false;
  const tick = (_t: number, dt: number) => {
    const still = st.isActive && Math.abs(st.getVelocity()) < 5;
    if (still !== blink) { caret.classList.toggle('blink', still); blink = still; }
    if (!blurOn || !st.isActive) return;
    acc += dt; frames++;
    if (acc >= 1000) { const fps = (frames * 1000) / acc; low = fps < 50 ? low + 1 : 0; acc = 0; frames = 0;
      if (low >= 2) { blurOn = false; blurTw.kill(); gsap.set(codeL, { filter: 'none' }); story.dataset.blur = 'off'; } }
  };
  gsap.ticker.add(tick); off.push(() => gsap.ticker.remove(tick));
  built = true; measure();
  return () => off.forEach((f) => f());
}
