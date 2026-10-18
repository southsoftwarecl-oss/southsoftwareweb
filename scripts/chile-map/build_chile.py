"""Genera src/content/map-chile.ts: contorno REAL de Chile continental + curvas de nivel de los Andes.
Fuentes (dominio público):
  - Contorno: Natural Earth 10m admin_0_countries (ADM0_A3 = CHL), https://www.naturalearthdata.com
  - Relieve: Mapzen Terrain Tiles z5 (AWS Open Data; SRTM y GMTED2010 — USGS; ETOPO1 — NOAA), recortado al contorno.
Uso: mkdir -p /tmp/chilemap && cd /tmp/chilemap
     curl -sLO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson
     python3 <repo>/scripts/chile-map/build_chile.py <repo>/src/content/map-chile.ts
Sin marcadores de ciudades ni coordenadas: solo geometría a escala país."""
import json, math, os, sys, urllib.request
import numpy as np
from PIL import Image, ImageDraw
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt

OUT = sys.argv[1] if len(sys.argv) > 1 else 'map-chile.ts'
Z = 5
d = json.load(open('ne_10m_admin_0_countries.geojson')) if os.path.exists('ne_10m_admin_0_countries.geojson') else json.load(open('ne10.geojson'))
chl = [f for f in d['features'] if f['properties'].get('ADM0_A3') == 'CHL'][0]['geometry']['coordinates']
polys = [p[0] for p in chl if min(x for x, _ in p[0]) > -76.5]  # continente + islas costeras (sin Rapa Nui ni Juan Fernández)
def MX(lon): return (lon + 180) / 360 * 2 ** Z * 256
def MY(lat): r = math.radians(lat); return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * 2 ** Z * 256
allp = [(MX(x), MY(y)) for p in polys for x, y in p]
x0, x1 = min(a for a, _ in allp), max(a for a, _ in allp); y0, y1 = min(b for _, b in allp), max(b for _, b in allp)
VH = 2000; sc = VH / (y1 - y0); VW = round((x1 - x0) * sc)
def P(px, py): return ((px - x0) * sc, (py - y0) * sc)
def dp(pts, eps):
    pts = np.asarray(pts)
    if len(pts) < 3: return pts
    keep = np.zeros(len(pts), bool); keep[0] = keep[-1] = True; st = [(0, len(pts) - 1)]
    while st:
        a, b = st.pop()
        if b - a < 2: continue
        A, B = pts[a], pts[b]; seg = B - A; L = np.hypot(*seg); q = pts[a + 1:b]
        dd = np.abs(seg[0] * (q[:, 1] - A[1]) - seg[1] * (q[:, 0] - A[0])) / L if L > 0 else np.hypot(*(q - A).T)
        i = int(np.argmax(dd))
        if dd[i] > eps: keep[a + 1 + i] = True; st += [(a, a + 1 + i), (a + 1 + i, b)]
    return pts[keep]
def plen(pts): pts = np.asarray(pts); return float(np.sum(np.hypot(*np.diff(pts, axis=0).T)))
def d_of(pts, close=False):
    p = [(round(x * 2) / 2, round(y * 2) / 2) for x, y in pts]
    f = lambda v: ('%g' % v)
    s = f'M{f(p[0][0])} {f(p[0][1])}'; px, py = p[0]
    for x, y in p[1:]:
        if (x, y) == (px, py): continue
        s += f'l{f(x - px)} {f(y - py)}'; px, py = x, y
    return s + ('z' if close else '')
outline = []
for p in polys:
    g = [P(MX(x), MY(y)) for x, y in p]
    s = dp(g, 0.9)
    if len(s) >= 4 and plen(s) > 10: outline.append(s)
outline.sort(key=lambda s: -plen(s))
# relieve
tx0, tx1 = int(x0 // 256), int(x1 // 256); ty0, ty1 = int(y0 // 256), int(y1 // 256)
rows = []
for ty in range(ty0, ty1 + 1):
    row = []
    for tx in range(tx0, tx1 + 1):
        fn = f't{Z}_{tx}_{ty}.png'
        if not os.path.exists(fn): urllib.request.urlretrieve(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{tx}/{ty}.png', fn)
        a = np.asarray(Image.open(fn).convert('RGB')).astype(np.float32)
        row.append(a[:, :, 0] * 256 + a[:, :, 1] + a[:, :, 2] / 256 - 32768)
    rows.append(np.hstack(row))
dem = np.vstack(rows); ox, oy = tx0 * 256, ty0 * 256
mask = Image.new('L', (dem.shape[1], dem.shape[0]), 0); dr = ImageDraw.Draw(mask)
for p in polys: dr.polygon([(MX(x) - ox, MY(y) - oy) for x, y in p], fill=1)
M = np.asarray(mask) > 0  # las curvas se calculan sobre el DEM completo y se cortan fuera de Chile (sin bordes artificiales)
levels = [1500, 3000, 4500]
yy, xx = np.mgrid[0:dem.shape[0], 0:dem.shape[1]]
cs = plt.contour(xx + .5, yy + .5, dem, levels=levels)
cont = []
for li, segs in enumerate(cs.allsegs):
    for seg in segs:
        parts, cur = [], []
        for x, y in seg:
            xi, yi = min(M.shape[1] - 1, max(0, int(x))), min(M.shape[0] - 1, max(0, int(y)))
            if M[yi, xi]: cur.append(P(x + ox, y + oy))
            elif cur: parts.append(cur); cur = []
        if cur: parts.append(cur)
        for g in parts:
            s = dp(g, 1.2)
            if len(s) >= 3 and plen(s) > 40: cont.append((levels[li], s))
cont.sort(key=lambda t: -plen(t[1]))
def emit(no, nk):
    O = [d_of(s, True) for s in outline[:no]]; K = [(l, d_of(s)) for l, s in cont[:nk]]
    return O, K, sum(map(len, O)) + sum(len(k) for _, k in K)
no, nk = len(outline), len(cont)
O, K, size = emit(no, nk)
while size > 34000:
    no = max(12, int(no * .9)); nk = max(8, int(nk * .9)); O, K, size = emit(no, nk)
print('viewBox', VW, VH, 'outline', len(O), 'contours', len(K), 'bytes', size)
ts = ['/* Generado por scripts/chile-map/build_chile.py — NO editar a mano.',
      ' * Contorno: Natural Earth 10m (dominio público). Relieve: Mapzen Terrain Tiles z5 (SRTM y GMTED2010, USGS; ETOPO1, NOAA).',
      ' * Proyección Web Mercator, simplificado (Douglas-Peucker). Sin ciudades ni coordenadas. */',
      f"export const CHILE_VIEWBOX = '0 0 {VW} {VH}';",
      'export const CHILE_OUTLINE: string[] = [' + ','.join(json.dumps(o) for o in O) + '];',
      'export const CHILE_RELIEF: [number, string][] = [' + ','.join(f'[{l},{json.dumps(k)}]' for l, k in K) + '];', '']
open(OUT, 'w').write('\n'.join(ts))
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VW} {VH}" style="background:#0A0A0B"><g fill="none" stroke="rgb(143,180,227)">' + ''.join(f'<path d="{o}" stroke-opacity=".8"/>' for o in O) + ''.join(f'<path d="{k}" stroke-opacity=".35"/>' for _, k in K) + '</g></svg>'
open('preview.svg', 'w').write(svg)
