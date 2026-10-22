'use client';
/**
 * Hero "metal líquido" (opción C).
 * Simulación GPGPU (engine.ts): resortes hacia el texto (k=18) y la esfera (k=10)
 * mezclados por el scroll, curl noise, cohesión con vecinos, cursor con empuje
 * gaussiano, onda y arrastre; amortiguación exp(-6.5·dt).
 * Render: gotas metálicas impostoras + (gama alta) superficie de fluido en pantalla.
 * Colores = tokens CSS (props desde HeroCanvas). Niveles: ./tiers.ts.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap, ScrollTrigger, setupGsap } from '@/lib/gsap';
import { RT, onIntro } from '@/lib/runtime';
import { FOV, LiquidEngine, makeMatcap, VIS_H, type FrameInput, type Tokens } from './engine';
import { Dust } from './dust';
import { targetsKernel, targetsWorker, type Targets } from './targets';
import { effectiveCfg, forcedTier, type Tier, type TierCfg } from './tiers';

type Lines = { text: string; size: number; y: number }[];
export const LOGO_LINES: Lines = [{ text: 'SOUTH', size: 210, y: 140 }, { text: 'SOFTWARE', size: 116, y: 330 }];

/** Rasteriza el texto en un canvas 2D y devuelve los píxeles encendidos como puntos. */
function sampleText(lines: Lines, font: string) {
  const c = document.createElement('canvas'); c.width = 1400; c.height = 420;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = 'white'; g.textAlign = 'center'; g.textBaseline = 'middle'; /* blanco = máscara de muestreo, no color visible */
  for (const l of lines) { g.font = `400 ${l.size}px ${font}, sans-serif`; g.fillText(l.text, 700, l.y); }
  const d = g.getImageData(0, 0, 1400, 420).data; const edge: [number, number][] = [], fill: [number, number][] = [];
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < 1400 && y < 420 && d[(y * 1400 + x) * 4] > 128;
  for (let y = 0; y < 420; y += 2) for (let x = 0; x < 1400; x += 2) {
    if (!on(x, y)) continue;
    const p: [number, number] = [(x - 700) / 100, (210 - y) / 100];
    (on(x - 3, y) && on(x + 3, y) && on(x, y - 3) && on(x, y + 3) ? fill : edge).push(p);
  }
  // muestreo ponderado al contorno (60 % borde / 40 % relleno) → letras con bordes definidos
  if (!edge.length || !fill.length) return new Float32Array([...edge, ...fill].flat());
  const rep = Math.max(1, Math.round((0.6 / 0.4) * fill.length / edge.length));
  const out = new Float32Array((fill.length + edge.length * rep) * 2); let o = 0;
  for (const p of fill) { out[o++] = p[0]; out[o++] = p[1]; }
  for (let r = 0; r < rep; r++) for (const p of edge) { out[o++] = p[0]; out[o++] = p[1]; }
  return out;
}

const damp = THREE.MathUtils.damp;

/**
 * Loop cinematográfico (~14,4 s, sin saltos): logo 3,8 s (respiración curl + barrido de luz) → red 1,8 s →
 * globo 2 s (girando) → cubo de código 1,6 s → logo. Transiciones 1,2 s (vuelta al logo 1,6 s) con estallido
 * hacia la cámara y reagrupado. Clic/tap en el hero (fuera de enlaces/botones) salta a la siguiente forma.
 */
