"""Packs "Forja de cromo": capturas desktop (1440×900), hover sobre Pyme y móvil (390×844).
Uso: python3 scripts/shoot-packs.py <base_url> <prefijo>   p. ej. https://southsoftware.cl before
Salida: /workspace/south-software/site-media/packs-forja/<prefijo>-{desktop,hover-pyme,mobile}.png"""
import asyncio, sys
from playwright.async_api import async_playwright
BASE = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://localhost:3410'
PFX = sys.argv[2] if len(sys.argv) > 2 else 'after'
OUT = '/workspace/south-software/site-media/packs-forja'
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
async def walk(pg):
  for _ in range(8): await pg.mouse.wheel(0, 300); await pg.wait_for_timeout(80)
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
    pg = await b.new_page(viewport={'width': 1440, 'height': 900})
    await pg.goto(BASE + '/packs', wait_until='load'); await pg.wait_for_timeout(2500)
    await pg.mouse.move(5, 450)
    top = await pg.evaluate("document.querySelector('#packs .packs').getBoundingClientRect().top")
    await pg.mouse.wheel(0, top - 70); await pg.wait_for_timeout(4200)
    await pg.screenshot(path=f'{OUT}/{PFX}-desktop.png')
    box = await pg.locator('#packs .pack').nth(1).bounding_box()
    await pg.mouse.move(box['x'] + box['width'] * .2, box['y'] + box['height'] * .25, steps=12)
    await pg.wait_for_timeout(1200)
    await pg.screenshot(path=f'{OUT}/{PFX}-hover-pyme.png')
    await pg.close()
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = await ctx.new_page(); await pg.goto(BASE + '/packs', wait_until='load'); await pg.wait_for_timeout(2500)
    await pg.evaluate("window.scrollTo(0, document.querySelector('#packs').getBoundingClientRect().top + scrollY)")
    await pg.wait_for_timeout(3500)
    await pg.screenshot(path=f'{OUT}/{PFX}-mobile.png')
    h = await pg.evaluate("(()=>{const s=document.querySelector('#packs');return {sec:s.getBoundingClientRect().height,ih:innerHeight,doc:document.documentElement.scrollHeight}})()")
    print(PFX, 'mobile', h, 'ratio', round(h['sec'] / h['ih'], 2))
    await b.close()
asyncio.run(main())
