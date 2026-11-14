"use client";
// Parallel-universe cards: each alternate you with its likeliest type, Big Five against the real you, and its biggest difference.
import { pct, type Report } from "@/lib/model";
import { TRAITS, TRAIT_META } from "@/lib/params";
import { biggestDifference, type UniverseOutcome } from "@/lib/universes";

export function UniverseCards({
  outcomes,
  report,
  horizon,
  selected,
  onSelect,
}: {
  outcomes: UniverseOutcome[];
  report: Report;
  horizon: number;
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-x-5 gap-y-6 pb-3 pr-3 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Parallel universes">
      {outcomes.map((o, i) => {
        const on = selected === o.universe.id;
        return (
          <button
            key={o.universe.id}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(o.universe.id)}
            className={`card stacked flex h-full w-full flex-col p-5 text-left ${on ? "!border-violet-300/80" : ""}`}
          >
            <span className="flex items-center justify-between gap-2 text-[11px] text-[var(--color-muted)]">
              <span>{o.universe.name}</span>
              <span aria-hidden="true" className="font-mono tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
            </span>
            <span className="mt-3 block font-[family-name:var(--font-display)] text-[17px] font-semibold leading-snug text-[#f4f3fb]">{o.universe.you}</span>
            <span className="mt-4 flex items-baseline gap-2.5">
              <span className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.04em] text-[#f4f3fb]">{o.type.type}</span>
              <span className="accent-serif text-lg text-[var(--accent-soft)]">{o.type.info.nickname}</span>
            </span>
            <span className="mt-4 block space-y-1.5">
              {TRAITS.map((t) => {
                const alt = pct(o.futureZ[t]);
                const mine = pct(report.future.find((f) => f.trait === t)!.expected);
                return (
                  <span key={t} className="flex items-center gap-2 text-[11px] text-[var(--color-muted)]">
                    <span className="w-10 shrink-0">{TRAIT_META[t].short}</span>
                    <span aria-hidden="true" className="relative h-1 flex-1 rounded-full bg-white/10">
                      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${alt}%`, background: TRAIT_META[t].color }} />
                      <span className="absolute -inset-y-1 w-px bg-white/80" style={{ left: `${mine}%` }} />
                    </span>
                    <span className="w-5 text-right tabular-nums text-[#d9d7ee]">{alt}</span>
                    <span className="sr-only">
                      th percentile{o.universe.id === "you" ? "" : `, real you ${mine}`}.
                    </span>
                  </span>
                );
              })}
            </span>
            <span className="mt-4 block border-t border-[var(--color-line)] pt-3 text-[13px] leading-relaxed text-[#d9d7ee]">{biggestDifference(o, horizon)}</span>
          </button>
        );
      })}
    </div>
  );
}
