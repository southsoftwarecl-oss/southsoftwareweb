"""/contacto: capturas de estados (chips, presupuesto, brief, sello, éxito, móvil) y video de 8 s
(completar el brief → enviar). Uso: python3 scripts/record-contacto.py [base] [out_dir]"""
import asyncio, sys, os, shutil, glob
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3530'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/workspace/south-software/site-media/contacto'
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
os.makedirs(OUT, exist_ok=True)

async def fill(pg, slow=55):
  await pg.get_by_label('Nombre').click(); await pg.keyboard.type('Ana Pérez', delay=slow)
  await pg.get_by_label('Empresa').click(); await pg.keyboard.type('Tienda Sur', delay=slow)
  await pg.get_by_label('Email', exact=True).click(); await pg.keyboard.type('ana@tiendasur.cl', delay=slow // 2)
  await pg.get_by_role('radio', name='E-commerce').click(); await pg.wait_for_timeout(500)
  await pg.get_by_role('radio', name='$300.000 – $700.000').click(); await pg.wait_for_timeout(350)
  await pg.keyboard.press('ArrowRight'); await pg.wait_for_timeout(600)
  await pg.get_by_label('Cuéntanos tu idea').click()
  await pg.keyboard.type('Vendemos ropa outdoor hecha en Chile, unos 80 productos.', delay=slow // 2)

async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
    # video 8 s (desktop)
    vdir = '/tmp/contacto-video'; shutil.rmtree(vdir, ignore_errors=True)
    ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, record_video_dir=vdir, record_video_size={'width': 1440, 'height': 900})
    pg = await ctx.new_page()
    await pg.goto(BASE + '/contacto', wait_until='load')
    await pg.wait_for_function('() => !!window.__contactMotion', timeout=15000)
    await pg.evaluate('window.scrollTo(0, 120)'); await pg.wait_for_timeout(300)
    await fill(pg, 35)
    await pg.screenshot(path=f'{OUT}/after-desktop-brief-filled.png')
    await pg.get_by_role('button', name='Enviar brief').click()
    await pg.wait_for_timeout(700); await pg.screenshot(path=f'{OUT}/after-desktop-seal.png')
    await pg.locator('form.brief .recv b').wait_for(timeout=15000); await pg.wait_for_timeout(900)
    await pg.screenshot(path=f'{OUT}/after-desktop-success.png')
    await ctx.close()
    vids = glob.glob(f'{vdir}/*.webm')
    if vids:
      os.system(f'ffmpeg -y -loglevel error -sseof -8.5 -i {vids[0]} -t 8 -c:v libx264 -pix_fmt yuv420p -movflags +faststart {OUT}/contacto-brief-8s.mp4')
    # móvil: brief abierto
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = await ctx.new_page(); await pg.goto(BASE + '/contacto', wait_until='load'); await pg.wait_for_timeout(2500)
    await pg.get_by_label('Nombre').fill('Ana Pérez'); await pg.get_by_role('radio', name='Ciencia de datos').check()
    await pg.get_by_role('radio', name='Aún no lo sé').check()
    await pg.locator('.bc-tog').click(); await pg.wait_for_timeout(600)
    await pg.locator('.bc-mob').scroll_into_view_if_needed(); await pg.wait_for_timeout(400)
    await pg.screenshot(path=f'{OUT}/after-mobile-brief-open.png')
    await ctx.close(); await b.close()
asyncio.run(main())
