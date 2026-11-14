import Link from "next/link";
import { Radar } from "@/components/Radar";
import { Census } from "@/components/Census";
import { Reveal } from "@/components/Motion";
import { PortalScene } from "@/components/PortalScene";

const demo = {
  baby: { O: 62, C: 35, E: 22, A: 55, N: 78 },
  now: { O: 74, C: 58, E: 48, A: 60, N: 52 },
  future: { O: 70, C: 72, E: 55, A: 66, N: 34 },
};

function Heading({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <Reveal className="mb-8 max-w-2xl">
      <p className="kicker">
        <span aria-hidden="true" className="h-px w-6 bg-violet-300/60" />
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
      <PortalScene />
      <section className="flex min-h-[calc(100svh-4rem)] flex-col pt-10 text-[#16122b] sm:justify-center sm:pb-24 sm:pt-0">
        <p className="rise font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-[#3d3857]" style={{ "--i": 0 } as React.CSSProperties}>
          Universe 01 of 08
        </p>
        <h1 className="hero-display rise mt-5 max-w-[11ch] text-[2.5rem] sm:text-[4.4rem]" style={{ "--i": 1 } as React.CSSProperties}>
          Meet the other you.
        </h1>
        <p className="rise mt-6 max-w-[26rem] text-[17px] leading-[1.65] text-[#2c2745] sm:text-lg" style={{ "--i": 2 } as React.CSSProperties}>
          Same baby. Different world. See who you would have become, and who you still could.
        </p>
        <div className="rise mt-8 flex flex-wrap items-center gap-x-4 gap-y-3" style={{ "--i": 3 } as React.CSSProperties}>
          <Link href="/quiz" className="btn group !rounded-full !bg-[#16122b] !px-6 !py-3.5 !text-base !text-white">
            Find my other selves
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
          <Link href="/science" className="text-[15px] font-medium text-[#16122b] underline decoration-[#16122b]/40 underline-offset-4">
            How it works
          </Link>
        </div>
        <p className="rise mt-5 font-mono text-[12px] tabular-nums text-[#3d3857]" style={{ "--i": 4 } as React.CSSProperties}>
          4 min · no sign-up · anonymous
        </p>
      </section>

      <section className="flex min-h-[70svh] flex-col justify-center text-[#16122b]">
        <h2 className="hero-display max-w-[12ch] text-[2.1rem] sm:text-[3.4rem]">Every choice bends the string.</h2>
      </section>

      <section className="flex min-h-[100svh] flex-col justify-center pb-16">
        <p className="kicker">The multiverse</p>
        <h2 className="hero-display mt-5 max-w-[10ch] text-[2.3rem] text-[#f4f3fb] sm:text-[3.8rem]">Eight worlds. One you.</h2>
        <p className="mt-6 max-w-[24rem] text-[17px] leading-[1.65] text-[var(--color-muted)]">
          Two portals close into one cube. Each face is a life you could have lived: a warmer home, a harder start, years abroad. We work out who you would be in every one.
        </p>
        <div className="mt-8">
          <Link href="/quiz" className="btn btn-primary group !px-6 !py-3.5 !text-base">
            Map my personalityverse
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      <section className="grid items-center gap-10 md:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="kicker">What you get</p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.1] sm:text-4xl">Baby you, you now and every you after.</h2>
          <p className="mt-4 max-w-md text-[var(--color-muted)]">
            Your temperament at birth, how far your upbringing moved it, and the odds each part of you changes again. Then a plan for the version you pick.
          </p>
        </div>
        <Reveal>
          <div className="card relative p-5 sm:p-6">
            <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
              <span className="font-medium text-white">A sample personalityverse</span>
              <span className="font-mono tabular-nums">O · C · E · A · N</span>
            </div>
            <Radar
              series={[
                { label: "Baby you", color: "#f472b6", values: demo.baby, dashed: true },
                { label: "You now", color: "#a78bfa", values: demo.now },
                { label: "You at 35", color: "#38bdf8", values: demo.future, dashed: true },
              ]}
            />
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs">
              {[
                { c: "#f472b6", l: "Baby you" },
                { c: "#a78bfa", l: "You now" },
                { c: "#38bdf8", l: "You at 35" },
              ].map((x) => (
                <span key={x.l} className="chip">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: x.c }} />
                  {x.l}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
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
                  <span className="font-mono text-xs tabular-nums text-violet-300">{s.n}</span>
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
