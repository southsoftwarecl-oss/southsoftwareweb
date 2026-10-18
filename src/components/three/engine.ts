/**
 * Motor del hero "metal líquido" (sin React):
 *  - simulación GPGPU de posición/velocidad (GPUComputationRenderer, Float o HalfFloat);
 *  - gotas impostoras metálicas (THREE.Points, blending normal, depthTest/depthWrite);
 *  - pasada de fluido en espacio de pantalla a media resolución (solo gama alta).
 * Sin asignaciones por frame: todos los vectores/uniforms se crean una vez.
 * dispose() libera render targets, texturas, geometrías y materiales.
 */
import * as THREE from 'three';
import { GPUComputationRenderer, type Variable } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { SIM_POS, SIM_VEL } from './shaders/sim';
import { BLUR_FRAG, COMP_FRAG, DEPTH_FRAG, DROP_FRAG, DROP_VERT, QUAD_VERT, THICK_FRAG } from './shaders/render';
import type { TierCfg } from './tiers';

export type Tokens = { accent: string; deep: string; chrome1: string; chrome2: string; chrome3: string };
export type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

/** Parámetros por frame (los escribe el componente; el motor solo los lee). */
export type FrameInput = {
  dt: number; t: number; mix: number; intro: number; live: number; scale: number;
  mouseLocal: THREE.Vector3; mouseVel: THREE.Vector2; cursor: number; radius: number;
  ripO: THREE.Vector3; ripT: number; ripA: number;
  mouseUv: THREE.Vector2; liquid: number; rUv: number; static: boolean;
};

const VIS_H = 2 * 13 * Math.tan(THREE.MathUtils.degToRad(20)); // alto visible en z=0 (cámara z=13, fov 40)
export { VIS_H };

/** Matcap cromado de 256 px generado en un canvas (gama móvil/baja, sin PMREM). */
export function makeMatcap(tk: Tokens) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d')!;
  const lin = g.createLinearGradient(0, 0, 0, S);
  lin.addColorStop(0, '#ffffff'); lin.addColorStop(0.24, tk.chrome1); lin.addColorStop(0.47, tk.chrome3);
  lin.addColorStop(0.55, '#16191e'); lin.addColorStop(0.72, tk.chrome2); lin.addColorStop(1, tk.chrome1);
  g.fillStyle = lin; g.fillRect(0, 0, S, S);
  const hl = g.createRadialGradient(S * 0.32, S * 0.28, 0, S * 0.32, S * 0.28, S * 0.3);
  hl.addColorStop(0, 'rgba(255,255,255,.95)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hl; g.fillRect(0, 0, S, S);
  const rim = g.createRadialGradient(S / 2, S / 2, S * 0.36, S / 2, S / 2, S * 0.5);
  rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, tk.deep);
  g.globalAlpha = 0.55; g.fillStyle = rim; g.fillRect(0, 0, S, S); g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}

function color(hex: string) { return new THREE.Color(hex); } // tokens CSS → THREE.Color (lineal)

export class LiquidEngine {
  readonly points: THREE.Points;
  private gpu: GPUComputationRenderer;
  private posVar: Variable; private velVar: Variable;
  private tex: { text: THREE.DataTexture; sphere: THREE.DataTexture; scatter: THREE.DataTexture; nbr: THREE.DataTexture };
  private dropMat: THREE.ShaderMaterial;
  private geo: THREE.BufferGeometry;
  private liquid: null | {
    depthMat: THREE.ShaderMaterial; thickMat: THREE.ShaderMaterial; blurMat: THREE.ShaderMaterial; compMat: THREE.ShaderMaterial;
    rtA: THREE.WebGLRenderTarget; rtB: THREE.WebGLRenderTarget; rtC: THREE.WebGLRenderTarget; rtD: THREE.WebGLRenderTarget;
    quad: THREE.Mesh; quadScene: THREE.Scene; quadCam: THREE.Camera;
  } = null;
  private N: number;
  private count: number;
  private clear = new THREE.Color();
  readonly bounds: Bounds = { minX: -5, maxX: 5, minY: -1, maxY: 2 };

