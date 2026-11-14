// MBTI as a layer on top of the Big Five. We never measure MBTI directly: we estimate the chance of each letter from
// your Big Five scores, using McCrae & Costa (1989) correlations (shrunk for the TIPI's lower reliability) and cut
// points that reproduce the UK population split (OPP 2011). See research/mbti_science.md.
import data from "./mbti.json";
import { phi, stabilityOver, maturation, type Vec, type Report } from "./model";
import { TRAITS, LIFE_EVENTS, type Trait } from "./params";

type Dim = "EI" | "SN" | "TF" | "JP";
type DimModel = { first: string; second: string; w: Partial<Record<Trait, number>>; sd: number; cut: number; r2: number };
export type TypeInfo = { nickname: string; line: string; strengths: string[]; growth: { text: string; trait: Trait; direction: "up" | "down"; src: string }[] };
export type Person = { name: string; confidence: "self-reported" | "strong consensus" | "disputed"; field?: string; in_app: boolean };

const MODEL = data.model as Record<Dim, DimModel>;
export const DIMS: Dim[] = ["EI", "SN", "TF", "JP"];
export const MBTI_TYPES = data.types as Record<string, TypeInfo>;
export const MBTI_PEOPLE = data.people as Record<string, Person[]>;
export const MBTI_PREVALENCE_UK = data.prevalence_uk as Record<string, number>;
export const MBTI_RETEST = data.retest;
export const MBTI_SOURCES = data.sources as Record<string, string>;
export const MBTI_HOW_TYPED = data.how_celebs_are_typed;
export const MBTI_GROWTH_CAVEAT = data.growth_caveat;
export const MBTI_DIM_MODEL = MODEL;

export type Letter = { dim: Dim; first: string; second: string; pSecond: number; letter: string; p: number };

/** Chance of each MBTI letter given Big Five z-scores (against the adult norm). */
export function mbtiLetters(z: Vec): Letter[] {
  return DIMS.map((dim) => {
    const m = MODEL[dim];
    const score = (Object.entries(m.w) as [Trait, number][]).reduce((s, [t, w]) => s + w * z[t], 0);
    const pSecond = phi((score - m.cut) / m.sd);
    const second = pSecond >= 0.5;
    return { dim, first: m.first, second: m.second, pSecond, letter: second ? m.second : m.first, p: second ? pSecond : 1 - pSecond };
  });
}

/** All 16 types with their probability (letters treated as independent given your Big Five), most likely first. */
export function mbtiTypes(z: Vec): { type: string; p: number }[] {
  const L = mbtiLetters(z);
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

export function closestType(z: Vec) {
  const types = mbtiTypes(z);
  const top = types[0];
  return { ...top, info: MBTI_TYPES[top.type], people: MBTI_PEOPLE[top.type] ?? [], runnersUp: types.slice(1, 3), letters: mbtiLetters(z) };
}

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
const score = (dim: Dim, z: Vec) => (Object.entries(MODEL[dim].w) as [Trait, number][]).reduce((s, [t, w]) => s + w * z[t], 0);
const typeOf = (z: Vec, res: number[]) => DIMS.map((d, i) => (score(d, z) + res[i] > MODEL[d].cut ? MODEL[d].second : MODEL[d].first)).join("");
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
  const born = new Map<string, number>();
  const now = new Map<string, number>();
  const later = new Map<string, number>();
  let changes = 0;
  let bornAsNow = 0;
  const flips: Record<Dim, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const fc = Object.fromEntries(r.future.map((f) => [f.trait, f])) as Record<Trait, (typeof r.future)[number]>;
  for (let k = 0; k < n; k++) {
    const res = DIMS.map((d) => MODEL[d].sd * gauss(rnd));
    const tNow = typeOf(r.now, res);
    const zLater = Object.fromEntries(TRAITS.map((t) => [t, fc[t].expected + fc[t].sd * gauss(rnd)])) as Vec;
    const tLater = typeOf(zLater, res);
    const zBaby = Object.fromEntries(TRAITS.map((t) => [t, r.backcast.traits[t].mean + r.backcast.traits[t].sd * gauss(rnd)])) as Vec;
    const tBorn = typeOf(
      zBaby,
      DIMS.map((d) => MODEL[d].sd * gauss(rnd)),
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
  const cur = closestType(r.now).type;
  const steps: PathStep[] = [];
  DIMS.forEach((d, i) => {
    if (cur[i] === target[i]) return;
    const m = MODEL[d];
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
        const res = DIMS.map((d) => MODEL[d].sd * gauss(rnd));
        const z = Object.fromEntries(TRAITS.map((t) => [t, r.now[t] + (rr - 1) * r.now[t] + mat[t] + (push[t] ?? 0) + sd * gauss(rnd)])) as Vec;
        if (typeOf(z, res) === target) hit++;
      }
      return hit / n;
    };
    return { label: s.label, y1: p(1), y3: p(3) };
  });
  return { target, steps, odds };
}
