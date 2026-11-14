"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { buildReport, toPct, pct, type Report, type TraitForecast } from "@/lib/model";
import { TRAITS, TRAIT_META, type Trait } from "@/lib/params";
import type { Answers } from "@/lib/questions";
import { Radar, Legend } from "./Radar";
import { Narrator } from "./Narrator";
import { Multiverse } from "./Multiverse";
import { TargetCoach } from "./TargetCoach";
import { CelebMatches } from "./CelebMatches";
import { Timeline } from "./Timeline";
import { FutureSelf } from "./FutureSelf";
import { IntegrationStatus } from "./IntegrationStatus";
import { BabyTwins } from "./BabyTwins";
import { Backcast } from "./Backcast";
import { DeepDive } from "./DeepDive";
import { MbtiLayer } from "./MbtiLayer";
import { TypeHero } from "./TypeHero";
import { AccuracyPanel } from "./Accuracy";
import { CountUp, Reveal } from "./Motion";
import { narrationScript } from "@/lib/narration";

const fmtP = (p: number) => `${Math.round(p * 100)}%`;

function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <Reveal className="mb-8 mt-24 sm:mt-28">
      <div className="flex items-center gap-4">
        <p className="kicker">{kicker}</p>
        <span aria-hidden="true" className="hairline min-w-6 flex-1" />
      </div>
      <h2 className="mt-5 max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.08] sm:text-[2.6rem]">{title}</h2>
      {sub && <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[var(--color-muted)]">{sub}</p>}
    </Reveal>
  );
}