const SEQ = [{ s: 0, h: 3.8, tr: 1.2 }, { s: 1, h: 1.8, tr: 1.2 }, { s: 2, h: 2, tr: 1.2 }, { s: 3, h: 1.6, tr: 1.6 }];
export const LOOP = SEQ.reduce((a, q) => a + q.h + q.tr, 0);
type Phase = { a: number; b: number; u: number; hold: boolean; hp: number; i: number; segEnd: number };
function phaseAt(tl: number, out: Phase) {
  let t = ((tl % LOOP) + LOOP) % LOOP;
  for (let i = 0; i < SEQ.length; i++) {
    const q = SEQ[i], nx = SEQ[(i + 1) % SEQ.length].s;
    if (t < q.h) { Object.assign(out, { a: q.s, b: q.s, u: 0, hold: true, hp: t / q.h, i, segEnd: tl - t + q.h }); return out; }
    t -= q.h;
    if (t < q.tr) { Object.assign(out, { a: q.s, b: nx, u: t / q.tr, hold: false, hp: 0, i, segEnd: tl - t + q.tr }); return out; }
    t -= q.tr;
  }
  return out;
}
const ease = (x: number) => x * x * (3 - 2 * x);
const TOUCH = () => matchMedia('(hover:none)').matches;

/** Encuadre: desktop como el preview; vertical ajustado al ancho; y siempre ≥32 px sobre `.status`. */
function frameText(out: { scale: number; posY: number }, w: number, h: number, b: { minX: number; maxX: number; minY: number; maxY: number }, statusTop: number | null) {
  const aspect = w / Math.max(h, 1);
  let scale = w < 760 ? 0.55 : 1, posY = 0;
  if (aspect < 1) {
    const visW = VIS_H * aspect;
    scale = Math.min(0.55, (visW * 0.86) / Math.max(b.maxX - b.minX, 1));
    posY = 2.3 - 1.3 * scale;
  }
  if (statusTop) {
    const ppw = h / VIS_H, NAV = 92, limit = statusTop - 32 - 8; // +8 px: radio de gota y ruido curl
    const yPx = (Y: number) => h / 2 - Y * ppw; // posición en pantalla de una Y de mundo
    if (yPx(posY + scale * b.minY) > limit) posY = (h / 2 - limit) / ppw - scale * b.minY;
    if (yPx(posY + scale * b.maxY) < NAV) {
      scale = Math.max(0.2, (limit - NAV) / ppw / Math.max(b.maxY - b.minY, 1e-3));
      posY = (h / 2 - limit) / ppw - scale * b.minY;
    }
  }
  out.scale = scale; out.posY = posY;
}

/** Cuadros renderizados (con el logo ya en sus destinos) antes de avisar que el canvas puede cubrir el póster:
 *  el primero compila shaders y sube texturas; los siguientes ya salen a ritmo normal (sin saltos al hacer el fundido). */
const WARM_FRAMES = 4;

