import {
  TRAITS,
  type Trait,
  type LifeEvent,
  HERITABILITY,
  STABILITY_BY_AGE,
  STABILITY_TYPICAL_LAG,
  STABILITY_SLOPE_PER_YEAR_LAG,
  MEASURE_RELIABILITY,
  MATURATION,
  TEMPERAMENT_TO_ADULT_R,
  LIFE_EVENTS,
  UPBRINGING,
  MEANINGFUL_CHANGE_SD,
  TIPI_NORMS,
  PARENT_CHILD_R,
  PARENT_RATING_VALIDITY,
  RECALL_VALIDITY,
  type Upbringing,
} from "./params";
import { TEMPERAMENT_ITEMS, TIPI_ITEMS, IPIP_ITEMS, STEADY_ITEMS, IPIP_MIN_PER_TRAIT, ipipOnFive, type Answers } from "./questions";
import neo120 from "./bank/ipipNeo120.json";
import ipipNorms from "./ipipNorms.json";
import type { Oejts } from "./oejts";
import type { InstinctAnswers } from "./enneagram";

const IPIP_NORMS = ipipNorms.traits as Record<Trait, { mean: number; sd: number; alpha: number }>;
/** TIPI two-item test–retest reliabilities (Gosling et al., 2003), used to shrink MBTI weights for the quick version. */
export const TIPI_REL: Vec = { E: 0.77, A: 0.71, C: 0.76, N: 0.7, O: 0.62 };
export const IPIP_REL: Vec = { O: IPIP_NORMS.O.alpha, C: IPIP_NORMS.C.alpha, E: IPIP_NORMS.E.alpha, A: IPIP_NORMS.A.alpha, N: IPIP_NORMS.N.alpha };

export type Vec = Record<Trait, number>;
const zeros = (): Vec => ({ O: 0, C: 0, E: 0, A: 0, N: 0 });
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

// ---------- statistics helpers ----------
export function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26
  const s = Math.sign(x);
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
export const phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));
export const pct = (z: number) => Math.round(phi(z) * 100);
/** P(|X| > t) for X ~ N(mu, sd²) */
const pAbsBeyond = (mu: number, sd: number, t: number) => 1 - phi((t - mu) / sd) + phi((-t - mu) / sd);
/** P(X > t) */
const pAbove = (mu: number, sd: number, t: number) => 1 - phi((t - mu) / sd);

// ---------- layer 1: early temperament ----------
export function temperamentZ(a: Answers): Vec {
  const out = zeros();
  for (const t of TRAITS) {
    let num = 0;
    let ss = 0;
    for (const item of TEMPERAMENT_ITEMS) {
      const l = item.loadings[t];
      if (!l) continue;
      num += l * ((a.temperament[item.id] ?? 3) - 3);
      ss += Math.abs(l);
    }
    // Weighted mean deviation from "typical" (3); items are correlated, so this behaves like a z-score in ±2.
    out[t] = ss ? clamp(num / ss, -2.2, 2.2) : 0;
  }
  return out;
}

/** Thomas & Chess style label (easy / difficult / slow-to-warm-up). */
export function temperamentType(a: Answers): { label: string; blurb: string; share: string } {
  const g = (id: string) => a.temperament[id] ?? 3;
  const difficult = g("fussy") + g("intense") - g("regular") - g("adaptable");
  const slow = g("fearful") - g("approach") + (3 - Math.abs(g("intense") - 3));
  if (difficult >= 3) return TYPE_INFO.Spirited;
  if (slow >= 4) return TYPE_INFO["Slow-to-warm-up"];
  if (g("adaptable") + g("smiley") + g("regular") >= 11) return TYPE_INFO.Easy;
  return TYPE_INFO.Mixed;
}

export const TYPE_INFO: Record<"Spirited" | "Slow-to-warm-up" | "Easy" | "Mixed", { label: string; blurb: string; share: string }> = {
  Spirited: { label: "Spirited (\"difficult\")", blurb: "Intense, irregular and quick to protest. Often grows into a passionate, driven adult.", share: "≈10% of babies" },
  "Slow-to-warm-up": { label: "Slow-to-warm-up", blurb: "Cautious with the new, then settles in. Often grows into a thoughtful, observant adult.", share: "≈15% of babies" },
  Easy: { label: "Easy", blurb: "Regular, cheerful and adaptable. The temperament parents dream about.", share: "≈40% of babies" },
  Mixed: { label: "Mixed", blurb: "A blend that doesn't fit one box, like about a third of children.", share: "≈35% of babies" },
};

