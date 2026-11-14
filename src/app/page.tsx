import Link from "next/link";
import { Radar } from "@/components/Radar";
import { Census } from "@/components/Census";

const demo = {
  baby: { O: 62, C: 35, E: 22, A: 55, N: 78 },
  now: { O: 74, C: 58, E: 48, A: 60, N: 52 },
  future: { O: 70, C: 72, E: 55, A: 66, N: 34 },
};

export default function Home() {
  return (
    <div>
      <section className="grid items-center gap-10 pt-14 md:grid-cols-[1.15fr_1fr] md:pt-20">
        <div className="fadeup">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--color-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Built on twin studies, 50 years of longitudinal data and 200+ intervention studies
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.05] sm:text-6xl">
            Who were you <span className="gradient-text">before the world</span> got to you?
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[var(--color-muted)]">
            Estimate the temperament you were born with, see how much your upbringing reshaped it, and get the odds that each part of your
            personality changes again. Then pick who you want to become and get a research-backed plan to get there.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/quiz" className="btn btn-primary text-lg">Map my personalityverse →</Link>
            <Link href="/science" className="btn btn-ghost">How it works</Link>
          </div>
          <p className="mt-4 text-xs text-[var(--color-muted)]">About 4 minutes. No sign-up. Your answers stay anonymous.</p>
        </div>
        <div className="card relative p-6 floaty">
          <Radar
            series={[
              { label: "Baby you", color: "#f472b6", values: demo.baby, dashed: true },
              { label: "You now", color: "#a78bfa", values: demo.now },
              { label: "You at 35", color: "#38bdf8", values: demo.future, dashed: true },
            ]}
          />
          <div className="mt-2 flex justify-center gap-4 text-xs text-[var(--color-muted)]">
            <span className="text-pink-400">● Baby you</span>
            <span className="text-violet-400">● You now</span>
            <span className="text-sky-400">● You at 35</span>
          </div>
        </div>
      </section>

      <section className="mt-20 grid gap-4 md:grid-cols-3">
        {[
          { n: "01", t: "You now, then backwards", d: "Ten questions place you on the Big Five today. Add how you grew up and what your parents are like, and we work out the odds of what you were like as a baby." },
          { n: "02", t: "The world happened", d: "Know stories about baby you? Add them and we cross-check. Upbringing and life events use published effect sizes to show how far you've likely drifted." },
          { n: "03", t: "Every future you", d: "Your current traits plus age-based maturation and planned life events give a % chance each trait shifts. Flip between alternate universes and watch it move." },
        ].map((s) => (
          <div key={s.n} className="card p-6">
            <div className="text-sm font-mono text-violet-300">{s.n}</div>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold">{s.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{s.d}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: "~40%", v: "of the differences in adult personality are linked to genes", s: "Meta-analysis, Vukasović & Bratko 2015" },
          { k: "r ≈ .3", v: "link between age-3 temperament and age-26 personality", s: "Dunedin study, Caspi et al. 2003" },
          { k: "d = .37", v: "average trait change from 24 weeks of intervention", s: "Roberts et al. 2017, 207 studies" },
          { k: "0", v: "measurable effect of birth order on personality", s: "Rohrer et al. 2015, n > 20,000" },
        ].map((f) => (
          <div key={f.v} className="card p-5">
            <div className="gradient-text font-[family-name:var(--font-display)] text-3xl font-bold">{f.k}</div>
            <p className="mt-2 text-sm">{f.v}</p>
            <p className="mt-2 text-xs text-[var(--color-muted)]">{f.s}</p>
          </div>
        ))}
      </section>

      <section className="card mt-16 border-amber-300/20 p-6">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-amber-200">An honest note</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
          Nobody can test your personality at birth. Newborns don&apos;t have the Big Five yet. What they do have is <em>temperament</em>: early,
          partly genetic tendencies in activity, mood, fearfulness and attention, which grow into adult traits only loosely. Personalityverse
          estimates that temperament from what you know about your early years, then models the rest with published effect sizes. Treat the
          numbers as an informed forecast, not a verdict.
        </p>
      </section>

      <Census />
    </div>
  );
}
