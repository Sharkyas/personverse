"use client";
import { useMemo } from "react";
import { OEJTS_ITEMS, type Oejts } from "@/lib/oejts";
import { lettersToCheck, mbtiLetters, ALWAYS_CHECK, CHECK_BELOW, type Dim } from "@/lib/mbti";
import { currentZ, IPIP_REL } from "@/lib/model";
import type { Answers } from "@/lib/questions";

const PAIR: Record<Dim, string> = { EI: "Extravert or Introvert", SN: "Practical or Big-picture", TF: "Logic-led or Values-led", JP: "Planner or Flexible" };

/**
 * Follow-up questions: E/I and S/N always, and T/F or J/P when the 50 answers leave them unsure (under 80%). Each is a pair of descriptions with
 * five points between them. Optional: skipping them just leaves those letters less certain.
 */
export function TypeCheck({ a, onChange }: { a: Answers; onChange: (o: Oejts) => void }) {
  const z = useMemo(() => currentZ(a), [a]);
  const dims = useMemo(() => lettersToCheck(z, IPIP_REL), [z]);
  const L = useMemo(() => mbtiLetters(z, IPIP_REL, a.oejts), [z, a.oejts]);
  if (!dims.length) return null;
  const near = L.filter((l) => dims.includes(l.dim) && !ALWAYS_CHECK.includes(l.dim) && l.p < CHECK_BELOW).map((l) => l.dim);
  const ans = a.oejts ?? {};
  const items = OEJTS_ITEMS.filter((it) => dims.includes(it.dim));
  const done = items.filter((it) => ans[it.id]).length;

  return (
    <section className="mt-10 border-t border-[var(--color-line)] pt-8" aria-labelledby="tc-h">
      <p className="kicker">Optional · {items.length} quick pairs</p>
      <h3 id="tc-h" className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold">Pin down your type</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
        {near.length > 0
          ? `Your answers so far leave ${near.length === 1 ? "one letter" : `${near.length} letters`} close to the line (${near.map((d) => PAIR[d]).join(", ")}). `
          : ""}
        Extravert or Introvert and Practical or Big-picture are always checked here, because the statements above read them less well than the other two. For each pair, tap
        where you sit between the two. Skip any you can&apos;t decide.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2 text-xs">
        {L.filter((l) => dims.includes(l.dim)).map((l) => (
          <li key={l.dim} className="rounded-full border border-[var(--color-line)] px-3 py-1 font-mono tabular-nums">
            {l.first}/{l.second}: {l.letter} {Math.round(l.p * 100)}%
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-5">
        {items.map((it) => (
          <div key={it.id} className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
            <span className="text-sm sm:text-right">{it.left}</span>
            <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={`${it.left} or ${it.right}`}>
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={ans[it.id] === v}
                  aria-label={v === 3 ? "In between" : v < 3 ? `${v === 1 ? "Very" : "Somewhat"}: ${it.left}` : `${v === 5 ? "Very" : "Somewhat"}: ${it.right}`}
                  onClick={() => onChange({ ...ans, [it.id]: ans[it.id] === v ? 0 : v })}
                  className="opt h-10 w-10 text-xs font-semibold sm:w-11"
                >
                  {v === 3 ? "·" : ""}
                </button>
              ))}
            </div>
            <span className="text-sm">{it.right}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 font-mono text-xs tabular-nums text-[var(--color-muted)]" aria-live="polite">
        {done} of {items.length} answered
      </p>
    </section>
  );
}
