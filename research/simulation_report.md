# Testing report: scoring, MBTI letters and the INTP problem

All numbers come from `npm run sim` (written to `research/simulation_report.json`) and the unit, simulation and
end-to-end suites. Simulated people are test data only and are never shown in the app as evidence about real people.

## Method

- **Answer model.** An ordinal factor model for the 50 IPIP items, fitted to 15,657 real adults in the open
  openpsychometrics.org dataset (`scripts/sim/fit_item_model.ts`). Thresholds reproduce each item's answer distribution;
  loadings are tuned until simulated item–rest correlations match the real ones. Simulated alphas match real ones
  within .01 (O .79, C .81, E .89, A .83, N .87). True traits are drawn with the real (disattenuated) trait correlations.
- **Ground truth for MBTI.** Each true MBTI scale = McCrae & Costa (1989) correlations × true Big Five + an unexplained
  part, at unit variance, split at the UK population cut. This is the app's own model, so recovery is an upper bound on
  real-world accuracy.
- **Retest.** The same true person answers twice with independent answer noise.
- **Real people.** The scoring was also run on all 15,744 complete adult records in the open dataset.

## Headline results (40,000 simulated people)

| | Likeliest letters (old) | Match UK shares (new) |
|---|---|---|
| Exact type right | 27.6% | 27.0% |
| Ceiling (true Big Five, no measurement error) | 30.8% | |
| Same type on retest | 52.3% | 48.7% |
| Same letter on retest (E/I, S/N, T/F, J/P) | 87, 89, 82, 82% | 87, 84, 81, 81% |
| INTP share, real people (UK 2.4%) | **0.5%** | **1.6%** |
| Intuitive (N) share, real people (UK 23.5%) | 14% | 23% |

The official MBTI keeps all four letters for 47% of UK adults over up to 15 weeks, so ~49–52% retest agreement is the
same order as the real instrument: type flips are a property of cutting a continuous scale, not a bug.

Trait scores track true traits at r ≈ √alpha (.89–.94), and two sittings correlate at about alpha.

## The INTP friend

Reproduced. A typical person who comes out INTP on the usual free online tests (introverted, curious, blunt,
unstructured, a little anxious) taking our test 3,000 times got:

- **Old rule:** ISTP 38%, ISFP 36%, ISTJ 15%, ISFJ 6%, INTP 2%.
- **New rule:** ISTP 37%, ISFP 22%, INTP 18%, INFP 11%, ISTJ 9%.

Why:

1. **S/N was almost unreachable.** N is the minority letter (23.5% in the UK) and the Big Five explain only about a
   third of the S/N scale, so the likeliest-letter rule needed Openness at about the 91st percentile before it would
   say N. On real answers it said N to 14% of people and INTP to 0.5%. Fixed by scaling the cut to the spread of the
   Big Five estimate (cut × √r²), so each letter is given out about as often as in the UK.
2. **T/F and J/P sit near 50/50 for this profile.** In McCrae & Costa's mapping, low Conscientiousness and some anxiety
   both pull towards F, which offsets low Agreeableness. So T/F is a coin flip (lean 58%) and J/P close to one (64%).
   These are the letters that change between sittings. The page now marks them as too close to call, and the direct
   type questions (OEJTS) are asked for any letter under 80%.
3. **Online tests define INTP differently.** Most free tests split each scale at the median, so N and P are far more
   common there than in the UK MBTI norms. Someone typed INTP online is often near our S/N and J/P lines.

Trade-off of the new rule: a letter's percentage is a lean rather than a strict probability. Around 50% it favours the
rarer letter (S/N most, by up to ~9 points); leans still rank people correctly (tested). Retest same-type drops from 52%
to 49%.

## Calibration

With the old rule, letter probabilities were calibrated within 4 points (E/I, T/F, J/P within 2; S/N slightly
under-confident at the top because the model ignores the O–E correlation). With the new rule the leans are within 10
points and well ordered. Backcast ranges remain calibrated (existing test).

## Careless answering

| Pattern | Flagged |
|---|---|
| Honest simulated respondents | 0.1% |
| Real adults in the open dataset | 2.8% |
| Answering at random | 67% |
| Random for the second half only | 34% |
| Any straight line, or 90% the same answer | 100% |
| Alternating 1, 5, 1, 5 | 0% (known gap) |

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
- Alternating 1/5 patterns are not caught (they look consistent after reverse-keying).

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
Remaining: ~470 ms of main-thread work on a mid-range phone for the results page (the Monte Carlo journeys run in
the browser), and SEO flags a missing meta description on result pages and a few links with generic text.
