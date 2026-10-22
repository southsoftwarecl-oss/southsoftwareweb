# Plantilla extendida de caso de estudio (solo datos reales)

Cada caso vive en `src/content/site.ts`, en `CASES`. Los campos que la página ya muestra son estos: `summary`, `challenge` (Desafío), `solution` (Solución), `built` (Lo que construimos), `stack`, `service`, `year`, la captura `image` y `metrics`.

Para extender un caso, completa esto con el cliente. Cualquier cosa que falte queda **[COMPLETAR]** y **no se publica**.

| Sección | Campo | Estado |
|---|---|---|
| Contexto | quién es el cliente y qué vende (sin ciudad) | `summary` real. **[COMPLETAR: 1–2 frases más si el cliente aprueba]** |
| Desafío | `challenge` | real en los 5 casos |
| Solución | `solution` | real en los 5 casos |
| Stack | `stack` | real |
| Lo construido | `built` | real |
| Resultados | `metrics[].value` | **[COMPLETAR: consultas/mes, LCP medido, ventas… validados por el cliente]**. Con `null` no se muestra |
| Capturas extra | `/public/cases/<slug>-*.jpg` | **[COMPLETAR: 2–3 capturas reales de desktop]** |
| Testimonio | `TESTIMONIALS` | **[COMPLETAR: cita autorizada por escrito, con nombre de empresa y sin nombre de persona si el cliente lo prefiere]** |

Reglas: no inventes cifras, no pongas ubicaciones y no uses fotos de personas.
