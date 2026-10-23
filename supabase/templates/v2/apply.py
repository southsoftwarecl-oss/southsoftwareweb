"""Sube las plantillas v2 a Supabase Auth (asuntos + contenido). Por defecto SOLO muestra lo que haría.
Uso (requiere aprobación de Mathias): SUPABASE_ACCESS_TOKEN=… python3 apply.py --apply
No toca SMTP, site_url ni ninguna otra opción. Nunca imprime secretos."""
import json, os, sys, urllib.request, pathlib
from build import SUBJECTS
HERE = pathlib.Path(__file__).parent
REF = 'pjcwsfsapvsqptuarfyh'
body = {
  'mailer_subjects_invite': SUBJECTS['invite'], 'mailer_templates_invite_content': (HERE / 'invite.html').read_text(),
  'mailer_subjects_recovery': SUBJECTS['recovery'], 'mailer_templates_recovery_content': (HERE / 'recovery.html').read_text(),
}
assert all('token_hash={{ .TokenHash }}' in body[k] for k in body if k.endswith('_content'))
if '--apply' not in sys.argv:
    print('Simulación (sin cambios). Campos:', {k: (v if 'subjects' in k else f'{len(v)} caracteres') for k, v in body.items()}); sys.exit(0)
req = urllib.request.Request(f'https://api.supabase.com/v1/projects/{REF}/config/auth', data=json.dumps(body).encode(), method='PATCH',
  headers={'Authorization': 'Bearer ' + os.environ['SUPABASE_ACCESS_TOKEN'], 'Content-Type': 'application/json'})
print('HTTP', urllib.request.urlopen(req).status)
