// MBTI as a layer on top of the Big Five. We never measure MBTI directly: we estimate the chance of each letter from
// your Big Five scores, using McCrae & Costa (1989) correlations (shrunk for the TIPI's lower reliability) and cut
// points that reproduce the UK population split (OPP 2011). See research/mbti_science.md.
import data from "./mbti.json";
import { phi, stabilityOver, maturation, type Vec, type Report } from "./model";
import { TRAITS, LIFE_EVENTS, type Trait } from "./params";
import { directLean, DIRECT_WEIGHT_BY_DIM, type Oejts } from "./oejts";

export type Dim = "EI" | "SN" | "TF" | "JP";
type DimModel = {
  first: string;
  second: string;
  w: Partial<Record<Trait, number>>;
  sd: number;
  /** where the full MBTI scale splits the UK population */
  cut: number;
  r2: number;
  /**
   * The cut applied to the Big Five estimate of the scale: the population cut scaled by that estimate's spread
   * (cut × √r²), so each letter, and so each type, is given out about as often as it occurs in the UK. Comparing the
   * estimate with the raw cut instead hands the majority letter to almost everyone near the middle: on 15,700 real
   * adults that rule called only 0.5% INTP (UK 2.4%) and 14% intuitive (UK 23.5%). See research/simulation_report.md.
   */
  typeCut: number;
};
const withTypeCut = (m: Omit<DimModel, "typeCut">): DimModel => ({ ...m, typeCut: m.cut * Math.sqrt(m.r2) });
export type TypeInfo = { nickname: string; line: string; strengths: string[]; growth: { text: string; trait: Trait; direction: "up" | "down"; src: string }[] };
export type Person = { name: string; confidence: "self-reported" | "strong consensus" | "disputed"; field?: string; in_app: boolean };

const MODEL = Object.fromEntries(Object.entries(data.model).map(([d, m]) => [d, withTypeCut(m)])) as Record<Dim, DimModel>;
export const DIMS: Dim[] = ["EI", "SN", "TF", "JP"];
export const MBTI_TYPES = data.types as Record<string, TypeInfo>;
export const MBTI_PEOPLE = data.people as Record<string, Person[]>;
export const MBTI_PREVALENCE_UK = data.prevalence_uk as Record<string, number>;
export const MBTI_RETEST = data.retest;
export const MBTI_SOURCES = data.sources as Record<string, string>;
export const MBTI_HOW_TYPED = data.how_celebs_are_typed;
export const MBTI_GROWTH_CAVEAT = data.growth_caveat;
export const MBTI_DIM_MODEL = MODEL;

export type Letter = {
  dim: Dim;
  first: string;
  second: string;
  pSecond: number;
  letter: string;
  p: number;
  /** what the direct type questions said for this letter pair, when any were answered */
  direct?: { n: number; lean: number; letter: string | null; agrees: boolean | null };
  /** under 65% sure either way: shown as both letters */
  borderline: boolean;
};

export const BORDERLINE = 0.65;
/** Letters we are less sure of than this get the direct follow-up questions. */
export const CHECK_BELOW = 0.8;

const logit = (p: number) => Math.log(p / (1 - p));
const expit = (x: number) => 1 / (1 + Math.exp(-x));

/** Correlations of each MBTI scale with the NEO Big Five (McCrae & Costa, 1989), before any shrinking for a short questionnaire. */
const NEO_W: Record<Dim, Partial<Record<Trait, number>>> = {
  EI: { E: -0.72, N: 0.16 },
  SN: { O: 0.71, E: 0.15 },
  TF: { A: 0.45, C: -0.18, N: 0.15 },
  JP: { C: -0.48, O: 0.28, E: 0.17 },
};

/**
 * The letter model for a given measurement reliability per trait: weights = NEO correlation × √reliability, and the
 * unexplained part grows or shrinks to keep each scale at unit variance. The population cuts do not change; the type
 * cut follows the spread of the estimate.
 * With no reliabilities it is the quick-version (TIPI) model stored in mbti.json.
 */
/** The unshrunk NEO correlations (what the letters would be with a perfectly reliable test). */
export const neoWeights = () => NEO_W;

export function modelFor(rel?: Vec): Record<Dim, DimModel> {
  if (!rel) return MODEL;
  return Object.fromEntries(
    DIMS.map((d) => {
      const w = Object.fromEntries((Object.entries(NEO_W[d]) as [Trait, number][]).map(([t, c]) => [t, c * Math.sqrt(rel[t])])) as Partial<Record<Trait, number>>;
      const r2 = Object.values(w).reduce((s, x) => s + (x ?? 0) ** 2, 0);
      return [d, withTypeCut({ ...MODEL[d], w, r2, sd: Math.sqrt(1 - r2) })];
    }),
  ) as Record<Dim, DimModel>;
}

