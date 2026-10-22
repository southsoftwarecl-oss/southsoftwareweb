import json,os
p=json.load(open('scripts/logo/paths.json'));W,H=p['W'],p['H'];o='public/brand'
VB=f'0 0 {W} {int(H+1)}'
def svg(body,fill='currentColor',vb=VB):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="South Software" fill="{fill}">{body}</svg>'
S=f'<path d="{p["south"]}"/>';F=f'<path d="{p["software"]}"/>'
files={
 'logo.svg':svg(S+F),
 'logo-accent-a.svg':svg(S+f'<path fill="#8A8F98" d="{p["software"]}"/>'),   # SOFTWARE en gris secundario
 'logo-accent-b.svg':svg(S+F+f'<rect fill="#2F5C96" x="0" y="{round(p["swY"]-p["swH"]*0.62,1)}" width="22" height="3"/>'),
 'logo-white.svg':svg(S+F,'#FFFFFF'),'logo-black.svg':svg(S+F,'#0A0A0B'),
 'monogram.svg':svg(f'<path d="{p["s"]}"/>','currentColor','0 0 512 512'),
 'monogram-app.svg':f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="South Software"><rect width="512" height="512" rx="96" fill="#0A0A0B"/><path fill="#EDEDEF" d="{p["s"]}"/></svg>',
}
for k,v in files.items(): open(f'{o}/{k}','w').write(v); print(k,len(v))
