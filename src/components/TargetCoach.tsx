"use client";
import { useMemo, useState } from "react";
import { planTarget, toPct, type Report, type Vec } from "@/lib/model";
import { TRAITS, TRAIT_META, type Trait } from "@/lib/params";
import { ARCHETYPES } from "@/lib/archetypes";
import type { Answers } from "@/lib/questions";
import { Radar, Legend } from "./Radar";
import { Narrator } from "./Narrator";
import { CelebRow } from "./CelebMatches";
import { libraryPlan, type CoachPlan, type CoachRequest } from "@/lib/coachLibrary";
import { directions } from "@/lib/planScience";
import { PlanOutlook, WeekScience } from "./PlanScience";

export function TargetCoach({ answers, report }: { answers: Answers; report: Report }) {
  const nowPct = toPct(report.now);
  const [archetype, setArchetype] = useState<string | null>("strategist");
  const [target, setTarget] = useState<Vec>(ARCHETYPES[0].target);
  const [years, setYears] = useState(1);
  const [plan, setPlan] = useState<CoachPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const rows = useMemo(() => planTarget(report.now, target, answers.age, years), [report.now, target, answers.age, years]);
  const name = archetype ? ARCHETYPES.find((x) => x.id === archetype)?.name : "your custom target";
  const dirs = directions(nowPct, target);

  async function build() {
    setLoading(true);
    setPlan(null);
    const req: CoachRequest = {
      name: answers.name,
      age: answers.age,
      temperamentType: report.temperamentType.label,
      nowPct,
      babyPct: toPct(report.temperament),
      targetPct: target,
      targetName: name,
      pChange: Object.fromEntries(report.future.map((f) => [f.trait, f.pChange])) as CoachRequest["pChange"],
    };
    try {
      const res = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) });
      if (!res.ok) throw new Error(String(res.status));
      setPlan(await res.json());
    } catch {
      setPlan(libraryPlan(req)); // offline: same evidence-based library, built in the browser
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ARCHETYPES.map((x) => (
          <button
            key={x.id}
            onClick={() => {
              setArchetype(x.id);
              setTarget(x.target);
              setPlan(null);
            }}
            className={`card p-4 text-left transition ${archetype === x.id ? "!border-pink-400 ring-1 ring-pink-400/50" : "hover:bg-white/5"}`}
          >
            <div className="text-2xl">{x.emoji}</div>
            <div className="mt-1 text-sm font-semibold">{x.name}</div>
            <div className="mt-1 text-[11px] leading-snug text-[var(--color-muted)]">{x.tagline}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="card p-5">
          <Radar
            series={[
              { label: "You now", color: "#a78bfa", values: nowPct },
              { label: "Target", color: "#f472b6", values: target, dashed: true },
            ]}
          />
          <Legend
            series={[
              { label: "You now", color: "#a78bfa", values: nowPct },
              { label: name ?? "Target", color: "#f472b6", values: target, dashed: true },
            ]}
          />
          <div className="mt-4 space-y-3">
            {TRAITS.map((t: Trait) => (
              <div key={t}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: TRAIT_META[t].color }}>{TRAIT_META[t].name}</span>
                  <span className="text-[var(--color-muted)]">
                    now {nowPct[t]} → target <b className="text-white">{target[t]}</b>
                  </span>
                </div>
                <input
                  type="range"
                  aria-label={`Target ${TRAIT_META[t].name} percentile`}
                  min={1}
                  max={99}
                  value={target[t]}
                  onChange={(e) => {
                    setArchetype(null);
                    setPlan(null);
                    setTarget({ ...target, [t]: +e.target.value });
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">Odds of reaching {name}</h3>
            <div className="flex rounded-full border border-white/10 p-0.5 text-xs">
              {[1, 3].map((y) => (
                <button key={y} onClick={() => setYears(y)} className={`rounded-full px-3 py-1 ${years === y ? "bg-violet-500/40" : ""}`}>
                  in {y} year{y > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted)]">Chance of getting within a quarter of an SD of each target, under three strategies.</p>
          <div className="mt-4 space-y-4">
            {rows.map((row) => (
              <div key={row.trait}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: TRAIT_META[row.trait].color }}>{TRAIT_META[row.trait].name}</span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {Math.abs(row.gap) < 0.25 ? "already there" : `${row.gap > 0 ? "↑" : "↓"} ${Math.abs(row.gap).toFixed(1)} SD to go`}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  {row.scenarios.map((s, i) => (
                    <div key={s.label} className="flex items-center gap-2 text-[11px]">
                      <span className="w-48 shrink-0 text-[var(--color-muted)]">{s.label}</span>
                      <div className="h-2 flex-1 rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(s.p * 100)}%`, background: ["#64748b", "#a78bfa", "#f472b6"][i] }}
                        />
                      </div>
                      <span className="w-9 text-right">{Math.round(s.p * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-[var(--color-muted)]">
            Weekly challenges: smartphone coaching trial, d ≈ .35 observer-rated over 3 months (Stieger et al., 2021). Coaching/therapy: per-trait effects
            from 207 intervention studies (Roberts et al., 2017).
          </p>
        </div>
      </div>

      <PlanOutlook nowZ={report.now} target={target} age={answers.age} name={name ?? "your target"} />

      <div className="card mt-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">Your 8-week change plan</h3>
            <p className="text-sm text-[var(--color-muted)]">Weekly behavioural challenges and if–then plans, written for you by the AI coach.</p>
          </div>
          <button onClick={build} disabled={loading} className="btn btn-primary">
            {loading ? "Coach is thinking…" : plan ? "Regenerate" : "Build my plan ✦"}
          </button>
        </div>
        {loading && (
          <div className="mt-6 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        )}
        {plan && (
          <div className="mt-6 fadeup">
            <h4 className="gradient-text font-[family-name:var(--font-display)] text-2xl font-bold">{plan.headline}</h4>
            <p className="mt-2 text-[15px] leading-relaxed">{plan.summary}</p>
            <div className="mt-4">
              <Narrator text={plan.narration} label="Hear your coach" />
            </div>
            <ol className="mt-5 grid gap-3 md:grid-cols-2">
              {plan.weeks.map((w) => (
                <li key={w.week} className="rounded-xl border border-white/10 bg-white/[.03] p-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-white/10 px-2 py-0.5">Week {w.week}</span>
                    <span style={{ color: TRAIT_META[w.trait]?.color }}>{TRAIT_META[w.trait]?.name}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{w.challenge}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{w.why}</p>
                  <WeekScience trait={w.trait} dir={dirs[w.trait] ?? (target[w.trait] >= nowPct[w.trait] ? "up" : "down")} />
                </li>
              ))}
            </ol>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-violet-500/10 p-4 text-sm">
                <p className="mb-2 text-xs uppercase tracking-wider text-violet-300">If–then plans</p>
                <ul className="space-y-1.5">
                  {plan.ifThen.map((x) => (
                    <li key={x}>→ {x}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-amber-400/10 p-4 text-sm">
                <p className="mb-2 text-xs uppercase tracking-wider text-amber-300">Watch out</p>
                <p>{plan.watchOut}</p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-[var(--color-muted)]">
              {plan.source === "ai"
                ? plan.model?.includes("(local)")
                  ? `Written by Gemma running locally (${plan.model.replace(" (local)", "")}). No cloud AI involved.`
                  : `Written by ${/gemma/i.test(plan.model ?? "") ? "Gemma" : "Gemini"} (${plan.model}) from your profile.`
                : "From our evidence-based challenge library."}{" "}
              Hudson et al. (2019): completing challenges predicts change, but signing up and not following through can backfire. Pick ones you&apos;ll actually do.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <CelebRow title={`Famous people closest to ${name}`} profile={target} />
      </div>
    </div>
  );
}