/**
 * How strongly you lean to each MBTI letter given Big Five z-scores (against the adult norm): the Big Five part is
 * Φ((weighted traits − type cut) / residual SD), so each type is handed out about as often as in the UK. Pass `rel` when the detailed
 * questionnaire was used, and `direct` when any of the direct type questions were answered: their lean is added to the
 * Big Five estimate in log-odds (see DIRECT_WEIGHT in oejts.ts).
 */
export function mbtiLetters(z: Vec, rel?: Vec, direct?: Oejts): Letter[] {
  const M = modelFor(rel);
  return DIMS.map((dim) => {
    const m = M[dim];
    const score = (Object.entries(m.w) as [Trait, number][]).reduce((s, [t, w]) => s + w * z[t], 0);
    const pBig5 = Math.min(1 - 1e-6, Math.max(1e-6, phi((score - m.typeCut) / m.sd)));
    const d = directLean(direct, dim);
    const pSecond = d.n ? expit(logit(pBig5) + (DIRECT_WEIGHT_BY_DIM[dim] * d.lean) / Math.sqrt(d.n)) : pBig5;
    const second = pSecond >= 0.5;
    const p = second ? pSecond : 1 - pSecond;
    const dLetter = d.lean > 0 ? m.second : d.lean < 0 ? m.first : null;
    return {
      dim,
      first: m.first,
      second: m.second,
      pSecond,
      letter: second ? m.second : m.first,
      p,
      borderline: p < BORDERLINE,
      ...(d.n ? { direct: { n: d.n, lean: d.lean, letter: dLetter, agrees: dLetter === null ? null : (pBig5 >= 0.5) === (d.lean > 0) } } : {}),
    };
  });
}

/** Letter pairs that always get the follow-up questions, because the Big Five read them less well (see DIRECT_WEIGHT_BY_DIM). */
export const ALWAYS_CHECK: Dim[] = ["EI", "SN"];

/** The letter pairs worth the follow-up questions: E/I and S/N always, the others when the Big Five leaves them under CHECK_BELOW sure. */
export function lettersToCheck(z: Vec, rel?: Vec): Dim[] {
  return mbtiLetters(z, rel)
    .filter((l) => ALWAYS_CHECK.includes(l.dim) || l.p < CHECK_BELOW)
    .map((l) => l.dim);
}

/** All 16 types with their probability (letters treated as independent given your Big Five), most likely first. */
export function mbtiTypes(z: Vec, rel?: Vec, direct?: Oejts): { type: string; p: number }[] {
  const L = mbtiLetters(z, rel, direct);
  const out: { type: string; p: number }[] = [];
  for (let i = 0; i < 16; i++) {
    let type = "";
    let p = 1;
    L.forEach((l, k) => {
      const useSecond = (i >> (3 - k)) & 1;
      type += useSecond ? l.second : l.first;
      p *= useSecond ? l.pSecond : 1 - l.pSecond;
    });
    out.push({ type, p });
  }
  return out.sort((a, b) => b.p - a.p);
}

export function closestType(z: Vec, rel?: Vec, direct?: Oejts) {
  const types = mbtiTypes(z, rel, direct);
  const top = types[0];
  const letters = mbtiLetters(z, rel, direct);
  return { ...top, info: MBTI_TYPES[top.type], people: MBTI_PEOPLE[top.type] ?? [], runnersUp: types.slice(1, 3), letters, confidence: typeConfidence(letters) };
}

export type Confidence = {
  /** the three letters we are surest of, e.g. "IN_J", and the chance all three are right (= the chance you are one of the top two types) */
  core: string;
  pCore: number;
  /** the least certain letter and its two options */
  open: { dim: Dim; first: string; second: string; p: number };
  level: "High" | "Good" | "Moderate" | "Low";
};

/** A fair summary of how sure we are: per letter, the three surest together, and the top two types that differ in one letter. */
export function typeConfidence(L: Letter[]): Confidence {
  const order = [...L.keys()].sort((i, j) => L[i].p - L[j].p);
  const weakest = order[0];
  const core = L.map((l, i) => (i === weakest ? "_" : l.letter)).join("");
  const pCore = L.reduce((s, l, i) => (i === weakest ? s : s * l.p), 1);
  const avg = L.reduce((s, l) => s + l.p, 0) / L.length;
  const level = avg >= 0.85 ? "High" : avg >= 0.75 ? "Good" : avg >= 0.65 ? "Moderate" : "Low";
  return { core, pCore, open: { dim: L[weakest].dim, first: L[weakest].first, second: L[weakest].second, p: L[weakest].p }, level };
}

/** The type for a whole report: detailed-test reliabilities and any direct type answers included. */
export const typeFor = (r: Report) => closestType(r.now, r.detailed ? r.rel : undefined, r.oejts);

// ---------- MBTI journey: born, now, later, and how to get to another type ----------

