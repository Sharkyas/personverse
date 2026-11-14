# Item bank, scoring upgrades and the metrics suite

Everything described here lives in new files (`src/lib/bank/`, `scripts/metrics/`, `scripts/bank/`). Nothing in `questions.ts`, `model.ts` or `mbti.ts` is changed, and each piece returns the shapes the existing code already takes. Numbers below are from `src/lib/bank/metrics.json`, produced by the scripts in `scripts/metrics/`.

## Why types were flipping

The four letters were worked out from Big Five scores alone. The Big Five explain between 18% (T/F) and 42% (E/I) of each letter, so the rest is a coin weighted by the population base rate. In a simulation of 40,000 people with a known type, the Big Five alone get each letter right 73% of the time and the exact four-letter type right 28% of the time. Someone who is INTP on a dedicated type test will usually be shown something else, and the letter that changes is whichever sits closest to its line.

Two things fix this, and both are in this branch.

1. Measure the letters directly. With 12 direct statements per letter the simulated accuracy rises to 90% per letter and 65% for the exact type, and the true type is one of the top two 86% of the time.
2. Stop presenting a close call as a verdict. Every letter now has a probability, a band (clear, likely, borderline) and a stated chance of repeating on another sitting. A borderline letter is shown as open ("IN_P: T or F is too close to call") instead of flipping from one sitting to the next.

| What is asked | Extra statements | Right letter | Right type | True type in top two | Letters called borderline |
|---|---|---|---|---|---|
| Big Five only (50) | 0 | 73% | 28% | 47% | 36% |
| + 4 direct per letter | 16 | 85% | 51% | 74% | 16% |
| + 8 direct per letter (OEJTS length) | 32 | 88% | 60% | 82% | 12% |
| + 12 direct per letter | 48 | 90% | 65% | 86% | 10% |
| Adaptive follow-ups, 4 to 12 per letter | 24 on average | 89% | 64% | 82% | 8% |

These rows are a design simulation. The Big Five answers are generated from item parameters fitted on real data. The direct statements have no response data yet, so they use an assumed discrimination of 1.4; with weaker statements (1.0) the exact-type figure is 56% and with stronger ones (1.8) it is 70%.

## The item bank

| Set | Statements | Source and licence | File |
|---|---|---|---|
| Big Five markers (already in the app) | 50 | IPIP, public domain | `questions.ts` |
| IPIP-NEO-120, 30 facets | 120, of which 14 are word-for-word in the 50 and are not asked twice | IPIP, public domain (Johnson, 2014), with Johnson's published norms by sex and age band | `ipipNeo120.json` |
| Type-dimension statements | 48, 12 per letter pair, six pointing each way | Written for this app, CC0 | `typeItems.json` |
| Upbringing scales | 37 plus birth order | Written for this app, CC0 | `upbringingItems.json` |
| Parent and carer ratings | 15 per person | Written for this app, CC0, following IPIP marker content | `parentItems.json` |

Design rules for the statements written here:

