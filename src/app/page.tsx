import Link from "next/link";
import { Radar } from "@/components/Radar";
import { Census } from "@/components/Census";
import { Reveal } from "@/components/Motion";
import { PortalImageHero } from "@/components/PortalImageHero";

const demo = {
  baby: { O: 62, C: 35, E: 22, A: 55, N: 78 },
  now: { O: 74, C: 58, E: 48, A: 60, N: 52 },
  future: { O: 70, C: 72, E: 55, A: 66, N: 34 },
};

const WORDS_A = ["Openness", "INTP", "Curious", "Conscientiousness", "ENFJ", "Steady", "Extraversion", "ISTJ", "Bold", "Agreeableness", "ESFP", "Warm", "Neuroticism", "INFJ", "Calm"];
const WORDS_B = ["Baby you", "ENTP", "You now", "ISFJ", "Sheltered", "ESTJ", "Nomad", "INFP", "Hard knocks", "ENTJ", "Growth", "ISTP", "Drift", "ESFJ", "You at 35"];
const SQUARES = ["#ff4fa3", "#ffe14d", "#b06bff", "#a9f1f6"];

function Heading({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <Reveal className="mb-8 max-w-2xl">
      <p className="kicker">
        <span aria-hidden="true" className="h-px w-6 bg-accent-300/60" />
        {kicker}
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.1] sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-[var(--color-muted)]">{sub}</p>}
    </Reveal>
  );
}

