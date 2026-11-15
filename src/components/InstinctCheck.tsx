"use client";
import { INSTINCT_ITEMS, type InstinctAnswers } from "@/lib/enneagram";
import { IPIP_SCALE_7 } from "@/lib/questions";

/** Six optional statements for the Enneagram instinct order (sp, so, sx), on the same 7-point scale as the main test. */
export function InstinctCheck({ ans = {}, onChange }: { ans?: InstinctAnswers; onChange: (a: InstinctAnswers) => void }) {
  const done = INSTINCT_ITEMS.filter((it) => ans[it.id]).length;
  return (
    <section className="mt-10 border-t border-[var(--color-line)] pt-8" aria-labelledby="ic-h">
      <p className="kicker">Optional · {INSTINCT_ITEMS.length} statements</p>
      <h3 id="ic-h" className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold">
        Your instincts
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
        These set the order of your Enneagram instincts: self-preservation, social and one-to-one. 1 is not me at all, 7 is very much me.
      </p>
      <div className="mt-6 space-y-6">
        {INSTINCT_ITEMS.map((it) => (
          <div key={it.id}>
            <p className="text-[15px] text-[#f4f3fb]">{it.text}</p>
            <div className="mt-2 grid grid-cols-7 gap-1.5" role="radiogroup" aria-label={it.text}>
              {[1, 2, 3, 4, 5, 6, 7].map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={ans[it.id] === v}
                  aria-label={IPIP_SCALE_7[v - 1]}
                  onClick={() => onChange({ ...ans, [it.id]: ans[it.id] === v ? 0 : v })}
                  className="opt h-10 text-xs font-semibold tabular-nums"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 font-mono text-xs tabular-nums text-[var(--color-muted)]" aria-live="polite">
        {done} of {INSTINCT_ITEMS.length} answered
      </p>
    </section>
  );
}
