"use client";
import { useMemo, useState } from "react";
import { buildReport, forecast, toPct, type Report, type Vec } from "@/lib/model";
import { TRAITS, TRAIT_META, LIFE_EVENTS, type LifeEvent, type Trait } from "@/lib/params";
import type { Answers } from "@/lib/questions";
import { Radar, Legend } from "./Radar";

type Universe = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  upbringing?: Partial<Answers["upbringing"]>;
  events?: LifeEvent[];
};

const UNIVERSES: Universe[] = [
  { id: "you", name: "Your universe", emoji: "🌍", blurb: "The life you described." },
  { id: "warm", name: "The sheltered universe", emoji: "🏡", blurb: "Warmest possible home, no adversity, never moved.", upbringing: { warmth: 5, harshness: 1, adversity: 1, ses: 4, moves: 1 } },
  { id: "tough", name: "The hard-knocks universe", emoji: "⛈️", blurb: "Cold, strict home, lots of instability.", upbringing: { warmth: 1, harshness: 5, adversity: 5, ses: 1, moves: 5 } },
  { id: "nomad", name: "The nomad universe", emoji: "✈️", blurb: "University, then years living abroad.", events: ["university", "abroad", "job"] },
  { id: "growth", name: "The growth universe", emoji: "🌱", blurb: "Therapy or coaching plus a stable relationship.", events: ["therapy", "relationship", "job"] },
  { id: "drift", name: "The drift universe", emoji: "🛋️", blurb: "No big commitments, a long stretch out of work.", events: ["unemployment"] },
];

export function Multiverse({ answers, report }: { answers: Answers; report: Report }) {
  const [sel, setSel] = useState("warm");
  const [extra, setExtra] = useState<LifeEvent[] | null>(null);
  const u = UNIVERSES.find((x) => x.id === sel)!;
  const events = extra ?? u.events ?? answers.events;

  const alt = useMemo(() => {
    const altAnswers: Answers = { ...answers, upbringing: { ...answers.upbringing, ...(u.upbringing ?? {}) }, events };
    const altR = buildReport(altAnswers);
    // Counterfactual "now": your actual now, shifted by how much the different upbringing moves the prediction.
    const altNow = {} as Vec;
    for (const t of TRAITS) altNow[t] = report.now[t] + (altR.predictedAdult[t] - report.predictedAdult[t]);
    const altFull = buildReportFromNow(altAnswers, altNow);
    return { now: altNow, future: altFull };
  }, [answers, u, events, report]);

  const yourFuture = Object.fromEntries(report.future.map((f) => [f.trait, f.expected])) as Vec;
  const altFuture = Object.fromEntries(alt.future.map((f) => [f.trait, f.expected])) as Vec;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-2">
        {UNIVERSES.map((x) => (
          <button
            key={x.id}
            onClick={() => {
              setSel(x.id);
              setExtra(null);
            }}
            className={`card flex w-full items-center gap-4 p-4 text-left transition ${sel === x.id ? "!border-violet-400 ring-1 ring-violet-400/50" : "hover:bg-white/5"}`}
          >
            <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.04] text-xl">{x.emoji}</span>
            <span>
              <span className="block font-semibold">{x.name}</span>
              <span className="block text-xs text-[var(--color-muted)]">{x.blurb}</span>
            </span>
          </button>
        ))}
        <div className="card p-4">
          <p className="text-xs text-[var(--color-muted)]">Tweak this universe&apos;s next chapter:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(LIFE_EVENTS) as LifeEvent[])
              .filter((e) => e !== "practice")
              .map((e) => {
                const on = events.includes(e);
                return (
                  <button
                    key={e}
                    onClick={() => setExtra(on ? events.filter((x) => x !== e) : [...events, e])}
                    className={`rounded-full border px-3 py-1 text-xs ${on ? "border-violet-400 bg-violet-500/25" : "border-white/10 text-[var(--color-muted)]"}`}
                  >
                    {LIFE_EVENTS[e].label}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
      <div className="card p-5">
        <h3 className="text-center font-[family-name:var(--font-display)] text-lg font-semibold">
          {u.emoji} {u.name}
        </h3>
        <Radar
          series={[
            { label: "Your universe at " + answers.horizon, color: "#a78bfa", values: toPct(yourFuture), dashed: true },
            { label: "This universe at " + answers.horizon, color: "#38bdf8", values: toPct(altFuture) },
          ]}
        />
        <Legend
          series={[
            { label: `Your universe at ${answers.horizon}`, color: "#a78bfa", values: toPct(yourFuture), dashed: true },
            { label: `This universe at ${answers.horizon}`, color: "#38bdf8", values: toPct(altFuture) },
          ]}
        />
        <div className="mt-4 grid grid-cols-5 gap-2 text-center">
          {TRAITS.map((t: Trait) => {
            const mine = report.future.find((f) => f.trait === t)!;
            const theirs = alt.future.find((f) => f.trait === t)!;
            const d = toPct(altFuture)[t] - toPct(yourFuture)[t];
            return (
              <div key={t} className="rounded-xl bg-white/[.03] p-2">
                <div className="text-[11px]" style={{ color: TRAIT_META[t].color }}>
                  {TRAIT_META[t].short}
                </div>
                <div className={`text-lg font-bold ${d > 0 ? "text-emerald-300" : d < 0 ? "text-pink-300" : ""}`}>
                  {d > 0 ? "+" : ""}
                  {d}
                </div>
                <div className="text-[10px] text-[var(--color-muted)]">
                  shift odds {Math.round(theirs.pChange * 100)}% <span className="opacity-60">vs {Math.round(mine.pChange * 100)}%</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Percentile points vs your universe. Upbringing effects are small on purpose: twin studies find shared family environment explains little of adult
          personality.
        </p>
      </div>
    </div>
  );
}

function buildReportFromNow(a: Answers, now: Vec) {
  return forecast(now, a.age, a.horizon, a.events);
}
