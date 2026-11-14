# PersonalityVerse: research brief

*The science behind the model. Compiled 14 Nov 2026 for DurHack. Machine-readable values are in `model_params.json`. Source IDs in [brackets] match its `sources` key.*

## 0. Scope

- **Personality can't be measured at birth.** What we can measure is infant **temperament**: activity, fearfulness, irritability, soothability, and from about age 2–3, attention control. It **weakly** predicts adult Big Five traits (r ≈ .1–.3).
- Our model has three steps:
  1. **Parent-recalled temperament → baseline adult profile.** This step carries very wide uncertainty.
  2. **Life factors → modifiers.**
  3. **Normative age change + stability → probability of a ≥0.5 SD shift by the target age.**
- Every output is a population-level probability. It is not a diagnosis and not a prediction for one individual.

## 1. Heritability

| Trait | h² (Jang et al. 1996 twins) | Recommended h² (shrunk to the meta-analytic mean) |
|---|---|---|
| Neuroticism | .41 | .40 |
| Extraversion | .53 | .45 |
| Openness | .61 | .45 |
| Agreeableness | .41 | .38 |
| Conscientiousness | .44 | .40 |

- **Meta-analysis [VB2015]:** h² ≈ **.40** overall from 62 samples and more than 100k people. The figure is .47 in twin studies and .22 in family/adoption studies. Personality model and sex did not moderate it, and it was robust to publication bias.
- **Shared environment** (what siblings share, including much of parenting style) is about **0** for adult traits [JLV1996; BTD2014]. The other ~55–60% of variance is non-shared environment plus measurement error.
- **Heritability by age [BTD2014]:** about .70 in infancy, .59 at 15, .47 at 30, and about .40 in adulthood. Traits become more stable with age **mainly for environmental reasons**, not genetic ones.
- *How solid:* the overall .40 is strong. Per-trait values come from one twin study (250 pairs), so they are noisy.

## 2. Rank-order stability

- **Roberts & DelVecchio 2000 [RD2000]:** 152 studies. Retest r over about 6.7 years is **.31 in childhood, .54 at college age, .64 at age 30 and .74 at ages 50–70**.
- **Bleidorn et al. 2022 [BL2022]:** k = 189 samples, N = 178k. This update finds that stability rises steeply to about age 25 (r ≈ .74) and then **barely increases** (+.035 from 25 to 60).
  - Exponential fit: r ≈ .09 at age 5, .57 at 15, .74 at 25, .82 at 50, with an asymptote of .83.
  - Effect of the retest interval: r drops by .036 at 1 year, .145 at 5 years and .225 at 10 years. The maximum drop is about .32.
- **Our function (estimate):** `r(age, lag) = .826 − 1.248·e^(−.105·age) − .320·(1 − e^(−.119·lag)) + .082`, clamped to [.05, .85].
  - It reproduces RD2000 for adults (age 20 → .58, age 50 → .73 over 6.7 years).
  - Example values over 10 years: age 10 → .25, age 20 → .53, age 30 → .63, age 50 → .68.
- **50-year check [D2019]:** from age 16 to 66, r = .23 raw and .31 after error correction (N = 1,795).

## 3. Mean-level (normative) change

The meta-analysis is Roberts, Walton & Viechtbauer 2006 [RWV2006]: 92 samples. People become more **dominant, conscientious and emotionally stable**, mostly between ages 20 and 40 (the "maturity principle"). Social vitality and openness rise in adolescence and fall in old age. Agreeableness rises mainly later in life. Several traits change by about 1 SD in total [RM2008].

**Approximate cumulative change from age 10 to 70+ (d):**

| Trait | d |
|---|---|
| Social dominance | +1.0 |
| Emotional stability | +1.0 (so N about −1.0) |
| Conscientiousness | +0.95 |
| Agreeableness | +0.5 |
| Openness | +0.1 (up, then down) |
| Social vitality | −0.2 |

- Bleidorn 2022 broadly agrees. Emotional stability rises about **1.5 SD** from birth to 80. Conscientiousness rises about 1 SD and then partly reverses after 70. Openness falls by about 0.5 SD across adulthood. Extraversion changes little and then declines slowly.
- *Caveat:* we couldn't retrieve RWV's Table 3 during the hackathon. Per-decade values in the JSON are reconstructed to fit the published pattern and totals (`estimate: true`). The direction and timing are well established.

## 4. Can you change on purpose? Interventions

**Roberts et al. 2017 [R2017]** reviewed 207 studies with 20k participants, mostly therapy.

- Mean pre–post change was **d = .37**. Against controls it was d = .43. The most conservative bias-corrected estimate is .21.
- The typical intervention lasted **24 weeks on average (median 13)**.

| Trait | Pre–post d | d vs control |
|---|---|---|
| Emotional stability | **.57** | .69 (the only effect robust to bias correction) |
| Extraversion | .23 | .38 |
| Conscientiousness | .19 | .06 |
| Agreeableness | .15 | .23 |
| Openness | .13 | .36 |

- Gains **persisted**: d = .37 at one year or more, and .76 for emotional stability.
- The type of therapy mattered little (CBT .46, supportive .49, drugs .31). Clinical and non-clinical samples were similar (.38 vs .33).

**PEACH app RCT [S2021]:** N = 1,523, 3 months of smartphone and chatbot coaching.

- Self-reported change in the desired direction was **d = .52** for traits people wanted to increase and **−.58** for traits they wanted to decrease.
- Friends and partners also noticed increases (d = .35). Their ratings of decreases (−.22) were not significant.
- Changes held at the 3-month follow-up.

**Volitional change [HF2015; H2019]:**

