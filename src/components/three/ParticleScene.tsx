'use client';
/**
 * Escena de partículas (port 1:1 del hero del preview 10).
 * 14.000 puntos (7.000 en móvil) muestrean el texto en Michroma, entran desde
 * una nube dispersa (uIn), se apartan del mouse con inercia y se convierten en
 * esfera al hacer scroll (uMix). Shader idéntico al preview.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { gsap, setupGsap } from '@/lib/gsap';
import { RT, capDpr, onIntro } from '@/lib/runtime';

const VERT = /* glsl */ `attribute vec3 sphere;attribute float rnd;uniform float uT,uMix,uIn;uniform vec3 uMouse;varying float vR;varying float vG;
void main(){vR=rnd;vec3 p=mix(position,sphere,uMix);
 float n=sin(p.x*1.3+uT*.9+rnd*6.)*.06+cos(p.y*1.7+uT*.7)*.06;p+=vec3(n,n*.7,n*1.4)*(1.+uMix*2.);
 vec3 scatter=(vec3(fract(rnd*91.7),fract(rnd*53.3),fract(rnd*17.1))-.5)*vec3(26.,16.,10.);p=mix(scatter,p,smoothstep(rnd*.5,rnd*.5+.5,uIn));
 vec3 d=p-uMouse;float dist=length(d.xy);float f=smoothstep(1.6,0.,dist);p.xy+=normalize(d.xy+.0001)*f*.9;p.z+=f*1.2;vG=f;
 vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=(1.2+rnd*1.6+f*2.)*(13./-mv.z);gl_Position=projectionMatrix*mv;}`;
const FRAG = /* glsl */ `uniform vec3 uC;varying float vR;varying float vG;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;vec3 c=mix(vec3(.78,.8,.86),uC,step(.86,vR)+vG);gl_FragColor=vec4(c,(1.-d*2.)*.9);}`;

type Lines = { text: string; size: number; y: number }[];
export const LOGO_LINES: Lines = [{ text: 'SOUTH', size: 210, y: 140 }, { text: 'SOFTWARE', size: 116, y: 330 }];

/** Rasteriza el texto en un canvas 2D y devuelve los píxeles encendidos como puntos. */
function sampleText(lines: Lines, font: string) {
  const c = document.createElement('canvas'); c.width = 1400; c.height = 420;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const l of lines) { g.font = `400 ${l.size}px ${font}, sans-serif`; g.fillText(l.text, 700, l.y); }
  const d = g.getImageData(0, 0, 1400, 420).data; const pts: [number, number][] = [];
  for (let y = 0; y < 420; y += 3) for (let x = 0; x < 1400; x += 3) if (d[(y * 1400 + x) * 4] > 128) pts.push([(x - 700) / 100, (210 - y) / 100]);
  return pts;
}