export type Dist = { type: string; p: number }[];
export type Journey = { born: Dist; now: Dist; later: Dist; pTypeChanges: number; pBornAsNow: number; letterFlip: Record<Dim, number> };

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
const score = (M: Record<Dim, DimModel>, dim: Dim, z: Vec) => (Object.entries(M[dim].w) as [Trait, number][]).reduce((s, [t, w]) => s + w * z[t], 0);
const typeOf = (M: Record<Dim, DimModel>, z: Vec, res: number[]) => DIMS.map((d, i) => (score(M, d, z) + res[i] > M[d].typeCut ? M[d].second : M[d].first)).join("");
const toDist = (m: Map<string, number>, n: number): Dist =>
  [...m].map(([type, c]) => ({ type, p: c / n })).sort((a, b) => b.p - a.p);
const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

/**
 * Monte Carlo over three uncertainties: the part of each MBTI scale the Big Five don't explain (kept the same for you now and
 * later, re-drawn for baby you), your Big Five change by the horizon (from the forecast), and baby temperament (from the
 * backwards estimate). Seeded, so the page shows the same numbers on every load.
 */
export function mbtiJourney(r: Report, n = 5000): Journey {
  const rnd = rng(1989);
  const M = modelFor(r.detailed ? r.rel : undefined);
  const M0 = MODEL; // baby you is estimated, not measured with a questionnaire
  const born = new Map<string, number>();
  const now = new Map<string, number>();
  const later = new Map<string, number>();
  let changes = 0;
  let bornAsNow = 0;
  const flips: Record<Dim, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const fc = Object.fromEntries(r.future.map((f) => [f.trait, f])) as Record<Trait, (typeof r.future)[number]>;
  for (let k = 0; k < n; k++) {
    const res = DIMS.map((d) => M[d].sd * gauss(rnd));
    const tNow = typeOf(M, r.now, res);
    const zLater = Object.fromEntries(TRAITS.map((t) => [t, fc[t].expected + fc[t].sd * gauss(rnd)])) as Vec;
    const tLater = typeOf(M, zLater, res);
    const zBaby = Object.fromEntries(TRAITS.map((t) => [t, r.backcast.traits[t].mean + r.backcast.traits[t].sd * gauss(rnd)])) as Vec;
    const tBorn = typeOf(
      M0,
      zBaby,
      DIMS.map((d) => M0[d].sd * gauss(rnd)),
    );
    bump(now, tNow);
    bump(later, tLater);
    bump(born, tBorn);
    if (tLater !== tNow) changes++;
    if (tBorn === tNow) bornAsNow++;
    DIMS.forEach((d, i) => {
      if (tNow[i] !== tLater[i]) flips[d]++;
    });
  }
  DIMS.forEach((d) => (flips[d] /= n));
  return { born: toDist(born, n), now: toDist(now, n), later: toDist(later, n), pTypeChanges: changes / n, pBornAsNow: bornAsNow / n, letterFlip: flips };
}

export type PathStep = { dim: Dim; from: string; to: string; trait: Trait; direction: "up" | "down" };
export type TypePath = { target: string; steps: PathStep[]; odds: { label: string; y1: number; y3: number }[] };

/** What it would take to become `target`: which letters must flip, the Big Five trait behind each, and the odds under three strategies. */
export function pathToType(r: Report, age: number, target: string, n = 3000): TypePath {
  const M = modelFor(r.detailed ? r.rel : undefined);
  const cur = closestType(r.now, r.detailed ? r.rel : undefined).type;
  const steps: PathStep[] = [];
  DIMS.forEach((d, i) => {
    if (cur[i] === target[i]) return;
    const m = M[d];
    const [trait, w] = (Object.entries(m.w) as [Trait, number][]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
    const towardSecond = target[i] === m.second;
    steps.push({ dim: d, from: cur[i], to: target[i], trait, direction: (w > 0) === towardSecond ? "up" : "down" });
  });
  const strategies = [
    { label: "Life as usual", k: 0 },
    { label: "16 weeks of weekly challenges", k: 1 },
    { label: "Challenges + coaching/therapy", k: 2 },
  ];
  const odds = strategies.map((s) => {
    const p = (years: number) => {
      const rr = stabilityOver(age, years);
      const sd = Math.sqrt(1 - rr * rr);
      const mat = maturation(age, age + years);
      const push: Partial<Record<Trait, number>> = {};
      for (const st of steps) {
        const prac = Math.abs(LIFE_EVENTS.practice.d[st.trait]);
        const ther = Math.abs(LIFE_EVENTS.therapy.d[st.trait]);
        const size = s.k === 0 ? 0 : s.k === 1 ? prac : prac + ther * 0.6;
        push[st.trait] = (st.direction === "up" ? 1 : -1) * size;
      }
      const rnd = rng(7 + years * 31 + s.k);
      let hit = 0;
      for (let k = 0; k < n; k++) {
        const res = DIMS.map((d) => M[d].sd * gauss(rnd));
        const z = Object.fromEntries(TRAITS.map((t) => [t, r.now[t] + (rr - 1) * r.now[t] + mat[t] + (push[t] ?? 0) + sd * gauss(rnd)])) as Vec;
        if (typeOf(M, z, res) === target) hit++;
      }
      return hit / n;
    };
    return { label: s.label, y1: p(1), y3: p(3) };
  });
  return { target, steps, odds };
}
