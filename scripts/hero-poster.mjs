/**
 * Regenera el póster del hero (public/hero/poster-{d,m}[@2x].{avif,webp}) desde el PRIMER cuadro real del canvas:
 * `?gl=<tier>&poster` congela t=0, cámara frontal y oculta el polvo; se captura solo el canvas (resto oculto),
 * 60 % superior del hero (igual que .gl-poster). Uso: `npx next start -p 3460` y `node scripts/hero-poster.mjs`.
 * Requiere `sharp` (viene con Next).
 */
import { chromium } from '@playwright/test';
import sharp from 'sharp';
const BASE = process.env.BASE || 'http://localhost:3460';
const Q = { 1: { avif: 55, webp: 78 }, 2: { avif: 38, webp: 62 } }; // @2x: más compresión (los píxeles extra compensan)
const JOBS = [
  { name: 'poster-d', tier: 'high', w: 1440, h: 900, dprs: [1, 2] },
  { name: 'poster-m', tier: 'mobile', w: 390, h: 844, dprs: [1, 2] },
];
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const j of JOBS.filter((x) => !process.env.ONLY || x.name === process.env.ONLY)) for (const dpr of j.dprs) {
  const ctx = await b.newContext({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: dpr });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/?gl=${j.tier}&poster`, { waitUntil: 'load' });
  // equipos modestos / móvil: la escena espera la primera interacción → se mueve el mouse hasta que aparece
  for (let k = 0; k < 60 && !(await p.locator('.hero .gl-wrap').count()); k++) { await p.mouse.move(20 + k, j.h - 20); await p.waitForTimeout(500); }
  await p.waitForFunction(() => getComputedStyle(document.querySelector('.hero .gl-wrap') ?? document.body).opacity === '1' && !!document.querySelector('.hero .gl-wrap'), null, { timeout: 120000 });
  await p.mouse.move(1, j.h - 1); await p.waitForTimeout(2500);
  await p.addStyleTag({ content: 'body *{visibility:hidden!important} .hero canvas.gl{visibility:visible!important}' });
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(600);
  const r = await p.locator('.hero canvas.gl').boundingBox();
  const png = await p.screenshot({ clip: { x: r.x, y: r.y, width: r.width, height: Math.round(r.height * 0.6) } });
  const suf = dpr === 1 ? '' : `@${dpr}x`;
  await sharp(png).avif({ quality: Q[dpr].avif, effort: 6 }).toFile(`public/hero/${j.name}${suf}.avif`);
  await sharp(png).webp({ quality: Q[dpr].webp }).toFile(`public/hero/${j.name}${suf}.webp`);
  console.log(j.name + suf, Math.round(r.width), 'x', Math.round(r.height * 0.6));
  await ctx.close();
}
await b.close();