// ---------- layer 2: upbringing ----------
function upbringingZ(a: Answers): Record<Upbringing, number> {
  const u = a.upbringing;
  const z = (x: number | undefined, mid = 3) => ((x ?? mid) - mid) / 1.4; // 1–5 scale, SD ≈ 1.4
  return {
    warmth: z(u.warmth),
    harshness: z(u.harshness),
    // 1 = none … 5 = a lot. "A lot" ≈ the significant-trauma group in Rosenek et al. (2026), g = .46 on neuroticism.
    adversity: ((u.adversity ?? 1) - 1) / 2,
    ses: z(u.ses),
    moves: z(u.moves, 2),
    birthOrder: 0,
  };
}

// Upbringing effects overlap (harsh homes are often unstable and less warm), so we cap their combined shift.
const MAX_UPBRINGING_SHIFT = 0.6;

export type Driver = { label: string; effect: number; src: string };

/** Expected adult trait (z, vs same-age peers) given temperament + upbringing. */
export function predictedAdult(a: Answers, T: Vec) {
  const uz = upbringingZ(a);
  const rEff = TEMPERAMENT_TO_ADULT_R * clamp(1.3 - 0.5 * a.confidence, 0.55, 1);
  const mu = zeros();
  const sd = zeros();
  const drivers: Record<Trait, Driver[]> = { O: [], C: [], E: [], A: [], N: [] };
  for (const t of TRAITS) {
    let up = 0;
    drivers[t].push({ label: "Baby temperament", effect: rEff * T[t], src: "C2003" });
    let explained = rEff * rEff;
    for (const k of Object.keys(UPBRINGING) as Upbringing[]) {
      const e = UPBRINGING[k].d[t] * uz[k];
      up += e;
      explained += (UPBRINGING[k].d[t] * 0.9) ** 2;
      if (Math.abs(e) > 0.01) drivers[t].push({ label: UPBRINGING[k].label, effect: e, src: UPBRINGING[k].src });
    }
    mu[t] = rEff * T[t] + clamp(up, -MAX_UPBRINGING_SHIFT, MAX_UPBRINGING_SHIFT);
    sd[t] = Math.sqrt(Math.max(0.5, 1 - explained));
    drivers[t].sort((x, y) => Math.abs(y.effect) - Math.abs(x.effect));
  }
  return { mu, sd, drivers, rEff };
}

// ---------- current personality (TIPI, or the 50-item IPIP when taken) ----------
/** Per-trait IPIP z-scores for traits with enough answers; null for the rest. */
export function ipipZ(a: Answers): Partial<Record<Trait, number>> {
  if (a.inventory !== "detailed" || !a.ipip) return {};
  const sums: Record<Trait, number[]> = { O: [], C: [], E: [], A: [], N: [] };
  const five = ipipOnFive(a);
  IPIP_ITEMS.forEach((it, i) => {
    const raw = five[i] ?? 0;
    if (raw >= 1 && raw <= 5) sums[it.trait].push(it.reverse ? 6 - raw : raw);
  });
  const out: Partial<Record<Trait, number>> = {};
  for (const t of TRAITS) {
    if (sums[t].length < IPIP_MIN_PER_TRAIT) continue;
    const m = sums[t].reduce((x, y) => x + y, 0) / sums[t].length;
    out[t] = clamp((m - IPIP_NORMS[t].mean) / IPIP_NORMS[t].sd, -2.5, 2.5);
  }
  const extra = steadyZ(five.slice(IPIP_ITEMS.length));
  if (extra != null && out.N != null) out.N = clamp(blendN(out.N, extra), -2.5, 2.5);
  return out;
}

/** Facet norms (Johnson's adult norms, per-item 1-5 scale) for the extra Neuroticism statements. */
const FACET_NORMS = (neo120 as { norms: { adult: { facets: Record<string, { mean: number; sd: number }> } } }).norms.adult.facets;
/** Typical correlation between the Neuroticism facets, used to put the mean of facet z-scores back on a unit scale. */
const FACET_R = 0.5;
/** Typical correlation between two Neuroticism scales from different item sets. */
const SCALE_R = 0.8;
export const STEADY_MIN = 5;

