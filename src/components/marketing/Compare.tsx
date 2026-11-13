/** Tabla comparativa colapsable de los packs combinados (qué incluye, sin montos). */
import { COMBO_PACKS } from '@/content/site';

export default function Compare() {
  return (
    <section className="wrap pk-compare" aria-label="Comparar packs combinados">
      <details>
        <summary>Comparar packs combinados</summary>
        <div className="pk-tw">
          <table>
            <thead><tr><th scope="col">Pack</th><th scope="col">Incluye</th></tr></thead>
            <tbody>{COMBO_PACKS.map((p) => (
              <tr key={p.name}><th scope="row">{p.name}</th><td>{p.tag}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