export default function Home() {
  return (
    <div>
      <section className="bleed isolate -mt-px flex min-h-[calc(100svh-3.5rem)] flex-col justify-end overflow-hidden text-[#16122b] sm:min-h-[calc(100svh-4rem)] md:justify-start">
        <PortalImageHero />
        <div className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6 md:pt-8">
          <div className="hero-panel rise w-full space-y-5 p-5 sm:p-6 md:max-w-[25rem]">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-[#3d3857]">Universe 01 of 08</p>
              <h1 className="hero-display mt-3 text-[2rem] md:text-[2.7rem]">Meet the other you.</h1>
              <p className="mt-3 max-w-[30rem] text-[15px] leading-[1.6] text-[#2c2745]">Same baby. Different world. See who you would have become, and who you still could.</p>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <Link href="/quiz" className="btn group !rounded-full !bg-[#16122b] !px-6 !py-3.5 !text-base !text-white">
                  Find my other selves
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
                <Link href="/science" className="text-[15px] font-medium text-[#16122b] underline decoration-[#16122b]/40 underline-offset-4">
                  How it works
                </Link>
              </div>
              <p className="mt-3 font-mono text-[12px] tabular-nums text-[#3d3857]">4 min · no sign-up · anonymous</p>
            </div>
          </div>
        </div>
      </section>

      <div className="bleed marquee" role="presentation">
        <p className="sr-only">Openness, conscientiousness, extraversion, agreeableness, neuroticism: five traits, sixteen types, eight universes.</p>
        {[WORDS_A, WORDS_B].map((row, k) => (
          <div key={k} className="marquee-row" aria-hidden="true">
            {[...row, ...row].map((w, i) => (
              <span key={i} style={{ "--sq": SQUARES[i % SQUARES.length] } as React.CSSProperties}>
                {w}
              </span>
            ))}
          </div>
        ))}
      </div>

      <section className="bleed portal-blend">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-40 pt-16 sm:px-6 sm:pt-24 md:grid-cols-[1fr_1.1fr]">
          <div className="hero-panel p-6 text-[#16122b] sm:p-8">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-[#3d3857]">The multiverse</p>
            <h2 className="hero-display mt-4 text-[2rem] sm:text-[2.8rem]">Eight worlds. One you.</h2>
            <p className="mt-4 text-[16px] leading-[1.65] text-[#2c2745]">
              Each world is a life you could have lived: a warmer home, a harder start, years abroad. We work out who you would be in every one, and how likely each part of you is to change again.
            </p>
            <div className="mt-6">
              <Link href="/quiz" className="btn group !rounded-full !bg-[#16122b] !px-6 !py-3.5 !text-base !text-white">
                Map my personalityverse
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
          <div className="card relative p-5 sm:p-6">
              <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                <span className="font-medium text-white">A sample personalityverse</span>
                <span className="font-mono tabular-nums">O · C · E · A · N</span>
              </div>
              <Radar
                series={[
                  { label: "Baby you", color: "#ffd23f", values: demo.baby, dashed: true },
                  { label: "You now", color: "#ff5fae", values: demo.now },
                  { label: "You at 35", color: "#8ff7f7", values: demo.future, dashed: true },
                ]}
              />
              <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs">
                {[
                  { c: "#ffd23f", l: "Baby you" },
                  { c: "#ff5fae", l: "You now" },
                  { c: "#8ff7f7", l: "You at 35" },
                ].map((x) => (
                  <span key={x.l} className="chip">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: x.c }} />
                    {x.l}
                  </span>
                ))}
              </div>
            </div>
        </div>
      </section>

      <Reveal className="mt-16 md:mt-24">
        <div className="hairline" />
        <p className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-5 text-center text-[13px] text-[var(--color-muted)]">
          <span className="text-white">Built on</span>
          <span>twin studies</span>
          <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-white/25 sm:block" />
          <span>50 years of longitudinal data</span>
          <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-white/25 sm:block" />
          <span>200+ intervention studies</span>
        </p>
        <div className="hairline" />
      </Reveal>

      <section className="mt-20 md:mt-28">
        <Heading kicker="How it works" title="Three steps, from the cot to the rest of your life." />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "01", t: "You now, then backwards", d: "Ten questions place you on the Big Five today. Add how you grew up and what your parents are like, and we work out the odds of what you were like as a baby." },
            { n: "02", t: "The world happened", d: "Know stories about baby you? Add them and we cross-check. Upbringing and life events use published effect sizes to show how far you've likely drifted." },
            { n: "03", t: "Every future you", d: "Your current traits plus age-based maturation and planned life events give a % chance each trait shifts. Think of yourself as a string: each way it can vibrate is another version of you. Pluck a different life and watch the odds move." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 80} className="h-full">
              <div className="card group h-full p-6 transition-colors duration-300 hover:border-white/20 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs tabular-nums text-accent-300">{s.n}</span>
                  <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
                </div>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-20 md:mt-28">
        <Heading kicker="The research" title="Four findings the model leans on." />
        <Reveal>
          <div className="card grid gap-px overflow-hidden !bg-white/[.08] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "~40%", v: "of the differences in adult personality are linked to genes", s: "from twin and adoption studies" },
              { k: "r ≈ .3", v: "link between age-3 temperament and age-26 personality", s: "from a study that followed children for decades" },
              { k: "d = .37", v: "average trait change from 24 weeks of intervention", s: "pooled across 207 studies" },
              { k: "0", v: "measurable effect of birth order on personality", s: "in samples of more than 20,000 people" },
            ].map((f) => (
              <div key={f.v} className="bg-[#110f1f] p-6 sm:p-7">
                <div className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight tabular-nums text-white">{f.k}</div>
                <p className="mt-3 text-sm leading-relaxed">{f.v}</p>
                <p className="mt-3 text-xs text-[var(--color-muted)]">{f.s}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <Reveal className="mt-16">
        <section className="card relative overflow-hidden p-6 pl-7 sm:p-8 sm:pl-10">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-amber-200/60" />
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-amber-200">An honest note</h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[var(--color-muted)]">
            Nobody can test your personality at birth. Newborns don&apos;t have the Big Five yet. What they do have is <em>temperament</em>: early,
            partly genetic tendencies in activity, mood, fearfulness and attention, which grow into adult traits only loosely. Personalityverse
            estimates that temperament from what you know about your early years, then models the rest with published effect sizes. Treat the
            numbers as an informed forecast, not a verdict.
          </p>
        </section>
      </Reveal>

      <Census />

      <section className="mt-20 text-center md:mt-28">
        <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.1] sm:text-5xl">
          Ready to meet <span className="accent-serif gradient-text">every version</span> of you?
        </h2>
        <div className="mt-8 flex justify-center">
          <Link href="/quiz" className="btn btn-primary group !px-6 !py-3.5 !text-base">
            Take the test
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
        <p className="mt-4 text-[13px] text-[var(--color-muted)]">About 4 minutes. No sign-up.</p>
      </section>
    </div>
  );
}
