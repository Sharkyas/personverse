"use client";
import { useState } from "react";
import { useOffThread } from "@/lib/useOffThread";
import { Working } from "./Working";
import Link from "next/link";
import { TRAIT_META, TRAITS, type Trait } from "@/lib/params";
import type { Report, Vec } from "@/lib/model";
import { closestType, mbtiLetters, MBTI_RETEST, MBTI_PREVALENCE_UK, MBTI_TYPES, type Person, type Dist } from "@/lib/mbti";

const WORD: Record<string, string> = { E: "Extraverted", I: "Introverted", S: "Sensing", N: "Intuitive", T: "Thinking", F: "Feeling", J: "Judging", P: "Perceiving" };
const BADGE: Record<Person["confidence"], string> = { "self-reported": "said so themselves", "strong consensus": "popular typing", disputed: "disputed typing" };

/** Bonus layer: the MBTI type your Big Five scores point to, with honest odds. */
function DistCol({ title, sub, d }: { title: string; sub: string; d: Dist }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
      <p className="text-xs uppercase tracking-wider text-accent-300/80">{title}</p>
      <p className="text-[11px] text-[var(--color-muted)]">{sub}</p>
      <div className="mt-3 space-y-2">
        {d.slice(0, 3).map((x, i) => (
          <div key={x.type}>
            <div className="flex justify-between text-sm">
              <Link href={`/types/${x.type}`} className={i === 0 ? "font-semibold text-white hover:underline" : "text-[var(--color-muted)] hover:underline"}>
                {x.type} <span className="text-xs font-normal">{MBTI_TYPES[x.type]?.nickname}</span>
              </Link>
              <span className={i === 0 ? "font-semibold" : "text-[var(--color-muted)]"}>{Math.round(x.p * 100)}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-accent-300" style={{ width: `${Math.min(100, x.p * 250)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MbtiLayer({ r, horizon, age }: { r: Report; horizon: number; age: number }) {
  const rel = r.detailed ? r.rel : undefined;
  const now = closestType(r.now, rel, r.oejts);
  const futureZ = Object.fromEntries(TRAITS.map((t) => [t, r.future.find((f) => f.trait === t)!.expected])) as Vec;
  const later = mbtiLetters(futureZ, rel, r.oejts);
  const [showAll, setShowAll] = useState(false);
  const shifts = now.letters
    .map((l, i) => ({ l, d: later[i].pSecond - l.pSecond, later: later[i] }))
    .filter((x) => Math.abs(x.d) >= 0.05);
  const laterType = later.map((l) => l.letter).join("");
  const people = showAll ? now.people : now.people.slice(0, 4);
  const journey = useOffThread({ kind: "journey", report: r });
  const [target, setTarget] = useState<string | null>(null);
  const path = useOffThread(target ? { kind: "path", report: r, age, target } : null);

  return (
    <section className="card mt-6 p-6" aria-labelledby="mbti-h">
      <p className="kicker">MBTI, worked out from your Big Five</p>
      <h3 id="mbti-h" className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold">
        Your closest type: <span className="gradient-text">{now.type}</span>
        {now.info && <span className="text-[var(--color-muted)]">, {now.info.nickname}</span>}
      </h3>
      {now.info && <p className="mt-1 text-sm">{now.info.line}</p>}
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {now.confidence.level} confidence: {Math.round(now.confidence.pCore * 100)}% sure you&apos;re {now.confidence.core.replace("_", now.confidence.open.first)} or{" "}
        {now.confidence.core.replace("_", now.confidence.open.second)}. About {Math.round(MBTI_PREVALENCE_UK[now.type] ?? 0)}% of UK adults are {now.type}.
      </p>

      {journey ? (
        <>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <DistCol title="Born" sub={r.reverse ? "From baby you, worked backwards" : "From baby you"} d={journey.born} />
        <DistCol title="Now" sub="From your answers today" d={journey.now} />
        <DistCol title={`At ${horizon}`} sub="From your forecast" d={journey.later} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="font-[family-name:var(--font-display)] text-3xl font-semibold">{Math.round(journey.pTypeChanges * 100)}%</div>
          <p className="text-xs text-[var(--color-muted)]">
            chance your four letters change by {horizon}. Most likely to flip:{" "}
            {Object.entries(journey.letterFlip)
              .sort((x, y) => y[1] - x[1])
              .slice(0, 2)
              .map(([d, p]) => `${d[0]}/${d[1]} (${Math.round(p * 100)}%)`)
              .join(", ")}
            .
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="font-[family-name:var(--font-display)] text-3xl font-semibold">{Math.round(journey.pBornAsNow * 100)}%</div>
          <p className="text-xs text-[var(--color-muted)]">
            chance you were born the type you are now. With 16 types and weak links from baby to adult, most people weren&apos;t.
          </p>
        </div>
      </div>
        </>
      ) : (
        <Working label="Simulating your type at birth, now and later" className="mt-5 min-h-[22rem]" />
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          {now.letters.map((l, i) => (
            <div key={l.dim}>
              <div className="flex justify-between text-xs">
                <span className={l.letter === l.first ? "font-semibold text-white" : "text-[var(--color-muted)]"}>
                  {l.first} · {WORD[l.first]}
                </span>
                <span className={l.letter === l.second ? "font-semibold text-white" : "text-[var(--color-muted)]"}>
                  {WORD[l.second]} · {l.second}
                </span>
              </div>
              <div className="relative mt-1.5 h-2.5 rounded-full bg-white/10" role="img" aria-label={`${Math.round(l.p * 100)}% ${WORD[l.letter]}`}>
                <span className="absolute top-0 h-full w-px bg-white/30" style={{ left: "50%" }} />
                <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b0a1a] bg-accent-400" style={{ left: `${l.pSecond * 100}%` }} />
                <span className="absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded bg-sky-300/80" style={{ left: `${later[i].pSecond * 100}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                {Math.round(l.p * 100)}% {WORD[l.letter].toLowerCase()} now
              </p>
            </div>
          ))}
          <p className="text-[11px] text-[var(--color-muted)]">Dot: you now. Blue tick: expected you at {horizon}.</p>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold">By {horizon}</h4>
            <p className="mt-1 text-[var(--color-muted)]">
              {laterType === now.type ? `Your likeliest type stays ${now.type}.` : `Your likeliest type becomes ${laterType}.`}{" "}
              {shifts.length
                ? shifts
                    .map((x) => {
                      const toward = x.d > 0 ? x.l.second : x.l.first;
                      return `${WORD[toward]} gets ${Math.round(Math.abs(x.d) * 100)} points likelier`;
                    })
                    .join("; ") + ", mostly from normal maturation and the life events you picked."
                : "Your letters barely move."}
            </p>
          </div>
          {now.info && (
            <>
              <div>
                <h4 className="font-semibold">Usual strengths</h4>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {now.info.strengths.map((s) => (
                    <span key={s} className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Room to grow</h4>
                <ul className="mt-1.5 space-y-2">
                  {now.info.growth.map((g, k) => (
                    <li key={k} className="text-[13px] text-[var(--color-muted)]">
                      <span className="mr-1 text-xs font-semibold" style={{ color: TRAIT_META[g.trait as Trait]?.color }}>
                        {TRAIT_META[g.trait as Trait]?.name} {g.direction === "up" ? "↑" : "↓"}
                      </span>
                      {g.text}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          {people.length > 0 && (
            <div>
              <h4 className="font-semibold">Famous {now.type}s</h4>
              <ul className="mt-1.5 space-y-1">
                {people.map((p) => (
                  <li key={p.name} className="flex justify-between gap-2 text-[13px]">
                    <span>{p.name}</span>
                    <span className="text-[11px] text-[var(--color-muted)]">{BADGE[p.confidence]}</span>
                  </li>
                ))}
              </ul>
              {now.people.length > 4 && !showAll && (
                <button className="mt-1 text-xs text-accent-300 underline" onClick={() => setShowAll(true)}>
                  Show all {now.people.length}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.02] p-4">
        <h4 className="font-semibold">Want to become another type?</h4>
        <p className="mt-1 text-xs text-[var(--color-muted)]">Pick one. We show which letters would need to flip, the trait behind each, and your odds.</p>
        <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {Object.keys(MBTI_TYPES)
            .sort()
            .map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={target === t}
                onClick={() => setTarget(t)}
                className={`rounded-lg border py-1.5 text-xs font-semibold ${target === t ? "border-accent-400 bg-accent-500/30" : t === now.type ? "border-white/30 text-white" : "border-white/10 text-[var(--color-muted)] hover:bg-white/10"}`}
              >
                {t}
              </button>
            ))}
        </div>
        {target && !path && <Working label={`Working out the odds of becoming ${target}`} className="mt-4 min-h-[10rem]" />}
        {path && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="text-sm">
              {path.steps.length ? (
                <ul className="space-y-1.5">
                  {path.steps.map((st) => (
                    <li key={st.dim}>
                      <b>
                        {st.from} → {st.to}
                      </b>
                      <span className="text-[var(--color-muted)]">
                        : {st.direction === "up" ? "raise" : "lower"}{" "}
                        <span style={{ color: TRAIT_META[st.trait].color }}>{TRAIT_META[st.trait].name.toLowerCase()}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[var(--color-muted)]">That&apos;s already your closest type. The odds show how likely it is to stay that way.</p>
              )}
              <Link href={`/types/${path.target}`} className="mt-2 inline-block text-xs text-accent-300 underline">
                About {path.target}, {MBTI_TYPES[path.target]?.nickname} →
              </Link>
            </div>
            <table className="w-full text-xs">
              <thead className="text-[var(--color-muted)]">
                <tr>
                  <th className="pb-1 text-left font-normal">Chance of being {path.target}</th>
                  <th className="pb-1 text-right font-normal">in 1 year</th>
                  <th className="pb-1 text-right font-normal">in 3 years</th>
                </tr>
              </thead>
              <tbody>
                {path.odds.map((o) => (
                  <tr key={o.label} className="border-t border-white/5">
                    <td className="py-1.5">{o.label}</td>
                    <td className="py-1.5 text-right font-semibold">{Math.round(o.y1 * 100)}%</td>
                    <td className="py-1.5 text-right font-semibold">{Math.round(o.y3 * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm">
        <Link href="/types" className="text-accent-300 underline">
          Explore all 16 types →
        </Link>
      </p>

      <p className="mt-5 text-[11px] text-[var(--color-muted)]">
        Take this lightly. We estimate MBTI from your Big Five, not with the official test. Even on the real test, only{" "}
        {MBTI_RETEST.same_4_letters}% of people kept all four letters when retested within {MBTI_RETEST.interval}, because most people sit near the
        middle of at least one scale. MBTI also has no scale for emotional stability. Celebrity types are crowd guesses unless marked otherwise. Every number here runs through your Big
        Five forecast, because we found no study of upbringing or life events changing MBTI type directly.
      </p>
    </section>
  );
}
