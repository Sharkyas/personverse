"use client";
import { TRAIT_META, type Trait } from "@/lib/params";
import type { Vec } from "@/lib/model";
import { STEP_SCIENCE, TIMELINE, dirWord, outlook, type Dir } from "@/lib/planScience";


/** What to expect after 16 weeks for each trait you are trying to move, and when. */
export function PlanOutlook({ nowZ, target, age, name }: { nowZ: Vec; target: Vec; age: number; name: string }) {
  const rows = outlook(nowZ, target, age);
  return (
    <div className="card mt-4 p-5">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">What to expect if you follow through</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-muted)]">You&apos;re already within about ten points of {name} on every trait. Pick a further target to see a plan.</p>
      ) : (
        <>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Expected percentile after 16 weeks, if you complete the challenges. The bar runs from where you are now to {name}.
          </p>
          <ul className="mt-4 space-y-4">
            {rows.map((o) => {
              const lo = Math.min(o.now, o.target);
              const hi = Math.max(o.now, o.target);
              const sc = STEP_SCIENCE[o.trait][o.dir];
              return (
                <li key={o.trait}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span>
                      <span style={{ color: TRAIT_META[o.trait].color }}>{TRAIT_META[o.trait].name}</span>{" "}
                      <span className="text-[var(--color-muted)]">{o.dir === "up" ? "↑" : "↓"} {o.now} → {o.target}</span>
                    </span>
                  </div>
                  <div className="relative mt-2 h-2.5 rounded-full bg-white/5" role="img" aria-label={`${TRAIT_META[o.trait].name}: now ${o.now}, about ${o.challenges16w} with challenges, about ${o.coached16w} with coaching, target ${o.target}`}>
                    <div className="absolute h-full rounded-full bg-white/10" style={{ left: `${lo}%`, width: `${Math.max(1, hi - lo)}%` }} />
                    <span className="absolute top-1/2 h-3.5 w-1 -translate-y-1/2 rounded bg-white" style={{ left: `${o.now}%` }} />
                    <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-400" style={{ left: `${o.challenges16w}%` }} />
                    <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-400" style={{ left: `${o.coached16w}%` }} />
                    <span className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-pink-200/70" style={{ left: `${o.target}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[var(--color-muted)]">
                    With weekly challenges: about <b className="text-accent-300">{o.challenges16w}</b>. With coaching as well: about{" "}
                    <b className="text-pink-300">{o.coached16w}</b>.{" "}
                    {Math.abs(o.coached16w - o.target) > 15 ? "The full gap is a multi-year project, so treat 16 weeks as the first leg." : "That gets you most of the way there."}
                  </p>
                  <details className="deepdive mt-2">
                    <summary>Why {dirWord(o.trait, o.dir)} works this way</summary>
                    <p>{sc.mechanism}</p>
                  </details>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[11px] text-[var(--color-muted)]">White tick: you now. Violet: weekly challenges. Pink: with coaching. Pale line: your target. Normal maturation over the 16 weeks is included.</p>
        </>
      )}
      <h4 className="mt-6 text-sm font-semibold">The timeline</h4>
      <ol className="mt-3 grid gap-2 sm:grid-cols-5">
        {TIMELINE.map((s) => (
          <li key={s.when} className="rounded-xl border border-white/10 bg-white/[.03] p-3">
            <p className="text-xs font-semibold text-accent-200">{s.when}</p>
            <p className="mt-1 text-[11px] leading-snug text-[var(--color-muted)]">{s.what}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Expandable "why this works" for one week of the plan. */
export function WeekScience({ trait, dir }: { trait: Trait; dir: Dir }) {
  const sc = STEP_SCIENCE[trait]?.[dir];
  if (!sc) return null;
  return (
    <details className="deepdive mt-2">
      <summary>Why this works</summary>
      <p>{sc.mechanism}</p>
    </details>
  );
}
