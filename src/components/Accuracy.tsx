"use client";
import { useState } from "react";
import Link from "next/link";
import { accuracySummary, type TraitAccuracy } from "@/lib/accuracySummary";
import { TRAIT_META } from "@/lib/params";

const S = accuracySummary();
const pc = (x: number) => Math.round(x * 100);
const n = (x: number) => x.toLocaleString("en-GB");

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="bg-[var(--color-panel)] p-5 sm:p-6">
      {/* a six-character figure such as 17,848 is wider than a four-column tile at the full size */}
      <dd className={`stat-num ${value.length >= 6 ? "lg:!text-[2rem] lg:!leading-[2.75rem]" : ""}`}>
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </dd>
      <dt className="mt-3 text-[13px] leading-snug text-[var(--color-muted)]">{label}</dt>
    </div>
  );
}

function Stats() {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-line)] lg:grid-cols-4">
      <Stat value={String(pc(S.accConfident))} unit="%" label="right, when the test says it is at least 80% sure" />
      <Stat value={String(pc(S.shareConfident))} unit="%" label="of calls are that sure. The rest we flag as in between" />
      <Stat value={S.auc.toFixed(2)} label="ranking score out of 1.00 (0.50 is a coin flip)" />
      <Stat value={n(S.nTest)} label="people it was checked on, none of them used to build it" />
    </dl>
  );
}

/** Compact "How accurate is this?" panel for the results page. */
export function AccuracyPanel() {
  return (
    <section className="mb-16" aria-labelledby="acc-h">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <div>
          <p className="kicker">How accurate is this?</p>
          <h2 id="acc-h" className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight sm:text-[1.75rem]">
            When it says it&apos;s sure, it&apos;s right about 9 times in 10.
          </h2>
        </div>
        <Link href="/science#accuracy" className="link-quiet text-sm">
          See the full accuracy check <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="mt-6">
        <Stats />
      </div>
      <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-[var(--color-muted)]">
        We built the scoring on {n(S.nTrain)} people from an open dataset, then tested it on {n(S.nTest)} others. For each person we used half of their
        answers to predict where the other half would land. When the test is not sure, it says so instead of guessing.
      </p>
    </section>
  );
}

const W = 220, H = 200, L = 30, R = 8, T = 10, B = 26;
const x = (p: number) => L + p * (W - L - R);
const y = (p: number) => T + (1 - p) * (H - T - B);

