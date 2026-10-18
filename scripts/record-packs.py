"""Packs "Forja de cromo": video de 6 s de la entrada (1440×900) + fps / long tasks (>50 ms) durante la entrada y el hover.
Uso: python3 scripts/record-packs.py [base_url] [salida.mp4]   (requiere ffmpeg y Chrome)
Nota: en esta máquina el compositor corre por software (swiftshader): los fps NO representan una iGPU real."""
import asyncio, sys, glob, shutil, subprocess, json, time
from playwright.async_api import async_playwright
BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3410').rstrip('/')
OUT = sys.argv[2] if len(sys.argv) > 2 else '/workspace/south-software/site-media/packs-forja/packs-forja-entrada-6s.mp4'
W, H = 1440, 900
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
PROBE = """window.__m={f:[],lt:[]};new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__m.lt.push(Math.round(e.duration)))).observe({type:'longtask',buffered:false});
  (function loop(t0){requestAnimationFrame(t=>{window.__m.f.push(t-t0);loop(t)})})(performance.now())"""
READ = "(()=>{const f=window.__m.f.slice(2).sort((a,b)=>a-b);const avg=f.reduce((s,x)=>s+x,0)/f.length;const r={frames:f.length,avgFps:+(1000/avg).toFixed(1),p95ms:+f[Math.floor(f.length*.95)].toFixed(1),longTasks:window.__m.lt};window.__m.f=[];window.__m.lt=[];return r})()"
async def to_grid(pg):
  # arranca con la grilla bajo el 80% del viewport y la trae con la rueda (dispara la entrada con Lenis)
  await pg.evaluate("window.scrollTo(0,0)")
  top = await pg.evaluate("document.querySelector('#packs .packs').getBoundingClientRect().top")
  return top
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
    res = {}
    # 1) fps + long tasks: entrada y hover (1440×900)
    pg = await b.new_page(viewport={'width': W, 'height': 600})
    await pg.goto(BASE + '/packs', wait_until='load'); await pg.wait_for_timeout(3000)
    await pg.set_viewport_size({'width': W, 'height': H})
    await pg.evaluate(PROBE)
    top = await to_grid(pg)
    await pg.mouse.move(4, 400); await pg.mouse.wheel(0, top - 80)
    await pg.wait_for_function("() => document.querySelector('#packs .packs').dataset.forja==='done'", timeout=15000)
    res['entrada'] = await pg.evaluate(READ)
    box = await pg.locator('#packs .pack.feat').bounding_box()
    await pg.evaluate("window.__m.f=[];window.__m.lt=[]")
    for k in range(3):
      await pg.mouse.move(box['x'] + 10, box['y'] + 10, steps=1)
      await pg.mouse.move(box['x'] + box['width'] - 10, box['y'] + box['height'] - 10, steps=45)
      await pg.mouse.move(box['x'] + box['width'] - 10, box['y'] + 10, steps=30)
    res['hover'] = await pg.evaluate(READ)
    print(json.dumps(res)); await pg.close()
    # 2) video 6 s de la entrada
    tmp = '/tmp/rec_packs'; shutil.rmtree(tmp, ignore_errors=True)
    # a 1440×900 la grilla carga bajo el 80% (top ≈ 766 px): la entrada recién se dispara con la rueda
    ctx = await b.new_context(viewport={'width': W, 'height': H}, record_video_dir=tmp, record_video_size={'width': W, 'height': H})
    pg = await ctx.new_page(); t0 = time.monotonic()
    await pg.goto(BASE + '/packs', wait_until='load'); await pg.wait_for_timeout(3000)
    top = await to_grid(pg)
    t_mark = time.monotonic() - t0
    await pg.mouse.move(4, 400); await pg.mouse.wheel(0, top - 80)
    await pg.wait_for_timeout(4200)
    bx = await pg.locator('#packs .pack.feat').bounding_box()
    await pg.mouse.move(bx['x'] + 30, bx['y'] + 40, steps=8)
    await pg.mouse.move(bx['x'] + bx['width'] - 30, bx['y'] + bx['height'] * .7, steps=40)
    await pg.wait_for_timeout(900)
    await ctx.close(); await b.close()
    webm = glob.glob(f'{tmp}/*.webm')[0]
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', webm], capture_output=True, text=True).stdout.strip())
    start = max(0.3, t_mark - 0.2)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{start:.2f}', '-i', webm, '-t', '6', '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-movflags', '+faststart', OUT], check=True)
    print(OUT, subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT], capture_output=True, text=True).stdout.strip())
asyncio.run(main())
