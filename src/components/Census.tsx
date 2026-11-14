"use client";
import { useEffect, useState } from "react";
import { TRAITS, TRAIT_META } from "@/lib/params";

type Stats = { n: number; avgPChange: Record<string, number | null>; types: { _id: string; n: number }[]; mode: string };

export function Census() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setS).catch(() => {});
  }, []);
  if (!s || !s.n) return null;
  return (
    <section className="card mt-10 p-6 fadeup">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">Multiverse census</h3>
        <span className="text-xs text-[var(--color-muted)]">{s.mode === "atlas" ? "Live from MongoDB Atlas" : "Live"}</span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {s.n} {s.n === 1 ? "person has" : "people have"} mapped their personalityverse. Average chance of each trait shifting:
      </p>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {TRAITS.map((t) => (
          <div key={t} className="text-center">
            <div className="text-2xl font-bold" style={{ color: TRAIT_META[t].color }}>
              {s.avgPChange[t] != null ? Math.round((s.avgPChange[t] as number) * 100) + "%" : "–"}
            </div>
            <div className="text-xs text-[var(--color-muted)]">{TRAIT_META[t].name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