function Liquid({ lines, font, cfg, tokens, onFirst, fromPoster, handoffMs }: { lines: Lines; font: string; cfg: TierCfg; tokens: Tokens; onFirst: () => void; fromPoster: boolean; handoffMs: number }) {
  const { gl, scene, camera, size, viewport, invalidate } = useThree();
  const group = useRef<THREE.Group>(null);
  // estado mutable del frame (sin setState en useFrame, sin asignaciones por frame)
  const S = useRef({
    engine: null as LiquidEngine | null, intro: { v: RT.static || fromPoster ? 1 : 0 }, warm: -1, still: false, freeze: fromPoster, t0: 0, prog: 0, mix: 0, mixFrom: 1, goingUp: false, upStart: 0,
    mouseW: new THREE.Vector3(99, 99, 0), mouseT: new THREE.Vector3(), mouseL: new THREE.Vector3(), last: new THREE.Vector2(-1, -1),
    velPx: new THREE.Vector2(), velW: new THREE.Vector2(), velL: new THREE.Vector2(), speed: 0, peak: 0, cursor: 0,
    ripO: new THREE.Vector3(99, 99, 0), ripW: new THREE.Vector3(99, 99, 0), ripT: 9, rotY: 0, fr: { scale: 1, posY: 0 }, ripA: 0, touchAt: -1, liquid: 0.85,
    ray: new THREE.Raycaster(), plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), ndc: new THREE.Vector2(), inv: new THREE.Matrix4(),
    mouseUv: new THREE.Vector2(-9, -9), statusTop: null as number | null, hero: null as HTMLElement | null, heroTop: 0, heroH: 1,
    f: null as FrameInput | null, scale: 1, onFirst: null as (() => void) | null,
    // loop de formas y cámara
    tl: 0, skip: false, fixedTl: null as number | null, ph: { a: 0, b: 0, u: 0, hold: true, hp: 0, i: 0, segEnd: 0 } as Phase,
    camR: 13, orbit: 0, rec: false, simT: 0, tilt: new THREE.Vector2(), tiltOn: false, dust: null as Dust | null,
  });

  // motor: se crea/destruye con el nivel de calidad
  useEffect(() => {
    const st = S.current;
    let env: THREE.WebGLRenderTarget | null = null, matcap: THREE.Texture | null = null;
    if (cfg.matcap) matcap = makeMatcap(tokens);
    else {
      const pm = new THREE.PMREMGenerator(gl); const room = new RoomEnvironment();
      env = pm.fromScene(room, 0.04); room.dispose(); pm.dispose();
    }
    const engine = new LiquidEngine(gl, cfg, tokens, env?.texture ?? null, matcap);
    st.engine = engine;
    if (forcedTier() || /[?&]qa\b/.test(location.search)) (window as unknown as { __liq?: unknown }).__liq = st; // QA (?gl=…): inspección desde Playwright
    const grp = group.current;
    grp?.add(engine.points);
    const dust = new Dust(cfg.dust, tokens.chrome1); st.dust = dust; scene.add(dust.points);
    const qtl = new URLSearchParams(location.search).get('tl'); st.fixedTl = qtl !== null && forcedTier() ? Number(qtl) : null; st.rec = !!forcedTier() && /[?&]rec\b/.test(location.search); // QA: congelar el loop en un instante
    st.still = !!forcedTier() && /[?&]poster\b/.test(location.search); // QA ?poster: primer cuadro exacto (t=0, cámara fija, sin polvo) para regenerar el póster
    if (st.still) dust.points.visible = false;
    // destinos: se rasteriza el texto (una vez, con la fuente ya cargada) y el resto se calcula en un Worker
    let alive = true, worker: Worker | null = null;
    const apply = (r: Targets) => {
      if (!alive) return;
      engine.applyTargets(r, RT.static || st.intro.v > 0.5 ? 'text' : 'scatter');
      engine.points.visible = true;
      // precompila los programas de la escena (evita el tirón de compilación en el primer cuadro visible)
      try { gl.compile(scene, camera); } catch { /* opcional */ }
      st.warm = 0; invalidate(); // useFrame cuenta WARM_FRAMES cuadros reales y recién ahí avisa (onFirst)
      st.onFirst = () => { if (alive) onFirst(); };
    };
    engine.points.visible = false;
    const run = () => {
      if (!alive) return;
      const pts = sampleText(lines, font), { N, count } = engine.size;
      const local = () => apply(targetsKernel()(pts, N, count)); // respaldo (sin Worker)
      worker = targetsWorker();
      if (!worker) { local(); return; }
      worker.onmessage = (e: MessageEvent<{ r: Targets }>) => { apply(e.data.r); worker?.terminate(); worker = null; };
      worker.onerror = () => { worker?.terminate(); worker = null; local(); };
      worker.postMessage({ id: 1, pts: pts.slice(), N, count }); // copia: `pts` queda para el respaldo
    };
    Promise.race([document.fonts.load(`200px ${font}`), new Promise((r) => setTimeout(r, 1500))]).then(run, run);
    st.f = {
      dt: 0, t: 0, mix: 0, intro: st.intro.v, live: RT.static ? 0 : 1, scale: 1, mouseLocal: st.mouseL, mouseVel: st.velL, cursor: 0, radius: 1,
      ripO: st.ripO, ripT: 9, ripA: 0, mouseUv: st.mouseUv, liquid: 0.85, rUv: 0.1, static: RT.static,
      a: 0, b: 0, u: 0, burst: 0, sweep: -9,
    };
    return () => {
      alive = false; worker?.terminate(); grp?.remove(engine.points); engine.dispose(); st.engine = null;
      scene.remove(dust.points); dust.dispose(); st.dust = null;
      env?.dispose(); matcap?.dispose();
    };
  }, [gl, scene, camera, cfg, tokens, lines, font, invalidate, onFirst]);

  // intro: uIn 0→1 en 2,4 s (ease 'south') cuando se abre el preloader
  useEffect(() => {
    if (RT.static || fromPoster) return; // con póster el logo ya está armado: sin vuelo de entrada (el póster se disuelve en él)
    setupGsap();
    const st = S.current;
    let tw: gsap.core.Tween | null = null;
    const off = onIntro(() => { tw = gsap.to(st.intro, { v: 1, duration: 1.2, ease: 'south' }); });
    return () => { off(); tw?.kill(); };
  }, [fromPoster]);

  // progreso de scroll del hero vía ScrollTrigger (no se mide el DOM en cada frame)
  useEffect(() => {
    const st = S.current;
    const hero = gl.domElement.closest('.hero') as HTMLElement | null;
    st.hero = hero;
    const measure = () => {
      if (!hero) return;
      st.heroTop = hero.getBoundingClientRect().top + scrollY; st.heroH = hero.offsetHeight;
      // top de `.status` relativo al hero (sin transformaciones)
      const status = hero.querySelector<HTMLElement>('.status');
      let y = 0; let el: HTMLElement | null = status;
      while (el && el !== hero) { y += el.offsetTop; el = el.offsetParent as HTMLElement | null; }
      st.statusTop = status ? y : null;
      invalidate();
    };
    measure();
    addEventListener('resize', measure);
    let trig: ScrollTrigger | null = null;
    if (hero && !RT.static) {
      setupGsap();
      // al bajar: la cámara retrocede (useFrame) y el hero se funde a negro hacia la siguiente sección
      trig = ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: (s) => { st.prog = s.progress; gl.domElement.style.opacity = String(1 - ease(Math.min(1, s.progress * 1.25))); } });
    }
    // táctil: la onda solo existe mientras el dedo se mueve
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]; if (!t) return;
      const m = RT.mouse; m.moved = true; m.x = t.clientX; m.y = t.clientY; st.touchAt = performance.now();
    };
    hero?.addEventListener('touchmove', onTouch, { passive: true });
    hero?.addEventListener('touchstart', onTouch, { passive: true });
    // clic/tap en el hero (no en enlaces ni botones) → siguiente forma
    const onDown = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest('a,button,input,select,textarea,label')) st.skip = true; };
    hero?.addEventListener('pointerdown', onDown);
    // inclinación del celular: en iOS el permiso se pide recién tras un toque; sin permiso → deriva automática
    const onTilt = (e: DeviceOrientationEvent) => { if (e.gamma == null || e.beta == null) return; st.tiltOn = true; st.tilt.set(THREE.MathUtils.clamp(e.gamma / 30, -1, 1), THREE.MathUtils.clamp((e.beta - 45) / 30, -1, 1)); };
    type DOE = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
    const DO = typeof DeviceOrientationEvent !== 'undefined' ? (DeviceOrientationEvent as DOE) : null;
    const askTilt = () => { DO?.requestPermission?.().then((r) => { if (r === 'granted') addEventListener('deviceorientation', onTilt); }).catch(() => {}); };
    if (TOUCH() && DO && !RT.static) { if (DO.requestPermission) hero?.addEventListener('touchend', askTilt, { once: true }); else addEventListener('deviceorientation', onTilt); }
    return () => {
      removeEventListener('resize', measure); trig?.kill(); hero?.removeEventListener('touchmove', onTouch); hero?.removeEventListener('touchstart', onTouch);
      hero?.removeEventListener('pointerdown', onDown); hero?.removeEventListener('touchend', askTilt); removeEventListener('deviceorientation', onTilt);
      gl.domElement.style.opacity = '';
    };
  }, [gl, invalidate]);

  useEffect(() => { S.current.engine?.resize(size.width, size.height, viewport.dpr); invalidate(); }, [size.width, size.height, viewport.dpr, cfg, invalidate]);

  useFrame((state, delta) => {
    const st = S.current, E = st.engine, f = st.f, g = group.current;
    if (!E || !f || !g) return;
    const dt = Math.min(delta, 1 / 30);
    // QA ?rec: reloj simulado (dt fijo) para grabar el loop con GPU por software sin cámara acelerada
    // con póster: todo queda congelado en el cuadro del póster (t=0, cámara frontal, loop detenido) hasta terminar el
    // fundido; después el reloj arranca desde 0, así el movimiento nace suave desde la pose del póster.
    if (st.freeze && st.warm === -1 && st.onFirst === null && st.t0 < 0) { st.freeze = false; st.t0 = state.clock.elapsedTime; }
    const t = st.still || st.freeze ? 0 : st.rec ? (st.simT += dt) : state.clock.elapsedTime - st.t0;
    const touch = TOUCH();
    const mix = 0; // (el morph texto→esfera por scroll fue reemplazado por el loop de formas)
    // --- loop de formas: arranca cuando termina la intro; congelado en reduced motion / captura ---
    const ph = st.ph;
    if (!RT.static && !st.still && !st.freeze && st.intro.v >= 1) {
      if (st.fixedTl !== null) st.tl = st.fixedTl;
      else { if (st.skip) { phaseAt(st.tl, ph); st.tl = ph.hold ? ph.segEnd : ph.segEnd + 1e-3; } st.tl += dt; }
    }
    st.skip = false;
    phaseAt(RT.static ? 0 : st.tl, ph);
    const burst = ph.hold ? 0 : 1, tu = ph.hold ? 0 : ease(ph.u);
    // barrido de luz al quedar armado el logo (0,3 → 1,9 s del hold)
    const sw = ph.hold && ph.a === 0 ? (ph.hp * SEQ[0].h - 0.3) / 1.6 : -1;
    const sweep = sw >= 0 && sw <= 1 ? -1.4 + 2.8 * ease(sw) : -9;
    // --- cámara: dolly-in lento en cada hold, push-in en transiciones, órbita suave, micro-shake, retroceso por scroll ---
    const desk = size.width >= 760 && size.width >= size.height;
    const logoW = ph.hold ? (ph.a === 0 ? 1 : 0) : ph.a === 0 ? 1 - tu : ph.b === 0 ? tu : 0; // cuánto "es logo" la escena
    if (!RT.static && !st.still && !st.freeze) {
      const dolly = ph.hold ? ease(ph.hp) * (ph.a === 0 ? (desk ? 0.7 : 0) : desk ? 1.6 : 0.6) : 0;
      const push = ph.hold ? 0 : Math.sin(Math.PI * ph.u) * 0.6;
      const r = 13 - dolly - push + ease(Math.min(1, st.prog * 1.2)) * 6;
      st.camR = damp(st.camR, r, 2.5, dt);
      // en celular el logo armado queda quieto (legible y bajo el header); la órbita vuelve en las otras formas
      st.orbit = damp(st.orbit, (desk ? 0.35 : 0) + (1 - logoW) * (desk ? 0.65 : 0.6), 2, dt);
      const tx = st.tiltOn ? st.tilt.x * 5 : Math.sin(t * 0.09) * 2, ty = st.tiltOn ? st.tilt.y * 5 : 0; // ±5° tilt (o deriva)
      const k = touch ? (1 - logoW * (desk ? 0 : 1)) : 0;
      const yaw = THREE.MathUtils.degToRad(Math.sin(t * 0.17) * 8 * st.orbit + tx * k);
      const pitch = THREE.MathUtils.degToRad(Math.sin(t * 0.11 + 1) * 3 * st.orbit + ty * k);
      const sh = 0.003 * 13 * (desk ? 1 : 0.5);
      camera.position.set(st.camR * Math.sin(yaw) * Math.cos(pitch) + Math.sin(t * 7.1) * Math.sin(t * 3.3) * sh,
        st.camR * Math.sin(pitch) + Math.sin(t * 6.3 + 2) * Math.sin(t * 2.7) * sh, st.camR * Math.cos(yaw) * Math.cos(pitch));
      camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    }
    st.dust?.update(t, viewport.dpr);
    // --- cursor en mundo (damp λ10) ---
    const m = RT.mouse, canvasY = m.y + scrollY - st.heroTop;
    const over = m.moved && canvasY >= 0 && canvasY <= size.height;
    const touchLive = touch && performance.now() - st.touchAt < 160;
    st.ndc.set((m.x / size.width) * 2 - 1, -((canvasY / size.height) * 2 - 1));
    st.ray.setFromCamera(st.ndc, camera); st.ray.ray.intersectPlane(st.plane, st.mouseT);
    if (st.last.x < 0) st.mouseW.copy(st.mouseT);
    st.mouseW.set(damp(st.mouseW.x, st.mouseT.x, 10, dt), damp(st.mouseW.y, st.mouseT.y, 10, dt), 0);
    // velocidad del cursor (px/s → mundo/s), suavizada con lerp .12
    const vx = st.last.x < 0 ? 0 : (m.x - st.last.x) / Math.max(delta, 1e-3), vy = st.last.x < 0 ? 0 : (canvasY - st.last.y) / Math.max(delta, 1e-3);
    st.last.set(m.x, canvasY);
    st.velPx.x += (vx - st.velPx.x) * 0.12; st.velPx.y += (vy - st.velPx.y) * 0.12;
    const ppw = size.height / VIS_H;
    st.velW.set(st.velPx.x / ppw, -st.velPx.y / ppw).clampLength(0, 4);
    st.speed = st.velPx.length();
    // radio: 70 px CSS → unidades de mundo (20 % menor en táctil)
    const radius = (70 * (touch ? 0.8 : 1) * VIS_H) / innerHeight;
    const active = !RT.static && !st.freeze && !st.still && (touch ? touchLive : over);
    st.cursor = damp(st.cursor, active ? 1 : 0, 8, dt);
    // onda: nace donde el cursor se detiene (o mientras el dedo se mueve)
    st.ripT += dt; st.ripA *= Math.exp(-1.4 * dt);
    if (!RT.static) {
      if (touch) { if (touchLive) { st.ripW.copy(st.mouseW); st.ripA = 1; st.ripT = st.ripT > 2 ? 0 : st.ripT; } }
      else if (over) {
        st.peak = Math.max(st.peak * Math.exp(-2 * dt), st.speed);
        if (st.speed < 25 && st.peak > 220) { st.ripW.copy(st.mouseW); st.ripT = 0; st.ripA = 1; st.peak = 0; }
      }
    }
    // --- encuadre (escala/posición) y rotación del grupo (damp λ3, máx ±.12 Y / ±.07 X) ---
    frameText(st.fr, size.width, size.height, E.bounds, st.statusTop);
    g.scale.setScalar(st.fr.scale); g.position.y = st.fr.posY;
    if (!RT.static && !st.freeze && !st.still) {
      const live = over || touchLive;
      st.rotY = damp(st.rotY, live ? THREE.MathUtils.clamp(m.nx, -1, 1) * 0.12 : 0, 3, dt);
      g.rotation.x = damp(g.rotation.x, live ? THREE.MathUtils.clamp(-m.ny, -1, 1) * 0.07 : 0, 3, dt);
      g.rotation.y = st.rotY;
    }
    g.updateMatrixWorld();
    // cursor y onda en coordenadas locales de las partículas
    st.inv.copy(g.matrixWorld).invert();
    st.mouseL.copy(st.mouseW).applyMatrix4(st.inv);
    st.ripO.copy(st.ripW).applyMatrix4(st.inv);
    st.velL.copy(st.velW).multiplyScalar(1 / Math.max(g.scale.x, 1e-3));
    // líquido: .85 en reposo, baja a .3 durante el morph (y cerca del cursor, en el shader)
    st.liquid = 0.85 - 0.55 * (ph.hold ? 0 : Math.sin(Math.PI * ph.u));
    st.mouseUv.set(st.ndc.x * 0.5 + 0.5, st.ndc.y * 0.5 + 0.5);
    if (!active) st.mouseUv.set(-9, -9);
    Object.assign(f, {
      dt: RT.static ? 0 : dt, t, mix: THREE.MathUtils.clamp(mix, -0.06, 1), intro: st.intro.v, live: RT.static ? 0 : 1, scale: g.scale.x,
      cursor: st.cursor, radius, ripT: st.ripT, ripA: st.ripA, liquid: st.liquid, rUv: radius / VIS_H, static: RT.static,
      a: ph.a, b: ph.b, u: ph.u, burst, sweep, steps: st.fixedTl !== null ? 6 : 1,
    });
    E.frame(f, scene, camera);
    if (st.warm >= 0 && ++st.warm >= WARM_FRAMES) {
      st.warm = -1; st.onFirst?.(); st.onFirst = null;
      if (st.freeze) window.setTimeout(() => { st.t0 = -1; }, handoffMs + 50); // t0 = -1 → se libera en el próximo cuadro
    }
  }, 1);

  return <group ref={group} />;
}

