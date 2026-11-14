// Research-grounded parameters for the Personalityverse model.
// Every number carries a source id (see SOURCES). Values marked `estimate`
// are our best defensible reading where the literature gives no direct figure.

export type Trait = "O" | "C" | "E" | "A" | "N";
export const TRAITS: Trait[] = ["O", "C", "E", "A", "N"];

export const TRAIT_META: Record<
  Trait,
  { name: string; short: string; high: string; low: string; color: string }
> = {
  O: { name: "Openness", short: "Open", high: "curious, imaginative, loves new ideas", low: "practical, prefers the familiar", color: "#a78bfa" },
  C: { name: "Conscientiousness", short: "Consc.", high: "organised, disciplined, reliable", low: "spontaneous, flexible, easy-going", color: "#34d399" },
  E: { name: "Extraversion", short: "Extra.", high: "energetic, sociable, assertive", low: "reserved, reflective, recharges alone", color: "#fbbf24" },
  A: { name: "Agreeableness", short: "Agree.", high: "warm, cooperative, trusting", low: "direct, competitive, sceptical", color: "#60a5fa" },
  N: { name: "Neuroticism", short: "Neuro.", high: "sensitive to stress, feels emotions intensely", low: "calm, steady, emotionally resilient", color: "#f472b6" },
};

import research from "./research.json";

// Sources: the research brief's citation list plus a few extra used only here.
export const SOURCES: Record<string, string> = {
  ...(research.sources as Record<string, string>),
  ZN2013: "Zimmermann, J., & Neyer, F. J. (2013). Do we become a different person when hitting the road? Personality development of sojourners. JPSP, 105(3), 515–530. https://doi.org/10.1037/a0033019",
  RES2015: "Rohrer, J. M., Egloff, B., & Schmukle, S. C. (2015). Examining the effects of birth order on personality. PNAS, 112(46), 14224–14229. https://doi.org/10.1073/pnas.1506451112",
  CO2010: "Connelly, B. S., & Ones, D. S. (2010). An other perspective on personality: Meta-analytic integration of observers' accuracy and predictive validity. Psychological Bulletin, 136(6), 1092–1122. https://doi.org/10.1037/a0021212",
  S2005: "Saudino, K. J. (2005). Behavioral genetics and child temperament. Journal of Developmental & Behavioral Pediatrics, 26(3), 214–223.",
  G2003: "Gosling, S. D., Rentfrow, P. J., & Swann, W. B. (2003). A very brief measure of the Big-Five personality domains. Journal of Research in Personality, 37(6), 504–528. https://doi.org/10.1016/S0092-6566(03)00046-1",
};

// Heritability: per-trait twin estimates (JLV1996) shrunk toward the meta-analytic .40 (VB2015).
// Shared (family) environment is close to zero for adult traits; we show 5% as "small".
export const HERITABILITY: Record<Trait, { h2: number; c2: number; src: string }> = {
  O: { h2: 0.45, c2: 0.05, src: "VB2015" },
  C: { h2: 0.4, c2: 0.05, src: "VB2015" },
  E: { h2: 0.45, c2: 0.05, src: "VB2015" },
  A: { h2: 0.38, c2: 0.05, src: "VB2015" },
  N: { h2: 0.4, c2: 0.05, src: "VB2015" },
};

// Rank-order stability by age at time 1 (Bleidorn et al., 2022, exponential age model),
// evaluated at the meta-analysis's typical retest lag. Lag adjusts r by -.011 per extra year.
export const STABILITY_BY_AGE: { age: number; r: number }[] = [
  { age: 0, r: 0.0 },
  { age: 5, r: 0.087 },
  { age: 15, r: 0.567 },
  { age: 25, r: 0.735 },
  { age: 50, r: 0.82 },
  { age: 90, r: 0.826 },
];
export const STABILITY_TYPICAL_LAG = 6.7;
export const STABILITY_SLOPE_PER_YEAR_LAG = -0.011;
export const MEASURE_RELIABILITY = 0.88;

// Mean-level change, d per year, from the per-period d in RWV2006 (spread evenly within each period).
// E = mean of social dominance and social vitality. N = -(emotional stability).
const ML = research.mean_level_change.d_per_period;
const PERIODS: [number, number][] = [[10, 18], [18, 22], [22, 30], [30, 40], [40, 50], [50, 60], [60, 70], [70, 90]];
export const MATURATION: { from: number; to: number; d: Record<Trait, number> }[] = PERIODS.map(([from, to], i) => {
  const len = to - from;
  return { from, to, d: { O: ML.O[i] / len, C: ML.C[i] / len, E: ML.E_combined[i] / len, A: ML.A[i] / len, N: ML.N[i] / len } };
});

// Early temperament → adult trait. Caspi et al. (2003) and Bleidorn et al. (2022) put this at r ≈ .1–.3.
export const TEMPERAMENT_TO_ADULT_R = 0.25;

