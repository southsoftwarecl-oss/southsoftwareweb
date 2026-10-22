# DNS de correo (DMARC, SPF y DKIM) y redirección HTTP→HTTPS

El DNS está en Cloudflare (bart/dalary.ns.cloudflare.com). Todo esto son **instrucciones**: nadie tocó el DNS.

## Estado medido el 22-10-2026 con DNS-over-HTTPS
| Registro | Valor | Estado |
|---|---|---|
| SPF raíz `southsoftware.cl` | `v=spf1 include:zohomail.com ~all` | OK para Zoho (el buzón contacto@) |
| MX raíz | mx/mx2/mx3.zoho.com | OK |
| DKIM Zoho `zmail._domainkey` | `v=DKIM1; k=rsa; p=…` | OK, firma con d=southsoftware.cl |
| DKIM Resend `resend._domainkey` | `p=…` | OK, firma con d=southsoftware.cl |
| SPF Resend `send.southsoftware.cl` | `v=spf1 ip4:52.3.252.119 ip4:44.222.39.36 ip4:199.249.231.0/24 ~all` + MX feedback.forge.rmta.net | OK. Es el Return-Path de Resend |
| **DMARC** `_dmarc.southsoftware.cl` | **no existe** | Falta |

**Alineación:**
- **Zoho:** SPF y DKIM están alineados con southsoftware.cl.
- **Resend:** el SPF pasa en `send.southsoftware.cl`, un subdominio. Eso queda alineado en modo relajado (aspf=r, el valor por defecto). DKIM pasa con d=southsoftware.cl.

Con eso, DMARC pasa para los dos proveedores.

## Paso 1: crear DMARC en modo monitoreo
En Cloudflare, ve a DNS y agrega un registro:
- Tipo **TXT**, nombre **`_dmarc`**, TTL Auto, sin proxy.
- Contenido: `v=DMARC1; p=none; rua=mailto:contacto@southsoftware.cl; adkim=r; aspf=r; fo=1; pct=100`

Los reportes agregados llegan al buzón contacto@. Si prefieres no llenar ese buzón, crea un alias, por ejemplo dmarc@, y usa ese.

## Paso 2: subir a quarantine (después de 2 a 4 semanas con reportes limpios)
Revisa en los reportes que solo envíen Zoho y Resend (rmta.net / amazonses) y que ambos aparezcan con `pass`. Luego cambia el contenido a:
`v=DMARC1; p=quarantine; pct=25; rua=mailto:contacto@southsoftware.cl; adkim=r; aspf=r; fo=1`

Después de una semana sin problemas, sube a `pct=50` y luego a `pct=100`.

## Paso 3 (opcional, a los 1 o 2 meses): reject
`v=DMARC1; p=reject; rua=mailto:contacto@southsoftware.cl; adkim=r; aspf=r`

Una alternativa es cerrar el SPF raíz con `-all` en vez de `~all`, pero solo cuando DMARC ya esté en quarantine.

## Redirección HTTP→HTTPS
- **Comprobado:** `https://www.southsoftware.cl` responde **308 → https://southsoftware.cl/**.
- **No verificable desde la caja:** la caja de trabajo bloquea la salida al puerto 80, que también falla para neverssl.com. Por eso el "puerto 80 no respondió" de la auditoría probablemente es una limitación de la red de la auditoría y no del sitio.
- Vercel redirige HTTP→HTTPS por defecto con 308, siempre que el dominio apunte directo (A 76.76.21.21, sin proxy naranja de Cloudflare, como está hoy).
- **Para confirmarlo**, desde tu notebook corre: `curl -sI http://southsoftware.cl | head -3`. Debería responder `308` con `location: https://southsoftware.cl/`.
- Si no lo hace, en Cloudflare activa SSL/TLS, luego Edge Certificates y "Always Use HTTPS". Eso solo hace falta si algún día pones el proxy de Cloudflare.
- HSTS con preload ya cubre a los navegadores que vuelven al sitio.