/**
 * The extra Neuroticism statements as one z-score: each facet scored against its own norm, the facet z-scores
 * averaged and rescaled to unit variance. Null when fewer than STEADY_MIN were answered.
 */
export function steadyZ(five: number[]): number | null {
  const byFacet = new Map<string, number[]>();
  STEADY_ITEMS.forEach((it, i) => {
    const v = five[i] ?? 0;
    if (v >= 1 && v <= 5) byFacet.set(it.facet, [...(byFacet.get(it.facet) ?? []), it.reverse ? 6 - v : v]);
  });
  const answered = [...byFacet.values()].reduce((s, xs) => s + xs.length, 0);
  if (answered < STEADY_MIN) return null;
  const zs = [...byFacet].map(([f, xs]) => (xs.reduce((a, b) => a + b, 0) / xs.length - FACET_NORMS[f].mean) / FACET_NORMS[f].sd);
  const k = zs.length;
  return zs.reduce((a, b) => a + b, 0) / k / Math.sqrt((1 + (k - 1) * FACET_R) / k);
}

/** The 50-statement Neuroticism score and the extra one, weighted by their number of statements and kept on a unit scale. */
export function blendN(z50: number, zExtra: number): number {
  const w1 = 10 / (10 + STEADY_ITEMS.length);
  const w2 = 1 - w1;
  return (w1 * z50 + w2 * zExtra) / Math.sqrt(w1 * w1 + w2 * w2 + 2 * w1 * w2 * SCALE_R);
}

/** Which questionnaire each trait was measured with, and how reliable that is. */
export function measurement(a: Answers): { detailed: Record<Trait, boolean>; rel: Vec } {
  const ip = ipipZ(a);
  const detailed = Object.fromEntries(TRAITS.map((t) => [t, ip[t] != null])) as Record<Trait, boolean>;
  const rel = Object.fromEntries(TRAITS.map((t) => [t, detailed[t] ? IPIP_REL[t] : TIPI_REL[t]])) as Vec;
  return { detailed, rel };
}

export function currentZ(a: Answers): Vec {
  const sums: Record<Trait, number[]> = { O: [], C: [], E: [], A: [], N: [] };
  TIPI_ITEMS.forEach((it, i) => {
    const raw = a.tipi[i] ?? 4;
    sums[it.trait].push(it.reverse ? 8 - raw : raw);
  });
  const ip = ipipZ(a);
  const out = zeros();
  for (const t of TRAITS) {
    const m = sums[t].reduce((x, y) => x + y, 0) / sums[t].length;
    out[t] = ip[t] ?? clamp((m - TIPI_NORMS[t].mean) / TIPI_NORMS[t].sd, -2.5, 2.5);
  }
  return out;
}

export function stabilityAt(age: number): number {
  const s = STABILITY_BY_AGE;
  if (age <= s[0].age) return s[0].r;
  for (let i = 1; i < s.length; i++) {
    if (age <= s[i].age) {
      const f = (age - s[i - 1].age) / (s[i].age - s[i - 1].age);
      return s[i - 1].r + f * (s[i].r - s[i - 1].r);
    }
  }
  return s[s.length - 1].r;
}

/**
 * True-score rank-order stability over `years` starting at `age`.
 * At the meta-analysis's typical lag we use the Bleidorn et al. (2022) age curve, disattenuated for measurement error.
 * Shorter lags interpolate smoothly up to r = 1 at lag 0; longer lags follow Bleidorn's slope of -.011 per year.
 */
export function stabilityOver(age: number, years: number): number {
  const rTyp = clamp(stabilityAt(age) / MEASURE_RELIABILITY, 0.05, 0.97);
  if (years <= STABILITY_TYPICAL_LAG) return 1 - (1 - rTyp) * Math.sqrt(Math.max(years, 0) / STABILITY_TYPICAL_LAG);
  return clamp(rTyp + (STABILITY_SLOPE_PER_YEAR_LAG * (years - STABILITY_TYPICAL_LAG)) / MEASURE_RELIABILITY, 0.05, 0.97);
}

export function maturation(from: number, to: number): Vec {
  const out = zeros();
  for (const band of MATURATION) {
    const lo = Math.max(from, band.from);
    const hi = Math.min(to, band.to);
    if (hi <= lo) continue;
    for (const t of TRAITS) out[t] += band.d[t] * (hi - lo);
  }
  return out;
}

const EVENT_WINDOW_YEARS = 3;

