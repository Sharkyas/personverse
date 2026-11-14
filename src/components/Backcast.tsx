"use client";
import { TRAITS, TRAIT_META, type Trait } from "@/lib/params";
import { phi, TYPE_BASE, type Report, type TypeName } from "@/lib/model";

const BABY_ADJ: Record<Trait, string> = { O: "curious", C: "regular and focused", E: "lively and sociable", A: "easy-going", N: "easily upset" };
const p100 = (z: number) => Math.round(phi(z) * 100);
const TYPE_ORDER: TypeName[] = ["Easy", "Mixed", "Slow-to-warm-up", "Spirited"];

/** Baby you, worked backwards from you now, your upbringing and your parents (plus your stories, if you gave them). */
export function Backcast({ r }: { r: Report }) {
  const bc = r.backcast;
  const sources = ["who you are now", ...(bc.parentsUsed ? [bc.parentsUsed === 2 ? "both parents" : "one parent"] : []), ...(bc.usedRecall ? ["your stories"] : [])];
  // Share of the narrowing that came from each clue, averaged over traits.
  const share = new Map<string, number>();
  for (const t of TRAITS) {
    const tot = bc.traits[t].evidence.reduce((s, e) => s + e.info, 0) || 1;
    for (const e of bc.traits[t].evidence) share.set(e.label, (share.get(e.label) ?? 0) + e.info / tot / 5);
  }
  const lifts = TYPE_ORDER.map((k) => ({ k, p: bc.types[k], lift: bc.types[k] / TYPE_BASE[k] })).sort((x, y) => y.lift - x.lift);

  return (
    <section className="card mt-6 p-6" aria-labelledby="bc-h">
      <p className="kicker">{r.reverse ? "Worked backwards" : "Your stories, cross-checked"}</p>
      <h3 id="bc-h" className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold">
        {r.reverse ? "What were you like as a baby?" : "Baby you, combining every clue"}
      </h3>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Built from {sources.join(", ").replace(/, ([^,]*)$/, " and $1")}, using how strongly each one tracks baby temperament in the research. The ranges are wide on purpose: that is the
        honest answer.
        {!r.reverse &&
          ` Your stories on their own say ${r.temperamentType.label.replace(/ \(.*\)$/, "").toLowerCase()}. Weighed against everything else, here is how likely that and each other type really is.`}
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h4 className="text-sm font-semibold">Which kind of baby were you?</h4>
          <div className="mt-3 space-y-3">
            {TYPE_ORDER.map((k) => (
              <div key={k}>
                <div className="flex justify-between text-xs">
                  <span>{k}</span>
                  <span className="text-[var(--color-muted)]">
                    <b className="text-white">{Math.round(bc.types[k] * 100)}%</b> · {Math.round(TYPE_BASE[k] * 100)}% of babies
                  </span>
                </div>
                <div className="relative mt-1 h-2.5 rounded-full bg-white/10" role="img" aria-label={`${k}: ${Math.round(bc.types[k] * 100)}% chance, against ${Math.round(TYPE_BASE[k] * 100)}% of all babies`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500" style={{ width: `${bc.types[k] * 100}%` }} />
                  <span className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-white/70" style={{ left: `${TYPE_BASE[k] * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            {lifts[0].lift >= 1.15
              ? `Compared with babies in general, you were ${lifts[0].lift.toFixed(1)}× as likely to be ${lifts[0].k === "Easy" ? "an" : "a"} ${lifts[0].k.toLowerCase()} baby.`
              : "Nothing here moves the odds far from the usual mix, which is a result in itself."}{" "}
            White tick: how common each type is.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-[var(--color-muted)]">What told us most:</span>
            {[...share]
              .sort((x, y) => y[1] - x[1])
              .map(([k, v]) => (
                <span key={k} className="rounded-full border border-white/10 px-2 py-0.5">
                  {k} {Math.round(v * 100)}%
                </span>
              ))}
          </div>
        </div>

        <div className="space-y-4">
          {TRAITS.map((t) => {
            const x = bc.traits[t];
            const now = p100(r.now[t]);
            const lo = p100(x.lo);
            const hi = p100(x.hi);
            const mid = p100(x.mean);
            const more = x.pHigher >= 0.5;
            const p = Math.round((more ? x.pHigher : 1 - x.pHigher) * 100);
            return (
              <div key={t}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: TRAIT_META[t].color }}>{TRAIT_META[t].name}</span>
                  <span className="text-[var(--color-muted)]">
                    baby {mid} (likely {lo}–{hi}) · now {now}
                  </span>
                </div>
                <div className="relative mt-1.5 h-2.5 rounded-full bg-white/5" role="img" aria-label={`${TRAIT_META[t].name}: baby you most likely ${mid}th percentile, 80% range ${lo} to ${hi}; you now ${now}`}>
                  <div className="absolute h-full rounded-full opacity-40" style={{ left: `${lo}%`, width: `${Math.max(2, hi - lo)}%`, background: TRAIT_META[t].color }} />
                  <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b0a1a]" style={{ left: `${mid}%`, background: TRAIT_META[t].color }} />
                  <span className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded bg-white" style={{ left: `${now}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                  {p}% chance baby you was {more ? "more" : "less"} {BABY_ADJ[t]} than you are now, compared with other babies.
                </p>
              </div>
            );
          })}
          <p className="text-[11px] text-[var(--color-muted)]">Band: 80% range for baby you. Dot: most likely. White tick: you now.</p>
        </div>
      </div>
    </section>
  );
}