- Simply *wanting* to change predicts modest change over 15–16 weeks.
- Concrete if-then plans help. Vague plans don't.
- In H2019, **completing** weekly trait-relevant challenges predicted change. Accepting challenges and then failing them predicted change in the *opposite* direction.

**Defaults for app guidance (estimate) over about 12 weeks:** N −.40, E +.30, C +.30, A +.25, O +.20.

## 5. Infant and child temperament → adult traits

- **Rothbart's three factors [RAE2000; ST2015]:**
  - Surgency/Extraversion → **E**
  - Negative Affectivity → **N**
  - Effortful Control → **C** (and A)
  - Affiliativeness → **A**
  - Orienting/perceptual sensitivity → **O**
  - These map well onto traits measured at the same age. Prediction from infancy to adulthood is weak, so we cap weights at about .25 and multiply by 0.7 for retrospective parent recall. Residual SD is about 0.97, so the app must show wide bands.
- **Thomas & Chess (NYLS) [TC1977]:**
  - Nine dimensions: activity, rhythmicity, approach/withdrawal, adaptability, intensity, threshold, mood, distractibility and persistence.
  - Types: **easy ~40%, difficult ~10%, slow-to-warm-up ~15%, mixed ~35%**.
- **Dunedin [C2003]:** N = 1,037, with 96% followed up at age 26. Behavioural style at age 3 predicted age-26 personality. Values are z-scores:
  - Undercontrolled (10%): informant-rated N +.30, A −.34, C −.35.
  - Inhibited (8%): E −.23, harm avoidance +.42.
  - Confident (28%): E +.13.
  - Reserved (15%): O −.18.
  - Well-adjusted (40%): close to average.
  - These are small to moderate effects after 23 years.
- **Kagan's behavioural inhibition [KS1991; CT2009]:**
  - About 15–20% of young children are inhibited.
  - Stability over 1–6 years is r = .24–.64, highest in extreme groups.
  - Only 18% stayed inhibited at every assessment from age 1 to 7.
  - Stable early inhibition gave about 3.8× the odds of lifetime social anxiety in adolescence (40% vs 15%).

## 6. Life factors

Effects are in SD units. "Est." means an estimate (see the JSON for reasoning). Many links are partly **genetic or selection** effects, because traits also shape which events happen to people.

| Factor | Effect | Evidence |
|---|---|---|
| Childhood trauma / ACEs | N **+.46** (g); small −C, −A, −E (est.) | Meta-analysis, 136 studies, N = 526k [R2026]; mostly retrospective |
| Harsh / warm parenting | N ±.10–.15, A/C ±.10 (est.) | Small, because shared environment is about 0 [BTD2014] |
| Low childhood SES | O −.10, small elsewhere (est.) | Parental SES r ≲ .10 with traits [A2018] |
| University | A, C, ES up about .1–.15 beyond normative change (est.) | [L2011; BU2024] |
| First job | C +.15, N −.10 (est.) | Social investment: earlier adult roles go with faster maturation in 62 nations [B2013]; work events have the largest, most consistent effects [BU2024] |
| First partnership | N −.20, E +.15 (est. from η² ≈ .05) | Lower neuroticism and shyness vs stable singles [NA2001; NL2007] |
| Marriage / divorce | ±.05–.10 (est.) | Small [BU2024] |
| Parenthood | about 0 | Null result against social investment theory [VS2016] |
| Unemployment (1–4 years) | C −.20, A −.10, O −.10 (est.) | German SOEP, N = 6,769; effects differ by sex; quick re-employment limits them [BO2015] |
| Therapy | See section 4 (N −.57) | [R2017] |
| Adult adversity | N +.15 (est.); the effect runs both ways | [J2014] |

Bühler et al. 2024 [BU2024] meta-analysed life events. Overall effects were **small**, and the largest came from graduation, first job, a new relationship, marriage and divorce.

## 7. What counts as "meaningful", and how often it happens

- **Threshold: 0.5 SD.** This is the half-SD minimal important difference [NSW2003], and it's about one decade of young-adult conscientiousness growth.
- For a strict individual-level test, use the Reliable Change Index [JT1991]: 1.96·√(2(1−rel)), which is about 1.1 SD at reliability .85.
- **Observed:** over 50 years, 21–61% of people showed reliable change, depending on the trait (mean about 40%) [D2019].
- **Our probability model (estimate):**
  - Treat change as Δ ~ N(μ, 2(1−ρ)), where ρ is the disattenuated stability (r/.85).
  - μ is normative change plus factor effects plus any intervention.
  - P(shift ≥ .5 SD) = 1 − Φ((.5 − μ)/σ).
  - Example: conscientiousness from 30 to 40 gives about 34% up and 17% down. From 20 to 30 it gives about 43% up.
  - Over a decade, about 40–50% of adults are predicted to shift ≥0.5 SD in true score in either direction. This is likely an upper bound, because a strict RCI would give about a third of that.

## 8. Celebrity comparisons

`celebrities` holds 42 figures from tech, finance, music, sport and film, each with a 0–100 OCEAN vector and a one-line reason. **These are popular typings, not clinical assessments.** They are light-hearted and based on public persona and fan-site types, and they are meant only for "you're most like…" fun.

## 9. Caveats for the Science page

1. Parents' memories of temperament are biased, and infant temperament → adult r is only about .1–.3. Baseline estimates are rough.
2. Most effects are **population averages** with large individual variation.
3. Life-event effects are mostly correlational, and causal direction is often two-way.
4. Most change evidence comes from WEIRD samples and self-reports. Observer-rated effects are smaller (e.g. PEACH .35 vs .52).
5. Values marked as estimates in the JSON are our reasoned reconstructions and should be checked before publication. This applies especially to the RWV per-decade table.