function Particles({ lines, font, count, accent }: { lines: Lines; font: string; count: number; accent: string }) {
  const pts = useRef<THREE.Points>(null);
  const { camera, size, invalidate } = useThree();
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const uniforms = useMemo(() => ({
    uT: { value: 0 }, uMix: { value: 0 }, uMouse: { value: new THREE.Vector3(99, 99, 0) },
    uC: { value: new THREE.Color(accent) }, uIn: { value: RT.static ? 1 : 0 },
  }), [accent]);
  const mat = useMemo(() => new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), [uniforms]);

  // Rellena posiciones: texto (position), esfera (sphere) y semilla (rnd)
  useEffect(() => {
    const aT = new Float32Array(count * 3), aS = new Float32Array(count * 3), aR = new Float32Array(count);
    const fill = () => {
      const p = sampleText(lines, font);
      for (let i = 0; i < count; i++) {
        const q = p[Math.floor(Math.random() * p.length)] || [0, 0];
        aT.set([q[0] + (Math.random() - 0.5) * 0.03, q[1] + 1.3 + (Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.25], i * 3);
        const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), r = 3.4 + Math.random() * 0.15;
        aS.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) + 1, r * Math.sin(ph) * Math.sin(th)], i * 3);
        aR[i] = Math.random();
      }
      geo.setAttribute('position', new THREE.BufferAttribute(aT, 3));
      geo.setAttribute('sphere', new THREE.BufferAttribute(aS, 3));
      geo.setAttribute('rnd', new THREE.BufferAttribute(aR, 1));
      geo.computeBoundingSphere();
      invalidate();
    };
    fill();
    document.fonts.load(`200px ${font}`).then(fill).catch(() => {});
    return () => { geo.dispose(); mat.dispose(); };
  }, [count, font, lines, geo, mat, invalidate]);

  // Intro: las partículas se ensamblan cuando se abre el preloader
  useEffect(() => {
    if (RT.static) return;
    setupGsap();
    return onIntro(() => { gsap.to(uniforms.uIn, { value: 1, duration: 2.4, ease: 'south' }); });
  }, [uniforms]);

  const ray = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const rot = useRef({ x: 0, y: 0 });
  const ndc = useMemo(() => new THREE.Vector2(), []);

  useFrame((state) => {
    const p = pts.current; if (!p) return;
    const t = RT.reduced ? 2.5 : state.clock.elapsedTime;
    uniforms.uT.value = t;
    const m = RT.mouse;
    ray.setFromCamera(ndc.set(m.nx, m.ny), camera); ray.ray.intersectPlane(plane, hit);
    if (!m.moved) hit.set(99, 99, 0);
    uniforms.uMouse.value.lerp(hit, 0.15);
    // scroll: progreso del hero (0 → 1) — igual que ScrollTrigger 'top top' → 'bottom top'
    const hero = (state.gl.domElement.closest('.hero') as HTMLElement) || null;
    const prog = hero ? Math.min(Math.max(window.scrollY / Math.max(hero.offsetHeight, 1), 0), 1) : 0;
    uniforms.uMix.value = RT.static ? 0 : Math.min(1, prog * 1.8);
    const r = rot.current; r.y += (m.nx * 0.18 - r.y) * 0.04; r.x += (-m.ny * 0.1 - r.x) * 0.04;
    p.rotation.y = r.y + uniforms.uMix.value * t * 0.2; p.rotation.x = r.x;
  });

  return <points ref={pts} geometry={geo} material={mat} scale={size.width < 760 ? 0.55 : 1} frustumCulled={false} />;
}

/** Pausa el render cuando el hero sale de pantalla o la pestaña se oculta. */
function VisibilityLoop() {
  const { gl, setFrameloop } = useThree();
  useEffect(() => {
    if (RT.reduced) { setFrameloop('demand'); return; }
    let vis = true;
    const apply = () => setFrameloop(vis && !document.hidden ? 'always' : 'never');
    const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; apply(); }, { rootMargin: '120px' });
    io.observe(gl.domElement);
    document.addEventListener('visibilitychange', apply);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', apply); };
  }, [gl, setFrameloop]);
  return null;
}

export default function ParticleScene({ lines = LOGO_LINES, font, accent = '#7C5CFF' }: { lines?: Lines; font: string; accent?: string }) {
  const mobile = typeof window !== 'undefined' && innerWidth < 760;
  const [dpr, setDpr] = useState(capDpr);
  return (
    <Canvas
      className="gl-wrap"
      style={{ position: 'absolute', inset: 0 }}
      flat
      dpr={dpr}
      gl={{ antialias: !mobile, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 40, near: 0.1, far: 100, position: [0, 0, 13] }}
      onCreated={({ gl }) => { gl.setClearColor(0x0a0a0b); gl.domElement.classList.add('gl'); gl.domElement.setAttribute('aria-hidden', 'true'); }}
      aria-hidden
    >
      {/* drei: baja la resolución si el equipo no sostiene los FPS */}
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(capDpr())} flipflops={3} />
      <VisibilityLoop />
      <Particles lines={lines} font={font} count={mobile ? 7000 : 14000} accent={accent} />
    </Canvas>
  );
}
