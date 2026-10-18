"""/servicios: video de 10 s (1440×900) recorriendo selector → demos → configurador → proceso → stack,
+ métricas: CLS, duración de eventos al cambiar de tab (proxy de INP), fps y long tasks.
Uso: python3 scripts/record-servicios.py [base_url] [salida.mp4]
Nota: compositor/WebGL por software (swiftshader) en esta máquina: fps NO representativos de hardware real."""
import asyncio, sys, glob, shutil, subprocess, json
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3480'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/workspace/south-software/site-media/servicios/servicios-10s.mp4'
W, H = 1440, 900
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
OBS = """window.__m={cls:0,ev:[],lt:[],f:[]};
new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.__m.cls+=e.value})).observe({type:'layout-shift',buffered:true});
new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__m.ev.push([e.name,Math.round(e.duration)]))).observe({type:'event',buffered:true,durationThreshold:16});
new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__m.lt.push(Math.round(e.duration)))).observe({type:'longtask',buffered:true});
(function loop(t0){requestAnimationFrame(t=>{window.__m.f.push(t-t0);loop(t)})})(performance.now());"""
async def smooth(pg, sel, off=60, ms=900):
  await pg.evaluate(f"""new Promise(res=>{{const y0=scrollY,y1=document.querySelector('{sel}').getBoundingClientRect().top+scrollY-{off},T={ms},t0=performance.now();
    (function f(){{const k=Math.min(1,(performance.now()-t0)/T);window.scrollTo(0,y0+(y1-y0)*(k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2));k<1?requestAnimationFrame(f):res()}})()}})""")
async def tour(pg):
  await smooth(pg, '.sv', 60, 900); await pg.wait_for_timeout(1300)
  for s in ['sitios-web', 'apps-moviles', 'seguridad-informatica']:
    await pg.locator(f'#svt-{s}').click(); await pg.wait_for_timeout(1300)
  await smooth(pg, '#arma-tu-proyecto', 40, 700)
  await pg.locator('.cfg .chip', has_text='Tienda online').click(); await pg.wait_for_timeout(500)
  await pg.locator('.cfg .chip', has_text='Pyme (2').click(); await pg.wait_for_timeout(700)
  await smooth(pg, '#proceso', 20, 700); await pg.locator('#pst-2').click(); await pg.wait_for_timeout(500)
  await smooth(pg, '#stack', 20, 600); await pg.locator('#stack .chip-b', has_text='Móvil').click(); await pg.wait_for_timeout(900)
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
    pg = await b.new_page(viewport={'width': W, 'height': H})
    await pg.goto(BASE + '/servicios', wait_until='networkidle'); await pg.evaluate(OBS); await pg.wait_for_timeout(2500)
    await tour(pg)
    m = await pg.evaluate("(()=>{const f=window.__m.f.slice(2).sort((a,b)=>a-b);const avg=f.reduce((s,x)=>s+x,0)/f.length;return {cls:+window.__m.cls.toFixed(4),events:window.__m.ev.filter(e=>/click|pointer|key/.test(e[0])),maxEvent:Math.max(0,...window.__m.ev.map(e=>e[1])),avgFps:+(1000/avg).toFixed(1),p95ms:+f[Math.floor(f.length*.95)].toFixed(1),longTasks:window.__m.lt}})()")
    print(json.dumps(m)); await pg.close()
    tmp = '/tmp/rec_servicios'; shutil.rmtree(tmp, ignore_errors=True)
    ctx = await b.new_context(viewport={'width': W, 'height': H}, record_video_dir=tmp, record_video_size={'width': W, 'height': H})
    pg = await ctx.new_page(); await pg.goto(BASE + '/servicios', wait_until='networkidle'); await pg.wait_for_timeout(2500)
    await pg.add_style_tag(content='.wa-float{display:none!important}')
    t0 = await pg.evaluate('performance.now()')
    await tour(pg)
    await ctx.close(); await b.close()
    webm = glob.glob(f'{tmp}/*.webm')[0]
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', webm], capture_output=True, text=True).stdout.strip())
    start = max(0.3, dur - 12.6)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{start:.2f}', '-i', webm, '-t', '10', '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-movflags', '+faststart', OUT], check=True)
    print(OUT, subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT], capture_output=True, text=True).stdout.strip(), 'raw', dur)
asyncio.run(main())
