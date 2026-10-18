'use client';
/**
 * Hero "metal líquido" (opción C).
 * Simulación GPGPU (engine.ts): resortes hacia el texto (k=18) y la esfera (k=10)
 * mezclados por el scroll, curl noise, cohesión con vecinos, cursor con empuje
 * gaussiano, onda y arrastre; amortiguación exp(-6.5·dt).
 * Render: gotas metálicas impostoras + (gama alta) superficie de fluido en pantalla.
 * Colores = tokens CSS (props desde HeroCanvas). Niveles: ./tiers.ts.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap, ScrollTrigger, setupGsap } from '@/lib/gsap';
import { RT, onIntro } from '@/lib/runtime';
import { LiquidEngine, makeMatcap, VIS_H, type FrameInput, type Tokens } from './engine';
import { effectiveCfg, forcedTier, type Tier, type TierCfg } from './tiers';

type Lines = { text: string; size: number; y: number }[];
export const LOGO_LINES: Lines = [{ text: 'SOUTH', size: 210, y: 140 }, { text: 'SOFTWARE', size: 116, y: 330 }];

/** Rasteriza el texto en un canvas 2D y devuelve los píxeles encendidos como puntos. */
function sampleText(lines: Lines, font: string) {
  const c = document.createElement('canvas'); c.width = 1400; c.height = 420;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = 'white'; // máscara de muestreo, no color visible g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const l of lines) { g.font = `400 ${l.size}px ${font}, sans-serif`; g.fillText(l.text, 700, l.y); }
  const d = g.getImageData(0, 0, 1400, 420).data; const pts: [number, number][] = [];
  for (let y = 0; y < 420; y += 3) for (let x = 0; x < 1400; x += 3) if (d[(y * 1400 + x) * 4] > 128) pts.push([(x - 700) / 100, (210 - y) / 100]);
  return pts;
}

const damp = THREE.MathUtils.damp;
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

