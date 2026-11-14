/*
 * Synthetic people for the v2 coach data. Each one is a set of questionnaire answers run through the app's own model
 * (buildReport), so every percentile, probability and type in a prompt is what the app would really show.
 *
 * Coverage is steered three ways: towards each of the 16 four-letter types (clear and borderline), towards each of
 * the 243 low/mid/high Big Five patterns, and plain population draws. Upbringing comes from named scenarios.
 */
import norms from "@/lib/ipipNorms.json";
import { buildReport, toPct, phi, IPIP_REL, TIPI_REL, type Report, type Vec } from "@/lib/model";
import { sanitizeAnswers, TEMPERAMENT_ITEMS, IPIP_ITEMS, TIPI_ITEMS, type Answers } from "@/lib/questions";
import { TRAITS, TIPI_NORMS, type Trait, type LifeEvent } from "@/lib/params";
import { mbtiLetters, mbtiTypes, lettersToCheck, type Letter } from "@/lib/mbti";
import { OEJTS_ITEMS, type Oejts } from "@/lib/oejts";
import { NAMES, type StageKey } from "./content";

export type Rnd = () => number;
export function rng(seed: number): Rnd {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const gauss = (r: Rnd) => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
export const int = (r: Rnd, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
export const pick = <T,>(r: Rnd, a: readonly T[]): T => a[Math.floor(r() * a.length)];
export const shuffle = <T,>(r: Rnd, a: readonly T[]): T[] => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export const MBTI_ALL = ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"];

export const UPBRINGING_SCENARIOS: Record<string, [number[], number[], number[], number[], number[]]> = {
  // warmth, harshness, adversity, money, moves: each a list of plausible answers (1-5)
  typical: [[3, 4], [2, 3], [1, 2], [3], [1, 2]],
  "warm and stable": [[5], [2], [1], [3, 4], [1]],
  "strict and high-achieving": [[3], [4, 5], [1, 2], [4], [1, 2]],
  "cold and distant": [[1, 2], [3, 4], [2, 3], [3], [2]],
  "high adversity": [[2, 3], [3, 4], [4, 5], [2], [3, 4]],
  "poor but warm": [[4, 5], [2, 3], [2, 3], [1], [2, 3]],
  "always moving": [[3, 4], [3], [2], [3], [5]],
  "comfortable and relaxed": [[4], [1], [1], [5], [1]],
  "harsh and chaotic": [[1], [5], [5], [1, 2], [4, 5]],
  "warm but strict": [[4, 5], [4, 5], [1, 2], [3], [1, 2]],
  "well-off but cold": [[1, 2], [3], [2], [5], [2, 3]],
};

export type Profile = {
  id: string;
  answers: Answers;
  report: Report;
  name?: string;
  age: number;
  horizon: number;
  nowPct: Vec;
  babyPct: Vec;
  temperamentType: string;
  pChange: Vec;
  letters: Letter[];
  mbti: string;
  types: { type: string; p: number }[];
  /** stage of life used when the prompt does not state one: inferred from age alone */
  defaultStage: StageKey;
  /** the person's actual stage (shown in the prompt only when the context includes it) */
  stage: StageKey;
  scenario: string;
  steer: string;
  /** Letter pairs for which this person answered the optional direct type questions. */
  direct?: { pair: string; n: number; leans: string | null }[];
  tags: { b5: string; mbti: string; borderline: number; ageBand: string; scenario: string; temperament: string; inventory: string; reverse: boolean; direct: boolean };
};

const AGE_BANDS: [number, number, number][] = [
  [16, 17, 8],
  [18, 22, 30],
  [23, 29, 22],
  [30, 39, 15],
  [40, 54, 13],
  [55, 70, 12],
];
export const ageBand = (a: number) => (a < 18 ? "16-17" : a <= 22 ? "18-22" : a <= 29 ? "23-29" : a <= 39 ? "30-39" : a <= 54 ? "40-54" : "55-70");
export const defaultStage = (age: number): StageKey => (age < 18 ? "school" : age <= 22 ? "uni" : age < 65 ? "work" : "retired");

function drawAge(r: Rnd) {
  let x = r() * 100;
  for (const [lo, hi, w] of AGE_BANDS) {
    if (x < w) return int(r, lo, hi);
    x -= w;
  }
  return 20;
}

function drawStage(r: Rnd, age: number): StageKey {
  const x = r();
  if (age < 18) return "school";
  if (age <= 22) return x < 0.7 ? "uni" : x < 0.95 ? "work" : "between";
  if (age < 60) return x < 0.78 ? "work" : x < 0.86 ? "between" : x < 0.95 ? "caring" : age <= 32 ? "uni" : "work";
  return x < 0.6 ? "retired" : x < 0.93 ? "work" : "caring";
}

function drawEvents(r: Rnd, age: number): LifeEvent[] {
  const e: LifeEvent[] = [];
  const add = (k: LifeEvent, p: number) => r() < p && e.push(k);
  add("university", age <= 19 ? 0.6 : age <= 22 ? 0.2 : 0.02);
  add("job", age <= 23 ? 0.6 : age <= 27 ? 0.15 : 0);
  add("relationship", age <= 30 ? 0.4 : 0.1);
  add("abroad", age <= 35 ? 0.2 : 0.07);
  add("parenthood", age >= 20 && age <= 40 ? 0.2 : 0.02);
  add("unemployment", 0.06);
  add("therapy", 0.12);
  add("practice", 0.25);
  return e;
}

export type Steer = { kind: "mbti"; type: string; borderline: number[] } | { kind: "grid"; pattern: string } | { kind: "pop" } | { kind: "extreme" } | { kind: "flat" };

/**
 * Latent Big Five z-scores, steered towards a four-letter type, a low/mid/high pattern, the far ends of the scales
 * (floor and ceiling scores), a flat profile with everything near the middle, or drawn from the population.
 */
function drawLatent(r: Rnd, steer: Steer): Vec {
  const z = Object.fromEntries(TRAITS.map((t) => [t, gauss(r)])) as Vec;
  if (steer.kind === "extreme") {
    for (const t of shuffle(r, TRAITS).slice(0, int(r, 2, 4))) z[t] = (r() < 0.5 ? -1 : 1) * (2.0 + 0.5 * Math.abs(gauss(r)));
    return z;
  }
  if (steer.kind === "flat") {
    for (const t of TRAITS) z[t] = 0.12 * gauss(r);
    return z;
  }
  if (steer.kind === "grid") {
    TRAITS.forEach((t, i) => (z[t] = { L: -1.15, M: 0, H: 1.15 }[steer.pattern[i]]! + 0.28 * gauss(r)));
    return z;
  }
  if (steer.kind === "mbti") {
    const [ei, sn, tf, jp] = steer.type;
    const near = (i: number) => steer.borderline.includes(i);
    // Letter drivers: E/I from Extraversion, S/N from Openness, T/F from Agreeableness, J/P from Conscientiousness.
    z.E = near(0) ? -0.05 + 0.3 * gauss(r) : (ei === "E" ? 1 : -1) * (0.75 + 0.5 * Math.abs(gauss(r)));
    z.O = near(1) ? 1.15 + 0.3 * gauss(r) : sn === "N" ? 1.75 + 0.4 * Math.abs(gauss(r)) : 0.1 - 0.7 * Math.abs(gauss(r));
    z.A = near(2) ? -0.2 + 0.35 * gauss(r) : (tf === "F" ? 1 : -1) * (0.7 + 0.5 * Math.abs(gauss(r))) - 0.2;
    z.C = near(3) ? -0.3 + 0.35 * gauss(r) : (jp === "J" ? 1 : -1) * (0.8 + 0.5 * Math.abs(gauss(r))) - 0.3;
    z.N = 0.9 * gauss(r);
  }
  return z;
}

function answersFor(r: Rnd, z: Vec, age: number, scenario: string): Answers {
  const N = (norms as { traits: Record<Trait, { mean: number; sd: number }> }).traits;
  const ipip = IPIP_ITEMS.map((it) => {
    const v = clamp(Math.round(N[it.trait].mean + z[it.trait] * N[it.trait].sd + 0.85 * gauss(r)), 1, 5);
    return it.reverse ? 6 - v : v;
  });
  const tipi = TIPI_ITEMS.map((it) => {
    const v = clamp(Math.round(TIPI_NORMS[it.trait].mean + z[it.trait] * TIPI_NORMS[it.trait].sd + 0.9 * gauss(r)), 1, 7);
    return it.reverse ? 8 - v : v;
  });
  // Baby stories: a latent infant temperament that shares a little with the adult (r about .25), read through the items.
  const baby = Object.fromEntries(TRAITS.map((t) => [t, 0.3 * z[t] + 0.95 * gauss(r)])) as Vec;
  const temperament = Object.fromEntries(
    TEMPERAMENT_ITEMS.map((i) => {
      const s = (Object.entries(i.loadings) as [Trait, number][]).reduce((a, [t, l]) => a + l * baby[t], 0);
      return [i.id, clamp(Math.round(3 + 1.6 * s + 0.7 * gauss(r)), 1, 5)];
    }),
  );
  const sc = UPBRINGING_SCENARIOS[scenario];
  const up = sc
    ? { warmth: pick(r, sc[0]), harshness: pick(r, sc[1]), adversity: pick(r, sc[2]), ses: pick(r, sc[3]), moves: pick(r, sc[4]) }
    : { warmth: int(r, 1, 5), harshness: int(r, 1, 5), adversity: int(r, 1, 5), ses: int(r, 1, 5), moves: int(r, 1, 5) };
  const nParents = pick(r, [0, 0, 1, 2, 2]);
  const parents = Array.from({ length: nParents }, () => ({
    traits: Object.fromEntries(TRAITS.map((t) => [t, r() < 0.12 ? null : clamp(Math.round(3 + 1.1 * (0.25 * z[t] + 0.95 * gauss(r))), 1, 5)])),
    sure: pick(r, [1, 1, 2, 2, 3]),
  }));
  const detailed = r() < 0.85;
  const horizon = Math.min(80, age + int(r, 3, 20));
  return sanitizeAnswers({
    temperament,
    confidence: pick(r, [0.6, 1.0, 1.0, 1.4]),
    upbringing: { ...up, birthOrder: int(r, 1, 5) },
    tipi,
    age,
    horizon,
    events: drawEvents(r, age),
    babyKnown: r() < 0.4,
    ...(nParents ? { parents } : {}),
    ...(detailed ? { inventory: "detailed", ipip } : {}),
  });
}

const level = (p: number) => (p < 30 ? "L" : p > 70 ? "H" : "M");

const PAIRS: Record<string, string> = { EI: "E/I", SN: "S/N", TF: "T/F", JP: "J/P" };

/**
 * Answers to the optional direct type questions, as the quiz asks them: only for the letter pairs the 50 statements
 * leave unsure, and only from people who took the 50-statement test. The answers lean the way the person's traits
 * do, plus a personal lean the traits do not capture, so they sometimes confirm the estimate and sometimes overturn it.
 */
function directAnswers(r: Rnd, report: Report): Oejts | undefined {
  if (!report.detailed) return undefined;
  const dims = lettersToCheck(report.now, IPIP_REL);
  if (!dims.length || r() >= 0.35) return undefined;
  const base = mbtiLetters(report.now, report.rel);
  const out: Oejts = {};
  for (const dim of dims) {
    const l = base.find((x) => x.dim === dim)!;
    const lean = clamp(Math.log(l.pSecond / (1 - l.pSecond)) / 1.5, -1.2, 1.2) + 0.9 * gauss(r);
    for (const it of OEJTS_ITEMS.filter((x) => x.dim === dim)) {
      if (r() < 0.1) continue; // "skip any you can't decide"
      out[it.id] = clamp(Math.round(3 + it.sign * (0.9 * lean + 0.9 * gauss(r))), 1, 5);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

export function makeProfile(seed: number, steer: Steer, scenario?: string): Profile {
  const r = rng(seed);
  const age = drawAge(r);
  const sc = scenario ?? pick(r, [...Object.keys(UPBRINGING_SCENARIOS), "typical", "typical", "random"]);
  const z = drawLatent(r, steer);
  let answers = answersFor(r, z, age, sc);
  let report = buildReport(answers);
  const oejts = directAnswers(r, report);
  if (oejts) {
    answers = sanitizeAnswers({ ...answers, oejts });
    report = buildReport(answers);
  }
  const rel = report.detailed ? report.rel : undefined;
  const letters = mbtiLetters(report.now, rel, report.oejts);
  const types = mbtiTypes(report.now, rel, report.oejts);
  const direct = letters.filter((l) => l.direct).map((l) => ({ pair: PAIRS[l.dim], n: l.direct!.n, leans: l.direct!.letter }));
  const nowPct = toPct(report.now);
  const name = r() < 0.55 ? pick(r, NAMES) : undefined;
  const temperamentType = report.temperamentType.label.replace(/ \(.*\)$/, "");
  return {
    id: `p${seed}`,
    answers,
    report,
    name,
    age,
    horizon: answers.horizon,
    nowPct,
    babyPct: toPct(report.temperament),
    temperamentType,
    pChange: Object.fromEntries(report.future.map((f) => [f.trait, f.pChange])) as Vec,
    letters,
    mbti: types[0].type,
    types,
    defaultStage: defaultStage(age),
    stage: drawStage(r, age),
    scenario: sc,
    steer: steer.kind,
    ...(direct.length ? { direct } : {}),
    tags: {
      b5: TRAITS.map((t) => level(nowPct[t])).join(""),
      mbti: types[0].type,
      borderline: letters.filter((l) => l.borderline).length,
      ageBand: ageBand(age),
      scenario: sc,
      temperament: temperamentType,
      inventory: report.detailed ? "ipip50" : "tipi",
      reverse: report.reverse,
      direct: direct.length > 0,
    },
  };
}

export { phi, IPIP_REL, TIPI_REL };
