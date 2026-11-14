"use client";
// One expandable panel per Big Five trait: what the score means day to day, strengths, watch-outs, how it moves with age and one thing to try.
import { pct, type Report } from "@/lib/model";
import { TRAITS, TRAIT_META } from "@/lib/params";
import { TRAIT_AGE, TRAIT_DETAILS, bandOf } from "@/lib/traitDetails";

export function TraitDeepDives({ r, horizon }: { r: Report; horizon?: number }) {
  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">Each trait, in depth</h3>
        <p className="text-xs text-[var(--color-muted)]">Open a trait for what it means day to day and one thing to try.</p>
      </div>
      <div className="mt-4">
        {TRAITS.map((k) => {
          const p = pct(r.now[k]);
          const d = TRAIT_DETAILS[k][bandOf(p)];
          const f = r.future.find((x) => x.trait === k)!;
          const later = pct(f.expected);
          return (
            <details key={k} className="deepdive !mt-2">
              <summary>
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TRAIT_META[k].color }} />
                    {TRAIT_META[k].name}
                  </span>
                  <span className="font-normal text-[var(--color-muted)]">
                    <span className="tabular-nums text-[#edecf7]">{p}</span> · {d.label}
                  </span>
                </span>
              </summary>
              <div className="grid gap-x-10 gap-y-5 pt-1 lg:grid-cols-[1.25fr_1fr]">
                <div>
                  <h4 className="text-[13px] font-medium">In daily life</h4>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[#d9d7ee]">{d.daily}</p>
                  <h4 className="mt-5 text-[13px] font-medium">How it tends to change with age</h4>
                  <p className="mt-1.5">
                    {TRAIT_AGE[k]}
                    {horizon ? ` Our forecast for you: percentile ${p} now, about ${later} by age ${horizon}.` : ""}
                  </p>
                </div>
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    {[
                      { h: "Strengths", items: d.strengths },
                      { h: "Watch-outs", items: d.watchOuts },
                    ].map((col) => (
                      <div key={col.h}>
                        <h4 className="text-[13px] font-medium">{col.h}</h4>
                        <ul className="mt-1.5 space-y-1.5">
                          {col.items.map((s) => (
                            <li key={s} className="flex gap-2.5 text-[#d9d7ee]">
                              <span aria-hidden="true" className="mt-[.62em] h-px w-2.5 shrink-0 bg-white/35" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[10px] border border-[var(--color-line)] bg-white/[.03] p-4">
                    <h4 className="text-[13px] font-medium">Try this week</h4>
                    <p className="mt-1.5 text-[#d9d7ee]">{d.tryThis}</p>
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
