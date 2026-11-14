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
  pinned = [],
  onPin,
}: {
  /** up to two universe ids pinned for a side-by-side comparison */
  pinned?: string[];
  onPin?: (id: string) => void;
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
        const isPinned = pinned.includes(o.universe.id);
        return (
          <div key={o.universe.id} className="flex h-full flex-col">
          <button
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(o.universe.id)}
            className={`card stacked flex w-full flex-1 flex-col p-5 text-left ${on ? "!border-violet-300/80" : ""}`}
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
          {onPin && (
            <button
              type="button"
              aria-pressed={isPinned}
              onClick={() => onPin(o.universe.id)}
              className="opt opt-quiet mt-5 min-h-10 self-start px-3 py-2 text-xs"
            >
              {isPinned ? `Pinned ${pinned.indexOf(o.universe.id) === 0 ? "A" : "B"}` : "Pin to compare"}
              <span className="sr-only">: {o.universe.name}</span>
            </button>
          )}
          </div>
        );
      })}
    </div>
  );
}

const assumption = (o: UniverseOutcome) =>
  o.universe.splits === "none" ? "Nothing: this is the life you described." : `${o.universe.splits === "childhood" ? "A different childhood" : "A different next chapter"}: ${o.universe.blurb.replace(/\.$/, "").toLowerCase()}.`;

/** Two pinned selves on the same trait scales, with signed differences and the one assumption each changes. */
export function PinnedCompare({ a, b, horizon, onClear }: { a: UniverseOutcome; b: UniverseOutcome; horizon: number; onClear: () => void }) {
  const A = "#c4b5fd";
  const B = "#7dd3fc";
  return (
    <section className="card mt-8 p-5 sm:p-6" aria-labelledby="pin-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Two selves, side by side</p>
          <h3 id="pin-h" className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold leading-snug">
            {a.universe.you} <span className="font-normal text-[var(--color-muted)]">vs</span> {b.universe.you}
          </h3>
        </div>
        <button type="button" onClick={onClear} className="btn btn-ghost !px-3 !py-2 !text-xs">
          Clear pins
        </button>
      </div>
      <div className="mt-5 grid gap-px overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2">
        {[
          { o: a, k: "A", c: A },
          { o: b, k: "B", c: B },
        ].map(({ o, k, c }) => (
          <div key={k} className="bg-[var(--color-panel)] p-4">
            <p className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: c }} />
              <span className="font-mono">{k}</span> · {o.universe.name}
            </p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-[#f4f3fb]">{o.type.type}</span>
              <span className="text-sm text-[var(--color-muted)]">
                {o.type.info.nickname}, {Math.round(o.type.p * 100)}% likely at {horizon}
              </span>
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#d9d7ee]">
              <span className="text-[var(--color-muted)]">What changed. </span>
              {assumption(o)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-3.5">
        {TRAITS.map((t) => {
          const pa = pct(a.futureZ[t]);
          const pb = pct(b.futureZ[t]);
          const d = pb - pa;
          return (
            <div key={t} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-xs sm:grid-cols-[9rem_1fr_auto]">
              <span className="truncate text-[var(--color-muted)]">
                <span className="sm:hidden">{TRAIT_META[t].short}</span>
                <span className="hidden sm:inline">{TRAIT_META[t].name}</span>
              </span>
              <span className="relative h-1.5 rounded-full bg-white/10" role="img" aria-label={`${TRAIT_META[t].name}: A at percentile ${pa}, B at percentile ${pb}`}>
                <span className="absolute inset-y-0 rounded-full bg-white/25" style={{ left: `${Math.min(pa, pb)}%`, width: `${Math.abs(d)}%` }} />
                <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#101016]" style={{ left: `${pa}%`, background: A }} />
                <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#101016]" style={{ left: `${pb}%`, background: B }} />
              </span>
              <span className="w-[7.5rem] text-right font-mono tabular-nums text-[#d9d7ee]">
                {pa} → {pb}{" "}
                <span className={d > 0 ? "text-emerald-300" : d < 0 ? "text-pink-300" : "text-[var(--color-muted)]"}>
                  ({d > 0 ? "+" : d < 0 ? "−" : "±"}
                  {Math.abs(d)})
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-[var(--color-muted)]">Percentiles at age {horizon}. The difference is B minus A, in percentile points.</p>
    </section>
  );
}
