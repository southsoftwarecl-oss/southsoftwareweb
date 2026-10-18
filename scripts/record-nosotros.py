"""Video de 15 s del recorrido de /nosotros (1440×900) + fps (rAF) y long tasks (>50 ms).
NOTA: el box renderiza por software (SwiftShader): los fps NO representan una GPU real.
Uso: python3 scripts/record-nosotros.py http://localhost:3520 /workspace/south-software/site-media/nosotros [gl]"""
import asyncio, sys, json, glob, os, shutil
from playwright.async_api import async_playwright
BASE, OUT = sys.argv[1], sys.argv[2]
GL = sys.argv[3] if len(sys.argv) > 3 else ''
PERF = """(() => { window.__perf = { frames: [], long: [] }; let last = performance.now();
  const f = (t) => { window.__perf.frames.push(t - last); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f);
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__perf.long.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }); } catch (e) {} })()"""
async def main():
  vdir = OUT + '/_video'; os.makedirs(vdir, exist_ok=True)
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, record_video_dir=vdir if not GL else None, record_video_size={'width': 1440, 'height': 900})
    await ctx.add_init_script(PERF)
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    await pg.goto(BASE + '/nosotros' + (f'?gl={GL}' if GL else ''), wait_until='load')
    await pg.wait_for_timeout(3000)
    await pg.evaluate('window.__perf.frames = []')
    await pg.mouse.move(80, 450)
    for i in range(60): await pg.mouse.wheel(0, 92); await pg.wait_for_timeout(190)
    await pg.wait_for_timeout(600)
    perf = await pg.evaluate('window.__perf'); tier = await pg.evaluate("document.querySelector('.forge')?.dataset.tier")
    path = await pg.video.path() if pg.video else None
    await ctx.close(); await b.close()
  fr = [x for x in perf['frames'] if x > 0]; fr.sort()
  avg = 1000 / (sum(fr) / len(fr)); p95 = fr[int(len(fr) * .95)]
  res = {'tier': tier, 'fps_avg': round(avg, 1), 'frame_p95_ms': round(p95, 1), 'long_tasks': perf['long'], 'long_tasks_count': len(perf['long']), 'errors': errs}
  print(json.dumps(res))
  if path:
    webm = OUT + '/nosotros-recorrido-15s.webm'; shutil.move(path, webm); shutil.rmtree(vdir, ignore_errors=True)
    os.system(f'ffmpeg -y -loglevel error -i {webm} -c:v libx264 -pix_fmt yuv420p -movflags +faststart {OUT}/nosotros-recorrido-15s.mp4')
  json.dump(res, open(f"{OUT}/metrics-{GL or 'default'}.json", 'w'), indent=1)
asyncio.run(main())
