"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { buildReport, toPct, pct, type Report, type TraitForecast } from "@/lib/model";
import { TRAITS, TRAIT_META, SOURCES, type Trait } from "@/lib/params";
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
import { CountUp, Reveal } from "./Motion";
import { narrationScript } from "@/lib/narration";

const fmtP = (p: number) => `${Math.round(p * 100)}%`;

function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <Reveal className="mb-5 mt-16">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-300">{kicker}</p>
      <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">{title}</h2>
      {sub && <p className="mt-2 max-w-3xl text-[var(--color-muted)]">{sub}</p>}
    </Reveal>
  );
}

function Cite({ id }: { id: string }) {
  const s = SOURCES[id];
  if (!s) return null;
  const short = s.split(")")[0] + ")";
  return (
    <span title={s} className="cursor-help border-b border-dotted border-white/30 text-[11px] text-[var(--color-muted)]">
      {short.replace(/,? et al\./, " et al.").slice(0, 48)}
    </span>
  );
}

function ChangeCard({ f, horizon }: { f: TraitForecast; horizon: number }) {
  const m = TRAIT_META[f.trait];
  const stay = 1 - f.pUp - f.pDown;
  return (
    <div className="card h-full p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold" style={{ color: m.color }}>{m.name}</h3>
          <p className="text-xs text-[var(--color-muted)]">
            {pct(f.now)}th percentile now → ~{pct(f.expected)}th by {horizon}
          </p>
        </div>
        <div className="text-right">
          <div className="font-[family-name:var(--font-display)] text-3xl font-bold"><CountUp value={Math.round(f.pChange * 100)} suffix="%" /></div>
          <div className="text-[11px] text-[var(--color-muted)]">chance of a big shift</div>
        </div>
      </div>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-white/5" title="Down / stays similar / up">
        <div className="transition-all duration-500" style={{ width: fmtP(f.pDown), background: "#f472b6" }} />
        <div className="transition-all duration-500" style={{ width: fmtP(stay), background: "#ffffff22" }} />
        <div className="transition-all duration-500" style={{ width: fmtP(f.pUp), background: "#34d399" }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-[var(--color-muted)]">
        <span>↓ {fmtP(f.pDown)} lower</span>
        <span>{fmtP(stay)} similar</span>
        <span>↑ {fmtP(f.pUp)} higher</span>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm">
        {f.drivers.slice(0, 3).map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-2">
            <span className="text-[var(--color-muted)]">{d.label}</span>
            <span className={d.effect > 0 ? "text-emerald-300" : "text-pink-300"}>
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
      {/* HERO */}
      <section className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
        <div className="fadeup">
          <p className="text-sm text-violet-300">{a.name ? `${a.name}'s` : "Your"} personalityverse</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight sm:text-5xl">
            {r.reverse ? "You most likely started life as " : "You started life as "}
            <span className="gradient-text">{r.temperamentType.label.replace(/ \(.*\)/, "")}</span>.
          </h1>
          <p className="mt-3 text-[var(--color-muted)]">
            {r.temperamentType.blurb} <span className="text-xs">({r.temperamentType.share}, Thomas &amp; Chess)</span>
            {r.reverse && (
              <span className="mt-1 block text-xs">
                Worked backwards from you now, your upbringing{r.backcast.parentsUsed ? " and your parents" : ""}: about{" "}
                {Math.round(Math.max(...Object.values(r.backcast.types)) * 100)}% likely. See Chapter 1 for the full odds.
              </span>
            )}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="font-[family-name:var(--font-display)] text-4xl font-bold"><CountUp value={Math.round(avg * 100)} suffix="%" /></div>
              <p className="text-xs text-[var(--color-muted)]">average chance each trait shifts meaningfully by age {a.horizon}</p>
            </div>
            <div className="card p-4">
              <div className="font-[family-name:var(--font-display)] text-4xl font-bold" style={{ color: TRAIT_META[most.trait].color }}>
                <CountUp value={Math.round(most.pChange * 100)} suffix="%" />
              </div>
              <p className="text-xs text-[var(--color-muted)]">{TRAIT_META[most.trait].name}: your most changeable trait</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
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
        <div className="card p-5">
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
      </section>

      {/* BABY -> NOW */}
      <SectionTitle
        kicker="Chapter 1 · Nature meets nurture"
        title="How far did you drift from baby you?"
        sub={
          r.reverse
            ? "Nobody remembers being a baby, so we worked baby you out backwards from where you are now, how you grew up and your parents. Here's how far you've likely drifted."
            : `Early temperament explains only about ${Math.round(r.carryover * 100)}% of the differences in adult personality (Caspi et al., 2003). Here's what your temperament and upbringing predicted, against where you actually are.`
        }
      />
      <div className="card overflow-x-auto p-2 sm:p-5">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-[var(--color-muted)]">
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
              <tr key={t} className="border-t border-white/5">
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
                      <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-violet-400" style={{ width: fmtP(r.pChangedFromBaby[t]) }} />
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
          <span className="text-sky-300">experiences unique to you</span>, from twin studies (<Cite id="VB2015" />). Notice how small the shared family slice is: siblings raised together end up
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
                    <span className={d.effect > 0 ? "text-emerald-300" : "text-pink-300"}>
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
        sub="A 'big shift' means moving at least half a standard deviation, roughly the gap between a typical 20-year-old and a typical 40-year-old in conscientiousness. Based on rank-order stability (Bleidorn et al., 2022), age-graded maturation (Roberts et al., 2006) and the life events you picked."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {r.future.map((f, i) => (
          <Reveal key={f.trait} delay={i * 70}>
            <ChangeCard f={f} horizon={a.horizon} />
          </Reveal>
        ))}
        <div className="card flex flex-col justify-center p-5">
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

      {/* MULTIVERSE */}
      <SectionTitle
        kicker="Chapter 3 · The multiverse"
        title="Meet the other versions of you"
        sub="Same baby, different worlds. Swap your upbringing or your next ten years and watch how the odds move."
      />
      <Reveal><Multiverse answers={a} report={r} /></Reveal>

      {/* TARGET */}
      <SectionTitle
        kicker="Chapter 4 · Choose your universe"
        title="Who do you want to become?"
        sub="Pick a target personality. We estimate your odds of getting there and build a weekly plan from the volitional change research (Hudson & Fraley, 2015; Stieger et al., 2021)."
      />
      <Reveal><TargetCoach answers={a} report={r} /></Reveal>

      {/* CELEBS */}
      <SectionTitle kicker="Chapter 5 · Your people" title="Famous people who share your profile" sub="Based on popular typings of public figures, for fun only. Nobody here took a personality test for us." />
      <Reveal><CelebMatches now={nowPct} baby={babyPct} /></Reveal>

      <section className="card mt-16 p-6 text-sm text-[var(--color-muted)]">
        <p>
          <b className="text-white">How to read this.</b> These are model estimates from published averages, not a diagnosis. Your answers about infancy are
          memories of other people&apos;s memories, so the &ldquo;baby you&rdquo; profile is the least certain part. Read{" "}
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
