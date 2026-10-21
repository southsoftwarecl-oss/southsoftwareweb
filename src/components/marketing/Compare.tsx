/** Tabla comparativa colapsable de los packs combinados (valores exactos de content/site.ts). */
import { COMBO_PACKS } from '@/content/site';

export default function Compare() {
  return (
    <section className="wrap pk-compare" aria-label="Comparar packs combinados">
      <details>
        <summary>Comparar packs combinados</summary>
        <div className="pk-tw">
          <table>
            <thead><tr><th scope="col">Pack</th><th scope="col">Incluye</th><th scope="col">Pago inicial</th><th scope="col">Lanzamiento</th><th scope="col">Mensual</th></tr></thead>
            <tbody>{COMBO_PACKS.map((p) => (
              <tr key={p.name}><th scope="row">{p.name}</th><td>{p.tag}</td><td>{p.setup}</td><td>{p.launch ?? 'No aplica'}</td><td>{p.monthly}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
