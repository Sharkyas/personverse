"use client";
import { useMemo, useState } from "react";
import { forecast, pct, type Report } from "@/lib/model";
import { TRAITS, TRAIT_META, type Trait } from "@/lib/params";
import type { Answers } from "@/lib/questions";

/** Lifespan "time machine": baby temperament → today → a fan of possible futures to age 80. */
export function Timeline({ answers, report }: { answers: Answers; report: Report }) {
  const [trait, setTrait] = useState<Trait>(() => [...report.future].sort((a, b) => b.pChange - a.pChange)[0].trait);
  const W = 720, H = 300, L = 40, R = 16, T = 16, B = 34;
  const maxAge = 80;
  const x = (age: number) => L + (age / maxAge) * (W - L - R);
  const y = (p: number) => T + (1 - p / 100) * (H - T - B);
  const color = TRAIT_META[trait].color;

  const pts = useMemo(() => {
    const out: { age: number; mid: number; lo1: number; hi1: number; lo2: number; hi2: number }[] = [];
    for (let h = answers.age; h <= maxAge; h += 1) {
      const f = forecast(report.now, answers.age, h, answers.events).find((q) => q.trait === trait)!;
      const sd = h === answers.age ? 0 : f.sd;
      out.push({
        age: h,
        mid: pct(f.expected),
        lo1: pct(f.expected - sd),
        hi1: pct(f.expected + sd),
        lo2: pct(f.expected - 1.96 * sd),
        hi2: pct(f.expected + 1.96 * sd),
      });
    }
    return out;
  }, [answers, report, trait]);

  const band = (lo: "lo1" | "lo2", hi: "hi1" | "hi2") =>
    pts.map((p) => `${x(p.age)},${y(p[hi])}`).join(" ") + " " + [...pts].reverse().map((p) => `${x(p.age)},${y(p[lo])}`).join(" ");
  const baby = pct(report.temperament[trait]);
  const pred = pct(report.predictedAdult[trait]);
  const now = pct(report.now[trait]);
  const atH = pts.find((p) => p.age === answers.horizon);

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">Your personality time machine</h3>
          <p className="text-xs text-[var(--color-muted)]">From the baby you were, to today, to the range of people you could be at 80. Darker band: 68% of futures. Lighter: 95%.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TRAITS.map((t) => (
            <button
              key={t}
              onClick={() => setTrait(t)}
              aria-pressed={trait === t}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 hover:text-white ${trait === t ? "text-white" : "border-white/10 text-[var(--color-muted)]"}`}
              style={trait === t ? { borderColor: TRAIT_META[t].color, background: TRAIT_META[t].color + "33" } : undefined}
            >
              {TRAIT_META[t].name}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-auto w-full" role="img" aria-label={`${TRAIT_META[trait].name} across the lifespan`}>
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="#fff" strokeOpacity={g === 50 ? 0.15 : 0.06} />
            <text x={L - 6} y={y(g)} fontSize={10} fill="#a19fc4" textAnchor="end" dominantBaseline="middle">{g}</text>
          </g>
        ))}
        {[0, 10, 20, 30, 40, 50, 60, 70, 80].map((a) => (
          <text key={a} x={x(a)} y={H - 12} fontSize={10} fill="#a19fc4" textAnchor="middle">{a}</text>
        ))}
        <polygon points={band("lo2", "hi2")} fill={color} fillOpacity={0.1} style={{ transition: "all .4s" }} />
        <polygon points={band("lo1", "hi1")} fill={color} fillOpacity={0.22} style={{ transition: "all .4s" }} />
        <polyline points={pts.map((p) => `${x(p.age)},${y(p.mid)}`).join(" ")} fill="none" stroke={color} strokeWidth={2.5} />
        {/* the unknown past: baby → model-predicted adult → now */}
        <path
          d={`M ${x(2)} ${y(baby)} C ${x(8)} ${y(baby)}, ${x(12)} ${y(pred)}, ${x(Math.min(18, answers.age - 1))} ${y(pred)} L ${x(answers.age)} ${y(now)}`}
          fill="none"
          stroke={color}
          strokeOpacity={0.5}
          strokeDasharray="4 5"
          strokeWidth={2}
        />
        <line x1={x(answers.horizon)} x2={x(answers.horizon)} y1={T} y2={H - B} stroke="#fff" strokeOpacity={0.25} strokeDasharray="3 4" />
        <circle cx={x(2)} cy={y(baby)} r={6} fill="#f472b6" />
        <text x={x(2) + 10} y={y(baby) - 10} fontSize={11} fill="#f9a8d4">baby you · {baby}</text>
        <circle cx={x(answers.age)} cy={y(now)} r={6} fill="#fff" stroke={color} strokeWidth={3} />
        <text x={x(answers.age) + 10} y={y(now) - 10} fontSize={11} fill="#fff">you now · {now}</text>
        {atH && (
          <>
            <circle cx={x(answers.horizon)} cy={y(atH.mid)} r={5} fill={color} />
            <text x={x(answers.horizon) + 8} y={y(atH.mid) + 16} fontSize={11} fill="#fff">
              at {answers.horizon}: {atH.lo1}–{atH.hi1}
            </text>
          </>
        )}
      </svg>
      <p className="mt-2 text-xs text-[var(--color-muted)]">
        Horizontal axis: age. Vertical: percentile on a fixed adult scale, so normal maturation shows up as change. The dashed line from childhood is the model&apos;s guess at a path nobody recorded. The fan widens because rank-order
        stability falls with time.
      </p>
    </div>
  );
}
