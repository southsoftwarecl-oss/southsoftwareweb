/**
 * Cálculo de destinos (sin DOM, sin three, sin imports): todo vive dentro de `targetsKernel` para poder
 * serializarlo con toString() y ejecutarlo en un Worker creado desde un Blob (Turbopack no empaqueta workers TS).
 * Así ni el muestreo de formas ni los ordenamientos por partícula corren en el hilo principal.
 */
export type Targets = { a: Float32Array; c: Float32Array; nb: Float32Array; shapes: Float32Array[]; bounds: { minX: number; maxX: number; minY: number; maxY: number } };
export const CY = 1.05; // centro vertical de las formas (= centro del logo en coordenadas locales)

export function targetsKernel(): (flat: Float32Array, N: number, count: number) => Targets {
  /*
   * Formas del loop cinematográfico (todas del mismo largo que la simulación).
   *  0 logo (ya muestreado en engine.setTargets) · 1 red/constelación · 2 globo de puntos (Fibonacci, sin marcadores)
   *  3 cubo de código (aristas + grilla de caras, isométrico).
   * Asignación por proximidad aproximada: partículas y puntos de cada forma se ordenan por ángulo polar
   * (alrededor del centro de la forma) y altura; el rango i de la forma va a la partícula de rango i del logo.
   * Formas abstractas: ningún mapa, pin, ciudad ni silueta geográfica.
   */
    const CY = 1.05;
  type P = [number, number, number];

  function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  function network(n: number, r: () => number): P[] {
    const NODES = 180, nodes: P[] = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < NODES; i++) {
      const y = 1 - (2 * (i + 0.5)) / NODES, rad = Math.sqrt(1 - y * y), th = i * ga;
      const R = 2.15 * (0.78 + 0.22 * r());
      nodes.push([Math.cos(th) * rad * R, y * R * 0.62, Math.sin(th) * rad * R]);
    }
    const edges: [number, number][] = [];
    for (let i = 0; i < NODES; i++) {
      const d = nodes.map((q, j) => [j, (q[0] - nodes[i][0]) ** 2 + (q[1] - nodes[i][1]) ** 2 + (q[2] - nodes[i][2]) ** 2] as const)
        .filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]);
      for (let k = 0; k < 3; k++) if (i < d[k][0]) edges.push([i, d[k][0]]);
    }
    const out: P[] = [];
    for (let k = 0; k < n; k++) {
      if (r() < 0.28) { // nodos: pequeños cúmulos
        const q = nodes[Math.floor(r() * NODES)], s = 0.07;
        out.push([q[0] + (r() - 0.5) * s, q[1] + (r() - 0.5) * s, q[2] + (r() - 0.5) * s]);
      } else {
        const [a, b] = edges[Math.floor(r() * edges.length)], t = r(), A = nodes[a], B = nodes[b], j = 0.012;
        out.push([A[0] + (B[0] - A[0]) * t + (r() - 0.5) * j, A[1] + (B[1] - A[1]) * t + (r() - 0.5) * j, A[2] + (B[2] - A[2]) * t + (r() - 0.5) * j]);
      }
    }
    return out;
  }

  function globe(n: number, r: () => number): P[] {
    const out: P[] = [], ga = Math.PI * (3 - Math.sqrt(5)), DOTS = Math.min(n, 1300);
    for (let k = 0; k < n; k++) { // cada punto Fibonacci es un "píxel" de varias gotas → puntos redondos y nítidos
      const i = k % DOTS, y = 1 - (2 * (i + 0.5)) / DOTS, rad = Math.sqrt(1 - y * y), th = i * ga, R = 1.75, s = 0.03;
      out.push([Math.cos(th) * rad * R + (r() - 0.5) * s, y * R + (r() - 0.5) * s, Math.sin(th) * rad * R + (r() - 0.5) * s]);
    }
    return out;
  }

  function cube(n: number, r: () => number): P[] {
    const H = 1.0, out: P[] = [];
    const ry = Math.PI / 4, rx = Math.atan(1 / Math.SQRT2); // vista isométrica
    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    const rot = (x: number, y: number, z: number): P => { const x1 = cy * x + sy * z, z1 = -sy * x + cy * z; return [x1, cx * y - sx * z1, sx * y + cx * z1]; };
    for (let k = 0; k < n; k++) {
      const u = r() * 2 - 1, j = () => (r() - 0.5) * 0.02;
      if (r() < 0.5) { // 12 aristas
        const e = Math.floor(r() * 12), ax = e >> 2, s1 = e & 1 ? H : -H, s2 = e & 2 ? H : -H;
        const p = ax === 0 ? [u * H, s1, s2] : ax === 1 ? [s1, u * H, s2] : [s1, s2, u * H];
        out.push(rot(p[0] + j(), p[1] + j(), p[2] + j()));
      } else { // grilla 6×6 en las caras ("bloques" de código)
        const f = Math.floor(r() * 6), axis = f >> 1, sgn = f & 1 ? H : -H, line = (Math.floor(r() * 5) + 1) / 3 - 1, along = r() < 0.5;
        const a = along ? line * H : u * H, b = along ? u * H : line * H;
        const p = axis === 0 ? [sgn, a, b] : axis === 1 ? [a, sgn, b] : [a, b, sgn];
        out.push(rot(p[0] * 0.995 + j(), p[1] * 0.995 + j(), p[2] * 0.995 + j()));
      }
    }
    return out;
  }

  const key = (x: number, y: number) => Math.atan2(y - CY, x) * 10 + Math.hypot(x, y - CY) * 0.01;

  /** Construye las formas 1..3 (Float32 xyz w=0, largo tot*4) alineadas por rango con el logo. */
  function buildShapes(logo: Float32Array, count: number, tot: number): Float32Array[] {
    const rank = Array.from({ length: count }, (_, i) => i).sort((i, j) => key(logo[i * 4], logo[i * 4 + 1]) - key(logo[j * 4], logo[j * 4 + 1]));
    const r = rng(7);
    return [network, globe, cube].map((gen) => {
      const pts = gen(count, r).map((p) => [p[0], p[1] + CY, p[2]] as P).sort((a, b) => key(a[0], a[1]) - key(b[0], b[1]));
      const out = new Float32Array(tot * 4);
      for (let j = 0; j < count; j++) { const i = rank[j], p = pts[j]; out[i * 4] = p[0]; out[i * 4 + 1] = p[1]; out[i * 4 + 2] = p[2]; }
      for (let k = count; k < tot; k++) out.set(out.subarray((k % count) * 4, (k % count) * 4 + 4), k * 4);
      return out;
    });
  }

  function computeTargets(flat: Float32Array, N: number, count: number): Targets {
    const tot = N * N, a = new Float32Array(tot * 4), c = new Float32Array(tot * 4), nb = new Float32Array(tot * 4);
    const pts: [number, number][] = []; for (let i = 0; i + 1 < flat.length; i += 2) pts.push([flat[i], flat[i + 1]]);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const q of pts) { if (q[0] < minX) minX = q[0]; if (q[0] > maxX) maxX = q[0]; if (q[1] < minY) minY = q[1]; if (q[1] > maxY) maxY = q[1]; }
    if (!pts.length) { minX = -1; maxX = 1; minY = 0; maxY = 0; }
    const w = Math.max(maxX - minX, 1e-3);
    // orden espacial (celdas de .2) para que los vecinos por índice sean vecinos reales
    const order = Array.from({ length: count }, (_, i) => i);
    const sample = order.map(() => pts[Math.floor(Math.random() * pts.length)] || [0, 0]);
    const key = (q: [number, number]) => Math.floor((q[1] + 10) / 0.2) * 1000 + Math.floor((q[0] + 20) / 0.2);
    order.sort((i, j) => key(sample[i]) - key(sample[j]));
    for (let k = 0; k < tot; k++) {
      const i = k < count ? k : k % count;
      const q = sample[order[i]];
      const rnd = Math.random();
      a[k * 4] = q[0] + (Math.random() - 0.5) * 0.03; a[k * 4 + 1] = q[1] + 1.3 + (Math.random() - 0.5) * 0.03; a[k * 4 + 2] = (Math.random() - 0.5) * 0.3; // grosor Z ±.15
      a[k * 4 + 3] = 0.5 * (0.55 * rnd + 0.45 * ((q[0] - minX) / w)); // retardo: rnd*.5 + onda izq→der
      c[k * 4] = (Math.random() - 0.5) * 26; c[k * 4 + 1] = (Math.random() - 0.5) * 16; c[k * 4 + 2] = (Math.random() - 0.5) * 10;
      c[k * 4 + 3] = Math.random() * 0.16; // retardo del morph: 0–.25 s de un tramo de ~1,5 s
      for (let n = 0; n < 4; n++) {
        let j = i + Math.round((Math.random() * 2 - 1) * 10); if (j === i) j = i + 1;
        nb[k * 4 + n] = Math.min(Math.max(j, 0), count - 1);
      }
    }
    // formas del loop (0 = logo sin el retardo de intro)
    const logo = new Float32Array(a); for (let k = 0; k < tot; k++) logo[k * 4 + 3] = 0;
    return { a, c, nb, shapes: [logo, ...buildShapes(logo, count, tot)], bounds: { minX, maxX, minY: minY + 1.3, maxY: maxY + 1.3 } };
  }

  return computeTargets;
}

/** Worker desde Blob con el kernel serializado; null si el navegador no lo permite (se calcula en el hilo principal). */
export function targetsWorker(): Worker | null {
  try {
    const src = `const ct=(${targetsKernel.toString()})();self.onmessage=(e)=>{const d=e.data;const r=ct(d.pts,d.N,d.count);self.postMessage({id:d.id,r},[r.a.buffer,r.c.buffer,r.nb.buffer,...r.shapes.map((s)=>s.buffer)]);};`;
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const w = new Worker(url); setTimeout(() => URL.revokeObjectURL(url), 10000);
    return w;
  } catch { return null; }
}