/** Pausa el render cuando el hero sale de pantalla o la pestaña se oculta; demanda única en reduced motion. */
function VisibilityLoop() {
  const { gl, setFrameloop } = useThree();
  useEffect(() => {
    if (RT.static) { setFrameloop('demand'); return; }
    let vis = true;
    const apply = () => setFrameloop(vis && !document.hidden ? 'always' : 'never');
    const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; apply(); }, { rootMargin: '120px' });
    io.observe(gl.domElement);
    document.addEventListener('visibilitychange', apply);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', apply); };
  }, [gl, setFrameloop]);
  return null;
}

export default function ParticleScene({ lines = LOGO_LINES, font, tier, tokens, onReady, fromPoster = false, handoffMs = 800 }: { lines?: Lines; font: string; tier: Tier; tokens: Tokens; onReady?: () => void; fromPoster?: boolean; handoffMs?: number }) {
  // degradación progresiva: 0 = completo, 1 = sin fluido, 2 = DPR 1, 3 = menos partículas
  const [level, setLevel] = useState(0);
  // fundido de 400 ms póster → canvas cuando el primer frame WebGL con el logo está listo
  const [shown, setShown] = useState(false);
  const readyRef = useRef(onReady);
  useEffect(() => { readyRef.current = onReady; }, [onReady]);
  const first = useCallback(() => { setShown(true); readyRef.current?.(); }, []);
  const eff = effectiveCfg(tier, level);
  const key = `${eff.tex}|${eff.count}|${eff.liquid}|${eff.matcap}`;
  // el motor solo se recrea si cambia algo estructural (no por el DPR)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cfg = useMemo(() => eff, [key]);
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, eff.dpr);
  return (
    <Canvas
      className="gl-wrap"
      style={{ position: 'absolute', inset: 0, opacity: shown ? 1 : 0, transition: fromPoster ? `opacity ${handoffMs}ms cubic-bezier(.45,0,.25,1)` : 'opacity .4s ease' }}
      dpr={dpr}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1, outputColorSpace: THREE.SRGBColorSpace }}
      camera={{ fov: FOV, near: 0.1, far: 100, position: [0, 0, 13] }}
      onCreated={({ gl }) => { gl.setClearColor(tokens.bg); gl.domElement.classList.add('gl'); gl.domElement.setAttribute('aria-hidden', 'true'); }}
      aria-hidden
      fallback={<div className="gl-fallback" aria-hidden="true" />}
    >
      <PerformanceMonitor onDecline={() => { if (!forcedTier()) setLevel((l) => Math.min(l + 1, 3)); }} flipflops={3} bounds={() => [45, 58]} ms={250} iterations={8} onFallback={() => { if (!forcedTier()) setLevel(3); }} />
      <VisibilityLoop />
      <Liquid lines={lines} font={font} cfg={cfg} tokens={tokens} onFirst={first} fromPoster={fromPoster} handoffMs={handoffMs} />
    </Canvas>
  );
}
