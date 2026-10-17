# Auditoría Semgrep — 17-oct-2026

Semgrep CLI 1.178.0, `--metrics=off`, 67 archivos (node_modules/.next excluidos por .gitignore/.semgrepignore).

Reglas: `p/default`, `p/security-audit`, `p/secrets`, `p/owasp-top-ten`, `p/react`,
`p/typescript`, `p/javascript`, `p/xss`, `p/nextjs` y reglas propias en `audit/semgrep-custom.yml`
(dangerouslySetInnerHTML, innerHTML y secretos de servidor en componentes cliente).

## Resultado
- Rulesets públicos: **0 hallazgos**.
- Reglas propias: 3 hallazgos, revisados a mano:
  | Hallazgo | Archivo | Decisión |
  |---|---|---|
  | `innerHTML` (anillo del cursor) | `src/lib/motion-runtime.ts` | **Corregido**: ahora se usa `append(createElement('span'))`. |
  | `dangerouslySetInnerHTML` script de modo | `src/app/layout.tsx` | Aceptado: constante literal del código (sin entrada de usuario); detecta `prefers-reduced-motion` antes del primer pintado. |
  | `dangerouslySetInnerHTML` JSON-LD | `src/components/ui.tsx` | Aceptado: `JSON.stringify` de datos estáticos del repo, escapando `<` (patrón recomendado por Next.js). |
- `npm audit --omit=dev`: 0 vulnerabilidades.

Para repetir: `semgrep scan --config p/default --config p/security-audit --config p/secrets --config audit/semgrep-custom.yml --metrics=off .`
