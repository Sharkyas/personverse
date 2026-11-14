"use client";
import { useMemo, useState } from "react";
import { buildReport, pct } from "@/lib/model";
import { sanitizeAnswers } from "@/lib/questions";
import { allOutcomes } from "@/lib/universes";
import { Branches } from "@/components/Branches";
import { UniverseCards } from "@/components/UniverseCards";

const RAW = {
  tipi: [5, 3, 5, 4, 6, 4, 6, 3, 4, 2],
  age: 20,
  horizon: 35,
  events: ["university"],
  babyKnown: false,
  inventory: "detailed",
  ipip: [4, 2, 5, 3, 4, 2, 4, 3, 5, 2, 3, 2, 4, 4, 5, 1, 4, 2, 4, 3, 5, 2, 3, 4, 4, 2, 5, 3, 4, 2, 3, 1, 4, 3, 5, 2, 4, 2, 4, 3, 5, 3, 3, 2, 4, 2, 5, 4, 4, 3],
};

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

export function Lab({ v }: { v: string }) {
  const a = useMemo(() => sanitizeAnswers(RAW), []);
  const r = useMemo(() => buildReport(a), [a]);
  const outcomes = useMemo(() => allOutcomes(a, r), [a, r]);
  const [sel, setSel] = useState("you");
  if (v === "B")
    return (
      <section className="pt-12">
        <p className="kicker">Direction B · Parallel-universe cards</p>
        <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.08] sm:text-[2.6rem]">
          Same baby, <span className="accent-serif text-[var(--accent-soft)]">eight worlds</span>
        </h1>
        <p className="mb-8 mt-4 max-w-3xl text-[15px] leading-relaxed text-[var(--color-muted)]">Each card is you at {a.horizon} in another universe. The white tick is the real you.</p>
        <UniverseCards outcomes={outcomes} report={r} horizon={a.horizon} selected={sel} onSelect={setSel} />
      </section>
    );
  if (v === "C") {
    const order = ["tough", "drift", "settled", "growth", "nomad", "restless", "warm", "you"].map((id) => outcomes.find((o) => o.universe.id === id)!);
    return (
      <section className="pt-12">
        <p className="kicker">Direction C · Probability cloud</p>
        <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.08] sm:text-[2.6rem]">
          Every universe is a <span className="accent-serif text-[var(--accent-soft)]">cloud of possible yous</span>
        </h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[var(--color-muted)]">
          One plane per universe. Each dot is a possible you at {a.horizon}: further right is more outgoing, further up is calmer. Your own universe is in focus.
        </p>
        <div className="relative mt-6 overflow-hidden" style={{ perspective: "1400px", height: "min(125vw, 520px)" }}>
          {order.map((o, i) => {
            const mine = o.universe.id === "you";
            const rnd = rng(11 + i * 97);
            const g = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
            const fE = o.future.find((f) => f.trait === "E")!;
            const fN = o.future.find((f) => f.trait === "N")!;
            const dots = Array.from({ length: mine ? 110 : 70 }, () => ({ x: pct(fE.expected + fE.sd * g()), y: pct(fN.expected + fN.sd * g()) }));
            return (
              <div
                key={o.universe.id}
                className="absolute left-1/2 w-[min(78%,720px)]"
                style={{
                  top: `${i * 8.5 - 14}%`,
                  aspectRatio: "2.4",
                  transform: `translateX(-50%) rotateX(64deg) rotateZ(-14deg) translateZ(${i * 6}px)`,
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="absolute inset-0 rounded-[18px] border"
                  style={{
                    borderColor: mine ? "rgba(196,181,253,.8)" : "rgba(255,255,255,.22)",
                    background: mine ? "rgba(52,44,92,.86)" : "rgba(22,22,32,.72)",
                    opacity: mine ? 1 : 0.55 + i * 0.06,
                  }}
                >
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
                    {dots.map((d, k) => (
                      <ellipse key={k} cx={d.x} cy={d.y} rx={mine ? 0.5 : 0.4} ry={mine ? 1.2 : 0.95} fill={mine ? "#c4b5fd" : "#e9e7f7"} fillOpacity={mine ? 0.95 : 0.75} />
                    ))}
                  </svg>
                </div>
              </div>
            );
          })}
          <ul className="absolute inset-y-0 right-0 hidden w-56 flex-col justify-center gap-2 text-xs sm:flex">
            {[...order].reverse().map((o) => (
              <li key={o.universe.id} className={`flex items-baseline justify-between gap-3 border-b border-[var(--color-line)] pb-2 ${o.universe.id === "you" ? "text-[#f4f3fb]" : "text-[var(--color-muted)]"}`}>
                <span>{o.universe.name}</span>
                <span className="font-mono tabular-nums">
                  {o.type.type} {Math.round(o.type.p * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:hidden">
          {[...order].reverse().map((o) => (
            <li key={o.universe.id} className={`flex justify-between gap-2 border-b border-[var(--color-line)] pb-1.5 ${o.universe.id === "you" ? "text-[#f4f3fb]" : "text-[var(--color-muted)]"}`}>
              <span className="truncate">{o.universe.id === "you" ? "Yours" : o.universe.name.replace(/^The | universe$/g, "")}</span>
              <span className="font-mono">{o.type.type}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  return (
    <div className="-mt-16">
      <Branches answers={a} report={r} />
    </div>
  );
}