export type TraitForecast = {
  trait: Trait;
  now: number; // z
  expected: number; // z at horizon
  sd: number;
  pChange: number; // P(|Δ| ≥ 0.5 SD)
  pUp: number;
  pDown: number;
  drivers: Driver[];
};

export function forecast(nowZ: Vec, age: number, horizon: number, events: LifeEvent[]): TraitForecast[] {
  const years = Math.max(0.5, horizon - age);
  const r = stabilityOver(age, years);
  const mat = maturation(age, horizon);
  return TRAITS.map((t) => {
    const drivers: Driver[] = [];
    // Regression toward the population mean is part of how rank-order stability works.
    const regress = (r - 1) * nowZ[t];
    drivers.push({ label: "Natural drift toward average", effect: regress, src: "BL2022" });
    drivers.push({ label: `Maturation, age ${age}→${horizon}`, effect: mat[t], src: "RWV2006" });
    let mu = regress + mat[t];
    for (const e of events) {
      if (e === "practice") continue; // directional; handled in target planner
      const d = LIFE_EVENTS[e].d[t] * Math.min(1, years / EVENT_WINDOW_YEARS); // events play out over a few years
      mu += d;
      if (Math.abs(d) > 0.01) drivers.push({ label: LIFE_EVENTS[e].label, effect: d, src: LIFE_EVENTS[e].src });
    }
    const sd = Math.sqrt(1 - r * r);
    drivers.sort((x, y) => Math.abs(y.effect) - Math.abs(x.effect));
    return {
      trait: t,
      now: nowZ[t],
      expected: nowZ[t] + mu,
      sd,
      pChange: pAbsBeyond(mu, sd, MEANINGFUL_CHANGE_SD),
      pUp: pAbove(mu, sd, MEANINGFUL_CHANGE_SD),
      pDown: phi((-MEANINGFUL_CHANGE_SD - mu) / sd),
      drivers,
    };
  });
}

// ---------- target planner ----------
export type TargetScenario = { label: string; p: number };
export type TargetPlan = { trait: Trait; nowPct: number; targetPct: number; gap: number; scenarios: TargetScenario[] };

export function planTarget(nowZ: Vec, targetPct: Vec, age: number, years = 1): TargetPlan[] {
  const r = stabilityOver(age, years);
  const sd = Math.sqrt(1 - r * r);
  const mat = maturation(age, age + years);
  return TRAITS.map((t) => {
    const targetZ = invPhi(clamp(targetPct[t], 1, 99) / 100);
    const gap = targetZ - nowZ[t];
    const dir = Math.sign(gap) || 1;
    const tol = 0.25;
    const need = Math.abs(gap) - tol;
    const base = (r - 1) * nowZ[t] + mat[t];
    const prac = Math.abs(LIFE_EVENTS.practice.d[t]);
    const ther = Math.abs(LIFE_EVENTS.therapy.d[t]);
    const p = (shift: number) => (need <= 0 ? 0.95 : pAbove(dir * base + shift, sd, need));
    return {
      trait: t,
      nowPct: pct(nowZ[t]),
      targetPct: targetPct[t],
      gap,
      scenarios: [
        { label: "Life as usual", p: p(0) },
        { label: "16 weeks of weekly challenges", p: p(prac) },
        { label: "Challenges + coaching/therapy", p: p(prac + ther * 0.6) },
      ],
    };
  });
}

