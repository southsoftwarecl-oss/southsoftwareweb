"""Suma el JS (gzip) que carga el home en desktop, separando el chunk 3D (three/R3F).
Uso: python3 scripts/js-weight.py http://localhost:3100/  (lee los archivos de .next/static)."""
import asyncio, sys, gzip, os
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3100/'
ROOT = os.path.join(os.path.dirname(__file__), '..', '.next')
async def main():
  urls = []
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = await b.new_page(viewport={'width': 1440, 'height': 900})
    pg.on('request', lambda r: urls.append(r.url) if r.url.endswith('.js') else None)
    await pg.goto(URL, wait_until='load'); await pg.mouse.move(700, 300); await pg.wait_for_timeout(6000)
    await b.close()
  tot = three = 0
  for u in sorted(set(urls)):
    f = os.path.join(ROOT, u.split('/_next/')[1])
    data = open(f, 'rb').read(); gz = len(gzip.compress(data, 9))
    is3d = any(k in data for k in (b'WebGLRenderer', b'GPUComputationRenderer', b'PMREMGenerator', b'@react-three', b'useFrame', b'gl_PointSize'))
    tot += gz; three += gz if is3d else 0
    print(f"{gz:>8} {'3D ' if is3d else '   '}{os.path.basename(f)}")
  print(f'TOTAL gzip {tot}  | 3D chunks gzip {three}')
asyncio.run(main())
