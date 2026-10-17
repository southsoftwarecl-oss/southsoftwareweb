"""Capturas del sitio (producción local). Uso: python3 scripts/shoot.py [base_url] [out_dir] [rutas...]"""
import asyncio, sys, os
from playwright.async_api import async_playwright
from PIL import Image
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3100'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/workspace/south-software/site-media'
ROUTES = sys.argv[3:] or ['/']
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
os.makedirs(OUT, exist_ok=True)

def slug(r): return 'home' if r == '/' else r.strip('/').replace('/', '-')

async def full(pg, path, W, VH):
    await pg.goto(BASE + (pathq := path) + ('&' if '?' in pathq else '?') + 'capture', wait_until='networkidle')
    await pg.wait_for_timeout(2200)
    H = await pg.evaluate('document.documentElement.scrollHeight')
    canvas = Image.new('RGB', (W, H)); y = 0; i = 0
    while y < H:
        yy = min(y, H - VH)
        await pg.evaluate(f'window.scrollTo(0,{yy})'); await pg.wait_for_timeout(350)
        if i == 1: await pg.add_style_tag(content='.nav,.wa-float{display:none!important}')
        await pg.screenshot(path='/tmp/_tile.png')
        tile = Image.open('/tmp/_tile.png').convert('RGB')
        if tile.width != W: tile = tile.resize((W, VH), Image.LANCZOS)  # DPR 2 → 1
        canvas.paste(tile, (0, yy)); y += VH; i += 1
    return canvas

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
        for r in ROUTES:
            s = slug(r)
            for name, vp, mobile in [('desktop', {'width': 1440, 'height': 900}, False), ('mobile', {'width': 390, 'height': 844}, True)]:
                ctx = await b.new_context(viewport=vp, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile)
                pg = await ctx.new_page(); errs = []
                pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
                pg.on('pageerror', lambda e: errs.append(str(e)))
                await pg.goto(BASE + r, wait_until='load')
                if not mobile: await pg.mouse.move(900, 380)
                await pg.wait_for_timeout(4200)
                await pg.screenshot(path=f'{OUT}/{s}-{name}-hero.png')
                if '--full' in os.environ.get('SHOOT', ''):
                    img = await full(pg, r, vp['width'], vp['height'])
                    img.save(f'{OUT}/{s}-{name}-full.jpg', quality=80)
                sw = await pg.evaluate('document.documentElement.scrollWidth')
                print(r, name, 'scrollWidth', sw, 'errors:', errs[:6])
                await ctx.close()
        await b.close()
asyncio.run(main())
