"""/servicios: captura de viewport por demo (un tab/ítem por servicio) a 1440×900 y 390×844 + configurador/proceso/stack.
Uso: python3 scripts/shoot-servicios.py <base_url> <out_dir> [espera_ms]
Nota: compositor/WebGL por software (swiftshader) en esta máquina: las animaciones van a menos fps que en hardware real."""
import asyncio, sys, os
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3480'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/tmp/svshots'
WAIT = int(sys.argv[3]) if len(sys.argv) > 3 else 5200
os.makedirs(OUT, exist_ok=True)
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
SLUGS = ['software-a-medida', 'software-de-escritorio', 'sitios-web', 'apps-moviles', 'seguridad-informatica', 'ciencia-de-datos']
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
    for name, vp, mobile in [('desktop', {'width': 1440, 'height': 900}, False), ('mobile', {'width': 390, 'height': 844}, True)]:
      ctx = await b.new_context(viewport=vp, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile)
      pg = await ctx.new_page(); errs = []
      pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
      pg.on('pageerror', lambda e: errs.append(str(e)))
      await pg.goto(BASE + '/servicios', wait_until='networkidle'); await pg.wait_for_timeout(2500)
      await pg.add_style_tag(content='.nav,.wa-float{display:none!important}')
      for i, s in enumerate(SLUGS):
        if mobile:
          btn = pg.locator(f'#sva-{s}')
          if await btn.get_attribute('aria-expanded') != 'true': await btn.click()
          await pg.wait_for_timeout(700)
          await pg.evaluate(f"window.scrollTo(0, document.getElementById('{s}').getBoundingClientRect().top + scrollY - 10)")
        else:
          await pg.locator(f'#svt-{s}').click()
          await pg.evaluate("window.scrollTo(0, document.querySelector('.sv').getBoundingClientRect().top + scrollY - 60)")
        await pg.wait_for_timeout(WAIT)
        await pg.screenshot(path=f'{OUT}/{name}-{i+1}-{s}.png')
      for sel, tag in [('#arma-tu-proyecto', 'configurador'), ('#proceso', 'proceso'), ('#stack', 'stack')]:
        if tag == 'configurador':
          await pg.locator('.cfg .chip', has_text='Sitio web').click(); await pg.locator('.cfg .chip', has_text='Pyme').click()
        await pg.evaluate(f"window.scrollTo(0, document.querySelector('{sel}').getBoundingClientRect().top + scrollY - 20)")
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{OUT}/{name}-{tag}.png')
      print(name, 'errors:', errs[:5])
      await ctx.close()
    await b.close()
asyncio.run(main())
