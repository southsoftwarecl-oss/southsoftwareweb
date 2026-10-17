"""Mide altura del home y de cada sección (en px y en múltiplos de innerHeight) en 3 viewports.
Uso: python3 scripts/measure-home.py http://localhost:3100/ [salida.json]"""
import asyncio, sys, json
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3100/'
VPS = [('1440x900', 1440, 900, False), ('1280x680', 1280, 680, False), ('390x844', 390, 844, True)]
JS = """() => {
  const vh = innerHeight, page = [...document.querySelectorAll('main .page')].find(p => p.offsetParent !== null) || document.querySelector('main');
  const els = [...page.querySelectorAll(':scope > section, :scope > div > section, :scope > section.story')];
  const out = els.map(s => ({ id: s.id || s.className.split(' ')[0] || s.getAttribute('aria-label'), h: Math.round(s.getBoundingClientRect().height), vh: +(s.getBoundingClientRect().height / vh).toFixed(2) }));
  const f = document.querySelector('footer'); if (f) out.push({ id: 'footer', h: Math.round(f.offsetHeight), vh: +(f.offsetHeight / vh).toFixed(2) });
  return { scrollHeight: document.documentElement.scrollHeight, innerHeight: vh, ratio: +(document.documentElement.scrollHeight / vh).toFixed(2), sections: out };
}"""
async def main():
  res = {}
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    for name, w, h, mob in VPS:
      ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob, device_scale_factor=1)
      pg = await ctx.new_page(); await pg.goto(URL, wait_until='load'); await pg.wait_for_timeout(2500)
      for y in range(0, 30): await pg.mouse.wheel(0, 900); await pg.wait_for_timeout(60)
      await pg.wait_for_timeout(800)
      res[name] = await pg.evaluate(JS); await ctx.close()
    await b.close()
  for k, v in res.items():
    print(f"{k}: scrollHeight={v['scrollHeight']} ratio={v['ratio']}")
    for s in v['sections']: print(f"   {s['id']:<20} {s['h']:>6}px {s['vh']:>5}vh")
  if len(sys.argv) > 2: json.dump(res, open(sys.argv[2], 'w'), indent=1)
asyncio.run(main())