export function invPhi(p: number): number {
  // Acklam's approximation
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// ---------- working backwards: from you now (and your parents) to baby you ----------
// Everything is jointly normal per trait, on z-scales: baby temperament T ~ N(0,1); you now, each parent rating and
// (optionally) your retold infancy are noisy, correlated readings of it. We condition T on whatever you gave us.

export type Evidence = { label: string; info: number };
export type BackcastTrait = { mean: number; sd: number; lo: number; hi: number; pHigher: number; pDrift: number; evidence: Evidence[] };
export type TypeName = "Spirited" | "Slow-to-warm-up" | "Easy" | "Mixed";
export type Backcast = { traits: Record<Trait, BackcastTrait>; types: Record<TypeName, number>; usedRecall: boolean; parentsUsed: number };

/** Base rates of Thomas & Chess types; trait-space cut-offs below reproduce them when nothing is known. */
export const TYPE_BASE: Record<TypeName, number> = { Spirited: 0.1, "Slow-to-warm-up": 0.15, Easy: 0.4, Mixed: 0.35 };
const CUT_SPIRITED = 1.2816; // top 10% of (N − A − C)/√3
const CUT_SLOW = 0.905; // with the rule order below, 15% overall (simulated, 400k draws)
const CUT_EASY = 0.229; // 40% overall

/** Thomas & Chess type from baby temperament in trait space (z-scores). */
export function typeFromTraits(T: Vec): TypeName {
  if ((T.N - T.A - T.C) / Math.sqrt(3) > CUT_SPIRITED) return "Spirited";
  if ((-T.E + 0.5 * T.N) / Math.sqrt(1.25) > CUT_SLOW) return "Slow-to-warm-up";
  if ((-T.N + T.A + T.E) / Math.sqrt(3) > CUT_EASY) return "Easy";
  return "Mixed";
}

/** Solve S x = b for a small symmetric positive-definite S (Gaussian elimination with partial pivoting). */
function solve(S: number[][], b: number[]): number[] {
  const n = b.length;
  const M = S.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) x[r] = (M[r][n] - M[r].slice(r + 1, n).reduce((s, v, k) => s + v * x[r + 1 + k], 0)) / M[r][r];
  return x;
}

/** Conditional mean and variance of a standard-normal T given readings o with cov(T, o) = c and cov(o) = S. */
export function conditionNormal(c: number[], S: number[][], o: number[]): { mean: number; variance: number } {
  if (!o.length) return { mean: 0, variance: 1 };
  const w = solve(S, c); // S⁻¹ c (S symmetric)
  return { mean: w.reduce((s, v, i) => s + v * o[i], 0), variance: Math.max(1e-6, 1 - w.reduce((s, v, i) => s + v * c[i], 0)) };
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function backcast(a: Answers): Backcast {
  const now = currentZ(a);
  // Upbringing shift on the adult trait, with the latent temperament weight (no recall shrinkage).
  const U = predictedAdult({ ...a, confidence: 0.6 }, zeros()).mu;
  const R = temperamentZ(a);
  const usedRecall = a.babyKnown !== false;
  const vR = RECALL_VALIDITY[String(a.confidence)] ?? 0.4;
  const parents = (a.parents ?? []).slice(0, 2);
  const r = TEMPERAMENT_TO_ADULT_R;
  const traits = {} as Record<Trait, BackcastTrait>;
  let parentsUsed = 0;
  for (const t of TRAITS) {
    const pc = PARENT_CHILD_R(t);
    // Readings: [label, value, cov with T, loading on the shared genetic path (for cross-covariances)]
    type Reading = { label: string; value: number; cT: number; kind: "now" | "parent" | "recall"; v: number };
    const rd: Reading[] = [{ label: "You now", value: now[t] - U[t], cT: r, kind: "now", v: 1 }];
    parents.forEach((p, i) => {
      const x = p?.traits?.[t];
      if (typeof x !== "number") return;
      const v = PARENT_RATING_VALIDITY[p.sure] ?? 0.5;
      rd.push({ label: `Parent ${i + 1}`, value: clamp((x - 3) / 1.1, -1.8, 1.8), cT: pc * v, kind: "parent", v });
    });
    if (usedRecall) rd.push({ label: "Stories of baby you", value: R[t], cT: vR, kind: "recall", v: vR });
    const cov = (x: Reading, y: Reading) => {
      if (x === y) return 1;
      const k = [x.kind, y.kind].sort().join("-");
      if (k === "now-parent") return pc * (x.kind === "parent" ? x.v : y.v); // parents' genes reach adult you directly too
      if (k === "parent-parent") return 0;
      if (k === "now-recall") return vR * r;
      if (k === "parent-recall") return vR * pc * (x.kind === "parent" ? x.v : y.v);
      return 0;
    };
    const S = rd.map((x) => rd.map((y) => cov(x, y)));
    const { mean, variance } = conditionNormal(
      rd.map((x) => x.cT),
      S,
      rd.map((x) => x.value),
    );
    const sd = Math.sqrt(variance);
    // How much each reading narrows the range: drop it and see how much wider the posterior gets.
    const evidence = rd.map((x, i) => {
      const keep = rd.filter((_, j) => j !== i);
      const v0 = conditionNormal(
        keep.map((y) => y.cT),
        keep.map((y) => keep.map((z) => cov(y, z))),
        keep.map((y) => y.value),
      ).variance;
      return { label: x.label, info: Math.max(0, v0 - variance) };
    });
    if (rd.some((x) => x.kind === "parent")) parentsUsed = Math.max(parentsUsed, rd.filter((x) => x.kind === "parent").length);
    traits[t] = {
      mean,
      sd,
      lo: mean - 1.2816 * sd,
      hi: mean + 1.2816 * sd,
      pHigher: pAbove(mean, sd, now[t]),
      pDrift: pAbsBeyond(now[t] - mean, sd, MEANINGFUL_CHANGE_SD),
      evidence,
    };
  }
  // Type probabilities: sample baby temperament from the posterior (seeded, so server and browser agree).
  const rnd = mulberry32(20261114);
  const counts: Record<TypeName, number> = { Spirited: 0, "Slow-to-warm-up": 0, Easy: 0, Mixed: 0 };
  const N = 4000;
  for (let i = 0; i < N; i++) {
    const T = zeros();
    for (const t of TRAITS) {
      const g = Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
      T[t] = traits[t].mean + traits[t].sd * g;
    }
    counts[typeFromTraits(T)]++;
  }
  const types = Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v / N])) as Record<TypeName, number>;
  return { traits, types, usedRecall, parentsUsed };
}

