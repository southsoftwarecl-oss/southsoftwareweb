"""/contacto: alturas, h1, JS gzip y capturas. Uso: python3 scripts/measure-contacto.py <base_url> <tag> [out_dir]
tag = before | after. Lee los .js servidos desde .next/static para sumar gzip."""
import asyncio, sys, gzip, os, json
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3530'
TAG = sys.argv[2] if len(sys.argv) > 2 else 'after'
OUT = sys.argv[3] if len(sys.argv) > 3 else '/workspace/south-software/site-media/contacto'
ROOT = os.path.join(os.path.dirname(__file__), '..', '.next')
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
os.makedirs(OUT, exist_ok=True)
JS = """() => {
  const vh = innerHeight, H = document.documentElement.scrollHeight;
  const secs = [...document.querySelectorAll('.page > section, .page > .page-top, footer')].map(s => [s.className.split(' ')[0] || s.tagName, Math.round(s.getBoundingClientRect().height)]);
  const h1 = document.querySelector('h1');
  return { vh, H, ratio: +(H / vh).toFixed(2), sw: document.documentElement.scrollWidth, secs, h1: h1 && getComputedStyle(h1).fontSize };
}"""
async def main():
  res = {}
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
    for name, vp, mobile in [('desktop', {'width': 1440, 'height': 900}, False), ('mobile', {'width': 390, 'height': 844}, True)]:
      ctx = await b.new_context(viewport=vp, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile)
      pg = await ctx.new_page(); urls = []; errs = []
      pg.on('request', lambda r: urls.append(r.url) if r.url.endswith('.js') else None)
      pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
      pg.on('pageerror', lambda e: errs.append(str(e)))
      await pg.goto(BASE + '/contacto', wait_until='load'); await pg.wait_for_timeout(4000)
      m = await pg.evaluate(JS)
      # captura de página completa (scroll para disparar reveals)
      for y in range(0, m['H'], 500):
        await pg.evaluate(f'window.scrollTo(0,{y})'); await pg.wait_for_timeout(120)
      await pg.wait_for_timeout(1500); await pg.evaluate('window.scrollTo(0,0)'); await pg.wait_for_timeout(600)
      await pg.screenshot(path=f'{OUT}/{TAG}-{name}-top.png')
      await pg.screenshot(path=f'{OUT}/{TAG}-{name}-full.png', full_page=True)
      tot = 0
      for u in sorted(set(urls)):
        if '/_next/' not in u: continue
        f = os.path.join(ROOT, u.split('/_next/')[1])
        if os.path.exists(f): tot += len(gzip.compress(open(f, 'rb').read(), 9))
      m['js_gzip'] = tot; m['js_files'] = len(set(urls)); m['errors'] = errs[:6]
      res[name] = m
      await ctx.close()
    await b.close()
  print(json.dumps(res, indent=1, ensure_ascii=False))
  json.dump(res, open(f'{OUT}/{TAG}-metrics.json', 'w'), indent=1, ensure_ascii=False)
asyncio.run(main())
