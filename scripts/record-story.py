"""Story v3: video de 8 s del scrub (1440×900) + medición de fps y long tasks (>50 ms) durante el scroll.
Uso: python3 scripts/record-story.py [url] [salida.mp4]   (requiere ffmpeg y Chrome)
Nota: en esta máquina WebGL/compositor corren por software (swiftshader): los fps NO representan una iGPU real."""
import asyncio, sys, glob, shutil, subprocess, json
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3410/'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/workspace/south-software/site-media/story-v3/story-v3-scrub-8s.mp4'
W, H = 1440, 900
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
GEO = "(()=>{const s=document.querySelector('.story');const r=s.getBoundingClientRect();return [r.top+scrollY,r.height,innerHeight]})()"
async def scrub(pg, secs):
  top, h, ih = await pg.evaluate(GEO)
  await pg.evaluate(f'window.scrollTo(0,{top - 40})'); await pg.wait_for_timeout(900)
  # scroll programático lineal en el propio navegador (independiente de la latencia de Playwright)
  await pg.evaluate(f"""new Promise(res=>{{const y0={top - 40},d={h - ih + 80},T={secs*1000},t0=performance.now();
    (function f(){{const k=Math.min(1,(performance.now()-t0)/T);window.scrollTo(0,y0+d*(k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2));k<1?requestAnimationFrame(f):res()}})()}})""")
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
    # 1) fps + long tasks
    pg = await b.new_page(viewport={'width': W, 'height': H})
    await pg.goto(URL, wait_until='load'); await pg.wait_for_timeout(3500)
    await pg.evaluate("""window.__m={f:[],lt:[]};new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__m.lt.push(Math.round(e.duration)))).observe({type:'longtask',buffered:false});
      (function loop(t0){requestAnimationFrame(t=>{window.__m.f.push(t-t0);loop(t)})})(performance.now())""")
    await scrub(pg, 6)
    m = await pg.evaluate("(()=>{const f=window.__m.f.slice(2).sort((a,b)=>a-b);const avg=f.reduce((s,x)=>s+x,0)/f.length;return {frames:f.length,avgFps:+(1000/avg).toFixed(1),p95ms:+f[Math.floor(f.length*.95)].toFixed(1),longTasks:window.__m.lt,blur:document.querySelector('.story').dataset.blur||'on'}})()")
    print(json.dumps(m)); await pg.close()
    # 2) video
    tmp = '/tmp/rec_story'; shutil.rmtree(tmp, ignore_errors=True)
    ctx = await b.new_context(viewport={'width': W, 'height': H}, record_video_dir=tmp, record_video_size={'width': W, 'height': H})
    pg = await ctx.new_page(); await pg.goto(URL, wait_until='load'); await pg.wait_for_timeout(3500)
    t0 = await pg.evaluate('performance.now()')
    await scrub(pg, 7.4); await pg.wait_for_timeout(900)
    await ctx.close(); await b.close()
    webm = glob.glob(f'{tmp}/*.webm')[0]
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', webm], capture_output=True, text=True).stdout.strip())
    start = max(0.3, dur - 8.6)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{start:.2f}', '-i', webm, '-t', '8', '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-movflags', '+faststart', OUT], check=True)
    print(OUT, subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT], capture_output=True, text=True).stdout.strip())
asyncio.run(main())
