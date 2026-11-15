# Enneagram layer: what it rests on

The app estimates an Enneagram type (1 to 9), a wing and an instinct order (sp, so, sx). It never measures the
Enneagram with an Enneagram questionnaire. The type is read from the Big Five scores and the MBTI letters already in the
report, using the patterns published research agrees on. Code: `src/lib/enneagram.ts`.

## Source

Hook, J. N., Hall, T. W., Davis, D. E., Van Tongeren, D. R., & Conner, M. (2021). The Enneagram: A systematic review of
the literature and directions for future research. *Journal of Clinical Psychology, 77*(4), 865-883.

The review pooled 9 studies of the Enneagram and the Big Five (Bartram & Brown, 2005; Delobbe et al.; Giordano, 2008;
Newgent et al., 2000, 2004; Stevens, 2011; Sutton, 2007; Yilmaz et al., 2015, 2016) and 7 of the Enneagram and the
MBTI (Delobbe et al.; Flautt, 1998; O'Leary, 1994; Palmer, 1988; Thrasher, 1994; Wagner, 1994; Wagner & Walker, 1983).
It reports a link only when more than half the studies found it in the same direction. It gives counts, not
correlations.

| Type | Big Five links (studies of 9) | MBTI links (studies of 7) |
|---|---|---|
| 1 | C+ (9) | I (4), J (5) |
| 2 | A+ (7), E+ (9) | F (5) |
| 3 | A- (5), C+ (5), E+ (6) | E (5) |
| 4 | C- (6), N+ (8), O+ (6) | N (5), F (6), P (4) |
| 5 | E- (9) | I (6), T (7) |
| 6 | E- (6), N+ (8), O- (5) | I (4) |
| 7 | C- (6), E+ (9), O+ (9) | E (6), N (5), P (4) |
| 8 | A- (9), E+ (8), N- (6) | E (5), T (4) |
| 9 | A+ (9) | none |

## Method

- Each link is weighted by the share of studies that found it (9 of 9 = 1.0, 5 of 9 = 0.56).
- **Big Five part:** the trait z-scores projected onto the type's weighted links (Σ w·z / √Σ w²), so a type with more links does not score higher for that alone.
- **Letter part:** the same projection, using each letter's probability as a z-score (probit). These probabilities already include the direct type answers.
- A type's score is the mean of the two parts. Type 9 has only the Big Five part.
- **Probabilities:** a softmax over the nine scores with sharpness 2, set by hand so a clear profile puts the top type at about 50 to 65%.
- **Wing:** the neighbouring type with the higher score.
- **Instincts:** the order of the mean answers to six statements written for the app, two per instinct, on the 7-point scale.

## What is weak, said plainly

- The links are directions agreed across studies, not fitted weights. No public dataset pairs Big Five answers with Enneagram type, so the mapping has not been checked against real people. Treat the type as a pointer, not a result.
- The review found one test of wings (Edwards, 1991), and it did no better than chance. Wings are shown because people use them, labelled as the closer neighbour.
- The review reports no empirical test of the instincts. The six statements are not research-tested. They only order the instincts on the person's own answers.
- Enneagram measures themselves have mixed reliability. Typing interviews agree at κ = .20, and RHETI subscale alphas go as low as .35. So even a perfect mapping would inherit that noise.

## Sanity checks (tests/enneagram.test.ts)

| Profile | Result |
|---|---|
| Introverted, very open, low C and low A (textbook INTP) | 5w4 |
| Very open, high N, low C | 4 |
| Extraverted, low A, low N | 8 |
| Introverted, high N, slightly closed | 6 |
