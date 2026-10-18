"""Alturas por sección de /servicios + capturas (full page) a 1440×900, 1280×680 y 390×844.
Uso: python3 scripts/measure-servicios.py <base_url> <out_dir>
Nota: WebGL/compositor por software (swiftshader) en esta máquina."""
import asyncio, sys, json, os
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3480'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/tmp/servicios-shots'
os.makedirs(OUT, exist_ok=True)
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
JS = """(()=>{const pg=[...document.querySelectorAll('.page')].find(e=>e.offsetParent!==null)||document.body;
const secs=[...pg.querySelectorAll(':scope > section, :scope > *  > section')].filter(s=>s.offsetParent!==null);
const out=secs.map(s=>({id:s.id||s.className.split(' ').slice(0,2).join('.')||s.getAttribute('aria-label'),h:Math.round(s.getBoundingClientRect().height)}));
const ft=document.querySelector('footer');if(ft)out.push({id:'footer',h:Math.round(ft.getBoundingClientRect().height)});
return {scrollHeight:document.documentElement.scrollHeight,innerHeight,ratio:+(document.documentElement.scrollHeight/innerHeight).toFixed(2),scrollWidth:document.documentElement.scrollWidth,sections:out}})()"""
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
    res = {}
    for name, vp, mobile in [('1440x900', {'width':1440,'height':900}, False), ('1280x680', {'width':1280,'height':680}, False), ('390x844', {'width':390,'height':844}, True)]:
      ctx = await b.new_context(viewport=vp, device_scale_factor=1, is_mobile=mobile, has_touch=mobile)
      pg = await ctx.new_page(); errs = []
      pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
      pg.on('pageerror', lambda e: errs.append(str(e)))
      await pg.goto(BASE + '/servicios?capture', wait_until='networkidle'); await pg.wait_for_timeout(2500)
      r = await pg.evaluate(JS); r['errors'] = errs[:5]; res[name] = r
      await pg.add_style_tag(content='.nav,.wa-float{display:none!important}')
      await pg.screenshot(path=f'{OUT}/servicios-{name}-full.png', full_page=True)
      await ctx.close()
    print(json.dumps(res, indent=1, ensure_ascii=False))
    await b.close()
asyncio.run(main())