function Liquid({ lines, font, cfg, tokens }: { lines: Lines; font: string; cfg: TierCfg; tokens: Tokens }) {
  const { gl, scene, camera, size, viewport, invalidate } = useThree();
  const group = useRef<THREE.Group>(null);
  // estado mutable del frame (sin setState en useFrame, sin asignaciones por frame)
  const S = useRef({
    engine: null as LiquidEngine | null, intro: { v: RT.static ? 1 : 0 }, prog: 0, mix: 0, mixFrom: 1, goingUp: false, upStart: 0,
    mouseW: new THREE.Vector3(99, 99, 0), mouseT: new THREE.Vector3(), mouseL: new THREE.Vector3(), last: new THREE.Vector2(-1, -1),
    velPx: new THREE.Vector2(), velW: new THREE.Vector2(), velL: new THREE.Vector2(), speed: 0, peak: 0, cursor: 0,
    ripO: new THREE.Vector3(99, 99, 0), ripW: new THREE.Vector3(99, 99, 0), ripT: 9, rotY: 0, fr: { scale: 1, posY: 0 }, ripA: 0, touchAt: -1, liquid: 0.85,
    ray: new THREE.Raycaster(), plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), ndc: new THREE.Vector2(), inv: new THREE.Matrix4(),
    mouseUv: new THREE.Vector2(-9, -9), statusTop: null as number | null, hero: null as HTMLElement | null, heroTop: 0, heroH: 1,
    f: null as FrameInput | null, scale: 1,
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
    group.current?.add(engine.points);
    const fill = (first: boolean) => {
      engine.setTargets(sampleText(lines, font), first ? (RT.static || st.intro.v > 0.5 ? 'text' : 'scatter') : undefined);
      invalidate();
    };
    fill(true);
    let alive = true;
    document.fonts.load(`200px ${font}`).then(() => { if (alive) fill(false); }).catch(() => {});
    st.f = {
      dt: 0, t: 0, mix: 0, intro: st.intro.v, live: RT.static ? 0 : 1, scale: 1, mouseLocal: st.mouseL, mouseVel: st.velL, cursor: 0, radius: 1,
      ripO: st.ripO, ripT: 9, ripA: 0, mouseUv: st.mouseUv, liquid: 0.85, rUv: 0.1, static: RT.static,
    };
    return () => {
      alive = false; group.current?.remove(engine.points); engine.dispose(); st.engine = null;
      env?.dispose(); matcap?.dispose();
    };
  }, [gl, cfg, tokens, lines, font, invalidate]);

  // intro: uIn 0→1 en 2,4 s (ease 'south') cuando se abre el preloader
  useEffect(() => {
    if (RT.static) return;
    setupGsap();
    const st = S.current;
    let tw: gsap.core.Tween | null = null;
    const off = onIntro(() => { tw = gsap.to(st.intro, { v: 1, duration: 2.4, ease: 'south' }); });
    return () => { off(); tw?.kill(); };
  }, []);

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
      trig = ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: (s) => { st.prog = s.progress; } });
    }
    // táctil: la onda solo existe mientras el dedo se mueve
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]; if (!t) return;
      const m = RT.mouse; m.moved = true; m.x = t.clientX; m.y = t.clientY; st.touchAt = performance.now();
    };
    hero?.addEventListener('touchmove', onTouch, { passive: true });
    hero?.addEventListener('touchstart', onTouch, { passive: true });
    return () => { removeEventListener('resize', measure); trig?.kill(); hero?.removeEventListener('touchmove', onTouch); hero?.removeEventListener('touchstart', onTouch); };
  }, [gl, invalidate]);

  useEffect(() => { S.current.engine?.resize(size.width, size.height, viewport.dpr); invalidate(); }, [size.width, size.height, viewport.dpr, cfg, invalidate]);

  useFrame((state, delta) => {
    const st = S.current, E = st.engine, f = st.f, g = group.current;
    if (!E || !f || !g) return;
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const touch = TOUCH();
    // --- mezcla texto/esfera: smoothstep + damp λ6; al volver a subir, curva 'mercury' ---
    const target = RT.static ? 0 : THREE.MathUtils.smoothstep(Math.min(1, st.prog * 1.8), 0, 1);
    if (target < st.mix - 1e-3 && !st.goingUp) { st.goingUp = true; st.mixFrom = Math.max(st.mix, 1e-3); }
    if (target > st.mix + 1e-3) st.goingUp = false;
    st.mix = damp(st.mix, target, 6, dt);
    let mix = st.mix;
    if (st.goingUp) { const u = 1 - st.mix / st.mixFrom; mix = st.mixFrom * (1 - gsap.parseEase('mercury')(Math.min(Math.max(u, 0), 1))); }
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
    const active = !RT.static && (touch ? touchLive : over);
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
    if (!RT.static) {
      const live = over || touchLive;
      st.rotY = damp(st.rotY, live ? THREE.MathUtils.clamp(m.nx, -1, 1) * 0.12 : 0, 3, dt);
      g.rotation.x = damp(g.rotation.x, live ? THREE.MathUtils.clamp(-m.ny, -1, 1) * 0.07 : 0, 3, dt);
      g.rotation.y = st.rotY + mix * t * 0.2; // giro lento solo en modo esfera (como el preview)
    }
    g.updateMatrixWorld();
    // cursor y onda en coordenadas locales de las partículas
    st.inv.copy(g.matrixWorld).invert();
    st.mouseL.copy(st.mouseW).applyMatrix4(st.inv);
    st.ripO.copy(st.ripW).applyMatrix4(st.inv);
    st.velL.copy(st.velW).multiplyScalar(1 / Math.max(g.scale.x, 1e-3));
    // líquido: .85 en reposo, baja a .3 durante el morph (y cerca del cursor, en el shader)
    st.liquid = 0.85 - 0.55 * Math.sin(Math.PI * THREE.MathUtils.clamp(mix, 0, 1));
    st.mouseUv.set(st.ndc.x * 0.5 + 0.5, st.ndc.y * 0.5 + 0.5);
    if (!active) st.mouseUv.set(-9, -9);
    Object.assign(f, {
      dt: RT.static ? 0 : dt, t, mix: THREE.MathUtils.clamp(mix, -0.06, 1), intro: st.intro.v, live: RT.static ? 0 : 1, scale: g.scale.x,
      cursor: st.cursor, radius, ripT: st.ripT, ripA: st.ripA, liquid: st.liquid, rUv: radius / VIS_H, static: RT.static,
    });
    E.frame(f, scene, camera);
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

export default function ParticleScene({ lines = LOGO_LINES, font, tier, tokens }: { lines?: Lines; font: string; tier: Tier; tokens: Tokens }) {
  // degradación progresiva: 0 = completo, 1 = sin fluido, 2 = DPR 1, 3 = menos partículas
  const [level, setLevel] = useState(0);
  const eff = effectiveCfg(tier, level);
  const key = `${eff.tex}|${eff.count}|${eff.liquid}|${eff.matcap}`;
  // el motor solo se recrea si cambia algo estructural (no por el DPR)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cfg = useMemo(() => eff, [key]);
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, eff.dpr);
  return (
    <Canvas
      className="gl-wrap"
      style={{ position: 'absolute', inset: 0 }}
      dpr={dpr}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1, outputColorSpace: THREE.SRGBColorSpace }}
      camera={{ fov: 40, near: 0.1, far: 100, position: [0, 0, 13] }}
      onCreated={({ gl }) => { gl.setClearColor(tokens.bg); gl.domElement.classList.add('gl'); gl.domElement.setAttribute('aria-hidden', 'true'); }}
      aria-hidden
      fallback={<div className="gl-fallback" aria-hidden="true" />}
    >
      <PerformanceMonitor onDecline={() => { if (!forcedTier()) setLevel((l) => Math.min(l + 1, 3)); }} flipflops={3} onFallback={() => { if (!forcedTier()) setLevel(3); }} />
      <VisibilityLoop />
      <Liquid lines={lines} font={font} cfg={cfg} tokens={tokens} />
    </Canvas>
  );
}
