"""Graba ~25 s del scroll del home (servidor de producción local) → site-media/home.mp4.
Uso: python3 scripts/record-home.py http://localhost:3100/  (requiere ffmpeg y Chrome)."""
import asyncio, sys, glob, shutil, subprocess, math
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3100/'
OUT = '/workspace/south-software/site-media/home.mp4'
W, H = 1280, 800
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    tmp = '/tmp/rec_home'; shutil.rmtree(tmp, ignore_errors=True)
    ctx = await b.new_context(viewport={'width': W, 'height': H}, record_video_dir=tmp, record_video_size={'width': W, 'height': H})
    pg = await ctx.new_page()
    await pg.goto(URL, wait_until='load')
    await pg.mouse.move(W * .62, H * .45)
    await pg.wait_for_timeout(3000)                      # preloader + intro de partículas
    for i in range(36):                                  # el mouse empuja las partículas
      a = i / 36 * math.pi * 2
      await pg.mouse.move(W * (.55 + .2 * math.cos(a)), H * (.42 + .18 * math.sin(a))); await pg.wait_for_timeout(40)
    total = await pg.evaluate('document.documentElement.scrollHeight - innerHeight')
    steps = 120
    for i in range(steps):                               # scroll continuo con rueda (Lenis lo suaviza)
      await pg.mouse.wheel(0, total / steps * 1.02); await pg.wait_for_timeout(85)
    await pg.wait_for_timeout(1800)
    await ctx.close(); await b.close()
    webm = glob.glob(f'{tmp}/*.webm')[0]
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '0.3', '-i', webm, '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', OUT], check=True)
    d = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT], capture_output=True, text=True).stdout.strip()
    print(OUT, d)
asyncio.run(main())
