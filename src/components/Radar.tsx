"use client";
import { useTween } from "./Motion";
import { TRAITS, TRAIT_META, type Trait } from "@/lib/params";

export type Series = { label: string; color: string; values: Record<Trait, number>; dashed?: boolean };

/** Five-axis radar chart; values are percentiles 0–100. */
function AnimatedSeries({ s, pt }: { s: Series; pt: (i: number, v: number) => number[] }) {
  const flat = { O: 50, C: 50, E: 50, A: 50, N: 50 };
  const v = useTween(s.values, 800, flat);
  return (
    <g>
      <polygon
        points={TRAITS.map((t, i) => pt(i, v[t]).join(",")).join(" ")}
        fill={s.color}
        fillOpacity={s.dashed ? 0.05 : 0.18}
        stroke={s.color}
        strokeWidth={2}
        strokeDasharray={s.dashed ? "5 4" : undefined}
      />
      {TRAITS.map((t, i) => {
        const [x, y] = pt(i, v[t]);
        return <circle key={t} cx={x} cy={y} r={3} fill={s.color} />;
      })}
    </g>
  );
}

export function Radar({ series, size = 320, labels = true }: { series: Series[]; size?: number; labels?: boolean }) {
  const c = size / 2;
  const R = size * 0.36;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / TRAITS.length;
  const pt = (i: number, v: number) => [c + Math.cos(ang(i)) * R * (v / 100), c + Math.sin(ang(i)) * R * (v / 100)];
  return (
    <svg viewBox={labels ? `${-size * 0.12} ${-size * 0.02} ${size * 1.24} ${size * 1.04}` : `0 0 ${size} ${size}`} className="h-auto w-full" role="img" aria-label={series.map((x) => `${x.label}: ${TRAITS.map((t) => `${TRAIT_META[t].name} ${Math.round(x.values[t])}`).join(", ")}`).join(". ")}>
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
        <AnimatedSeries key={s.label} s={s} pt={pt} />
      ))}
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
