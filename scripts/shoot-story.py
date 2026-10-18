"""Capturas de la sección Story: 0/25/50/75/100% del recorrido (1440×900), transición story→proyectos
(1440×900 y 1280×680) y móvil 390×844. Imprime métricas (top del pin, alturas).
Uso: python3 scripts/shoot-story.py URL OUTDIR PREFIJO"""
import asyncio, sys, json
from playwright.async_api import async_playwright
URL, OUT, P = sys.argv[1], sys.argv[2], sys.argv[3]
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
async def go(pg, y):
  await pg.evaluate(f'window.scrollTo(0,{y})'); await pg.wait_for_timeout(1400)
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
    for (w, h) in [(1440, 900), (1280, 680)]:
      pg = await b.new_page(viewport={'width': w, 'height': h})
      await pg.goto(URL, wait_until='load'); await pg.wait_for_timeout(3500)
      m = await pg.evaluate("(()=>{const s=document.querySelector('.story');const r=s.getBoundingClientRect();return {top:r.top+scrollY,h:r.height,doc:document.documentElement.scrollHeight,ih:innerHeight}})()")
      out = {'vp': f'{w}x{h}', 'storyH/vh': round(m['h']/m['ih'], 2), 'doc/vh': round(m['doc']/m['ih'], 2), 'pinTop': {}}
      for pct in [0, 25, 50, 75, 100]:
        await go(pg, m['top'] + (m['h'] - m['ih']) * pct / 100)
        out['pinTop'][pct] = await pg.evaluate("Math.round(document.querySelector('.story .pin').getBoundingClientRect().top)")
        if w == 1440: await pg.screenshot(path=f'{OUT}/{P}-desktop-{pct:03d}.png')
      await go(pg, m['top'] + m['h'] - m['ih'] * 0.5)
      await pg.screenshot(path=f'{OUT}/{P}-story-to-projects-{w}x{h}.png')
      print(json.dumps(out)); await pg.close()
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = await ctx.new_page(); await pg.goto(URL, wait_until='load'); await pg.wait_for_timeout(3000)
    st = pg.locator('.story'); await st.scroll_into_view_if_needed()
    for i in range(12): await pg.mouse.wheel(0, 300); await pg.wait_for_timeout(200)
    await st.scroll_into_view_if_needed(); await pg.evaluate("document.querySelector('.story').scrollIntoView()")
    y0 = await pg.evaluate("document.querySelector('.story').getBoundingClientRect().top+scrollY")
    hh = await pg.evaluate("document.querySelector('.story').offsetHeight")
    for k in range(0, int(hh) + 1, 600): await go(pg, y0 + k)
    await pg.wait_for_timeout(1500)
    await st.screenshot(path=f'{OUT}/{P}-mobile-390.png')
    print(json.dumps({'mobile storyH/vh': round(hh/844, 2)}))
    await b.close()
asyncio.run(main())