function CalibrationChart({ t }: { t: TraitAccuracy }) {
  const [hi, setHi] = useState<number | null>(null);
  const name = TRAIT_META[t.trait].name;
  const pts = t.calibration;
  const h = hi == null ? null : pts[hi];
  return (
    <figure className="bg-[var(--color-panel)] p-4 sm:p-5">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-[#f4f3fb]">{name}</span>
        <span className="text-xs tabular-nums text-[var(--color-muted)]">off by {(t.ece * 100).toFixed(1)} pts</span>
      </figcaption>
      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          role="img"
          aria-label={`${name}: predicted chance against how often it happened, ${pts.length} points. Average gap ${(t.ece * 100).toFixed(1)} percentage points. Exact values are in the table below.`}
          onMouseLeave={() => setHi(null)}
        >
          {[0, 0.5, 1].map((g) => (
            <g key={g}>
              <line x1={x(0)} x2={x(1)} y1={y(g)} y2={y(g)} stroke="rgba(255,255,255,0.08)" />
              <line y1={y(0)} y2={y(1)} x1={x(g)} x2={x(g)} stroke="rgba(255,255,255,0.08)" />
              <text x={L - 6} y={y(g) + 3.5} textAnchor="end" fontSize="10" fill="#a8a6c4">{g * 100}</text>
              <text x={x(g)} y={H - 10} textAnchor={g === 0 ? "start" : g === 1 ? "end" : "middle"} fontSize="10" fill="#a8a6c4">{g * 100}%</text>
            </g>
          ))}
          <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="3 4" />
          <polyline fill="none" stroke="#8ff7f7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={pts.map((p) => `${x(p.predicted)},${y(p.observed)}`).join(" ")} />
          {pts.map((p, i) => (
            <g key={p.bin}>
              <circle cx={x(p.predicted)} cy={y(p.observed)} r={hi === i ? 5 : 4} fill="#8ff7f7" stroke="#0f0f15" strokeWidth="2" />
              <circle
                cx={x(p.predicted)}
                cy={y(p.observed)}
                r="11"
                fill="transparent"
                onMouseEnter={() => setHi(i)}
                onClick={() => setHi(hi === i ? null : i)}
              />
            </g>
          ))}
        </svg>
        {h && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-[11rem] -translate-x-1/2 rounded-lg border border-white/15 bg-[#191922] px-2.5 py-1.5 text-[11px] leading-snug text-[#edecf7]"
            style={{ left: `${Math.min(72, Math.max(28, (x(h.predicted) / W) * 100))}%`, top: `${(y(h.observed) / H) * 100 + 6}%` }}
          >
            Said <b className="tabular-nums">{pc(h.predicted)}%</b>, happened <b className="tabular-nums">{pc(h.observed)}%</b>
            <span className="block text-[var(--color-muted)]">{n(h.n)} people</span>
          </div>
        )}
      </div>
    </figure>
  );
}

/** Full accuracy section for /science: headline numbers, calibration small multiples, per-trait table. */
export function AccuracyFull() {
  return (
    <div>
      <div className="mt-6">
        <Stats />
      </div>

      <h3 className="mt-12 font-[family-name:var(--font-display)] text-lg font-semibold">Does 70% really mean 70%?</h3>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">
        Each dot is a group of people the test gave a similar chance of scoring high. Across is what the test said. Up is how often it turned out true.
        A perfect test sits on the dashed line.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--color-muted)]">
        <span className="inline-flex items-center gap-2">
          <svg width="26" height="8" aria-hidden="true"><line x1="0" y1="4" x2="26" y2="4" stroke="#8ff7f7" strokeWidth="2" /><circle cx="13" cy="4" r="3.5" fill="#8ff7f7" /></svg>
          Our test
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="26" height="8" aria-hidden="true"><line x1="0" y1="4" x2="26" y2="4" stroke="rgba(255,255,255,0.55)" strokeDasharray="3 4" /></svg>
          Perfect
        </span>
        <span>Across: chance the test gave. Up: how often it happened.</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-line)] min-[420px]:grid-cols-2 lg:grid-cols-3">
        {S.traits.map((t) => (
          <CalibrationChart key={t.trait} t={t} />
        ))}
        <div className="flex flex-col justify-center bg-[var(--color-panel)] p-5">
          <p className="stat-num">
            {(S.ece * 100).toFixed(1)}
            <span className="stat-unit">pts</span>
          </p>
          <p className="mt-3 text-[13px] leading-snug text-[var(--color-muted)]">
            average gap between the chance the test gives and what actually happens. Hover or tap a dot for its numbers.
          </p>
        </div>
      </div>

      <h3 className="mt-12 font-[family-name:var(--font-display)] text-lg font-semibold">Trait by trait</h3>
      <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)]" tabIndex={0} role="region" aria-label="Accuracy by trait, scrolls sideways on small screens">
        <table className="w-full min-w-[620px] text-sm tabular-nums">
          <thead className="text-left text-xs text-[var(--color-muted)]">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Trait</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Right when sure</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">How often sure</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Ranking score (AUC)</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Average gap (ECE)</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Consistency (α)</th>
            </tr>
          </thead>
          <tbody>
            {S.traits.map((t) => (
              <tr key={t.trait} className="border-t border-[var(--color-line)]">
                <th scope="row" className="px-4 py-3 text-left font-medium text-[#f4f3fb]">{TRAIT_META[t.trait].name}</th>
                <td className="px-4 py-3 text-right">{pc(t.accConfident)}%</td>
                <td className="px-4 py-3 text-right text-[var(--color-muted)]">{pc(t.shareConfident)}%</td>
                <td className="px-4 py-3 text-right">{t.auc.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-[var(--color-muted)]">{(t.ece * 100).toFixed(1)} pts</td>
                <td className="px-4 py-3 text-right text-[var(--color-muted)]">{t.alpha.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="border-t border-white/20">
              <th scope="row" className="px-4 py-3 text-left font-medium text-[#f4f3fb]">Average</th>
              <td className="px-4 py-3 text-right">{pc(S.accConfident)}%</td>
              <td className="px-4 py-3 text-right text-[var(--color-muted)]">{pc(S.shareConfident)}%</td>
              <td className="px-4 py-3 text-right">{S.auc.toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-[var(--color-muted)]">{(S.ece * 100).toFixed(1)} pts</td>
              <td className="px-4 py-3 text-right text-[var(--color-muted)]">{S.alpha.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <details className="deepdive">
        <summary>Chart data as a table</summary>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Calibration data, scrolls sideways on small screens">
          <table className="w-full min-w-[480px] text-xs tabular-nums">
            <thead className="text-left text-[var(--color-muted)]">
              <tr>
                <th scope="col" className="py-1.5 pr-3 font-medium">Trait</th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">Test said</th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">Happened</th>
                <th scope="col" className="py-1.5 text-right font-medium">People</th>
              </tr>
            </thead>
            <tbody>
              {S.traits.flatMap((t) =>
                t.calibration.map((p, i) => (
                  <tr key={t.trait + p.bin} className="border-t border-white/5">
                    <td className="py-1.5 pr-3">{i === 0 ? TRAIT_META[t.trait].name : ""}</td>
                    <td className="py-1.5 pr-3 text-right">{pc(p.predicted)}%</td>
                    <td className="py-1.5 pr-3 text-right">{pc(p.observed)}%</td>
                    <td className="py-1.5 text-right">{n(p.n)}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
