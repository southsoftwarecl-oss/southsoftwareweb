/** Sparkline SVG 100×28 (trazo marca 1.5, área 8 %, último punto marcado). Solo se usa con datos reales. */
export default function Spark({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(1, ...data), W = 100, H = 28, step = W / (data.length - 1);
  const pts = data.map((v, i) => [i * step, H - 3 - (v / max) * (H - 6)] as const);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="spark" role="img" aria-label={label}>
      <path d={`${d} L${W} ${H} L0 ${H} Z`} fill="currentColor" opacity=".08" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="2.2" fill="currentColor" />
    </svg>
  );
}
