"""Graba 10 s del hero v2 (servidor de producción local): intro → hover sobre el texto → scroll a la esfera → vuelta.
Uso: python3 scripts/record-home.py [url] [salida.mp4] [nivel]   (requiere ffmpeg y Chrome)
nivel = high|mid|mobile|low (por defecto mid: con swiftshader la pasada de fluido baja a ~5 fps y el video
se vería a saltos; en GPU real usar high)."""
import asyncio, sys, glob, shutil, subprocess, math
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3100/'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/workspace/south-software/site-media/v2/home-v2-10s.mp4'
TIER = sys.argv[3] if len(sys.argv) > 3 else 'mid'
W, H = 1280, 800
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    tmp = '/tmp/rec_home'; shutil.rmtree(tmp, ignore_errors=True)
    ctx = await b.new_context(viewport={'width': W, 'height': H}, record_video_dir=tmp, record_video_size={'width': W, 'height': H})
    pg = await ctx.new_page()
    await pg.goto(f"{URL}{'&' if '?' in URL else '?'}gl={TIER}", wait_until='load')
    await pg.mouse.move(W * .9, H * .9)
    await pg.wait_for_timeout(2600)                       # preloader + intro (nube → texto, onda izq→der)
    for i in range(30):                                   # hover: el cursor recorre el wordmark y se detiene (onda)
      x = .22 + .56 * i / 29
      await pg.mouse.move(W * x, H * (.3 + .05 * math.sin(i / 29 * math.pi * 3))); await pg.wait_for_timeout(30)
    await pg.wait_for_timeout(500)
    for i in range(10): await pg.mouse.wheel(0, 50); await pg.wait_for_timeout(60)   # scroll → esfera
    await pg.wait_for_timeout(1300)
    for i in range(10): await pg.mouse.wheel(0, -50); await pg.wait_for_timeout(60)  # vuelta → texto (curva 'mercury')
    await pg.wait_for_timeout(1400)
    await ctx.close(); await b.close()
    webm = glob.glob(f'{tmp}/*.webm')[0]
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', webm], capture_output=True, text=True).stdout.strip() or 11)
    start = max(0.3, dur - 10.0)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{start:.2f}', '-i', webm, '-t', '10', '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', OUT], check=True)
    d = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT], capture_output=True, text=True).stdout.strip()
    print(OUT, d, 'source', dur)
asyncio.run(main())