// ---------- working backwards (reverse mode) ----------
// Parent–child correlation for one parent ≈ h²/2 under additive genetics (≈ .19–.23 here). Infant temperament is
// moderately heritable too (S2005), so we use the same figure for baby temperament. Estimate.
export const PARENT_CHILD_R = (t: Trait) => HERITABILITY[t].h2 / 2;
// How well a grown child's rating of a parent matches the parent's own (CO2010: family observers are among the most
// accurate). By how sure the user says they are. Estimates.
export const PARENT_RATING_VALIDITY: Record<number, number> = { 1: 0.6, 2: 0.5, 3: 0.35 };
// How well a retold story of infancy tracks real infant temperament, by recall confidence. Estimates.
export const RECALL_VALIDITY: Record<string, number> = { "0.6": 0.5, "1": 0.4, "1.4": 0.25 };

// Effects of life events on traits over the forecast window, in SD units (research.json → life_factors).
export type LifeEvent =
  | "relationship"
  | "job"
  | "university"
  | "abroad"
  | "parenthood"
  | "therapy"
  | "practice"
  | "unemployment";

export const LIFE_EVENTS: Record<
  LifeEvent,
  { label: string; blurb: string; d: Record<Trait, number>; src: string; estimate?: boolean }
> = {
  relationship: { label: "Long-term relationship", blurb: "First committed partnership", d: { O: 0, C: 0.1, E: 0.15, A: 0, N: -0.2 }, src: "NA2001", estimate: true },
  job: { label: "First full-time job", blurb: "Social investment in work", d: { O: 0, C: 0.15, E: 0.05, A: 0.05, N: -0.1 }, src: "B2013", estimate: true },
  university: { label: "University", blurb: "Transition to university life", d: { O: 0.1, C: 0.15, E: 0, A: 0.1, N: -0.15 }, src: "L2011", estimate: true },
  abroad: { label: "Living abroad", blurb: "Sojourn of 6+ months", d: { O: 0.14, C: 0, E: 0.05, A: 0.1, N: -0.12 }, src: "ZN2013", estimate: true },
  parenthood: { label: "Becoming a parent", blurb: "Effects are surprisingly small", d: { O: 0, C: 0, E: 0, A: 0, N: 0 }, src: "VS2016" },
  therapy: { label: "Therapy / coaching", blurb: "Clinical or coaching intervention", d: { O: 0.13, C: 0.19, E: 0.23, A: 0.15, N: -0.57 }, src: "R2017" },
  practice: { label: "Deliberate practice", blurb: "Weekly behaviour challenges", d: { O: 0.35, C: 0.35, E: 0.35, A: 0.35, N: -0.35 }, src: "S2021", estimate: true },
  unemployment: { label: "Long unemployment", blurb: "Extended period without work", d: { O: -0.1, C: -0.2, E: 0, A: -0.1, N: 0.05 }, src: "BO2015", estimate: true },
};

// Upbringing factors: shift from temperament-predicted adult traits, in SD per unit of the (z-scored) answer.
export type Upbringing = "warmth" | "harshness" | "adversity" | "ses" | "moves" | "birthOrder";
export const UPBRINGING: Record<
  Upbringing,
  { label: string; d: Record<Trait, number>; src: string; estimate?: boolean; note: string }
> = {
  warmth: { label: "Parental warmth", d: { O: 0.05, C: 0.1, E: 0.05, A: 0.1, N: -0.1 }, src: "BTD2014", estimate: true, note: "Small effects: shared family environment explains little adult variance." },
  harshness: { label: "Harsh or strict parenting", d: { O: 0, C: -0.1, E: 0, A: -0.1, N: 0.15 }, src: "R2026", estimate: true, note: "Direction consistent with the childhood trauma literature; size estimated." },
  adversity: { label: "Childhood adversity", d: { O: 0, C: -0.05, E: -0.05, A: -0.05, N: 0.23 }, src: "R2026", note: "Meta-analysis of 136 studies: childhood trauma relates to adult neuroticism, g = .46 for significant adversity." },
  ses: { label: "Family resources", d: { O: 0.1, C: 0.05, E: 0.05, A: 0, N: -0.05 }, src: "A2018", estimate: true, note: "Parental SES correlates weakly (r ≲ .10) with offspring traits, most for openness." },
  moves: { label: "Frequent moves / school changes", d: { O: 0.05, C: -0.03, E: -0.03, A: 0, N: 0.05 }, src: "J2014", estimate: true, note: "Instability has small, mixed associations." },
  birthOrder: { label: "Birth order", d: { O: 0, C: 0, E: 0, A: 0, N: 0 }, src: "RES2015", note: "Myth-buster: in 20,000+ people, birth order had no meaningful effect on personality." },
};

// Threshold for a "meaningful" change: half a standard deviation (common convention; Roberts & Mroczek 2008).
export const MEANINGFUL_CHANGE_SD = 0.5;

// TIPI norms (Gosling et al., 2003), 1–7 scale.
export const TIPI_NORMS: Record<Trait, { mean: number; sd: number }> = {
  E: { mean: 4.44, sd: 1.45 },
  A: { mean: 5.23, sd: 1.11 },
  C: { mean: 5.4, sd: 1.32 },
  N: { mean: 3.17, sd: 1.42 }, // emotional stability 4.83 reversed on 8-point
  O: { mean: 5.38, sd: 1.07 },
};
