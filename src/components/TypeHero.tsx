"use client";
import Link from "next/link";
import { typeFor } from "@/lib/mbti";
import { TYPE_DETAILS, traitWord } from "@/lib/typeDetails";
import { TRAITS, TRAIT_META } from "@/lib/params";
import { pct, type Report } from "@/lib/model";
import { TraitDeepDives } from "./TraitDeepDives";
import { enneagram, ENNEA_INFO, INSTINCT_NAME } from "@/lib/enneagram";

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
export function TypeHero({ r, horizon }: { r: Report; horizon?: number }) {
  const t = typeFor(r);
  const d = TYPE_DETAILS[t.type];
  const c = t.confidence;
  const pair = [c.core.replace("_", c.open.first), c.core.replace("_", c.open.second)];
  const clear = t.letters.filter((l) => l.p >= 0.7).length;
  const checked = t.letters.filter((l) => l.direct?.letter);
  const agreed = checked.filter((l) => l.direct?.agrees).length;
  const borderline = t.letters.filter((l) => l.borderline);
  /** the type with one letter flipped to its other option */
  const alt = (l: (typeof t.letters)[number]) => t.letters.map((x) => (x.dim === l.dim ? (x.letter === x.first ? x.second : x.first) : x.letter)).join("");
  const openL = t.letters.find((l) => l.dim === c.open.dim)!;
  const coreLetters = t.letters.filter((l) => l.dim !== c.open.dim).map((l) => l.letter).join(", ");
  const en = enneagram(r.now, t.letters, r.instincts);
  const enInfo = ENNEA_INFO[en.type];

  const cell = "bg-[var(--color-panel)] p-5 sm:p-7";
  const grid = "grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-line)]";

  return (
    <section className="mb-16 pt-2 sm:pt-6" aria-labelledby="type-h">
      <div className="grid items-start gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
        <div>
          <p className="kicker rise">Your personality type</p>
          <h2 id="type-h" className="rise mt-5" style={{ "--i": 1 } as React.CSSProperties}>
            <span className="sr-only">{t.type}, </span>
            <span aria-hidden="true" className="flex flex-wrap items-end gap-x-5 gap-y-3">
              <span className="font-[family-name:var(--font-display)] text-[5.5rem] font-semibold leading-[.85] tracking-[-0.05em] text-[#f4f3fb] sm:text-[8.5rem]">{t.type}</span>
              {borderline.length > 0 && (
                <span className="mb-2 flex flex-col items-start gap-1.5">
                  {borderline.map((l) => (
                    <span key={l.dim} className="chip font-mono tabular-nums">
                      or {alt(l)} · {100 - Math.round(l.p * 100)}%
                    </span>
                  ))}
                </span>
              )}
            </span>
            <span className="accent-serif mt-4 block text-3xl leading-tight text-[var(--accent-soft)] sm:text-[2.5rem]">{t.info.nickname}</span>
          </h2>
          <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-[#edecf7] sm:text-xl" style={{ "--i": 2 } as React.CSSProperties}>
            {t.info.line}
          </p>
          <p className="rise mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-muted)]" style={{ "--i": 3 } as React.CSSProperties}>
            {d.summary}
          </p>
          <ul className="rise mt-6 flex flex-wrap gap-1.5" aria-label="Strengths" style={{ "--i": 4 } as React.CSSProperties}>
            {t.info.strengths.map((s) => (
              <li key={s} className="chip">
                {s}
              </li>
            ))}
          </ul>
          <div className="card rise mt-8 p-5 sm:p-6" style={{ "--i": 5 } as React.CSSProperties} aria-labelledby="ennea-h">
            <p className="eyebrow" id="ennea-h">
              Enneagram
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
              <span className="font-[family-name:var(--font-display)] text-5xl font-semibold leading-none tracking-[-0.04em] text-[#f4f3fb]">{en.label}</span>
              {en.instincts && <span className="mb-1 font-mono text-lg tabular-nums text-[var(--accent-soft)]">{en.instincts.stack}</span>}
              <span className="mb-1 flex flex-wrap gap-1.5">
                {en.ranked.slice(1, 3).map((x) => (
                  <span key={x.type} className="chip font-mono tabular-nums">
                    or {x.label} · {Math.round(x.p * 100)}%
                  </span>
                ))}
              </span>
            </div>
            <p className="mt-3 text-sm text-[#edecf7]">
              {enInfo.name}. {enInfo.line}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
              {Math.round(en.ranked[0].p * 100)}% likely from your trait scores and type letters. The number is the best-supported part; the wing is the closer
              neighbouring type
              {en.instincts
                ? `, and ${INSTINCT_NAME[en.instincts.order[0]].toLowerCase()} leads your instincts on your own answers`
                : ". Answer the instinct statements at the end of the test to add sp, so and sx"}
              .
            </p>
          </div>
        </div>

        <div className="card rise p-5 sm:p-7" style={{ "--i": 3 } as React.CSSProperties}>
          <div className="flex items-start justify-between gap-3">
            <p className="eyebrow">How sure we are</p>
            <span className={`stamp stamp-${c.level.toLowerCase()}`}>{c.level} confidence</span>
          </div>
          <p className="stat-num mt-4">
            {Math.round(c.pCore * 100)}
            <span className="stat-unit">%</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
            chance that your {coreLetters} are all right, which narrows you to {pair[0]} or {pair[1]}. The letter we are least sure of is {openL.letter} (versus {openL.letter === openL.first ? openL.second : openL.first}), at {Math.round(openL.p * 100)}%, so {t.type} is the more likely of the two. {clear === 1 ? "1 of 4 letters is" : `${clear} of 4 letters are`} clear (70% or more).
          </p>
          {(checked.length > 0 || borderline.length > 0) && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              {checked.length > 0 &&
                `Your follow-up answers ${agreed === checked.length ? "agreed with" : `agreed on ${agreed} of ${checked.length} letters with`} your 50 answers. `}
              {borderline.length > 0 &&
                `Under 65% is a lean, not a clear call, so ${borderline.map((l) => `${l.letter} (${Math.round(l.p * 100)}%)`).join(", ")} could fairly be read either way. That is why different tests can disagree on ${borderline.length === 1 ? "it" : "them"}.`}
            </p>
          )}
          <div className="mt-6 space-y-5 border-t border-[var(--color-line)] pt-6">
            {t.letters.map((l) => {
              const left = Math.round((1 - l.pSecond) * 100);
              const on = "font-medium text-[#f4f3fb]";
              const off = "text-[var(--color-muted)]";
              return (
                <div key={l.dim}>
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className={l.letter === l.first ? on : off}>
                      {LETTER_NAME[l.first]} <span className="tabular-nums">{left}%</span>
                    </span>
                    <span className={`text-right ${l.letter === l.second ? on : off}`}>
                      <span className="tabular-nums">{100 - left}%</span> {LETTER_NAME[l.second]}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2.5">
                    <span aria-hidden="true" className={`w-3 text-center font-mono text-xs ${l.letter === l.first ? "text-[#f4f3fb]" : off}`}>{l.first}</span>
                    <div
                      className="relative h-1.5 flex-1 rounded-full bg-white/10"
                      role="img"
                      aria-label={`${LETTER_NAME[l.first]} ${left}%, ${LETTER_NAME[l.second]} ${100 - left}%`}
                    >
                      <div
                        className="absolute inset-y-0 rounded-full bg-[var(--accent-soft)]"
                        style={left >= 50 ? { right: "50%", width: `${left - 50}%` } : { left: "50%", width: `${50 - left}%` }}
                      />
                      <span className="absolute -inset-y-1 left-1/2 w-px bg-white/45" />
                    </div>
                    <span aria-hidden="true" className={`w-3 text-center font-mono text-xs ${l.letter === l.second ? "text-[#f4f3fb]" : off}`}>{l.second}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-xs leading-relaxed text-[var(--color-muted)]">
            {r.detailed ? "From the full 50-question test." : "From the quick 10-question test."} The bar leans towards the side you lean. Letters near the middle are genuinely in between: that is common, not a fault in the test.
            {!r.detailed && (
              <>
                {" "}
                <Link href="/quiz" className="link-quiet">
                  Take the full test
                </Link>{" "}
                for a sharper read.
              </>
            )}
          </p>
        </div>
      </div>

      <div className={`${grid} mt-14 sm:grid-cols-2`}>
        {[
          { h: "At your best", b: d.atBest },
          { h: "Under stress", b: d.underStress },
          { h: "At work", b: d.work, chips: d.roles },
          { h: "With people", b: d.relationships },
        ].map((x, i) => (
          <div key={x.h} className={cell}>
            <h3 className="flex items-baseline gap-3 text-sm font-medium text-[#f4f3fb]">
              <span aria-hidden="true" className="font-mono text-[11px] tabular-nums text-[var(--color-muted)]">0{i + 1}</span>
              {x.h}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#d9d7ee]">{x.b}</p>
            {x.chips && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {x.chips.map((c) => (
                  <span key={c} className="chip">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className={`${cell} sm:col-span-2`}>
          <h3 className="flex items-baseline gap-3 text-sm font-medium text-[#f4f3fb]">
            <span aria-hidden="true" className="font-mono text-[11px] tabular-nums text-[var(--color-muted)]">05</span>
            Your growth edge
          </h3>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[#d9d7ee]">{d.growthEdge}</p>
        </div>
      </div>

      <div className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">Your Big Five, in plain words</h3>
          <p className="text-xs text-[var(--color-muted)]">Percentiles: 70 means higher than 70 in 100 people who took this test.</p>
        </div>
        <div className={`${grid} mt-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`}>
          {TRAITS.map((k) => {
            const p = pct(r.now[k]);
            return (
              <div key={k} className="bg-[var(--color-panel)] p-5 max-sm:last:col-span-2 sm:max-lg:[&:nth-child(n+4)]:col-span-1">
                <p className="flex items-center gap-2 text-[13px] text-[var(--color-muted)]">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: TRAIT_META[k].color }} />
                  {TRAIT_META[k].name}
                </p>
                <p className="stat-num mt-4 !text-4xl">{p}</p>
                <div className="mt-3 h-1 rounded-full bg-white/10" role="img" aria-label={`${TRAIT_META[k].name}: percentile ${p}`}>
                  <div className="h-full rounded-full" style={{ width: `${p}%`, background: TRAIT_META[k].color }} />
                </div>
                <p className="mt-3 text-[13px] leading-snug text-[#d9d7ee]">{traitWord(k, p)}</p>
              </div>
            );
          })}
        </div>
        <TraitDeepDives r={r} horizon={horizon} />
      </div>
    </section>
  );
}
