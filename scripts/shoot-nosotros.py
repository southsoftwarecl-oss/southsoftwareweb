"""Capturas por acto de /nosotros (desktop 1440×900 y móvil 390×844) + errores de consola.
Uso: python3 scripts/shoot-nosotros.py http://localhost:3520 /workspace/south-software/site-media/nosotros [sufijo]"""
import asyncio, sys
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3520'
OUT = sys.argv[2] if len(sys.argv) > 2 else '.'
SUF = sys.argv[3] if len(sys.argv) > 3 else ''
ACTS = [('1-apertura', '.fhero', 0), ('2-manifiesto-inicio', '.mf', 0.05), ('2-manifiesto-fin', '.mf', 0.97),
        ('3-principios', '.mono-sec', 0), ('3-principios-activo', '.mono-sec', 0), ('4-personas', '.team-sec', 0), ('5-como-trabajamos', '.steps-sec', 0), ('5-cta', '.final', 0)]
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    for name, w, h, mob in [('desktop', 1440, 900, False), ('mobile', 390, 844, True)]:
      ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob, device_scale_factor=1)
      pg = await ctx.new_page(); errs = []
      pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
      pg.on('pageerror', lambda e: errs.append(str(e)))
      await pg.goto(BASE + '/nosotros', wait_until='load'); await pg.wait_for_timeout(4200)
      for act, sel, frac in ACTS:
        if mob and act == '3-principios-activo': continue
        if act == '1-apertura':
          await pg.screenshot(path=f'{OUT}/{act}-{name}{SUF}.png'); continue
        y = await pg.evaluate("""([s, f]) => { const e = document.querySelector(s); const r = e.getBoundingClientRect();
          const top = r.top + scrollY; return f ? top + (r.height - innerHeight) * f : top - 40; }""", [sel, frac])
        await pg.evaluate('(y) => window.scrollTo(0, y)', y); await pg.wait_for_timeout(2600)
        if act == '3-principios-activo':
          await pg.hover('.mono-li:nth-child(3) .mono-p'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=f'{OUT}/{act}-{name}{SUF}.png')
      print(name, 'errores:', errs)
      await ctx.close()
    await b.close()
asyncio.run(main())
