"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { IPIP_ITEMS, IPIP_SCALE, IPIP_MIN_PER_TRAIT, IPIP_HINTS } from "@/lib/questions";
import { TRAITS } from "@/lib/params";

/** True once every trait has enough answers to be scored. */
export function ipipReady(ans: number[]) {
  return TRAITS.every((t) => IPIP_ITEMS.filter((it, i) => it.trait === t && ans[i] >= 1).length >= IPIP_MIN_PER_TRAIT);
}
export const firstUnanswered = (ans: number[]) => {
  const i = ans.findIndex((v) => !(v >= 1));
  return i < 0 ? IPIP_ITEMS.length : i;
};

/** The 50 statements one at a time: tap an answer and it moves on. Keys 1–5 answer, ← goes back. */
export function IpipFlow({ ans, onChange, jumpTo }: { ans: number[]; onChange: (next: number[]) => void; jumpTo?: number }) {
  const [i, setI] = useState(() => Math.min(firstUnanswered(ans), IPIP_ITEMS.length - 1));
  const [dir, setDir] = useState<"next" | "back">("next");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = ans.filter((v) => v >= 1).length;
  const total = IPIP_ITEMS.length;
  const finished = done === total;

  useEffect(() => {
    if (jumpTo != null && jumpTo < total) {
      setDir("next");
      setI(jumpTo);
    }
  }, [jumpTo, total]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const go = useCallback((n: number) => {
    setDir(n >= i ? "next" : "back");
    setI(Math.max(0, Math.min(total - 1, n)));
  }, [i, total]);

  const answer = useCallback(
    (v: number) => {
      const next = [...ans];
      next[i] = v;
      onChange(next);
      if (timer.current) clearTimeout(timer.current);
      const target = i < total - 1 ? i + 1 : firstUnanswered(next);
      if (target < total) timer.current = setTimeout(() => go(target), 220);
    },
    [ans, i, onChange, go, total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (/^[1-5]$/.test(e.key)) answer(+e.key);
      else if (e.key === "ArrowLeft" && i > 0) go(i - 1);
      else if (e.key === "ArrowRight" && ans[i] >= 1 && i < total - 1) go(i + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, go, i, ans, total]);

  const it = IPIP_ITEMS[i];
  const v = ans[i] ?? 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-mono tabular-nums text-[var(--color-muted)]" aria-live="polite">
          {i + 1} / {total}
        </span>
        <span className="text-[var(--color-muted)]">{finished ? "All answered" : `${done} answered`}</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div className="h-full rounded-full bg-violet-300 transition-[width] duration-300 ease-out" style={{ width: `${(done / total) * 100}%` }} />
      </div>

      <div key={i} className={`mt-8 min-h-[6.5rem] ${dir === "back" ? "step-back" : "step-next"}`}>
        <p className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">How well does this describe you?</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-medium leading-snug sm:text-2xl">{it.text}</p>
        {IPIP_HINTS[it.id] && <p className="mt-1.5 text-sm text-[var(--color-muted)]">{IPIP_HINTS[it.id]}</p>}
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-5" role="radiogroup" aria-label={it.text}>
        {IPIP_SCALE.map((label, k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={v === k + 1}
            onClick={() => answer(k + 1)}
            className={`opt flex items-center gap-3 px-4 py-3 text-left text-sm sm:flex-col sm:items-center sm:gap-1.5 sm:px-2 sm:py-4 sm:text-center ${v === k + 1 ? "pop" : ""}`}
          >
            <span className="font-mono text-xs tabular-nums text-[var(--color-muted)]">{k + 1}</span>
            <span className="leading-tight">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between text-xs">
        <button type="button" onClick={() => go(i - 1)} disabled={i === 0} className="text-[var(--color-muted)] hover:text-white disabled:invisible">
          <span aria-hidden="true">←</span> Previous
        </button>
        <span className="hidden text-[var(--color-muted)] sm:inline">Keys 1–5 to answer</span>
        <button type="button" onClick={() => go(i + 1)} disabled={i === total - 1 || !(v >= 1)} className="text-[var(--color-muted)] hover:text-white disabled:invisible">
          Next question <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
