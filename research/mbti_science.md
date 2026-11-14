# MBTI as a layer derived from the Big Five: the science

Compiled 14 November 2026 for Personalityverse. British English. Every number below is tagged **[verified]** (read from the primary source or a reputable secondary reproduction during this session), **[derived]** (our own arithmetic from verified numbers) or **[unverified]** (recalled or reported second-hand, not checked; do not quote publicly).

**One-line summary for the app:** we do not administer the MBTI. We measure the Big Five with the TIPI and then estimate, from published correlations, how likely a person with those scores would be to land on each MBTI letter. It is a translation with stated uncertainty, not a type test.

## 1. Big Five and MBTI correlations

### 1.1 McCrae and Costa (1989) [1]

Sample: 267 men and 201 women aged 19 to 93 from a longitudinal study of ageing (the Baltimore Longitudinal Study of Aging), who completed the MBTI and the NEO Personality Inventory (self-report). MBTI continuous scores run E to I, S to N, T to F, J to P, so a positive correlation means "more of the second letter".

**Men, n = 267 [verified through secondary reproductions of the paper's table; the paywalled original was not opened]**

| MBTI scale | N | E | O | A | C |
|---|---|---|---|---|---|
| E-I (towards I) | .16 | **-.74** | .03 | -.03 | .08 |
| S-N (towards N) | -.06 | .10 | **.72** | .04 | -.15 |
| T-F (towards F) | .06 | .19 | .02 | **.44** | -.15 |
| J-P (towards P) | .11 | .15 | .30 | -.06 | **-.49** |

**Women, n = 201 [significant cells verified through one secondary reproduction; blank cells were not significant and their exact values are unverified]**

| MBTI scale | N | E | O | A | C |
|---|---|---|---|---|---|
| E-I (towards I) | .17 | **-.69** | n.s. | n.s. | n.s. |
| S-N (towards N) | n.s. | .22 | **.69** | n.s. | n.s. |
| T-F (towards F) | .28 | n.s. | n.s. | **.46** | -.22 |
| J-P (towards P) | n.s. | .20 | .26 | n.s. | **-.46** |

Sample-size-weighted pooled values for the four headline pairs are -.72, .71, .45 and -.48 **[derived]**. An independent secondary source quotes exactly .72, .71, .45 and .48 for McCrae and Costa, which corroborates the two tables.

What the paper concluded (abstract, verified): no support for true dichotomies or distinct types; the MBTI measures four relatively independent dimensions that correspond to four of the five factors. Neuroticism has no MBTI counterpart. With peer ratings on the NEO-PI instead of self-reports, the same pattern held with somewhat smaller coefficients (reported in ERIC document ED414335, verified).

### 1.2 Later studies

- **Furnham (1996) [2]**, N = 160, NEO-PI and MBTI. Existence, title and DOI verified. The coefficients could not be retrieved (paywall), so none are given here. **[unverified numbers omitted]**
- **Furnham, Moutafi and Crump (2003) [3]**, N = 900, NEO PI-R and MBTI. The abstract (verified) states that E correlated with E-I, O with S-N, A with T-F and C with J-P, "replicating McCrae and Costa (1989)". Exact coefficients were not retrievable. **[unverified numbers omitted]**
- **Furnham (2022) [4]**, N = 9,487 managers, 30 NEO PI-R facets and MBTI. The domain-level correlations printed in its Table 1 are far weaker and partly opposite in pattern to all earlier work (for example E-I with E = .20, S-N with O = -.03, T-F with A = -.35) **[verified as printed]**. The paper does not state scoring direction clearly and its S-N result contradicts three decades of replications, so we do **not** use it. Flag it on the Science page only as "a recent large study reported much weaker links".
- **No meta-analysis** of MBTI with Big Five correlations was found. Randall, Isaacson and Ciro (2017) [9] meta-analysed reliability only.

## 2. A usable mapping: P(letter | Big Five z-scores)

### 2.1 Model

For each dichotomy treat the (unobserved) MBTI continuous score y as standard normal in the population, and linear in the Big Five:

    y = w · z + e,   e ~ Normal(0, s²),   s = sqrt(1 - R²)

where z are the user's Big Five z-scores. A person is assigned the second letter (I, N, F, P) when y exceeds a cut point c. So

    P(second letter | z) = Φ( (w · z - c) / s )
    P(first letter | z)  = 1 - P(second letter | z)

Φ is the standard normal cumulative distribution. The cut point is c = Φ⁻¹(1 - p), where p is the population share of the second letter. That makes the average of the predicted probabilities across a reference population equal the published prevalence. Setting c = 0 gives a median split.

### 2.2 Choosing the weights (three steps, all arithmetic shown)

**Step A. Which cells.** Keep a Big Five trait for a dichotomy if its correlation was significant in both sexes, or its pooled value is at least .15 in size. Pool as (267 × r_men + 201 × r_women) / 468.

| Dichotomy | Trait | Men | Women | Pooled [derived] |
|---|---|---|---|---|
| E-I | E | -.74 | -.69 | -.72 |
| E-I | N | .16 | .17 | .16 |
| S-N | O | .72 | .69 | .71 |
| S-N | E | .10 | .22 | .15 |
| T-F | A | .44 | .46 | .45 |
| T-F | C | -.15 | -.22 | -.18 |
| T-F | N | .06 | .28 | .15 |
| J-P | C | -.49 | -.46 | -.48 |
| J-P | O | .30 | .26 | .28 |
| J-P | E | .15 | .20 | .17 |

Dropped because they are small or significant in one sex only with the other value unverified: S-N with C (-.15 men), T-F with E (.19 men), J-P with N (.11 men).

**Step B. NEO-based version.** Treating the Big Five domains as independent (see 2.4), the weights are the pooled correlations and R² is the sum of their squares.

| Dichotomy | Weights on z | R² | s = sqrt(1 - R²) |
|---|---|---|---|
| E-I | -.72 E + .16 N | .5184 + .0256 = .544 | .675 |
| S-N | .71 O + .15 E | .5041 + .0225 = .527 | .688 |
| T-F | .45 A - .18 C + .15 N | .2025 + .0324 + .0225 = .257 | .862 |
| J-P | -.48 C + .28 O + .17 E | .2304 + .0784 + .0289 = .338 | .814 |

Use these only if the app ever measures the Big Five with a long inventory.

**Step C. TIPI version (recommended).** The correlations above come from the full-length NEO-PI. The TIPI has two items per trait and is noisier, so the same weights would make the app overconfident. We shrink each weight by the square root of the TIPI six-week retest reliability from Gosling et al. (2003) [5], Table 3 **[verified]**: E .77, A .71, C .76, Emotional Stability .70, O .62. Square roots: E .877, A .843, C .872, N .837, O .787 **[derived]**.

| Dichotomy | Recommended weights on TIPI z | R² | s |
|---|---|---|---|
| **E-I** (P of I) | **-0.632 E + 0.134 N** | .417 | **.763** |
| **S-N** (P of N) | **+0.559 O + 0.132 E** | .330 | **.819** |
| **T-F** (P of F) | **+0.379 A - 0.157 C + 0.125 N** | .184 | **.903** |
| **J-P** (P of P) | **-0.418 C + 0.220 O + 0.149 E** | .245 | **.869** |

Example arithmetic: -.72 × .877 = -.632; .16 × .837 = .134; R² = .632² + .134² = .399 + .018 = .417; s = sqrt(.583) = .763.

This shrinkage is our own modelling choice **[derived, an estimate]**. It is conservative in one way (the NEO is itself not perfectly reliable) and optimistic in another (TIPI and NEO content differ: Gosling reports TIPI with NEO PI-R convergent correlations of only .65 E, .59 A, .68 C, .66 N, .56 O). The honest reading is that the true TIPI weights lie somewhere between about 0.6 and 0.9 of the NEO weights.

### 2.3 Cut points

c = Φ⁻¹(1 - share of second letter) **[derived]**.

| Reference population | c for E-I | c for S-N | c for T-F | c for J-P |
|---|---|---|---|---|
| US national sample 1998 (I 50.7, N 26.7, F 59.8, P 45.9) | -0.018 | +0.622 | -0.248 | +0.103 |
| UK 1996 general population (I 47.4, N 23.5, F 54.1, P 41.7) | +0.065 | +0.722 | -0.103 | +0.210 |
| UK 2018 Global Step I sample (I 59.3, N 37.2, F 50.2, P 56.1) | -0.235 | +0.327 | -0.005 | -0.154 |
| Median split | 0 | 0 | 0 | 0 |

Recommendation: default to the US 1998 cut points because that is the sample everyone quotes, and offer the UK 1996 set for a UK audience. Note for the Science page that the cut point matters a lot for S-N: with the real split an average person is only about 22% likely to be N; with a median split it would be 50%.

### 2.4 Worked examples (TIPI weights, US cut points) [derived]

- Average person (all z = 0): P(I) = Φ(0.018/.763) = .51; P(N) = Φ(-.622/.819) = .22; P(F) = Φ(.248/.903) = .61; P(P) = Φ(-.103/.869) = .45. Closest type ISFJ, which is also the most common type in the US sample. Good sanity check.
- E = +1, O = +1, A = -0.5, C = +1, N = 0: P(I) = .21, P(N) = .53, P(F) = .46, P(P) = .43. Closest type ENTJ, but three of the four letters are near a coin flip, and the app should say so.
- E = +2 alone moves P(I) only to .05, so even an extreme TIPI score never gives certainty.

**Four-letter type.** Closest type = the more probable letter on each dichotomy. For a probability of each of the 16 types, multiply the four letter probabilities. This assumes the four MBTI scales are independent once the Big Five are known, which is an approximation (S-N and J-P are known to correlate). With four letters each at 70%, the type as a whole is only .7⁴ = 24% likely. Show that number.

### 2.5 Assumptions to state

1. Zero-order correlations are used as regression weights, which is exact only if the Big Five domains are uncorrelated. They are in fact modestly correlated, so the secondary weights are slightly overstated. We did not find McCrae and Costa's own NEO intercorrelation matrix to do better.
2. z-scores must be standardised against a general adult norm, the same kind of population the prevalence figures describe.
3. The correlations come from one 1989 US sample of mostly older, well-educated adults using the MBTI form of the 1980s. Later forms (M, Global Step I) may differ somewhat.
4. Sex differences are ignored. Women's T-F had an extra link with N (.28). The MBTI itself uses the same T-F cut for both sexes in current forms. The often-quoted split of roughly 57% of men T and 75% of women F in the 1998 sample is **[unverified]**.

## 3. Type prevalence

### 3.1 United States, MBTI Manual 3rd edition (1998) national representative sample, N = 3,009 [6] [verified via Psychometrics Canada (2008) [7], Tables 10 and 13, which reproduce the Manual]

| | | | |
|---|---|---|---|
| ISTJ 11.6 | ISFJ 13.8 | INFJ 1.5 | INTJ 2.1 |
| ISTP 5.4 | ISFP 8.8 | INFP 4.4 | INTP 3.3 |
| ESTP 4.3 | ESFP 8.5 | ENFP 8.1 | ENTP 3.2 |
| ESTJ 8.7 | ESFJ 12.3 | ENFJ 2.5 | ENTJ 1.8 |

Letters: E 49.3 / I 50.7; S 73.3 / N 26.7; T 40.2 / F 59.8; J 54.1 / P 45.9. The 16 type figures sum to 100.3 because of rounding in the source, so letter totals recomputed from the types differ by up to 0.2 points from the published letter figures.

### 3.2 United Kingdom

**UK 1996 general population, N = 1,634 [8]** [verified]. Individuals sampled by the Office for National Statistics to represent the UK population completed a development version of the European Step I questionnaire.

| | | | |
|---|---|---|---|
| ISTJ 13.7 | ISFJ 12.7 | INFJ 1.7 | INTJ 1.4 |
| ISTP 6.4 | ISFP 6.1 | INFP 3.2 | INTP 2.4 |
| ESTP 5.8 | ESFP 8.7 | ENFP 6.3 | ENTP 2.8 |
| ESTJ 10.4 | ESFJ 12.6 | ENFJ 2.8 | ENTJ 2.9 |

Letters: E 52.6 / I 47.4; S 76.5 / N 23.5; T 45.9 / F 54.1; J 58.3 / P 41.7.

**UK 2018 Global Step I sample, N = 2,831 [10]** [verified]. Online market-research panel with quotas matched to the UK population, ages 16 to 67. Letters: E 40.7 / I 59.3; S 62.8 / N 37.2; T 49.8 / F 50.2; J 43.9 / P 56.1. Most common types ISTJ 14.0 and ISTP 10.2; least common ENTJ 1.6 and ENFJ 2.2.

The two UK samples disagree by up to 14 points on a letter. Different questionnaire versions and sampling methods give different "population" splits, which is itself worth saying on the Science page.

## 4. Reliability and stability

**Continuous scores**

- Capraro and Capraro (2002) [11], reliability generalisation over 70 coefficients from studies published 1998 to 2001: mean reliability .815 overall; alpha .816 (50 coefficients); test-retest .813 (20 coefficients, range .48 to .91). By scale: E-I .838, S-N .843, T-F .764, J-P .822. Only 14 of 210 articles (7%) reported reliability for their own data. **[verified]**
- Randall, Isaacson and Ciro (2017) [9], meta-analysis of three test-retest studies: E-I .764, S-N .753, T-F .612, J-P .775. **[verified]**
- Publisher data, Global Step I (2018 manual, as reported by the Myers and Briggs Foundation): retest .81 to .86 across scales over 6 to 15 weeks, n = 1,721. Publisher also reports Form M retest of .94 to .97 at one month and .57 to .81 at four years (Schaubhut, Herk and Thompson, 2009, as quoted on the publisher's site). **[verified as publisher claims]**

**Same letters on retest**

- UK 2018 supplement [10], n = 88, up to 15 weeks: agreement per dichotomy E-I 84%, S-N 82%, T-F 78%, J-P 77%; **47% kept all four letters**, 33% kept three, 17% two, 2% one, 1% none. **[verified]**
- UK 2009 European supplement [8], n = 81 people who already knew their type, one to six months: 91 to 95% per dichotomy, **79% same four letters**. **[verified]** (A selected sample, so an upper bound.)
- Publisher summary: about 50% match on all four letters and about 90% on three or four. **[verified as publisher claim]**
- Critics: Pittenger (1993) [12] and Pittenger (2005) [13] are the origin of "about half change type within five weeks". Second-hand reports of what they cite: McCarley and Carskadon (1983) found 50% changed on at least one scale after five weeks; the 1998 Manual reported 35% with a different four-letter type after four weeks; Howes and Carskadon (1979) found that among people with slight preferences about 32% (E-I), 25% (S-N), 29% (T-F) and 30% (J-P) changed letter on retest. Wikipedia summarises the range as 39 to 76% receiving a different type at five weeks. **[all second-hand, treat as unverified in detail; the overall picture of roughly 35 to 55% changing at least one letter within weeks is consistent with the verified UK figure of 53%]**

**Near the cut point [derived, standard bivariate-normal arithmetic]**

If the retest correlation is r and the cut is at the median, the expected share keeping the same letter is 0.5 + arcsin(r)/π: 77% at r = .75, 80% at r = .81, 82% at r = .85. Multiplying four such values gives roughly 33 to 47% keeping the whole type, which matches the observed 47%. For a person whose score sits d standard deviations from the cut, the chance of flipping on retest is Φ(-r·d / sqrt(1 - r²)):

| Distance from cut (SD) | Flip chance, r = .75 | Flip chance, r = .85 |
|---|---|---|
| 0 | 50% | 50% |
| 0.1 | 46% | 44% |
| 0.25 | 39% | 34% |
| 0.5 | 29% | 21% |
| 1.0 | 13% | 5% |

Because scores are roughly bell-shaped, about 20% of people sit within 0.25 SD of any given cut. So type changes are what the mathematics predicts from cutting a continuous score in two, even when the underlying scale is respectably reliable.

## 5. Change over life

**What MBTI theory says.** Type is treated as an inborn preference, like handedness; people develop skill with the non-preferred side but the preference is not expected to change (Myers and Myers, 1980 [14]; publisher FAQ). This is a theoretical claim, not a finding.

**What the MBTI evidence says.**

- Cummings (1995) [15] analysed the MBTI Atlas of Type Tables and found significant age-group differences on every dimension, concluding that norms should be age-specific. **[verified from abstract; direction of each difference not verified]**. The common statement that older groups show more S and J is plausible given Big Five ageing but **[unverified]** here.
- The publisher's own four-year retest correlations of .57 to .81 show real individual movement over years.
- An unnamed 1996 study quoted by EBSCO and Wikipedia: about 50% kept the same type within nine months and about 36% after more than nine months. **[second-hand, unverified]**
- Bouchard and Hur (1998) [16] studied the MBTI continuous scales in twins reared apart and reported substantial heritability. **[citation recalled; exact figures unverified and omitted]**
- We found **no** verified study linking upbringing, parenting or specific life events to MBTI preference change. Say so in the app. All such claims must run through the Big Five evidence.

**What Big Five change implies for letters.** Using the app's existing normative change figures (model_params.json, reconstructed from Roberts, Walton and Viechtbauer 2006 [17], consistent with Bleidorn et al. 2022 [18]): from age 20 to 70 roughly C +0.82 SD, N -0.77, A +0.41, E +0.15, O -0.03. Feeding those shifts into the recommended model for an average person (US cut points) **[derived]**:

| Letter | At 20 (z = 0) | At 70 | Why |
|---|---|---|---|
| P(J) | 55% | 69% | C rises: -0.418 × 0.82 = -0.34 on the J-P score |
| P(E) | 49% | 59% | lower N (0.134 × -0.77) and slightly higher E (mostly social dominance) |
| P(F) | 61% | 58% | higher A pushes to F (+0.16) but higher C (-0.13) and lower N (-0.10) push to T; they nearly cancel |
| P(N) | 22% | 22% | O barely changes over this span |

So the defensible headline is "maturation pushes people towards J, a little towards E, and leaves S-N and T-F roughly where they were". This only works if z-scores are always taken against one fixed adult norm. If the app re-norms by age, letters would not drift at all. Openness-raising experiences or interventions push towards N and P; conscientiousness gains push towards J; extraversion gains push towards E, with a small spill-over to N and P.

Rank-order stability (Bleidorn et al. 2022: about .74 from age 25 onwards over typical intervals) means individuals shuffle around these averages, so letter probabilities for a future age should be wider than those for today. The existing change model (Δ ~ Normal(μ, 2(1 - ρ))) can be pushed through the same formula.

## 6. Main criticisms, for the Science page

- **The dichotomies are artificial.** MBTI scores are spread in a single hump with most people near the middle, not in two clumps. Bess and Harvey (2002) [19] showed that apparent bimodality was a scoring artefact, and McCrae and Costa (1989) [1] found no evidence of distinct types. Cutting a bell curve in half puts very similar people on opposite sides.
- **Types are unstable for people near the middle.** In the publisher's own UK data only 47% kept all four letters over a few weeks [10]; critics report similar or worse (Pittenger, 1993, 2005 [12, 13]).
- **A whole dimension is missing.** Nothing in the MBTI corresponds to Neuroticism or Emotional Stability, the Big Five trait most tied to wellbeing and mental health (McCrae and Costa, 1989 [1]).
- **The theory behind it does not hold up.** Stein and Swan (2019) [20] conclude that MBTI theory of a "true type" conflicts with known data, is not testable and is internally inconsistent. Type-dynamics ideas (dominant and auxiliary functions) add nothing beyond the four scales.
- **Weak evidence that it predicts outcomes.** Pittenger (2005) [13] and others find little evidence that type predicts job performance or should guide career or hiring decisions. The four scales carry information mainly because they overlap with four Big Five traits, and they carry less of it once dichotomised.
- **Reliability reporting is thin.** Capraro and Capraro (2002) [11] found only 7% of MBTI studies reported reliability for their own data, and T-F is consistently the weakest scale (.61 to .76).

**Suggested wording for the app:** "Your MBTI-style letters are estimated from your Big Five scores using correlations published by McCrae and Costa (1989). You did not take the MBTI. Each letter is shown as a probability because the MBTI splits smooth traits into two boxes, and people near the middle often change letter when retested."

## 7. Could not verify

1. McCrae and Costa's original table was not opened (paywall). Men's values agree across two independent reproductions; women's significant values come from one reproduction; women's non-significant cells are unknown.
2. Furnham (1996) and Furnham, Moutafi and Crump (2003) coefficients.
3. Exact figures and attributions in Pittenger (1993, 2005), Howes and Carskadon (1979), McCarley and Carskadon (1983) and the "1996 study" on nine-month stability.
4. Direction of age differences in Cummings (1995); sex split on T-F in the 1998 Manual; Bouchard and Hur (1998) heritabilities; exact page ranges for references 15, 16 and 19.
5. The US prevalence figures were read from a reputable secondary reproduction of the Manual, not the Manual itself.
6. The TIPI shrinkage factors and all "derived" probabilities are our modelling choices, not published results.

## References

1. McCrae, R. R., & Costa, P. T., Jr. (1989). Reinterpreting the Myers-Briggs Type Indicator from the perspective of the five-factor model of personality. *Journal of Personality, 57*(1), 17-40. https://doi.org/10.1111/j.1467-6494.1989.tb00759.x
2. Furnham, A. (1996). The big five versus the big four: The relationship between the Myers-Briggs Type Indicator (MBTI) and NEO-PI five factor model of personality. *Personality and Individual Differences, 21*(2), 303-307. https://doi.org/10.1016/0191-8869(96)00033-5
3. Furnham, A., Moutafi, J., & Crump, J. (2003). The relationship between the revised NEO-Personality Inventory and the Myers-Briggs Type Indicator. *Social Behavior and Personality, 31*(6), 577-584. https://doi.org/10.2224/sbp.2003.31.6.577
4. Furnham, A. (2022). The Big Five facets and the MBTI: The relationship between the 30 NEO-PI(R) facets and the four Myers-Briggs Type Indicator (MBTI) scores. *Psychology, 13*. (Scientific Research Publishing, paper ID 120220; page range and DOI not verified.) https://www.scirp.org/journal/paperinformation?paperid=120220
5. Gosling, S. D., Rentfrow, P. J., & Swann, W. B., Jr. (2003). A very brief measure of the Big-Five personality domains. *Journal of Research in Personality, 37*(6), 504-528. https://doi.org/10.1016/S0092-6566(03)00046-1
6. Myers, I. B., McCaulley, M. H., Quenk, N. L., & Hammer, A. L. (1998). *MBTI manual: A guide to the development and use of the Myers-Briggs Type Indicator* (3rd ed.). Palo Alto, CA: Consulting Psychologists Press.
7. Psychometrics Canada. (2008). *Myers-Briggs Type Indicator (MBTI) in Canada*. Edmonton: Psychometrics Canada Ltd. https://www.psychometrics.com/wp-content/uploads/2015/02/mbti-in-canada.pdf
8. OPP Ltd. (2011). *MBTI Step I instrument: European data supplement* (English chapter dated January 2009). Oxford: OPP Ltd. https://nz.themyersbriggs.com/content/Research%20and%20White%20Papers/MBTI/MBTI_Step_I_European_Data_Supplement.pdf
9. Randall, K., Isaacson, M., & Ciro, C. (2017). Validity and reliability of the Myers-Briggs Personality Type Indicator: A systematic review and meta-analysis. *Journal of Best Practices in Health Professions Diversity, 10*(1), 1-27.
10. Schaubhut, N. A., Thompson, R. C., Morris, M. L., & Arneson, J. J. (2018). *United Kingdom (European English) supplement to the MBTI manual for the Global Step I and Step II assessments*. Sunnyvale, CA: The Myers-Briggs Company. https://asia.themyersbriggs.com/wp-content/uploads/22.MBTIGlobalManualSuppUK.pdf
11. Capraro, R. M., & Capraro, M. M. (2002). Myers-Briggs Type Indicator score reliability across studies: A meta-analytic reliability generalization study. *Educational and Psychological Measurement, 62*(4), 590-602. https://doi.org/10.1177/0013164402062004004
12. Pittenger, D. J. (1993). Measuring the MBTI... and coming up short. *Journal of Career Planning and Employment, 54*(1), 48-52.
13. Pittenger, D. J. (2005). Cautionary comments regarding the Myers-Briggs Type Indicator. *Consulting Psychology Journal: Practice and Research, 57*(3), 210-221. https://doi.org/10.1037/1065-9293.57.3.210
14. Myers, I. B., & Myers, P. B. (1980). *Gifts differing: Understanding personality type*. Palo Alto, CA: Consulting Psychologists Press.
15. Cummings, W. H., III. (1995). Age group differences and estimated frequencies of the Myers-Briggs Type Indicator preferences. *Measurement and Evaluation in Counseling and Development, 28*(2), 69-77.
16. Bouchard, T. J., Jr., & Hur, Y.-M. (1998). Genetic and environmental influences on the continuous scales of the Myers-Briggs Type Indicator: An analysis based on twins reared apart. *Journal of Personality, 66*(2), 135-149. (Volume and pages recalled, not verified.)
17. Roberts, B. W., Walton, K. E., & Viechtbauer, W. (2006). Patterns of mean-level change in personality traits across the life course: A meta-analysis of longitudinal studies. *Psychological Bulletin, 132*(1), 1-25. https://doi.org/10.1037/0033-2909.132.1.1
18. Bleidorn, W., Schwaba, T., Zheng, A., Hopwood, C. J., Sosa, S. S., Roberts, B. W., & Briley, D. A. (2022). Personality stability and change: A meta-analysis of longitudinal studies. *Psychological Bulletin, 148*(7-8), 588-619. https://doi.org/10.1037/bul0000365
19. Bess, T. L., & Harvey, R. J. (2002). Bimodal score distributions and the Myers-Briggs Type Indicator: Fact or artifact? *Journal of Personality Assessment, 78*(1), 176-186. (DOI not verified.)
20. Stein, R., & Swan, A. B. (2019). Evaluating the validity of Myers-Briggs Type Indicator theory: A teaching tool and window into intuitive psychology. *Social and Personality Psychology Compass, 13*(2), e12434. https://doi.org/10.1111/spc3.12434
