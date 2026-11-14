import { TRAITS, TRAIT_META, type Trait } from "@/lib/params";

export type Series = { label: string; color: string; values: Record<Trait, number>; dashed?: boolean };

/** Five-axis radar chart; values are percentiles 0–100. */
export function Radar({ series, size = 320, labels = true }: { series: Series[]; size?: number; labels?: boolean }) {
  const c = size / 2;
  const R = size * 0.36;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / TRAITS.length;
  const pt = (i: number, v: number) => [c + Math.cos(ang(i)) * R * (v / 100), c + Math.sin(ang(i)) * R * (v / 100)];
  return (
    <svg viewBox={labels ? `${-size * 0.12} ${-size * 0.02} ${size * 1.24} ${size * 1.04}` : `0 0 ${size} ${size}`} className="h-auto w-full" role="img" aria-label="Personality radar chart">
      {[20, 40, 60, 80, 100].map((g) => (
        <polygon
          key={g}
          points={TRAITS.map((_, i) => pt(i, g).join(",")).join(" ")}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={g === 100 ? 0.18 : 0.07}
        />
      ))}
      {TRAITS.map((t, i) => {
        const [x, y] = pt(i, 100);
        return <line key={t} x1={c} y1={c} x2={x} y2={y} stroke="#fff" strokeOpacity={0.08} />;
      })}
      {series.map((s) => (
        <polygon
          key={s.label}
          points={TRAITS.map((t, i) => pt(i, s.values[t]).join(",")).join(" ")}
          fill={s.color}
          fillOpacity={s.dashed ? 0.05 : 0.18}
          stroke={s.color}
          strokeWidth={2}
          strokeDasharray={s.dashed ? "5 4" : undefined}
          style={{ transition: "all .5s ease" }}
        />
      ))}
      {series.map((s) =>
        TRAITS.map((t, i) => {
          const [x, y] = pt(i, s.values[t]);
          return <circle key={s.label + t} cx={x} cy={y} r={3} fill={s.color} style={{ transition: "all .5s ease" }} />;
        })
      )}
      {labels &&
        TRAITS.map((t, i) => {
          const [x, y] = pt(i, 122);
          return (
            <text key={t} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.04} fill={TRAIT_META[t].color} fontWeight={600}>
              {TRAIT_META[t].name}
            </text>
          );
        })}
    </svg>
  );
}

export function Legend({ series }: { series: Series[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-4 text-sm">
      {series.map((s) => (
        <span key={s.label} className="flex items-center gap-2">
          <span className="inline-block h-1 w-6 rounded" style={{ background: s.color, opacity: s.dashed ? 0.7 : 1 }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