- One concrete situation per statement (a journey, a deadline, a friend's problem, a rule that hurts someone), spread across work, study, friends, travel, money and everyday life.
- Both poles of a letter are worded as equally reasonable ways to be. A T/F statement must not read as kind versus unkind, or a J/P statement as hard-working versus lazy, because then it measures Agreeableness or Conscientiousness again instead of the preference.
- Half of the statements for each letter point at each pole, so agreeing with everything cancels out.
- Plain English, no double negatives, one idea per statement. The IPIP statements keep their tested wording and get a one-line hint where a word is hard.
- Nothing is adapted from the MBTI, 16Personalities or any other published type test.

Upbringing: five multi-statement scales feed the five factors the model already uses (warmth, harshness, hard events, money, moves), and three more (freedom to choose, ideas and books at home, support outside home) are collected but not yet used by the model. Hard events are yes/no with "prefer not to say", counted, and four or more is the top band. Skipped scales leave the model's default in place.

Parents: three statements per trait instead of one adjective, one of them reverse-keyed, plus "how well did you know this person". The result is a normal `ParentRating`.

Other public-domain sets considered. The BFAS (100 statements, ten aspects) splits each trait in two in a way that maps well onto the letters (ideas versus art for S/N, compassion versus politeness for T/F, order versus drive for J/P). The SPI (135 statements, 27 narrow traits) comes with open response data. Neither is added here: the IPIP-NEO-120 has published norms, shares 14 statements with the test people have already taken, and adding a second 100-statement inventory would make the test longer without a clear gain. BFAS is the one to add next if the facet chapter proves popular. The OEJTS items the main app is adding are licensed CC BY-NC-SA, which is fine for a hackathon but rules out commercial use; the 48 statements here are CC0 and can replace them if that ever matters.

## Scoring upgrades

**Graded response model for the 50 statements** (`irt.ts`, `bigfive.ts`, parameters in `ipip50Irt.json`). Fitted by marginal maximum likelihood on 41,644 people. Each person gets a score and their own standard error, which depends on which statements they answered. `scoreIpip50(ans)` returns `z` and `reliability` per trait in the form `currentZ` and `modelFor` already use.

**Adaptive order** (`nextIpipItem`). A pure function of the answers so far: at least four statements per trait, then whichever statement narrows the least certain trait the most, stopping a trait once its standard error is 0.42. Replayed on 2,000 real held-out people it asks 30 statements on average instead of 50 (41% fewer), its scores correlate .98 with the full test, and it gives the same Big-Five-implied letters 95% of the time. The first 30 statements in fixed order correlate .96.

**Letters** (`typeEngine.ts`). `typeResult(z, rel, evidence)` starts from the existing Big Five model (with no evidence it reproduces `mbtiLetters` exactly) and updates each letter with direct answers on a grid. Evidence can come from the 48 statements here (`evidenceFromBank`) or from bipolar items such as the OEJTS (`evidenceFromBipolar`). It returns per letter: probability, band, chance of repeating on a retest, and for the type: the mask with borderline letters open, the candidate types that fit it, and the chance all four repeat. `nextTypeItem` chooses follow-ups: four per letter first, then only for letters under 85%, alternating poles and situations. `carryForward` lets a retest start from the previous sitting, loosened for the time elapsed, so one lukewarm sitting cannot overturn a well-established letter.

The direct statements are scored with "in between" sitting exactly on the letter's cut point. That is an assumption until response data exists; `fit_irt.py` is where fitted values will replace it.

**Answer quality** (`consistency.ts`). Three checks are added to the three already in `quality.ts`: the gap between near-synonym statements, person fit under the response model, and coherence (do this person's answers correlate with each other and with the usual profile). When the page records seconds per statement, a speed check applies too. Cut-offs are set on real people so that each new check flags 2% of them.

| Made-up answer sheet | Caught before | Caught now |
|---|---|---|
| Random answers | 0% | 94% |
| Random answers that avoid the extremes | 0% | 70% |
| A repeating pattern | 0% | 100% |
| Careful first half, random second half | 0% | 68% |
| Same answer throughout with a few slips | 100% | 100% |
| Real people flagged | 0.4% | 4.6% (6.1% with the speed check) |

Random answering that avoids the extremes is the hard case: it looks like an average person to every check except coherence. Flagged people should be asked to confirm or retake, not blocked, since some real people answer unusually.

## The metrics suite

Each metric has a definition, where its number comes from today, and how to compute it on other data. `metricsSuite.ts` exposes them as cards with a plain-English line each and a status: measured, simulated, cross-sectional or pending. Simulated and pending numbers must keep that label wherever they are shown.

Data used: the openpsychometrics IPIP-FFM file (a reproducible 100,000-row sample of 1,015,341; 59,492 after keeping one record per IP address; 70% to fit, 30% held out), and the 2012 BIG5 file for the age check because the larger file has no age.

| Metric | Value | Status | How it is computed |
|---|---|---|---|
| Reliability, McDonald's omega | .85 mean (O .80, C .82, E .90, A .85, N .88) | Measured, 17,848 held-out people | One-factor fit to each ten-statement scale; bootstrap intervals are ±.004 |
| Ranking score, AUC | .85 mean | Measured | Half of a person's answers on a trait predict whether the other half lands above the median |
| Calibration error | 3.8 points; slope 1.01 | Measured | Expected calibration error over 89,240 predictions in ten bands |
| Brier skill over a 50/50 forecast | 38% | Measured | 1 − Brier / 0.25 on the same predictions |
| Right when at least 80% sure | 91%, on 45% of calls | Measured | Same predictions |
| Interval coverage | 50%, 80%, 90% and 95% ranges held the truth 52%, 81%, 91% and 95% of the time | Measured | Range for the second half predicted from the first |
| Same letter from two halves of the test | 81% per letter; all four 44% | Measured | Letters from two 25-statement halves that share nothing |
| Same letter by band | Clear 98%, likely 89%, borderline 65% | Measured | As above, split by the stated probability |
| Retest forecast error | 1.2 points | Measured | Stated chance of repeating against whether the other half agreed |
| Full-length projection | 84% per letter; all four 51% | Projected (Spearman–Brown) | Two full sittings on the same day, Big Five only |
| Type recovery | 28% → 65% exact type | Simulated | Table at the top |
| Careless answers caught | 94% of random sheets at 4.6% of real people flagged | Simulated respondents, real false-alarm rate | Table above |
| Adaptive test | 41% fewer statements at r = .98 | Measured | The app's code replayed on real answers |
| Ageing curve against real age groups | Same direction 87%, off by .08 SD on average, r = .89 | Cross-sectional | Forecast change between age bands against the observed gap, 15 comparisons |
| Scoring time | p95 5.8 ms | Measured, one core | All scores, checks and letter probabilities for 1,000 answer sheets |
| Completion rate | none yet | Pending | `completion()` over logged attempts |
| Same type on a real retake | none yet | Pending | `letterRetest()` over tracker sittings |
| Forecast ranges that held, and Brier skill of stated chances of change | none yet | Pending | `intervalCoverage()` and `brierSkill()` over tracker check-ins |
| Agreement with a second measure | none yet | Pending | `traitAgreement()` for people with both the quick and the long test |

Things the numbers do not show, said plainly:

- Two halves of one sitting are not a retest. They share the person's mood that day, so real retests weeks apart will agree somewhat less. The published retest figures already in `mbti.json` (77% to 84% per letter, 47% all four) are the benchmark until the tracker has real pairs.
- The projected same-day agreement for Big-Five-only letters (51% all four) is higher than their accuracy (28%), because a stable input gives a stable answer whether or not it is right. Stability and accuracy are separate metrics and both should be shown.
- No open dataset we could reach has the same people measured years apart, so the long-range forecast has only been checked against age groups, which are different people. The LISS panel (the same 50 IPIP statements every year since 2008, free to researchers on registration) is the right dataset for a proper coverage check of the forecast, and MIDUS is a second option with a different questionnaire.
- Type recovery against people's self-declared type cannot be computed until the app asks for it. A self-declared type is also not ground truth.
- The facet test is scored on published norms. Its reliabilities (.85 per domain, .70 per facet) are typical published values marked provisional, to be replaced by a fit on Johnson's open IPIP-NEO response file.

## Recomputing from open data

```
python3 scripts/metrics/fit_irt.py data/ipip_ffm_sample100k.tsv.gz
python3 scripts/metrics/metrics_suite.py data/ipip_ffm_sample100k.tsv.gz --age-file data/ipip-big5.csv --export-test /tmp/test_sample.json
node scripts/run-ts.cjs scripts/metrics/ts_checks.ts /tmp/test_sample.json
```

Both openpsychometrics releases work (the 2018 IPIP-FFM file or the 2012 BIG5 file), gzipped or not. The TypeScript step stops with an error if the app's scoring and the Python scoring disagree by more than 0.01 on any person; today the largest gap is 0.000.

| To compute | Open data | Notes |
|---|---|---|
| Reliability, AUC, calibration, coverage, halves agreement, adaptive replay, quality cut-offs | openpsychometrics `_rawdata`: IPIP-FFM-data-8Nov2018 (1,015,341 rows, response times, no age) or BIG5 (19,719 rows, age) | Keep IPC = 1 in the 2018 file |
| Speed cut-off | Same 2018 file | Per-statement milliseconds |
| Facet norms and reliabilities for the 120-statement test | Johnson's IPIP-NEO data repository on OSF (item responses to the 120 and 300 statement versions) | Not reachable from the build container; the scripts take the file when it is available |
| Forecast coverage over years, real retest agreement | LISS panel personality module; MIDUS | Both need registration |
| Completion, real retest, forecast coverage, second-measure agreement | The app's own records | Functions in `appMetrics.ts` |

## Integration points

| Where | Change |
|---|---|
| Quiz order | Call `nextIpipItem(ans, { lastTrait })` for the next statement; `null` means stop. Offer it as the shorter test. |
| Trait scores | `scoreIpip50(ans)` gives `z` and `reliability` per trait; pass them where `ipipZ` and `IPIP_REL` are used now. |
| Letters and confidence | `typeResult(z, rel, evidence)` in place of `closestType`; feed OEJTS answers through `evidenceFromBipolar(dim, value, highIsSecond)` and the 48 statements through `evidenceFromBank(answers)`. Show `mask` and `candidates` when `borderline` is not empty. |
| Follow-ups | `nextTypeItem(z, rel, answers)` until it returns `null`. |
| Answer check | `responseQuality(ans, seconds)` in place of `answerQuality`; record seconds per statement in the quiz. |
| Upbringing and parents | `scoreUpbringing(answers).upbringing` spreads onto `Answers.upbringing`; `scoreParent(answers, know).rating` is one entry of `Answers.parents`. |
| Facet chapter | `NEO_ITEMS`, `prefillFromIpip50`, `scoreNeo120`, `facetHighlights`. |
| Accuracy panel | `METRIC_CARDS`, `TRAIT_METRICS`, `CALIBRATION_CURVE`, `STABILITY_CURVE`, `TYPE_RECOVERY` from `metricsSuite.ts`. |
| Live metrics | Log attempts (answered, total, finished) and keep each sitting's type; then the pending cards can be filled with `appMetrics.ts`. |

## Sources

- Goldberg, L. R. (1992). The development of markers for the Big-Five factor structure. Psychological Assessment, 4, 26–42. International Personality Item Pool, ipip.ori.org (public domain).
- Johnson, J. A. (2014). Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory: Development of the IPIP-NEO-120. Journal of Research in Personality, 51, 78–89. Item list taken from the MIT-licensed package `@alheimsins/b5-johnson-120-ipip-neo-pi-r`; norm tables from Johnson's public scoring routine as carried by the MIT-licensed package `five-factor-e`.
- McCrae, R. R., & Costa, P. T. (1989). Reinterpreting the Myers-Briggs Type Indicator from the perspective of the five-factor model of personality. Journal of Personality, 57, 17–40.
- Samejima, F. (1969). Estimation of latent ability using a response pattern of graded scores. Psychometrika Monograph Supplement, 34.
- McDonald, R. P. (1999). Test theory: A unified treatment. Erlbaum.
- Drasgow, F., Levine, M. V., & Williams, E. A. (1985). Appropriateness measurement with polychotomous item response models and standardized indices. British Journal of Mathematical and Statistical Psychology, 38, 67–86.
- Meade, A. W., & Craig, S. B. (2012). Identifying careless responses in survey data. Psychological Methods, 17, 437–455.
- Curran, P. G. (2016). Methods for the detection of carelessly invalid responses in survey data. Journal of Experimental Social Psychology, 66, 4–19.
- DeYoung, C. G., Quilty, L. C., & Peterson, J. B. (2007). Between facets and domains: 10 aspects of the Big Five. Journal of Personality and Social Psychology, 93, 880–896.
- Condon, D. M. (2018). The SAPA Personality Inventory: An empirically-derived, hierarchically-organized self-report personality assessment model. PsyArXiv.
- Open-Source Psychometrics Project, openpsychometrics.org/_rawdata: BIG5 (2012) and IPIP-FFM-data-8Nov2018.
