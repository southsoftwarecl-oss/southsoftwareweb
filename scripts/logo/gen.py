"""Genera el wordmark SOUTH/SOFTWARE como paths (Michroma, OFL) + monograma S."""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
import json,sys
f=TTFont('src/fonts/Michroma-Regular.woff2'); gs=f.getGlyphSet(); cmap=f.getBestCmap(); upm=f['head'].unitsPerEm
def run(text,track):
    x=0;items=[]
    for ch in text:
        g=cmap[ord(ch)];items.append((g,x));x+=gs[g].width+track*upm
    return items,x-track*upm
def bounds(items):
    bp=BoundsPen(gs)
    for g,x in items:
        gs[g].draw(TransformPen(bp,(1,0,0,1,x,0)))
    return bp.bounds
def path(items,s,dx,dy):
    pen=SVGPathPen(gs,ntos=lambda v:'%d'%round(v))
    for g,x in items:
        gs[g].draw(TransformPen(pen,(s,0,0,-s,dx+x*s,dy)))
    return pen.getCommands()
W=320
a,_=run('SOUTH',0.02); b,_=run('SOFTWARE',0.16)   # tracking extra en SOFTWARE
ba=bounds(a); bb=bounds(b)
sa=W/(ba[2]-ba[0]); sb=W/(bb[2]-bb[0])           # mismo ancho óptico
ha=(ba[3]-ba[1])*sa; hb=(bb[3]-bb[1])*sb; gap=ha*0.30
pa=path(a,sa,-ba[0]*sa,ba[3]*sa); pb=path(b,sb,-bb[0]*sb,ha+gap+bb[3]*sb)
H=ha+gap+hb
m,_=run('S',0); bm=bounds(m); sm=(512*0.62)/(bm[3]-bm[1]); wm=(bm[2]-bm[0])*sm
pm=path(m,sm,(512-wm)/2-bm[0]*sm,(512-(bm[3]-bm[1])*sm)/2+bm[3]*sm)
json.dump(dict(W=W,H=round(H,1),south=pa,software=pb,s=pm,swY=round(ha+gap,1),swH=round(hb,1)),open('scripts/logo/paths.json','w'))
print(W,H,len(pa)+len(pb))
