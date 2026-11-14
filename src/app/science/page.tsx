import Link from "next/link";
import { MBTI_DIM_MODEL, MBTI_RETEST, MBTI_SOURCES, MBTI_GROWTH_CAVEAT } from "@/lib/mbti";
import { AccuracyFull } from "@/components/Accuracy";
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
  <h2 className="mt-16 border-t border-white/[.07] pt-10 font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-[1.75rem]">{children}</h2>
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
      <p className="kicker">Methodology</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] sm:text-5xl">The science behind Personalityverse</h1>
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

      <div id="accuracy" className="scroll-mt-24">
        <H>How accurate is the test?</H>
        <P>
          The 50-question test is scored against 19,631 real responses from an open, public-domain dataset (the openpsychometrics.org IPIP Big Five
          Factor Markers release). We set 5,890 of those people aside before building anything, and only used them to check the result. For each
          person we took half of their answers for a trait, predicted whether the other half would land above or below the middle, and compared the
          prediction with what they actually answered.
        </P>
        <AccuracyFull />
        <P>
          The same probability maths drives the letters on your results page and the bands in the tracker, so these numbers describe the confidence
          figures you see there. They measure how consistent and well-calibrated the test is. They cannot tell you whether a questionnaire captures
          everything about a person, and no test can.
        </P>
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

      <H>1b · Working backwards from you now</H>
      <P>
        Nobody remembers being a baby, and retold stories are a memory of someone else&apos;s memory. So the default route runs the model in reverse. We
        treat your baby temperament as unknown and ask what it most likely was, given three kinds of clue, each with the strength it has in the research:
      </P>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--color-muted)]">
        <li>
          <b className="text-white">You now</b>, after removing the small upbringing effects. Temperament and adult traits correlate at about r = .25, so this
          clue is real but weak.
        </li>
        <li>
          <b className="text-white">Your parents&apos; personalities.</b> Each parent passes on about half their genes, so a parent&apos;s trait and their
          child&apos;s correlate at roughly h²/2, about .19 to .23 here (Vukasović &amp; Bratko, 2015). Infant temperament is itself moderately heritable
          (Saudino, 2005). Your rating of a parent is a good but imperfect reading of them: family members are among the most accurate observers (Connelly
          &amp; Ones, 2010). We weight it at .6, .5 or .35 depending on how sure you are (est.).
        </li>
        <li>
          <b className="text-white">Stories of baby you</b>, if you add them, weighted at .5, .4 or .25 by how sure you are (est.).
        </li>
      </ul>
      <P>
        All of these are treated as jointly normal readings of the same hidden quantity, including the fact that a parent&apos;s genes reach adult you
        directly as well as through your temperament. Standard Gaussian conditioning then gives a most-likely value and an 80% range per trait. In
        simulation those ranges contain the true value 80% of the time (an automated test checks this). To turn trait odds into Thomas &amp; Chess type
        odds, we define the types in trait space with cut-offs that reproduce their base rates (10% spirited, 15% slow-to-warm-up, 40% easy, 35% mixed)
        when nothing is known, then sample from your posterior.
      </P>
      <P>
        Expect wide ranges. With only you now to go on, the range for each trait covers most of the scale, and the type odds move only modestly away from
        the base rates. That is the finding, not a bug: the research says who you are now tells us surprisingly little about who you were at one.
      </P>

      <H>2 · Nature meets nurture</H>
      <P>
        Twin studies attribute roughly 40% of personality differences to genes (Vukasović &amp; Bratko, 2015; per-trait values from Jang et al., 1996). The
        surprise is the <em>shared</em> family environment: close to zero. Siblings raised together aren&apos;t much more alike than siblings raised apart. Most
        of the non-genetic variance comes from experiences unique to each person.
      </P>
      <div className="card mt-4 overflow-x-auto p-4" tabIndex={0} role="region" aria-label="Table 1, scrolls sideways">
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
      <div className="card mt-4 overflow-x-auto p-4" tabIndex={0} role="region" aria-label="Table 2, scrolls sideways">
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
      <div className="card mt-2 overflow-x-auto p-4" tabIndex={0} role="region" aria-label="Table 3, scrolls sideways">
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
      <div className="card mt-2 overflow-x-auto p-4" tabIndex={0} role="region" aria-label="Table 4, scrolls sideways">
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


      <H>5 · The MBTI layer, and why it&apos;s a bonus</H>
      <P>
        You don&apos;t take the Myers-Briggs Type Indicator here. We estimate the chance of each letter from your Big Five scores, using the correlations
        McCrae and Costa (1989) published between the two (Extraversion drives E/I, Openness drives S/N, Agreeableness drives T/F, Conscientiousness drives
        J/P). We shrink their weights for the TIPI&apos;s lower reliability (Gosling et al., 2003), which is our modelling choice, and set the cut points so
        the letters split as they do in the UK general population (OPP, 2011; n = 1,634). Your lean to each letter is Φ((weighted Big Five − cut) / residual
        SD). The cut is scaled to how widely the Big Five estimate spreads (cut × √explained), so each type is handed out about as often as it occurs in
        the UK. With the raw cut, almost everyone near the middle got the majority letter: on 15,700 real people only 0.5% came out INTP against 2.4% in
        the UK, and 14% intuitive against 23.5%.
      </P>
      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10" tabIndex={0} role="region" aria-label="MBTI mapping">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-[var(--color-muted)]">
            <tr>
              <th className="p-2">Scale</th>
              <th className="p-2">Weights on Big Five z (towards second letter)</th>
              <th className="p-2">Big Five explain</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(MBTI_DIM_MODEL).map(([k, m]) => (
              <tr key={k} className="border-t border-white/5">
                <td className="p-2 font-semibold">
                  {m.first}/{m.second}
                </td>
                <td className="p-2">
                  {Object.entries(m.w)
                    .map(([t, w]) => `${w > 0 ? "+" : "−"}${Math.abs(w as number).toFixed(2)} ${t}`)
                    .join("  ")}
                </td>
                <td className="p-2">{Math.round(m.r2 * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>
        Why it&apos;s only a bonus: MBTI scores form one hump, not two clumps, so splitting them into types puts similar people on opposite sides (Bess
        &amp; Harvey, 2002). In the publisher&apos;s own UK retest data only {MBTI_RETEST.same_4_letters}% kept all four letters within{" "}
        {MBTI_RETEST.interval} (Schaubhut et al., 2018), and critics report worse (Pittenger, 2005). There is no scale for emotional stability, T/F is the
        least reliable scale (Capraro &amp; Capraro, 2002), and the theory of a fixed &ldquo;true type&rdquo; doesn&apos;t fit the data (Stein &amp; Swan,
        2019). We found no study linking upbringing or life events to MBTI change, so any change you see in your letters comes from the Big Five forecast:
        maturation mostly pushes people towards J, a little towards E.
      </P>
      <P>
        Celebrity types are popular guesses, not test results. Only one person on our list, Ray Dalio, has said his type in public (ENTP, on X in 2018).
        The rest come from crowd votes on the Personality Database, read from an open snapshot of the site, and typing sites that mirror it. We show whether each typing is self-reported, a strong consensus or disputed.
        Growth tips for each type run through the Big Five traits behind its letters, using the volitional change research in section 4.{" "}
        {MBTI_GROWTH_CAVEAT}
      </P>
      <ol className="mt-3 space-y-1.5 break-words text-xs text-[var(--color-muted)] [overflow-wrap:anywhere]">
        {["MC1989", "G2003", "OPP2011", "UK2018", "BeH2002", "P2005", "CC2002", "SS2019", "RIC2017", "PDB_SNAPSHOT", "DALIO_X"].map((k) => (
          <li key={k}>{MBTI_SOURCES[k]}</li>
        ))}
      </ol>

      <H>5b · Tracking yourself over time</H>
      <P>
        Your first result is the baseline. For any later date the tracker uses the same stability, maturation and life-event logic as the forecast to get
        an expected score and the spread of true change. A retest also wobbles because the TIPI is only ten items: its six-week test–retest reliability
        averages .72 (Gosling et al., 2003). Both your first answers and your check-in carry that error, so the band adds 2 × (1 − .72) to the variance of
        true change. A check-in outside the 80% band is flagged as higher or lower than forecast. From three points we fit a straight line and show its 95%
        interval, and say &ldquo;not clear yet&rdquo; when that interval includes zero. With weeks between check-ins, most of what you see is test noise, and the
        page says so.
      </P>
      <P>
        Check-ins are five numbers and a timestamp under your result&apos;s random link. On Tiger Data they sit in a TimescaleDB hypertable partitioned by
        month, a retention policy deletes them after three years, and the weekly pulse is a time_bucket() query.
      </P>

      <H>6 · Does the model reproduce the literature?</H>
      <P>
        These checks run as automated tests. Left: what the published studies report. Right: what our model produces when you ask it the same
        question. For stability we follow the newer, larger meta-analysis (Bleidorn et al., 2022), which finds traits a little more stable than the
        2000 review did.
      </P>
      <div className="card mt-4 overflow-x-auto p-4" tabIndex={0} role="region" aria-label="Table 5, scrolls sideways">
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
              <span className="mr-2 font-mono text-[11px] text-accent-300">{k}</span>
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
