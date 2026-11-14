# Testing report: scoring, MBTI letters and the INTP problem

All numbers come from `npm run sim` (written to `research/simulation_report.json`) and the unit, simulation and
end-to-end suites. Simulated people are test data only and are never shown in the app as evidence about real people.

## Method

- **Answer model.** An ordinal factor model for the 50 IPIP items, fitted to 59,492 real people in the larger open
  openpsychometrics.org dataset (the 2018 IPIP-FFM release, one record per IP address; it does not record age, so
  under-18s are included; `scripts/sim/fit_item_model.ts`). The norms the app scores with come from the same file. Thresholds reproduce each item's answer distribution;
  loadings are tuned until simulated item–rest correlations match the real ones. Simulated alphas match real ones
  within .01 (O .80, C .82, E .90, A .84, N .87). True traits are drawn with the real (disattenuated) trait correlations.
- **Ground truth for MBTI.** Each true MBTI scale = McCrae & Costa (1989) correlations × true Big Five + an unexplained
  part, at unit variance, split at the UK population cut. This is the app's own model, so recovery is an upper bound on
  real-world accuracy.
- **Retest.** The same true person answers twice with independent answer noise.
- **Real people.** The scoring was also run on all 59,492 of those records (`SIM_REAL_DATA=<file> npm run sim`).
- **History.** Until 14 Nov 2026 the answer model and norms used the smaller 2012 file (15,657 adults). Refitting moved
  the figures below by at most 1.5 points; the conclusions are the same.

## Headline results (40,000 simulated people)

| | Likeliest letters (old) | Match UK shares (new) |
|---|---|---|
| Exact type right | 28.0% | 27.2% |
| Ceiling (true Big Five, no measurement error) | 31.0% | |
| Same type on retest | 53.7% | 50.0% |
| Same letter on retest (E/I, S/N, T/F, J/P) | 87, 89, 83, 83% | 87, 84, 83, 82% |
| INTP share, real people (UK 2.4%) | **0.6%** | **1.6%** |
| Intuitive (N) share, real people (UK 23.5%) | 15% | 27% |

The official MBTI keeps all four letters for 47% of UK adults over up to 15 weeks, so ~50–54% retest agreement is the
same order as the real instrument: type flips are a property of cutting a continuous scale, not a bug.

Trait scores track true traits at r ≈ √alpha (.89–.94), and two sittings correlate at about alpha.

## The INTP friend

Reproduced. A typical person who comes out INTP on the usual free online tests (introverted, curious, blunt,
unstructured, a little anxious) taking our test 3,000 times got:

- **Old rule:** ISTP 40%, ISFP 36%, ISTJ 14%, ISFJ 5%, INTP 2%.
- **New rule:** ISTP 39%, ISFP 23%, INTP 18%, INFP 10%, ISTJ 8%.

Why:

1. **S/N was almost unreachable.** N is the minority letter (23.5% in the UK) and the Big Five explain only about a
   third of the S/N scale, so the likeliest-letter rule needed Openness at about the 91st percentile before it would
   say N. On real answers it said N to 15% of people and INTP to 0.6%. Fixed by scaling the cut to the spread of the
   Big Five estimate (cut × √r²), so each letter is given out about as often as in the UK.
2. **T/F and J/P sit near 50/50 for this profile.** In McCrae & Costa's mapping, low Conscientiousness and some anxiety
   both pull towards F, which offsets low Agreeableness. So T/F is a coin flip (lean 58%) and J/P close to one (64%).
   These are the letters that change between sittings. The page now marks them as too close to call, and the direct
   type questions (OEJTS) are asked for any letter under 80%.
3. **Online tests define INTP differently.** Most free tests split each scale at the median, so N and P are far more
   common there than in the UK MBTI norms. Someone typed INTP online is often near our S/N and J/P lines.

Trade-off of the new rule: a letter's percentage is a lean rather than a strict probability. Around 50% it favours the
rarer letter (S/N most, by up to ~9 points); leans still rank people correctly (tested). Retest same-type drops from 54%
to 50%.

## Calibration

With the old rule, letter probabilities were calibrated within 4 points (E/I, T/F, J/P within 2; S/N slightly
under-confident at the top because the model ignores the O–E correlation). With the new rule the leans are within 10
points and well ordered. Backcast ranges remain calibrated (existing test).

## Careless answering

| Pattern | Flagged |
|---|---|
| Honest simulated respondents | under 0.1% |
| Real people in the open dataset | 2.2% |
| Answering at random | 67% |
| Random for the second half only | 32% |
| Any straight line, or 90% the same answer | 100% |
| Alternating 1, 5, 1, 5 (and 2/4, zigzags) | 100% |
| Alternating 1/5 with 15% noise | 99% |

The random-answering check now needs both high within-trait spread and low even–odd consistency. Even–odd alone at 0
flagged 4.3% of real adults and 2.9% of honest simulated ones while catching about half of random responders.

## Bugs found

- **Deep dive letters disagreed with the hero.** The deep-dive panel quoted letter odds from the quick-test model even
  when the 50-question test was taken, so its percentages (and sometimes letters) differed from the big type at the top.
  Fixed: it uses `typeFor(r)`; a test checks no component calls the letter model on `r.now` directly.
- **INTP and other N types almost never shown** (above). Fixed by the type cut.

## Known limitations

- Exact type is right about 27% of the time even under the app's own assumptions; the Big Five can't see about half of
  each MBTI scale. Direct type questions are the way to raise this.
- Alternating 1/5 patterns looked consistent after reverse-keying, so no content check caught them. A sequence check
  now does (repeat share at some lag 2–10 ≥ .85, or mean jump between answers ≥ 2.8; flags 0.06% of real adults).

## End-to-end, accessibility and performance

- **Playwright** (`npm run e2e`, desktop Chrome and Pixel 7): 27 pass. Covers the 50 questions by keyboard and by tap,
  the result type matching the scoring library exactly (and after reload), the quick test, the sample profile, going
  back, missing answers, the careless-answering warning, shared links and the share card, compare, types, science,
  404s, no sideways scroll on phones, and no layout jump on the result page.
- **axe-core** WCAG 2.1 AA on home, quiz, results, types, a type page and science: no serious or critical issues.
- **Lighthouse 12** (local production build):

| Page | Mobile perf | Desktop perf | Accessibility | Best practices | SEO |
|---|---|---|---|---|---|
| Home | 94 | 100 | 100 | 100 | 90 / 100 |
| Quiz | 94 | 100 | 100 | 100 | 100 |
| Results (before fix) | 67 | 76 | 100 | 100 | 80 / 90 |
| Results (after fix) | 83 | 100 | | | |
| Science | 91 | 100 | 100 | 100 | 90 / 100 |

The results page shifted by 0.9 (desktop) as the footer was pushed off screen when the profile loaded; fixed.
Round 2: the type journeys, the parallel universes and paths to a type now run in a web worker
(`src/lib/offthread.worker.ts`, `useOffThread`). On the results page (simulated mid-range phone, two runs each) total
blocking time fell from 700–790 ms to 370–480 ms and the longest task from 470 ms to under 180 ms; performance 70–74 →
77–80. What remains is React rendering a long page. SEO still flags a missing meta description on result pages.
