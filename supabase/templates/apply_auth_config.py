import json,os,urllib.request
def tpl(title, intro, cta, link, foot):
    return f'''<!doctype html><html lang="es"><body style="margin:0;background:#0A0A0B;padding:32px 12px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#E9EAEC">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:520px;background:#121316;border:1px solid #26282D;border-radius:14px" cellpadding="0" cellspacing="0">
<tr><td style="padding:28px 32px 8px;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#9AA0AA">South Software · Panel</td></tr>
<tr><td style="padding:8px 32px 0;font-size:24px;font-weight:700;color:#FFFFFF">{title}</td></tr>
<tr><td style="padding:14px 32px 0;font-size:15px;line-height:1.6;color:#C9CCD2">{intro}</td></tr>
<tr><td style="padding:26px 32px"><a href="{link}" style="display:inline-block;background:linear-gradient(180deg,#F4F5F7,#C9CDD3);color:#0A0A0B;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:999px">{cta}</a></td></tr>
<tr><td style="padding:0 32px 26px;font-size:13px;line-height:1.6;color:#8A9099">{foot}<br>Si el botón no funciona, copia este enlace:<br><span style="color:#B8BDC5;word-break:break-all">{link}</span></td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #26282D;font-size:12px;color:#6F7580">South Software — Software &amp; Marketing · southsoftware.cl</td></tr>
</table></td></tr></table></body></html>'''
inv = tpl('Te invitamos al panel', 'Te dieron acceso al panel de administración de South Software. Crea tu contraseña para entrar.', 'Crear mi contraseña',
  '{{ .SiteURL }}/admin/confirmar?token_hash={{ .TokenHash }}&type=invite', 'El enlace vence en 24 horas. Si no esperabas este correo, ignóralo.')
rec = tpl('Crea una nueva contraseña', 'Recibimos una solicitud para cambiar la contraseña de tu cuenta del panel.', 'Crear nueva contraseña',
  '{{ .SiteURL }}/admin/confirmar?token_hash={{ .TokenHash }}&type=recovery', 'El enlace vence en 24 horas. Si no lo pediste, ignora este correo: tu contraseña no cambia.')
cfg = {
  'site_url': 'https://southsoftware.cl',
  'mailer_otp_exp': 86400,
  'smtp_host': 'smtp.resend.com', 'smtp_port': '465', 'smtp_user': 'resend', 'smtp_pass': os.environ['RESEND_API_KEY_SOUTHSOFTWARE'],
  'smtp_admin_email': 'administracion@southsoftware.cl', 'smtp_sender_name': 'South Software',
  'mailer_subjects_invite': 'Tu acceso al panel de South Software', 'mailer_templates_invite_content': inv,
  'mailer_subjects_recovery': 'Crea una nueva contraseña · Panel South Software', 'mailer_templates_recovery_content': rec,
}
open('/tmp/invite_preview.html','w').write(inv.replace('{{ .SiteURL }}','https://southsoftware.cl').replace('{{ .TokenHash }}','EJEMPLO'))
open('/tmp/recovery_preview.html','w').write(rec.replace('{{ .SiteURL }}','https://southsoftware.cl').replace('{{ .TokenHash }}','EJEMPLO'))
A='https://api.supabase.com/v1/projects/pjcwsfsapvsqptuarfyh/config/auth'; H={'Authorization':'Bearer '+os.environ['SUPABASE_ACCESS_TOKEN'],'Content-Type':'application/json'}
try:
  r=urllib.request.urlopen(urllib.request.Request(A,data=json.dumps(cfg).encode(),headers=H,method='PATCH'),timeout=60); print('patch',r.status)
except urllib.error.HTTPError as e: print('HTTP',e.code,e.read().decode()[:400])
d=json.load(urllib.request.urlopen(urllib.request.Request(A,headers=H),timeout=60))
print({k:d.get(k) for k in ['site_url','mailer_otp_exp','smtp_host','smtp_port','smtp_user','smtp_admin_email','smtp_sender_name','disable_signup','uri_allow_list','rate_limit_email_sent','mailer_subjects_invite']}, 'smtp_pass_set', bool(d.get('smtp_pass')), 'tpl_ok', 'token_hash' in (d.get('mailer_templates_invite_content') or ''))
