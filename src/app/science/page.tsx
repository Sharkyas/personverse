import Link from "next/link";
import { forecast, maturation, stabilityOver } from "@/lib/model";
import { HERITABILITY, MEASURE_RELIABILITY, LIFE_EVENTS, SOURCES, TRAITS, TRAIT_META, UPBRINGING, MATURATION, type LifeEvent, type Upbringing } from "@/lib/params";

function validation() {
  const z0 = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const obs = (age: number) => (stabilityOver(age, 6.7) * MEASURE_RELIABILITY).toFixed(2);
  const m = maturation(20, 70);
  const decade = forecast(z0, 20, 30, []);
  const avgShift = Math.round((decade.reduce((s, f) => s + f.pChange, 0) / 5) * 100);
  const ther = forecast(z0, 30, 33, ["therapy"]).find((f) => f.trait === "N")!;
  const base = forecast(z0, 30, 33, []).find((f) => f.trait === "N")!;
  return [
    { check: "Rank-order stability at ~20 (6.7-year retest)", published: ".54 (older meta-analysis) · ≈ .65 (newer)", ours: `r = ${obs(20)}`, src: "Roberts & DelVecchio 2000; Bleidorn et al. 2022" },
    { check: "Rank-order stability at ~30", published: ".64 · ≈ .75", ours: `r = ${obs(30)}`, src: "Roberts & DelVecchio 2000; Bleidorn et al. 2022" },
    { check: "Rank-order stability at 50–70", published: ".74 · ≈ .82", ours: `r = ${obs(60)}`, src: "Roberts & DelVecchio 2000; Bleidorn et al. 2022" },
    { check: "Conscientiousness change, age 20→70", published: "≈ +0.8 to +1.0 SD", ours: `${m.C > 0 ? "+" : ""}${m.C.toFixed(2)} SD`, src: "Roberts et al. 2006" },
    { check: "Neuroticism change, age 20→70", published: "≈ −0.8 to −1.0 SD", ours: `${m.N.toFixed(2)} SD`, src: "Roberts et al. 2006" },
    { check: "Therapy effect on neuroticism", published: "d = −.57", ours: `d = ${(ther.expected - base.expected).toFixed(2)}`, src: "Roberts et al. 2017" },
    { check: "People showing big change over decades", published: "21–61% by trait over 50 years", ours: `${avgShift}% per trait over one decade (age 20→30)`, src: "Damian et al. 2019" },
    { check: "Birth order effect", published: "none", ours: "0.00 SD", src: "Rohrer et al. 2015" },
  ];
}

export const metadata = { title: "The science · Personalityverse" };

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-14 font-[family-name:var(--font-display)] text-2xl font-bold">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 leading-relaxed text-[var(--color-muted)]">{children}</p>;
const fmt = (x: number) => (x > 0 ? "+" : "") + x.toFixed(2);

