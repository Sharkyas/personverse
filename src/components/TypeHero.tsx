"use client";
import Link from "next/link";
import { closestType } from "@/lib/mbti";
import { TYPE_DETAILS, traitWord } from "@/lib/typeDetails";
import { TRAITS, TRAIT_META } from "@/lib/params";
import { pct, type Report } from "@/lib/model";

const LETTER_NAME: Record<string, string> = {
  E: "Extravert",
  I: "Introvert",
  S: "Practical",
  N: "Big-picture",
  T: "Logic-led",
  F: "Values-led",
  J: "Planner",
  P: "Flexible",
};

/** The named type, front and centre: four letters, how sure we are, and a full portrait. */
export function TypeHero({ r }: { r: Report }) {
  const t = closestType(r.now, r.detailed ? r.rel : undefined);
  const d = TYPE_DETAILS[t.type];
  const c = t.confidence;
  const pair = [c.core.replace("_", c.open.first), c.core.replace("_", c.open.second)];
  const clear = t.letters.filter((l) => l.p >= 0.7).length;

  return (
    <section className="card mb-16 overflow-hidden p-6 sm:p-10" aria-labelledby="type-h">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="kicker">
            <span aria-hidden="true" className="h-px w-6 bg-violet-300/60" />
            Your personality type
          </p>
          <h2 id="type-h" className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-[family-name:var(--font-display)] text-6xl font-semibold tracking-tight sm:text-7xl">{t.type}</span>
            <span className="accent-serif text-3xl text-[#d9d7ee] sm:text-4xl">{t.info.nickname}</span>
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#e4e2f3]">{t.info.line}</p>
          <p className="mt-4 max-w-xl leading-relaxed text-[var(--color-muted)]">{d.summary}</p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {t.info.strengths.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold">How sure we are</p>
            <span className="chip">{c.level} confidence</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
            {clear === 1 ? "1 of 4 letters is" : `${clear} of 4 letters are`} clear. We&apos;re <b className="text-white">{Math.round(c.pCore * 100)}% sure</b> you&apos;re {pair[0]} or {pair[1]}, and{" "}
            {t.type} is the more likely of the two.
          </p>
          <div className="mt-5 space-y-4">
            {t.letters.map((l) => {
              const left = Math.round((1 - l.pSecond) * 100);
              return (
                <div key={l.dim}>
                  <div className="flex justify-between text-xs">
                    <span className={l.letter === l.first ? "font-semibold text-white" : "text-[var(--color-muted)]"}>
                      {l.first} · {LETTER_NAME[l.first]} {left}%
                    </span>
                    <span className={l.letter === l.second ? "font-semibold text-white" : "text-[var(--color-muted)]"}>
                      {100 - left}% {LETTER_NAME[l.second]} · {l.second}
                    </span>
                  </div>
                  <div
                    className="relative mt-1.5 h-2 rounded-full bg-white/10"
                    role="img"
                    aria-label={`${LETTER_NAME[l.first]} ${left}%, ${LETTER_NAME[l.second]} ${100 - left}%`}
                  >
                    <div className="absolute inset-y-0 left-0 rounded-full bg-violet-300" style={{ width: `${left}%` }} />
                    <span className="absolute -top-0.5 h-3 w-px bg-white/50" style={{ left: "50%" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[var(--color-muted)]">
            {r.detailed ? "From the full 50-question test." : "From the quick 10-question test."} Letters near 50% are genuinely in between: that is common, not a fault in the test.
            {!r.detailed && (
              <>
                {" "}
                <Link href="/quiz" className="underline decoration-dotted hover:text-white">
                  Take the full test
                </Link>{" "}
                for a sharper read.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.08] sm:grid-cols-2">
        {[
          { h: "At your best", b: d.atBest },
          { h: "Under stress", b: d.underStress },
          { h: "At work", b: d.work, chips: d.roles },
          { h: "With people", b: d.relationships },
        ].map((x) => (
          <div key={x.h} className="bg-[var(--color-panel)] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-wider text-violet-200/80">{x.h}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#dcdaea]">{x.b}</p>
            {x.chips && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {x.chips.map((c) => (
                  <span key={c} className="chip text-[11px]">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm leading-relaxed text-[var(--color-muted)]">
        <b className="text-white">Your growth edge:</b> {d.growthEdge}
      </p>

      <div className="mt-10">
        <p className="text-sm font-semibold">Your Big Five, in plain words</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          {TRAITS.map((k) => {
            const p = pct(r.now[k]);
            return (
              <div key={k} className="rounded-xl border border-white/[.08] p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs" style={{ color: TRAIT_META[k].color }}>
                    {TRAIT_META[k].name}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-[var(--color-muted)]">{p}</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${p}%`, background: TRAIT_META[k].color }} />
                </div>
                <p className="mt-2 text-xs leading-snug text-[#dcdaea]">{traitWord(k, p)}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-[var(--color-muted)]">Numbers are percentiles: 70 means higher than 70 in 100 adults.</p>
      </div>
    </section>
  );
}
