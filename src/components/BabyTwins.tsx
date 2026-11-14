"use client";
import { useEffect, useState } from "react";
import { TRAITS, TRAIT_META, type Trait } from "@/lib/params";

type Twins = { n: number; avgNow: Record<string, number>; avgBaby: Record<string, number>; mode: string };
const MIN_TWINS = 5;
const ADJ: Record<Trait, string> = { O: "open", C: "conscientious", E: "extraverted", A: "agreeable", N: "prone to stress" };

/** Where the real people who started life most like you ended up, from the census. Hidden until enough people have taken the test. */
export function BabyTwins({ babyPct, nowPct, id }: { babyPct: Record<Trait, number>; nowPct: Record<Trait, number>; id?: string }) {
  const [tw, setTw] = useState<Twins | null>(null);
  const key = TRAITS.map((t) => Math.round(babyPct[t])).join(",");
  useEffect(() => {
    let live = true;
    fetch("/api/twins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ baby: babyPct, exclude: id }) })
      .then((r) => r.json())
      .then((j) => live && setTw(j))
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, id]);

  if (!tw || tw.n < MIN_TWINS) return null;
  const gaps = TRAITS.map((t) => ({ t, gap: nowPct[t] - tw.avgNow[t] })).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  const big = gaps[0];
  const headline =
    Math.abs(big.gap) < 10
      ? "You've turned out a lot like the people who started where you did."
      : `You've become ${big.gap > 0 ? "more" : "less"} ${ADJ[big.t]} than the people who started where you did, by ${Math.round(Math.abs(big.gap))} points.`;

  return (
    <section className="card mt-6 p-6 fadeup" aria-labelledby="twins-h">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="twins-h" className="font-[family-name:var(--font-display)] text-xl font-semibold">
          Your baby twins
        </h3>
        <span className="text-xs text-[var(--color-muted)]">{tw.mode === "atlas" ? "Live from MongoDB Atlas" : "Live census"}</span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        The {tw.n} people in our census whose baby temperament was closest to yours, and where they are now. {headline}
      </p>
      <div className="mt-5 space-y-4">
        {TRAITS.map((t) => (
          <div key={t}>
            <div className="flex justify-between text-xs">
              <span style={{ color: TRAIT_META[t].color }}>{TRAIT_META[t].name}</span>
              <span className="text-[var(--color-muted)]">
                them {Math.round(tw.avgNow[t])} · you {Math.round(nowPct[t])}
              </span>
            </div>
            <div className="relative mt-1.5 h-2.5 rounded-full bg-white/10" role="img" aria-label={`${TRAIT_META[t].name}: your baby twins are at ${Math.round(tw.avgNow[t])}, you are at ${Math.round(nowPct[t])}`}>
              <span className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded bg-white/40" style={{ left: `${tw.avgNow[t]}%` }} />
              <span
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--color-bg,#0b0718)]"
                style={{ left: `${nowPct[t]}%`, background: TRAIT_META[t].color }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-[var(--color-muted)]">
        Grey tick: your baby twins today, on average. Dot: you. Real people who took the test, not the sample profile. Same start, different lives.
      </p>
    </section>
  );
}