  constructor(private gl: THREE.WebGLRenderer, cfg: TierCfg, tk: Tokens, env: THREE.Texture | null, matcap: THREE.Texture | null) {
    const N = cfg.tex; this.N = N; this.count = Math.min(cfg.count, N * N);
    // --- simulación ---
    const gpu = new GPUComputationRenderer(N, N, gl);
    const floatRT = gl.capabilities.isWebGL2 && gl.extensions.has('EXT_color_buffer_float');
    gpu.setDataType(floatRT ? THREE.FloatType : THREE.HalfFloatType);
    const pos0 = gpu.createTexture(), vel0 = gpu.createTexture();
    this.posVar = gpu.addVariable('texturePosition', SIM_POS, pos0);
    this.velVar = gpu.addVariable('textureVelocity', SIM_VEL, vel0);
    gpu.setVariableDependencies(this.posVar, [this.posVar, this.velVar]);
    gpu.setVariableDependencies(this.velVar, [this.posVar, this.velVar]);
    const mk = () => { const t = new THREE.DataTexture(new Float32Array(N * N * 4), N, N, THREE.RGBAFormat, THREE.FloatType); t.needsUpdate = true; return t; };
    this.tex = { text: mk(), sphere: mk(), scatter: mk(), nbr: mk() };
    const vu = this.velVar.material.uniforms;
    Object.assign(vu, {
      uDt: { value: 0 }, uT: { value: 0 }, uMix: { value: 0 }, uIn: { value: 0 }, uAmp: { value: 0.18 }, uScale: { value: 1 },
      uCursor: { value: 0 }, uR: { value: 1 }, uRipT: { value: 0 }, uRipA: { value: 0 }, uLive: { value: 1 }, uTex: { value: N },
      uMouse: { value: new THREE.Vector3(99, 99, 0) }, uRipO: { value: new THREE.Vector3(99, 99, 0) }, uMVel: { value: new THREE.Vector2() },
      tText: { value: this.tex.text }, tSphere: { value: this.tex.sphere }, tScatter: { value: this.tex.scatter }, tNbr: { value: this.tex.nbr },
    });
    this.posVar.material.uniforms.uDt = { value: 0 };
    const err = gpu.init();
    if (err) throw new Error(err);
    this.gpu = gpu;

    // --- gotas ---
    const geo = new THREE.BufferGeometry();
    const ref = new Float32Array(this.count * 2), rnd = new Float32Array(this.count);
    for (let i = 0; i < this.count; i++) { ref[i * 2] = ((i % N) + 0.5) / N; ref[i * 2 + 1] = (Math.floor(i / N) + 0.5) / N; rnd[i] = Math.random(); }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.count * 3), 3));
    geo.setAttribute('ref', new THREE.BufferAttribute(ref, 2));
    geo.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);
    this.geo = geo;

    const shading = {
      uRim: { value: color(tk.accent) }, uBackRim: { value: color(tk.deep) }, uEnvI: { value: 1.15 }, uKey: { value: 1.6 },
      envMap: { value: env }, tMatcap: { value: matcap },
    };
    const defines: Record<string, string> = {};
    if (cfg.matcap || !env) defines.USE_MATCAP = '';
    else {
      const h = (env.image as { height: number }).height; const maxMip = Math.log2(h) - 2;
      defines.CUBEUV_TEXEL_WIDTH = String(1 / (3 * Math.max(Math.pow(2, maxMip), 7 * 16)));
      defines.CUBEUV_TEXEL_HEIGHT = String(1 / h);
      defines.CUBEUV_MAX_MIP = maxMip.toFixed(1);
    }
    const dropU = { tPos: { value: null as THREE.Texture | null }, uDpr: { value: 1 }, uMix: { value: 0 }, uPxPerUnit: { value: 100 } };
    this.dropMat = new THREE.ShaderMaterial({
      uniforms: { ...dropU, ...shading }, defines, vertexShader: DROP_VERT, fragmentShader: DROP_FRAG,
      blending: THREE.NormalBlending, depthTest: true, depthWrite: true, transparent: false,
    });
    this.points = new THREE.Points(geo, this.dropMat);
    this.points.frustumCulled = false;

    if (cfg.liquid) {
      const rtOpts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, generateMipmaps: false };
      const rtA = new THREE.WebGLRenderTarget(2, 2, { ...rtOpts, depthBuffer: true });
      const rtB = new THREE.WebGLRenderTarget(2, 2, rtOpts), rtC = new THREE.WebGLRenderTarget(2, 2, rtOpts), rtD = new THREE.WebGLRenderTarget(2, 2, { ...rtOpts, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); // la composición a resolución completa interpola
      const halfU = () => ({ tPos: { value: null as THREE.Texture | null }, uDpr: { value: 0.5 }, uMix: { value: 0 }, uPxPerUnit: { value: 50 } });
      const depthMat = new THREE.ShaderMaterial({ uniforms: halfU(), vertexShader: DROP_VERT, fragmentShader: DEPTH_FRAG, depthTest: true, depthWrite: true });
      const thickMat = new THREE.ShaderMaterial({ uniforms: halfU(), vertexShader: DROP_VERT, fragmentShader: THICK_FRAG, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending });
      const blurMat = new THREE.ShaderMaterial({ uniforms: { tA: { value: null }, tB: { value: null }, uDir: { value: new THREE.Vector2() }, uFirst: { value: 1 } }, vertexShader: QUAD_VERT, fragmentShader: BLUR_FRAG, depthTest: false, depthWrite: false });
      const compMat = new THREE.ShaderMaterial({
        uniforms: {
          ...shading, tS: { value: rtD.texture }, uTexel: { value: new THREE.Vector2() }, uTan: { value: new THREE.Vector2() },
          uMouseUv: { value: new THREE.Vector2(-9, -9) }, uLiquid: { value: 0.85 }, uAspect: { value: 1 }, uRUv: { value: 0.1 }, uThr: { value: 0.022 },
        },
        defines, vertexShader: QUAD_VERT, fragmentShader: COMP_FRAG, transparent: true, depthTest: false, depthWrite: false, blending: THREE.NormalBlending,
      });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMat); quad.frustumCulled = false;
      const quadScene = new THREE.Scene(); quadScene.add(quad);
      this.liquid = { depthMat, thickMat, blurMat, compMat, rtA, rtB, rtC, rtD, quad, quadScene, quadCam: new THREE.Camera() };
    }
  }

  /** Destinos: texto (muestreado), esfera, nube inicial, retardos e índices de vecinos. */
  setTargets(pts: [number, number][], reset?: 'text' | 'scatter') {
    const N = this.N, tot = N * N, T = this.tex;
    const a = T.text.image.data as Float32Array, s = T.sphere.image.data as Float32Array, c = T.scatter.image.data as Float32Array, nb = T.nbr.image.data as Float32Array;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const q of pts) { if (q[0] < minX) minX = q[0]; if (q[0] > maxX) maxX = q[0]; if (q[1] < minY) minY = q[1]; if (q[1] > maxY) maxY = q[1]; }
    if (!pts.length) { minX = -1; maxX = 1; minY = 0; maxY = 0; }
    const w = Math.max(maxX - minX, 1e-3);
    // orden espacial (celdas de .2) para que los vecinos por índice sean vecinos reales
    const order = Array.from({ length: this.count }, (_, i) => i);
    const sample = order.map(() => pts[Math.floor(Math.random() * pts.length)] || [0, 0]);
    const key = (q: [number, number]) => Math.floor((q[1] + 10) / 0.2) * 1000 + Math.floor((q[0] + 20) / 0.2);
    order.sort((i, j) => key(sample[i]) - key(sample[j]));
    for (let k = 0; k < tot; k++) {
      const i = k < this.count ? k : k % this.count;
      const q = sample[order[i]];
      const rnd = Math.random();
      a[k * 4] = q[0] + (Math.random() - 0.5) * 0.03; a[k * 4 + 1] = q[1] + 1.3 + (Math.random() - 0.5) * 0.03; a[k * 4 + 2] = (Math.random() - 0.5) * 0.25;
      a[k * 4 + 3] = 0.5 * (0.55 * rnd + 0.45 * ((q[0] - minX) / w)); // retardo: rnd*.5 + onda izq→der
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), r = 3.4 + Math.random() * 0.15;
      s[k * 4] = r * Math.sin(ph) * Math.cos(th); s[k * 4 + 1] = r * Math.cos(ph) + 1; s[k * 4 + 2] = r * Math.sin(ph) * Math.sin(th); s[k * 4 + 3] = rnd;
      c[k * 4] = (Math.random() - 0.5) * 26; c[k * 4 + 1] = (Math.random() - 0.5) * 16; c[k * 4 + 2] = (Math.random() - 0.5) * 10; c[k * 4 + 3] = 1;
      for (let n = 0; n < 4; n++) {
        let j = i + Math.round((Math.random() * 2 - 1) * 10); if (j === i) j = i + 1;
        nb[k * 4 + n] = Math.min(Math.max(j, 0), this.count - 1);
      }
    }
    T.text.needsUpdate = T.sphere.needsUpdate = T.scatter.needsUpdate = T.nbr.needsUpdate = true;
    Object.assign(this.bounds, { minX, maxX, minY: minY + 1.3, maxY: maxY + 1.3 });
    if (reset) this.resetPositions(reset === 'text' ? a : c);
  }

  /** Copia posiciones iniciales a los dos buffers de la simulación (velocidad 0). */
  private resetPositions(src: Float32Array) {
    const N = this.N, init = new THREE.DataTexture(new Float32Array(src), N, N, THREE.RGBAFormat, THREE.FloatType);
    init.needsUpdate = true;
    const zero = this.gpu.createTexture();
    for (const v of [this.posVar, this.velVar]) {
      const t = v === this.posVar ? init : zero;
      for (const rt of v.renderTargets) this.gpu.renderTexture(t, rt);
    }
    init.dispose(); zero.dispose();
  }

  resize(wCss: number, hCss: number, dpr: number) {
    const ppu = (hCss * dpr) / VIS_H;
    this.dropMat.uniforms.uDpr.value = dpr; this.dropMat.uniforms.uPxPerUnit.value = ppu;
    const L = this.liquid; if (!L) return;
    const w = Math.max(2, Math.round(wCss * dpr * 0.5)), h = Math.max(2, Math.round(hCss * dpr * 0.5));
    for (const rt of [L.rtA, L.rtB, L.rtC, L.rtD]) rt.setSize(w, h);
    for (const m of [L.depthMat, L.thickMat]) { m.uniforms.uDpr.value = dpr * 0.5; m.uniforms.uPxPerUnit.value = ppu * 0.5; }
    const cu = L.compMat.uniforms;
    cu.uTexel.value.set(1 / w, 1 / h);
    const tanY = Math.tan(THREE.MathUtils.degToRad(20)); cu.uTan.value.set(tanY * (wCss / hCss), tanY);
    cu.uAspect.value = wCss / hCss;
    this.texel.set(1 / w, 1 / h);
  }
  private texel = new THREE.Vector2();

  /** Un paso: simulación + render (el componente llama con prioridad 1, R3F no renderiza solo). */
  frame(f: FrameInput, scene: THREE.Scene, camera: THREE.Camera) {
    const gl = this.gl, vu = this.velVar.material.uniforms;
    if (!f.static) {
      vu.uDt.value = f.dt; this.posVar.material.uniforms.uDt.value = f.dt;
      vu.uT.value = f.t; vu.uMix.value = f.mix; vu.uIn.value = f.intro; vu.uLive.value = f.live;
      vu.uAmp.value = 0.18 + (0.45 - 0.18) * Math.max(0, Math.min(1, f.mix));
      vu.uScale.value = f.scale; vu.uCursor.value = f.cursor; vu.uR.value = f.radius;
      vu.uMouse.value.copy(f.mouseLocal); vu.uMVel.value.copy(f.mouseVel);
      vu.uRipO.value.copy(f.ripO); vu.uRipT.value = f.ripT; vu.uRipA.value = f.ripA;
      this.gpu.compute();
    }
    const posTex = this.gpu.getCurrentRenderTarget(this.posVar).texture;
    this.dropMat.uniforms.tPos.value = posTex; this.dropMat.uniforms.uMix.value = f.mix;
    gl.setRenderTarget(null);
    gl.render(scene, camera);
    const L = this.liquid; if (!L) return;
    // 1) profundidad y 2) espesor de las gotas a media resolución
    const prevAuto = gl.autoClear; gl.getClearColor(this.clear); const prevAlpha = gl.getClearAlpha();
    gl.setClearColor(0x000000, 0);
    for (const m of [L.depthMat, L.thickMat]) { m.uniforms.tPos.value = posTex; m.uniforms.uMix.value = f.mix; }
    this.points.material = L.depthMat; gl.setRenderTarget(L.rtA); gl.clear(true, true, false); gl.render(this.points, camera);
    this.points.material = L.thickMat; gl.setRenderTarget(L.rtB); gl.clear(true, false, false); gl.render(this.points, camera);
    this.points.material = this.dropMat;
    // 3) desenfoque bilateral separable (2 pasadas)
    const bu = L.blurMat.uniforms; L.quad.material = L.blurMat;
    bu.tA.value = L.rtA.texture; bu.tB.value = L.rtB.texture; bu.uFirst.value = 1; bu.uDir.value.set(this.texel.x, 0);
    gl.setRenderTarget(L.rtC); gl.render(L.quadScene, L.quadCam);
    bu.tA.value = L.rtC.texture; bu.uFirst.value = 0; bu.uDir.value.set(0, this.texel.y);
    gl.setRenderTarget(L.rtD); gl.render(L.quadScene, L.quadCam);
    // 4) composición sobre la escena con el mismo cromo PBR
    const cu = L.compMat.uniforms; cu.uLiquid.value = f.liquid; cu.uMouseUv.value.copy(f.mouseUv); cu.uRUv.value = f.rUv;
    L.quad.material = L.compMat; gl.setRenderTarget(null); gl.autoClear = false;
    gl.render(L.quadScene, L.quadCam);
    gl.autoClear = prevAuto; gl.setClearColor(this.clear, prevAlpha);
  }

  get hasLiquid() { return !!this.liquid; }

  dispose() {
    this.gpu.dispose();
    Object.values(this.tex).forEach((t) => t.dispose());
    this.geo.dispose(); this.dropMat.dispose();
    const L = this.liquid;
    if (L) {
      [L.rtA, L.rtB, L.rtC, L.rtD].forEach((rt) => rt.dispose());
      [L.depthMat, L.thickMat, L.blurMat, L.compMat].forEach((m) => m.dispose());
      L.quad.geometry.dispose();
    }
  }
}