export default function Science() {
  const decade = (from: number, to: number) => {
    const out: Record<string, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    for (const b of MATURATION) {
      const lo = Math.max(from, b.from), hi = Math.min(to, b.to);
      if (hi > lo) for (const t of TRAITS) out[t] += b.d[t] * (hi - lo);
    }
    return out;
  };
  return (
    <article className="mx-auto max-w-3xl pt-12">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-300">Methodology</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">The science behind Personalityverse</h1>
      <P>
        Personalityverse chains together three well-studied questions. How much of adult personality is visible in early temperament? How do family and
        life events shift it? And how likely is a trait to keep changing from where you are today? Every number below comes from a published study or
        meta-analysis. Where the literature gives a direction but no clean effect size, we say so and mark the value as our estimate.
      </P>

      <div className="card mt-8 border-amber-300/20 p-5 text-sm">
        <b className="text-amber-200">What we can&apos;t do.</b>{" "}
        <span className="text-[var(--color-muted)]">
          Personality can&apos;t be measured at birth. Newborns show temperament (activity, distress, fear, attention), not Big Five traits. Our &ldquo;baby
          you&rdquo; profile is built from retrospective reports, which add error, so we shrink its predictive weight further when you tell us you&apos;re guessing.
          Outputs are population-level probabilities, not diagnoses.
        </span>
      </div>

      <H>1 · Baby you: temperament</H>
      <P>
        Twelve items cover Rothbart&apos;s three broad temperament factors (surgency, negative affectivity, effortful control) plus affiliation and
        perceptual sensitivity, and map onto Thomas &amp; Chess&apos;s nine dimensions from the New York Longitudinal Study. Each item loads onto the Big Five
        domains it grows into (surgency → extraversion, negative affectivity → neuroticism, effortful control → conscientiousness). We also classify you as
        easy (≈40% of babies), difficult/spirited (≈10%), slow-to-warm-up (≈15%) or mixed (≈35%).
      </P>
      <P>
        How much survives? In the Dunedin study, behavioural styles observed at age 3 predicted personality at 26, but modestly (Caspi et al., 2003).
        Bleidorn et al. (2022) put rank-order stability from early childhood across 20+ years at about .1–.3. We use r = .25 between your temperament
        estimate and adult trait, reduced to as little as .14 if you&apos;re guessing.
      </P>

      <H>2 · Nature meets nurture</H>
      <P>
        Twin studies attribute roughly 40% of personality differences to genes (Vukasović &amp; Bratko, 2015; per-trait values from Jang et al., 1996). The
        surprise is the <em>shared</em> family environment: close to zero. Siblings raised together aren&apos;t much more alike than siblings raised apart. Most
        of the non-genetic variance comes from experiences unique to each person.
      </P>
      <div className="card mt-4 overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-[var(--color-muted)]">
            <tr><th className="p-2">Trait</th><th className="p-2">Genes (h²)</th><th className="p-2">Shared family</th><th className="p-2">Unique experience</th></tr>
          </thead>
          <tbody>
            {TRAITS.map((t) => (
              <tr key={t} className="border-t border-white/5">
                <td className="p-2" style={{ color: TRAIT_META[t].color }}>{TRAIT_META[t].name}</td>
                <td className="p-2">{Math.round(HERITABILITY[t].h2 * 100)}%</td>
                <td className="p-2">≈{Math.round(HERITABILITY[t].c2 * 100)}%</td>
                <td className="p-2">{Math.round((1 - HERITABILITY[t].h2 - HERITABILITY[t].c2) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>Upbringing factors shift the temperament-based prediction by these amounts (SD per standard deviation of the factor). Because they overlap (harsh homes are often less warm and less stable), their combined shift is capped at ±0.6 SD per trait.</P>
      <div className="card mt-4 overflow-x-auto p-4">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs text-[var(--color-muted)]">
            <tr><th className="p-2">Factor</th>{TRAITS.map((t) => <th key={t} className="p-2">{t}</th>)}<th className="p-2">Source</th></tr>
          </thead>
          <tbody>
            {(Object.keys(UPBRINGING) as Upbringing[]).map((k) => (
              <tr key={k} className="border-t border-white/5">
                <td className="p-2">{UPBRINGING[k].label}{UPBRINGING[k].estimate && <sup className="text-amber-300"> est.</sup>}</td>
                {TRAITS.map((t) => <td key={t} className="p-2">{fmt(UPBRINGING[k].d[t])}</td>)}
                <td className="p-2 text-xs text-[var(--color-muted)]">{k === "birthOrder" ? "Rohrer et al. 2015 (null)" : UPBRINGING[k].src}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H>3 · Your future selves</H>
      <P>
        From your current profile (the Ten-Item Personality Inventory; Gosling et al., 2003) we forecast each trait at your chosen age. The expected change
        has three parts: regression toward the average implied by rank-order stability, normative maturation (most people become more conscientious,
        agreeable and emotionally stable between 20 and 60), and the life events you pick.
      </P>
      <div className="card mt-4 p-4 font-mono text-[13px] leading-relaxed">
        r<sub>6.7y</sub>(age) = r<sub>Bleidorn</sub>(age) ÷ .88 (measurement error); shorter lags: r = 1 − (1 − r<sub>6.7y</sub>)·√(lag/6.7); longer lags: −.011 per extra year ÷ .88
        <br />E[Δ] = (r − 1)·z<sub>now</sub> + maturation(age → target) + Σ life-event effects
        <br />SD[Δ] = √(1 − r²)
        <br />P(big shift) = P(|Δ| ≥ 0.5 SD), with Δ ~ Normal(E[Δ], SD[Δ]²)
      </div>
      <P>
        Half a standard deviation is a standard benchmark for a minimal important difference (Norman et al., 2003). Over a decade, it&apos;s roughly the
        normative change in conscientiousness during young adulthood. For context, a 50-year follow-up found 21–61% of people showed statistically reliable
        change depending on the trait (Damian et al., 2019).
      </P>
      <p className="mt-6 text-sm font-semibold">Normative maturation (cumulative d), from Roberts, Walton &amp; Viechtbauer (2006)</p>
      <div className="card mt-2 overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-[var(--color-muted)]">
            <tr><th className="p-2">Age span</th>{TRAITS.map((t) => <th key={t} className="p-2">{TRAIT_META[t].short}</th>)}</tr>
          </thead>
          <tbody>
            {[[18, 30], [30, 50], [50, 70]].map(([a, b]) => {
              const d = decade(a, b);
              return (
                <tr key={a} className="border-t border-white/5">
                  <td className="p-2">{a}–{b}</td>
                  {TRAITS.map((t) => <td key={t} className="p-2">{fmt(d[t])}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm font-semibold">Life events (SD change over the event window)</p>
      <div className="card mt-2 overflow-x-auto p-4">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs text-[var(--color-muted)]">
            <tr><th className="p-2">Event</th>{TRAITS.map((t) => <th key={t} className="p-2">{t}</th>)}<th className="p-2">Source</th></tr>
          </thead>
          <tbody>
            {(Object.keys(LIFE_EVENTS) as LifeEvent[]).map((k) => (
              <tr key={k} className="border-t border-white/5">
                <td className="p-2">{LIFE_EVENTS[k].label}{LIFE_EVENTS[k].estimate && <sup className="text-amber-300"> est.</sup>}</td>
                {TRAITS.map((t) => <td key={t} className="p-2">{fmt(LIFE_EVENTS[k].d[t])}</td>)}
                <td className="p-2 text-xs text-[var(--color-muted)]">{LIFE_EVENTS[k].src}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H>4 · Choosing who you become</H>
      <P>
        Personality can be changed on purpose. Across 207 intervention studies, traits shifted by d = .37 on average over about 24 weeks, and the gains held a
        year later. Emotional stability moved most (d = .57) (Roberts et al., 2017). In a randomised trial of a smartphone coaching app with 1,523 adults,
        people moved their chosen trait by about half an SD in self-report and .35 SD as rated by friends and partners, and it lasted (Stieger et al.,
        2021). Volitional change works best with concrete weekly challenges and if–then plans. Signing up and not following through can backfire (Hudson
        &amp; Fraley, 2015; Hudson et al., 2019). The coach builds plans on exactly this model.
      </P>


      <H>6 · Does the model reproduce the literature?</H>
      <P>
        These checks run as automated tests. Left: what the published studies report. Right: what our model produces when you ask it the same
        question. For stability we follow the newer, larger meta-analysis (Bleidorn et al., 2022), which finds traits a little more stable than the
        2000 review did.
      </P>
      <div className="card mt-4 overflow-x-auto p-4">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs text-[var(--color-muted)]">
            <tr><th className="p-2">Check</th><th className="p-2">Published</th><th className="p-2">Our model</th><th className="p-2">Source</th></tr>
          </thead>
          <tbody>
            {validation().map((v) => (
              <tr key={v.check} className="border-t border-white/5">
                <td className="p-2">{v.check}</td>
                <td className="p-2">{v.published}</td>
                <td className="p-2 text-emerald-300">{v.ours}</td>
                <td className="p-2 text-xs text-[var(--color-muted)]">{v.src}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H>7 · Known limitations</H>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--color-muted)]">
        <li>Retrospective infancy reports are noisy, and the temperament-to-trait weights are our estimates within published ranges.</li>
        <li>Most life-event effect sizes are estimates. The direction is sourced, but the exact size often isn&apos;t reported. They&apos;re flagged &ldquo;est.&rdquo; above.</li>
        <li>Life events partly reflect personality (selection effects), so treat their effects as predictive, not purely causal.</li>
        <li>The normal-distribution change model probably overstates individual change somewhat compared with strict reliable-change tests.</li>
        <li>The TIPI is a 10-item measure: quick, but less precise than a full inventory.</li>
        <li>Celebrity profiles are popular typings for fun, not assessments.</li>
      </ul>

      <H>Sources</H>
      <ol className="mt-4 space-y-2 text-sm text-[var(--color-muted)]">
        {Object.entries(SOURCES)
          .filter(([k]) => k !== "POP")
          .sort((a, b) => a[1].localeCompare(b[1]))
          .map(([k, v]) => (
            <li key={k}>
              <span className="mr-2 font-mono text-[11px] text-violet-300">{k}</span>
              {v}
            </li>
          ))}
      </ol>
      <div className="mt-12">
        <Link href="/quiz" className="btn btn-primary">Take the test</Link>
      </div>
    </article>
  );
}
