"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildReport, pct, phi } from "@/lib/model";
import { TRAITS, TRAIT_META, type Trait } from "@/lib/params";
import { TIPI_ITEMS, type Answers } from "@/lib/questions";
import { assess, expectAt, reminderIcs, simulateYear, yearsBetween, Z80, type Checkin } from "@/lib/track";
import type { PulseRow, TrackMode } from "@/lib/trackStore";
import { Scale, SEVEN } from "./Scale";

const STORE_LABEL: Record<TrackMode, string> = {
  tiger: "Saved in Tiger Data (a TimescaleDB hypertable)",
  postgres: "Saved in Postgres",
  local: "Saved in the local store",
  "db-down": "Database unreachable, saved in the local store for now",
};
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const monthsLabel = (y: number) => (y < 1 / 12 ? "today" : y < 1 ? `${Math.round(y * 12)} months` : `${(Math.round(y * 10) / 10).toString()} years`);

/** "Am I moving the way the forecast said?" Your first result is the baseline, and each check-in is the ten TIPI questions again. */
export function Tracker({ id, answers, baseTime }: { id: string; answers: Answers; baseTime: string }) {
  const r = useMemo(() => buildReport(answers), [answers]);
  const base = r.now;
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [pulse, setPulse] = useState<PulseRow[]>([]);
  const [store, setStore] = useState<TrackMode | null>(null);
  const [example, setExample] = useState(false);
  const [trait, setTrait] = useState<Trait>("N");
  const [tipi, setTipi] = useState<number[]>(Array(10).fill(0));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    fetch(`/api/track/${id}`)
      .then((x) => (x.ok ? x.json() : null))
      .then((j) => {
        if (!j) return;
        setCheckins(j.checkins);
        setPulse(j.pulse);
        setStore(j.store);
      })
      .catch(() => {});
  }, [id]);

  const simulated = useMemo(() => simulateYear(base, baseTime, answers), [base, baseTime, answers]);
  const shown = example && checkins.length < 2 ? simulated : checkins;
  const status = assess(base, baseTime, answers, shown);
  const lastYears = shown.length ? yearsBetween(baseTime, shown[shown.length - 1].time) : 0;
  const span = Math.max(1, lastYears + 2 / 12);

  async function submit() {
    setState("saving");
    try {
      const res = await fetch(`/api/track/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipi }) });
      if (!res.ok) throw new Error(String(res.status));
      const j = await res.json();
      setCheckins(j.checkins);
      setPulse(j.pulse ?? []);
      setStore(j.store);
      setExample(false);
      setState("saved");
      setTipi(Array(10).fill(0));
    } catch {
      setState("error");
    }
  }

  function downloadReminder() {
    const when = new Date(Date.now() + 8 * 7 * 864e5);
    const blob = new Blob([reminderIcs(window.location.href, when)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "personalityverse-check-in.ics";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ---- chart ----
  const W = 720, H = 300, L = 40, R = 16, T = 16, B = 34;
  const x = (yrs: number) => L + (yrs / span) * (W - L - R);
  const y = (p: number) => T + (1 - p / 100) * (H - T - B);
  const color = TRAIT_META[trait].color;
  const pts = Array.from({ length: 41 }, (_, k) => {
    const yrs = (span * k) / 40;
    const e = expectAt(base, answers, yrs)[trait];
    return { yrs, mid: phi(e.expected) * 100, lo: phi(e.expected - Z80 * e.sdObs) * 100, hi: phi(e.expected + Z80 * e.sdObs) * 100 };
  });
  const band = pts.map((p) => `${x(p.yrs)},${y(p.hi)}`).join(" ") + " " + [...pts].reverse().map((p) => `${x(p.yrs)},${y(p.lo)}`).join(" ");
  const ticks = span <= 1.5 ? [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5].filter((t) => t <= span) : Array.from({ length: Math.floor(span) + 1 }, (_, i) => i);
  const done = tipi.every((v) => v > 0);

  return (
    <div>
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Are you moving the way we said?</h2>
            <p className="text-xs text-[var(--color-muted)]">
              Band: where 80% of check-ins should land if the forecast is right, including the normal wobble of a ten-question test. Line: the expected path. White dot: your first result ({fmt(baseTime)}).
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TRAITS.map((t) => (
              <button
                key={t}
                onClick={() => setTrait(t)}
                aria-pressed={trait === t}
                className={`rounded-full border px-3 py-1 text-xs max-sm:min-h-11 ${trait === t ? "text-white" : "border-white/10 text-[var(--color-muted)]"}`}
                style={trait === t ? { borderColor: TRAIT_META[t].color, background: TRAIT_META[t].color + "33" } : undefined}
              >
                {TRAIT_META[t].name}
              </button>
            ))}
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-auto w-full" role="img" aria-label={`${TRAIT_META[trait].name}: forecast band and ${shown.length} check-ins`}>
          {[0, 25, 50, 75, 100].map((gv) => (
            <g key={gv}>
              <line x1={L} x2={W - R} y1={y(gv)} y2={y(gv)} stroke="#fff" strokeOpacity={gv === 50 ? 0.15 : 0.06} />
              <text x={L - 6} y={y(gv)} fontSize={10} fill="#a19fc4" textAnchor="end" dominantBaseline="middle">{gv}</text>
            </g>
          ))}
          {ticks.map((t) => (
            <text key={t} x={x(t)} y={H - 12} fontSize={10} fill="#a19fc4" textAnchor="middle">
              {t === 0 ? "start" : span <= 1.5 ? `${Math.round(t * 12)}m` : `${t}y`}
            </text>
          ))}
          <polygon points={band} fill={color} fillOpacity={0.16} />
          <polyline points={pts.map((p) => `${x(p.yrs)},${y(p.mid)}`).join(" ")} fill="none" stroke={color} strokeWidth={2} strokeDasharray="6 5" />
          {shown.length > 0 && (
            <polyline
              points={[`${x(0)},${y(pct(base[trait]))}`, ...shown.map((c) => `${x(yearsBetween(baseTime, c.time))},${y(phi(c.z[trait]) * 100)}`)].join(" ")}
              fill="none"
              stroke="#fff"
              strokeOpacity={0.35}
              strokeWidth={1.5}
            />
          )}
          {shown.map((c, i) => (
            <circle key={i} cx={x(yearsBetween(baseTime, c.time))} cy={y(phi(c.z[trait]) * 100)} r={5.5} fill={example && checkins.length < 2 ? "transparent" : color} stroke={color} strokeWidth={2.5} />
          ))}
          <circle cx={x(0)} cy={y(pct(base[trait]))} r={6} fill="#fff" stroke={color} strokeWidth={3} />
        </svg>
        {example && checkins.length < 2 && <p className="mt-1 text-xs text-amber-200">Simulated example drawn from the model, not real check-ins. Your own will replace it.</p>}

        {status ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {status.map((s) => {
              const last = shown[shown.length - 1];
              const e = expectAt(base, answers, yearsBetween(baseTime, last.time))[s.trait];
              return (
                <li key={s.trait} className="rounded-xl border border-white/10 p-3 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: TRAIT_META[s.trait].color }}>{TRAIT_META[s.trait].name}</span>
                    <span className={s.verdict === "within" ? "text-emerald-300" : "text-amber-200"}>
                      {s.verdict === "within" ? "Within the range" : s.verdict === "higher" ? "Higher than forecast" : "Lower than forecast"}
                    </span>
                  </div>
                  <p className="mt-1 text-[var(--color-muted)]">
                    Latest {pct(last.z[s.trait])}, forecast {pct(e.expected)} (likely {pct(e.expected - Z80 * e.sdObs)}–{pct(e.expected + Z80 * e.sdObs)}).
                    {s.slope !== null && s.slopeSe !== null && (
                      <> Trend {s.slope >= 0 ? "+" : "−"}{Math.abs(s.slope).toFixed(2)} SD a year (±{(1.96 * s.slopeSe).toFixed(2)}){Math.abs(s.slope) < 1.96 * s.slopeSe ? ", not clear yet" : ""}.</>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            No check-ins yet. Come back in about eight weeks: that is how long the weekly-challenge trials ran before people noticed a change.{" "}
            <button className="underline decoration-dotted hover:text-white" onClick={() => setExample(true)}>
              See an example year (simulated)
            </button>
          </p>
        )}
        {shown.length === 1 && !example && (
          <p className="mt-3 text-xs text-[var(--color-muted)]">One check-in mostly measures how short the test is. From three points we can fit a trend and say whether it is clear yet.</p>
        )}
      </section>

      <section className="card mt-6 p-6" aria-labelledby="ci-h">
        <h2 id="ci-h" className="font-[family-name:var(--font-display)] text-lg font-semibold">Check in now</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          The same ten questions as last time. &ldquo;I see myself as&hellip;&rdquo; It is {monthsLabel(yearsBetween(baseTime, new Date()))} since your first result.
        </p>
        <div className="mt-5 space-y-5">
          {TIPI_ITEMS.map((it, i) => (
            <div key={i}>
              <p className="text-[15px]">{it.text}</p>
              <Scale n={7} labels={SEVEN} value={tipi[i]} onChange={(v) => setTipi((p) => p.map((q, k) => (k === i ? v : q)))} />
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className="btn btn-primary" disabled={!done || state === "saving"} onClick={submit}>
            {state === "saving" ? "Saving…" : "Save check-in"}
          </button>
          <button className="btn btn-ghost" onClick={downloadReminder}>
            Remind me in 8 weeks (.ics)
          </button>
          <span role="status" className="text-xs text-[var(--color-muted)]">
            {state === "saved" ? "Saved. Your dot is on the chart." : state === "error" ? "Could not save that. Try again in a minute." : !done ? `${tipi.filter((v) => v > 0).length} of 10 answered` : ""}
          </span>
        </div>
        {store && <p className="mt-4 text-[11px] text-[var(--color-muted)]">{STORE_LABEL[store]}. Anonymous: just the five scores and a timestamp, under your result&apos;s link.</p>}
      </section>

      {pulse.length > 0 && (
        <section className="card mt-6 p-6" aria-labelledby="pulse-h">
          <h2 id="pulse-h" className="font-[family-name:var(--font-display)] text-lg font-semibold">Everyone&apos;s check-ins, week by week</h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">Average percentile across all check-ins in each week, last 12 weeks{store === "tiger" ? ", bucketed with time_bucket() on Tiger Data" : ""}.</p>
          <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Weekly averages">
            <table className="w-full text-left text-xs">
              <thead className="text-[var(--color-muted)]">
                <tr>
                  <th className="py-1 pr-3 font-normal">Week of</th>
                  <th className="py-1 pr-3 font-normal">Check-ins</th>
                  {TRAITS.map((t) => (
                    <th key={t} className="py-1 pr-3 font-normal" style={{ color: TRAIT_META[t].color }}>{TRAIT_META[t].short}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pulse.map((w) => (
                  <tr key={w.week} className="border-t border-white/5">
                    <td className="py-1.5 pr-3">{fmt(w.week)}</td>
                    <td className="py-1.5 pr-3">{w.n}</td>
                    {TRAITS.map((t) => (
                      <td key={t} className="py-1.5 pr-3">{pct(w.z[t])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="mt-6 text-xs text-[var(--color-muted)]">
        <Link href={`/r/${id}`} className="inline-flex min-h-11 items-center underline decoration-dotted hover:text-white">Back to your full results</Link>
      </p>
    </div>
  );
}
