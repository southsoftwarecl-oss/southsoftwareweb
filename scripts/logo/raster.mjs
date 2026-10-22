// Rasteriza los SVG del sistema de logo (favicon, apple-touch, manifest, OG, logo.png de schema).
import { chromium } from 'playwright';
import fs from 'node:fs';
const B = 'public/brand', rd = (f) => fs.readFileSync(`${B}/${f}`, 'utf8');
const logo = rd('logo.svg'), mono = rd('monogram.svg');
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' }); const pg = await b.newPage();
async function shot(html, w, h, out, type = 'png', omit = false) {
  await pg.setViewportSize({ width: w, height: h });
  await pg.setContent(`<html><body style="margin:0;width:${w}px;height:${h}px;overflow:hidden;${omit ? 'background:transparent' : ''}">${html}</body></html>`);
  await pg.screenshot({ path: out, type, omitBackground: omit, ...(type === 'jpeg' ? { quality: 88 } : {}) });
}
const tile = (s) => `<div style="width:${s}px;height:${s}px;background:#0A0A0B;display:flex;align-items:center;justify-content:center;color:#EDEDEF">${mono.replace('<svg', `<svg width="${s}" height="${s}"`)}</div>`;
for (const s of [16, 32, 48, 96, 192, 512]) await shot(tile(s), s, s, `public/icon-${s}.png`);
await shot(tile(180), 180, 180, 'public/apple-touch-icon.png');
const og = `<div style="width:1200px;height:630px;background:#0A0A0B;color:#EDEDEF;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px;font-family:sans-serif">${logo.replace('<svg', '<svg width="560"')}<div style="color:#8A8F98;font-size:28px;letter-spacing:.02em">Software &amp; Marketing</div></div>`;
await shot(og, 1200, 630, 'src/app/opengraph-image.jpg', 'jpeg');
await shot(og, 1200, 630, 'src/app/twitter-image.jpg', 'jpeg');
await shot(`<div style="width:600px;height:187px;background:#0A0A0B;color:#EDEDEF;display:flex;align-items:center;justify-content:center">${logo.replace('<svg', '<svg width="520"')}</div>`, 600, 187, `${B}/logo.png`);
await b.close();
