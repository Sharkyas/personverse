"use client";
import { useMemo, useState } from "react";
import { toPct, type Report, type Vec } from "@/lib/model";
import { TRAITS, TRAIT_META, LIFE_EVENTS, type LifeEvent, type Trait } from "@/lib/params";
import type { Answers } from "@/lib/questions";
import { UNIVERSES, allOutcomes, universeOutcome } from "@/lib/universes";
import { Radar, Legend } from "./Radar";
import { PinnedCompare, UniverseCards } from "./UniverseCards";

export function Multiverse({ answers, report }: { answers: Answers; report: Report }) {
  const [sel, setSel] = useState("warm");
  const [extra, setExtra] = useState<LifeEvent[] | null>(null);
  const [pins, setPins] = useState<string[]>([]);
  // pin up to two; a third replaces the older pin
  const togglePin = (id: string) => setPins((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-2)));
  const u = UNIVERSES.find((x) => x.id === sel)!;
  const outcomes = useMemo(() => allOutcomes(answers, report), [answers, report]);
  // The selected universe, with any "next chapter" tweaks applied on top.
  const alt = useMemo(() => (extra ? universeOutcome(answers, report, u, extra) : outcomes.find((o) => o.universe.id === u.id)!), [answers, report, u, extra, outcomes]);
  const events = alt.events;

  const yourFuture = Object.fromEntries(report.future.map((f) => [f.trait, f.expected])) as Vec;
  const altFuture = alt.futureZ;

  return (
    <div>
      <UniverseCards
        outcomes={outcomes}
        report={report}
        horizon={answers.horizon}
        selected={sel}
        onSelect={(id) => {
          setSel(id);
          setExtra(null);
        }}
        pinned={pins}
        onPin={togglePin}
      />
      {pins.length === 2 ? (
        <PinnedCompare a={outcomes.find((o) => o.universe.id === pins[0])!} b={outcomes.find((o) => o.universe.id === pins[1])!} horizon={answers.horizon} onClear={() => setPins([])} />
      ) : (
        <p className="mt-6 text-xs text-[var(--color-muted)]" aria-live="polite">
          {pins.length === 1 ? "One pinned. Pin a second universe to compare the two side by side." : "Pin any two universes to compare them side by side."}
        </p>
      )}
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <div className="card p-5 sm:p-6">
            <p className="eyebrow">{u.name}</p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight">{u.you}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{u.blurb}</p>
            <p className="mt-5 flex items-baseline gap-3">
              <span className="stat-num">{alt.type.type}</span>
              <span className="accent-serif text-xl text-[var(--accent-soft)]">{alt.type.info.nickname}</span>
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Likeliest type at {answers.horizon} in this universe ({Math.round(alt.type.p * 100)}% chance). {alt.type.info.line}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-[var(--color-muted)]">Tweak this universe&apos;s next chapter:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(LIFE_EVENTS) as LifeEvent[])
                .filter((e) => e !== "practice")
                .map((e) => {
                  const on = events.includes(e);
                  return (
                    <button
                      key={e}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setExtra(on ? events.filter((x) => x !== e) : [...events, e])}
                      className={`rounded-full border px-3 py-1.5 text-xs ${on ? "border-violet-400 bg-violet-500/25" : "border-white/10 text-[var(--color-muted)]"}`}
                    >
                      {LIFE_EVENTS[e].label}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-center font-[family-name:var(--font-display)] text-lg font-semibold">{u.name}</h3>
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
                  <div className={`text-lg font-semibold ${d > 0 ? "text-emerald-300" : d < 0 ? "text-pink-300" : ""}`}>
                    {d > 0 ? "+" : ""}
                    {d}
                  </div>
                  <div className="text-[10px] text-[var(--color-muted)]">
                    shift odds {Math.round(theirs.pChange * 100)}% <span className="opacity-85">vs {Math.round(mine.pChange * 100)}%</span>
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
    </div>
  );
}
