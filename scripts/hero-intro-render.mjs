// Grabación offline determinista de la intro cinemática: ?gl=high&rec&step → un cuadro de simulación (1/30 s) por captura.
import { chromium } from '@playwright/test';
import fs from 'fs';
const W = +(process.env.W || 1440), H = +(process.env.H || 900), TIER = process.env.TIER || 'high', N = +(process.env.N || 150);
const out = `/workspace/ss_final/hero-cinematic/frames-${TIER}-${W}`; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: W, height: H } });
await ctx.addInitScript(() => { try { localStorage.setItem('cookie-consent', 'denied'); } catch {} });
const p = await ctx.newPage();
await p.goto(`http://localhost:3460/?gl=${TIER}&rec&step`, { waitUntil: 'load' });
for (let k = 0; k < 120 && !(await p.evaluate(() => !!window.__heroStep)); k++) { await p.mouse.move(5 + k, H - 5); await p.waitForTimeout(500); }
await p.mouse.move(2, H - 2);
await p.getByRole('button', { name: /Rechazar/ }).click({ timeout: 2000 }).catch(() => {});
await p.waitForTimeout(2500); // preloader/titulares asentados
let i = 0; const shot = async () => p.screenshot({ path: `${out}/f${String(i++).padStart(4, '0')}.png` });
for (let k = 0; k < 15; k++) await shot(); // 0,5 s de póster (LCP)
// avanza sin grabar hasta que la escena está lista (destinos del Worker + 4 cuadros de calentamiento)
for (let k = 0; k < 400; k++) {
  await p.evaluate(() => window.__heroStep(1));
  if (await p.evaluate(() => document.querySelector('.hero .gl-wrap')?.style.opacity === '1')) break;
  await p.waitForTimeout(30);
}
await p.addStyleTag({ content: '.hero .gl-wrap{transition:none!important}' });
for (let k = 0; k < N; k++) { await p.evaluate(() => window.__heroStep(1)); await shot(); if (k % 20 === 0) console.log('frame', k); }
await b.close();
console.log('done', i);