// ---------- full report ----------
export type Report = {
  /** true when baby you was worked out backwards (the baby questions were skipped) */
  reverse: boolean;
  backcast: Backcast;
  temperament: Vec;
  temperamentType: ReturnType<typeof temperamentType>;
  predictedAdult: Vec;
  predictedSd: Vec;
  now: Vec;
  /** P(adult trait ≥ 0.5 SD away from baby temperament), from the model alone */
  pChangedFromBaby: Vec;
  /** how surprising your actual adult trait is vs the model (z) */
  surprise: Vec;
  upbringingDrivers: Record<Trait, Driver[]>;
  future: TraitForecast[];
  carryover: number; // variance in adult trait explained by temperament
  nature: Record<Trait, { genes: number; shared: number; unique: number }>;
  /** reliability of the questionnaire each trait was measured with (TIPI retest, or IPIP-50 alpha) */
  rel: Vec;
  detailed: boolean;
  /** answers to the direct type questions (OEJTS item id -> 1-5), when any were asked */
  oejts?: Oejts;
  /** Enneagram instinct statements, when answered */
  instincts?: InstinctAnswers;
};

export function buildReport(a: Answers): Report {
  const reverse = a.babyKnown === false;
  const bc = backcast(a);
  const T = reverse ? (Object.fromEntries(TRAITS.map((t) => [t, bc.traits[t].mean])) as Vec) : temperamentZ(a);
  const pa = predictedAdult(a, T);
  const now = currentZ(a);
  const meas = measurement(a);
  const pChangedFromBaby = zeros();
  const surprise = zeros();
  const nature = {} as Report["nature"];
  for (const t of TRAITS) {
    pChangedFromBaby[t] = reverse ? bc.traits[t].pDrift : pAbsBeyond(pa.mu[t] - T[t], pa.sd[t], MEANINGFUL_CHANGE_SD);
    surprise[t] = reverse ? 0 : (now[t] - pa.mu[t]) / pa.sd[t];
    const h = HERITABILITY[t];
    nature[t] = { genes: h.h2, shared: h.c2, unique: 1 - h.h2 - h.c2 };
  }
  const likeliest = (Object.entries(bc.types) as [keyof typeof TYPE_INFO, number][]).sort((x, y) => y[1] - x[1])[0][0];
  return {
    reverse,
    backcast: bc,
    temperament: T,
    temperamentType: reverse ? TYPE_INFO[likeliest] : temperamentType(a),
    predictedAdult: pa.mu,
    predictedSd: pa.sd,
    now,
    pChangedFromBaby,
    surprise,
    upbringingDrivers: pa.drivers,
    future: forecast(now, a.age, a.horizon, a.events),
    carryover: pa.rEff * pa.rEff,
    nature,
    rel: meas.rel,
    detailed: TRAITS.some((t) => meas.detailed[t]),
    ...(a.oejts ? { oejts: a.oejts } : {}),
    ...(a.instincts ? { instincts: a.instincts } : {}),
  };
}

export const toPct = (v: Vec): Vec => ({ O: pct(v.O), C: pct(v.C), E: pct(v.E), A: pct(v.A), N: pct(v.N) });