function ChangeCard({ f, horizon }: { f: TraitForecast; horizon: number }) {
  const m = TRAIT_META[f.trait];
  const stay = 1 - f.pUp - f.pDown;
  return (
    <div className="card h-full p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold" style={{ color: m.color }}>{m.name}</h3>
          <p className="text-xs text-[var(--color-muted)]">
            {pct(f.now)}th percentile now → ~{pct(f.expected)}th by {horizon}
          </p>
        </div>
        <div className="text-right">
          <div className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight"><CountUp value={Math.round(f.pChange * 100)} suffix="%" /></div>
          <div className="text-[11px] text-[var(--color-muted)]">chance of a big shift</div>
        </div>
      </div>
      <div className="mt-5 flex h-2 gap-0.5 overflow-hidden rounded-full" title="Down / stays similar / up">
        <div className="transition-all duration-500" style={{ width: fmtP(f.pDown), background: "#f472b6" }} />
        <div className="transition-all duration-500" style={{ width: fmtP(stay), background: "#ffffff22" }} />
        <div className="transition-all duration-500" style={{ width: fmtP(f.pUp), background: "#34d399" }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-[var(--color-muted)]">
        <span>↓ {fmtP(f.pDown)} lower</span>
        <span>{fmtP(stay)} similar</span>
        <span>↑ {fmtP(f.pUp)} higher</span>
      </div>
      <ul className="mt-5 space-y-2 border-t border-white/[.07] pt-4 text-sm">
        {f.drivers.slice(0, 3).map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-2">
            <span className="text-[var(--color-muted)]">{d.label}</span>
            <span className={`tabular-nums ${d.effect > 0 ? "text-emerald-300" : "text-pink-300"}`}>
              {d.effect > 0 ? "+" : ""}
              {d.effect.toFixed(2)} SD
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NatureBar({ r, t }: { r: Report; t: Trait }) {
  const n = r.nature[t];
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full" title={`Genes ${fmtP(n.genes)}, shared family ${fmtP(n.shared)}, unique experiences ${fmtP(n.unique)}`}>
      <div style={{ width: fmtP(n.genes), background: "#a78bfa" }} />
      <div style={{ width: fmtP(n.shared), background: "#fbbf24" }} />
      <div style={{ width: fmtP(n.unique), background: "#38bdf8" }} />
    </div>
  );
}

export function Results({ answers, id }: { answers: Answers; id?: string }) {
  const [a, setA] = useState(answers);
  const r = useMemo(() => buildReport(a), [a]);
  const babyPct = toPct(r.temperament);
  const nowPct = toPct(r.now);
  const futurePct = toPct(Object.fromEntries(r.future.map((f) => [f.trait, f.expected])) as Record<Trait, number>);
  const predPct = toPct(r.predictedAdult);
  const most = [...r.future].sort((x, y) => y.pChange - x.pChange)[0];
  const avg = r.future.reduce((s, f) => s + f.pChange, 0) / 5;
  const script = narrationScript(r, a.name, a.age, a.horizon);
  const [copied, setCopied] = useState(false);

  return (
    <div className="pt-10">
      <TypeHero r={r} />
      {r.detailed && <AccuracyPanel />}
      {/* HERO */}
      <section className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr] md:pt-6">
        <div>
          <p className="kicker rise" style={{ "--i": 0 } as React.CSSProperties}>
            <span aria-hidden="true" className="h-px w-6 bg-violet-300/60" />
            {a.name ? `${a.name}'s` : "Your"} personalityverse
          </p>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.04] sm:text-6xl">
            <span className="rise block text-[.62em] font-medium leading-tight text-[#d9d7ee]" style={{ "--i": 1 } as React.CSSProperties}>
              {r.reverse ? "You most likely started life as " : "You started life as "}
            </span>
            <span className="unblur mt-1 block" style={{ "--i": 4 } as React.CSSProperties}>
              <span className="accent-serif text-[1.18em] text-[#f4f3fb]">{r.temperamentType.label.replace(/ \(.*\)/, "")}</span>.
            </span>
          </h1>
          <p className="rise mt-5 max-w-xl leading-relaxed text-[var(--color-muted)]" style={{ "--i": 8 } as React.CSSProperties}>
            {r.temperamentType.blurb} <span className="text-xs">({r.temperamentType.share})</span>
            {r.reverse && (
              <span className="mt-1 block text-xs">
                Worked backwards from you now, your upbringing{r.backcast.parentsUsed ? " and your parents" : ""}: about{" "}
                {Math.round(Math.max(...Object.values(r.backcast.types)) * 100)}% likely. See Chapter 1 for the full odds.
              </span>
            )}
          </p>
          <div className="rise mt-7 grid grid-cols-2 gap-3" style={{ "--i": 10 } as React.CSSProperties}>
            <div className="card p-5">
              <div className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight"><CountUp value={Math.round(avg * 100)} suffix="%" ms={1600} /></div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">average chance each trait shifts meaningfully by age {a.horizon}</p>
            </div>
            <div className="card p-5">
              <div className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight" style={{ color: TRAIT_META[most.trait].color }}>
                <CountUp value={Math.round(most.pChange * 100)} suffix="%" ms={1600} />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">{TRAIT_META[most.trait].name}: your most changeable trait</p>
            </div>
          </div>
          <div className="rise mt-7 flex flex-wrap gap-2.5" style={{ "--i": 12 } as React.CSSProperties}>
            <Narrator text={script} />
            {id && (
              <>
                <button
                  className="btn btn-ghost"
                  onClick={async () => {
                    const url = window.location.href;
                    try {
                      if (navigator.share) return await navigator.share({ title: "My personalityverse", url });
                    } catch {}
                    navigator.clipboard?.writeText(url);
                    setCopied(true);
                  }}
                >
                  {copied ? "Link copied ✓" : "Share"}
                </button>
                <a className="btn btn-ghost" href={`/api/card/${id}?format=story&download=1`} download>
                  Story card ↓
                </a>
                <Link className="btn btn-ghost" href={`/quiz?compare=${id}`}>
                  Compare with a friend
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="unblur relative" style={{ "--i": 5 } as React.CSSProperties}>
          <div className="card relative p-5 sm:p-6">
          <Radar
            series={[
              { label: "Baby you (temperament)", color: "#f472b6", values: babyPct, dashed: true },
              { label: "You now", color: "#a78bfa", values: nowPct },
              { label: `Expected you at ${a.horizon}`, color: "#38bdf8", values: futurePct, dashed: true },
            ]}
          />
          <Legend
            series={[
              { label: "Baby you", color: "#f472b6", values: babyPct, dashed: true },
              { label: "You now", color: "#a78bfa", values: nowPct },
              { label: `You at ${a.horizon}`, color: "#38bdf8", values: futurePct, dashed: true },
            ]}
          />
          </div>
        </div>
      </section>

      {/* BABY -> NOW */}
      <SectionTitle
        kicker="Chapter 1 · Nature meets nurture"
        title="How far did you drift from baby you?"
        sub={
          r.reverse
            ? "Nobody remembers being a baby, so we worked baby you out backwards from where you are now, how you grew up and your parents. Here's how far you've likely drifted."
            : `Early temperament explains only about ${Math.round(r.carryover * 100)}% of the differences in adult personality. Here's what your temperament and upbringing predicted, against where you actually are.`
        }
      />
      <DeepDive chapter="nature" r={r} a={a} />
      <div className="card overflow-x-auto p-3 sm:p-6" tabIndex={0} role="region" aria-label="Baby you versus you now, by trait">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-[11px] uppercase tracking-[.12em] text-[var(--color-muted)]">
            <tr>
              <th className="p-2">Trait</th>
              <th className="p-2">{r.reverse ? "Baby you (likely)" : "Baby you"}</th>
              {!r.reverse && <th className="p-2">Model predicted</th>}
              <th className="p-2">You now</th>
              <th className="p-2">Chance of drifting from baby you</th>
              <th className="p-2 w-40">Genes · family · unique</th>
            </tr>
          </thead>
          <tbody>
            {TRAITS.map((t) => (
              <tr key={t} className="border-t border-white/[.07] tabular-nums transition-colors hover:bg-white/[.025]">
                <td className="p-2 font-semibold" style={{ color: TRAIT_META[t].color }}>{TRAIT_META[t].name}</td>
                <td className="p-2">{babyPct[t]}</td>
                {!r.reverse && <td className="p-2">{predPct[t]}</td>}
                <td className="p-2">
                  {nowPct[t]}
                  {Math.abs(r.surprise[t]) > 1 && (
                    <span className="ml-2 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] text-amber-200">
                      {r.surprise[t] > 0 ? "beat" : "below"} the model
                    </span>
                  )}
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-violet-300" style={{ width: fmtP(r.pChangedFromBaby[t]) }} />
                    </div>
                    {fmtP(r.pChangedFromBaby[t])}
                  </div>
                </td>
                <td className="p-2">
                  <NatureBar r={r} t={t} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-2 pt-3 text-xs text-[var(--color-muted)]">
          Percentiles on a fixed adult scale (TIPI norms). Bar colours: <span className="text-violet-300">genes</span> · <span className="text-amber-300">shared family environment</span> ·{" "}
          <span className="text-sky-300">experiences unique to you</span>, from twin studies. Notice how small the shared family slice is: siblings raised together end up
          surprisingly different.
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {TRAITS.filter((t) => r.upbringingDrivers[t].length > 1)
          .sort((x, y) => Math.abs(r.upbringingDrivers[y][0].effect) - Math.abs(r.upbringingDrivers[x][0].effect))
          .slice(0, 3)
          .map((t) => (
            <div key={t} className="card p-5">
              <p className="text-xs text-[var(--color-muted)]">What shaped your</p>
              <h3 className="font-semibold" style={{ color: TRAIT_META[t].color }}>{TRAIT_META[t].name}</h3>
              <ul className="mt-3 space-y-1.5 text-sm">
                {r.upbringingDrivers[t].slice(0, 4).map((d) => (
                  <li key={d.label} className="flex justify-between gap-2">
                    <span className="text-[var(--color-muted)]">{d.label}</span>
                    <span className={`tabular-nums ${d.effect > 0 ? "text-emerald-300" : "text-pink-300"}`}>
                      {d.effect > 0 ? "+" : ""}
                      {d.effect.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>

      <Backcast r={r} />

      <BabyTwins babyPct={babyPct} nowPct={nowPct} id={id} />

      {/* FUTURE */}
      <SectionTitle
        kicker="Chapter 2 · Your future selves"
        title={`What are the odds you change by ${a.horizon}?`}
        sub="A 'big shift' means moving at least half a standard deviation, roughly the gap between a typical 20-year-old and a typical 40-year-old in conscientiousness. Based on how stable personality is over time, how people typically mature with age and the life events you picked."
      />
      <DeepDive chapter="future" r={r} a={a} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {r.future.map((f, i) => (
          <Reveal key={f.trait} delay={i * 70}>
            <ChangeCard f={f} horizon={a.horizon} />
          </Reveal>
        ))}
        <div className="card flex flex-col justify-center p-5 sm:p-6">
          <label className="text-sm">
            Forecast to age <b>{a.horizon}</b>
          </label>
          <input type="range" aria-label="Forecast age" min={a.age + 1} max={80} value={a.horizon} onChange={(e) => setA({ ...a, horizon: +e.target.value })} className="mt-2" />
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Drag it. Personality keeps changing at every age, but it&apos;s most fluid in your twenties and settles from about 50.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Reveal><Timeline answers={a} report={r} /></Reveal>
      </div>
      <div className="mt-4">
        <Reveal><FutureSelf answers={a} report={r} /></Reveal>
      </div>
      {id && (
        <div className="card mt-4 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">Check yourself against this forecast</h3>
            <p className="text-xs text-[var(--color-muted)]">Retake the ten questions every few weeks and see if you&apos;re moving the way the model expected. Takes a minute.</p>
          </div>
          <Link className="btn btn-ghost" href={`/track/${id}`}>
            Start tracking →
          </Link>
        </div>
      )}

      {/* MULTIVERSE */}
      <SectionTitle
        kicker="Chapter 3 · The multiverse"
        title="Meet the other versions of you"
        sub="Same baby, different worlds. Swap your upbringing or your next ten years and watch how the odds move."
      />
      <DeepDive chapter="multiverse" r={r} a={a} />
      <Reveal><Multiverse answers={a} report={r} /></Reveal>

      {/* TARGET */}
      <SectionTitle
        kicker="Chapter 4 · Choose your universe"
        title="Who do you want to become?"
        sub="Pick a target personality. We estimate your odds of getting there and build a weekly plan from the research on deliberate personality change."
      />
      <DeepDive chapter="target" r={r} a={a} />
      <Reveal><TargetCoach answers={a} report={r} /></Reveal>

      {/* CELEBS */}
      <SectionTitle kicker="Chapter 5 · Your people" title="Famous people who share your profile" sub="Based on popular typings of public figures, for fun only. Nobody here took a personality test for us." />
      <DeepDive chapter="people" r={r} a={a} />
      <Reveal><CelebMatches now={nowPct} baby={babyPct} /></Reveal>
      <SectionTitle
        kicker="Chapter 6 · Your type"
        title="The MBTI version of you: born, now and later"
        sub="Myers-Briggs is the personality test most people know, but it's less reliable than the Big Five, so we derive it from your Big Five rather than ask you 93 more questions. Odds, not labels."
      />
      <DeepDive chapter="mbti" r={r} a={a} />
      <MbtiLayer r={r} horizon={a.horizon} age={a.age} />

      <section className="card mt-24 p-6 text-sm leading-relaxed text-[var(--color-muted)] sm:p-8">
        <p>
          <b className="text-white">How to read this.</b> These are model estimates from published averages, not a diagnosis. {r.reverse
            ? "Baby you is worked out backwards from weak clues, so it is the least certain part, and the ranges say so. "
            : "Your answers about infancy are memories of other people's memories, so the \u201cbaby you\u201d profile is the least certain part. "}
          The MBTI chapter is derived from your Big Five and is the least reliable layer. Read{" "}
          <Link href="/science" className="text-violet-300 underline">
            the science
          </Link>{" "}
          for every number and its source.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/quiz" className="btn btn-ghost">
            Retake
          </Link>
          <IntegrationStatus />
        </div>
      </section>
    </div>
  );
}
