// Enneagram type, wing and instinct, as an estimate layered on the Big Five and the type letters, like the MBTI layer.
//
// Evidence used (see research/enneagram.md): the systematic review by Hook et al. (2021, Journal of Clinical Psychology
// 77, 865-883) lists, for each type, the Big Five traits and MBTI letters that moved in the same direction in more than
// half of the studies (9 Big Five studies, 7 MBTI studies). We weight each link by the share of studies that found it,
// score each type as a projection of your profile onto its links, and average the Big Five and the letter evidence.
// The review found no support for wings (one study, at chance) and no empirical test of the instincts, so the wing is
// read as the stronger neighbour, and the instincts come from six direct statements, both shown as unvalidated.
import type { Trait } from "./params";
import type { Vec } from "./model";
import type { Letter } from "./mbti";

export type EnneaNum = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export const ENNEA_NUMS: EnneaNum[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Big Five links: sign × share of the 9 studies that found it (Hook et al., 2021, Table of consistent patterns). */
export const BIG5_LINKS: Record<EnneaNum, Partial<Record<Trait, number>>> = {
  1: { C: 9 / 9 },
  2: { A: 7 / 9, E: 9 / 9 },
  3: { A: -5 / 9, C: 5 / 9, E: 6 / 9 },
  4: { C: -6 / 9, N: 8 / 9, O: 6 / 9 },
  5: { E: -9 / 9 },
  6: { E: -6 / 9, N: 8 / 9, O: -5 / 9 },
  7: { C: -6 / 9, E: 9 / 9, O: 9 / 9 },
  8: { A: -9 / 9, E: 8 / 9, N: -6 / 9 },
  9: { A: 9 / 9 },
};

/** Letter links: the letter named, × share of the 7 studies that found it. Type 9 had none. */
export const LETTER_LINKS: Record<EnneaNum, Partial<Record<string, number>>> = {
  1: { I: 4 / 7, J: 5 / 7 },
  2: { F: 5 / 7 },
  3: { E: 5 / 7 },
  4: { N: 5 / 7, F: 6 / 7, P: 4 / 7 },
  5: { I: 6 / 7, T: 7 / 7 },
  6: { I: 4 / 7 },
  7: { E: 6 / 7, N: 5 / 7, P: 4 / 7 },
  8: { E: 5 / 7, T: 4 / 7 },
  9: {},
};

export const ENNEA_INFO: Record<EnneaNum, { name: string; line: string }> = {
  1: { name: "The Reformer", line: "Principled and exacting; wants things done right." },
  2: { name: "The Helper", line: "Warm and generous; wants to be needed." },
  3: { name: "The Achiever", line: "Driven and adaptable; wants to succeed and be seen to." },
  4: { name: "The Individualist", line: "Expressive and introspective; wants to be true to themselves." },
  5: { name: "The Investigator", line: "Curious and private; wants to understand how things work." },
  6: { name: "The Loyalist", line: "Committed and watchful; wants security and people to trust." },
  7: { name: "The Enthusiast", line: "Spontaneous and versatile; wants variety and freedom." },
  8: { name: "The Challenger", line: "Direct and decisive; wants control over their own path." },
  9: { name: "The Peacemaker", line: "Easy-going and steady; wants harmony." },
};

export type Instinct = "sp" | "so" | "sx";
export const INSTINCT_NAME: Record<Instinct, string> = { sp: "Self-preservation", so: "Social", sx: "One-to-one" };
/** Six direct statements, two per instinct, answered on the same 7-point scale. Written for this app; not research-tested. */
export const INSTINCT_ITEMS: { id: string; text: string; instinct: Instinct }[] = [
  { id: "sp1", text: "I put my comfort, health and security first.", instinct: "sp" },
  { id: "so1", text: "I keep track of where I stand in a group.", instinct: "so" },
  { id: "sx1", text: "I am drawn to intense one-to-one connections.", instinct: "sx" },
  { id: "sp2", text: "I like to keep reserves of money, food or energy, just in case.", instinct: "sp" },
  { id: "so2", text: "Being part of a community or cause matters a lot to me.", instinct: "so" },
  { id: "sx2", text: "I go after experiences that feel electric or all-consuming.", instinct: "sx" },
];
export type InstinctAnswers = Record<string, number>;

export function sanitizeInstincts(raw: unknown): InstinctAnswers | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const out: InstinctAnswers = {};
  for (const it of INSTINCT_ITEMS) {
    const n = Number(o[it.id]);
    if (Number.isFinite(n) && n >= 1 && n <= 7) out[it.id] = Math.round(n);
  }
  return Object.keys(out).length ? out : undefined;
}

const probit = (p: number) => {
  // Acklam-free approximation, good to about 1e-3 over (0.001, 0.999), plenty here
  const q = Math.min(0.999, Math.max(0.001, p));
  const t = Math.sqrt(-2 * Math.log(q < 0.5 ? q : 1 - q));
  const z = t - (2.515517 + 0.802853 * t + 0.010328 * t * t) / (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t);
  return q < 0.5 ? -z : z;
};

/** A profile projected onto a type's links: Σ w·x / √Σ w², so a type with more links does not score higher for that alone. */
function project(links: Partial<Record<string, number>>, x: (k: string) => number): number | null {
  const e = Object.entries(links) as [string, number][];
  if (!e.length) return null;
  const norm = Math.sqrt(e.reduce((s, [, w]) => s + w * w, 0));
  return e.reduce((s, [k, w]) => s + w * x(k), 0) / norm;
}

/** How strongly the profile leans to each MBTI letter, as a z-score (probit of the letter's probability). */
function letterZ(L: Letter[], letter: string): number {
  const l = L.find((x) => x.first === letter || x.second === letter);
  if (!l) return 0;
  const pThis = letter === l.second ? l.pSecond : 1 - l.pSecond;
  return probit(pThis);
}

/** Spread of the softmax over type scores: chosen so a clear profile gives the top type about 40-60%, not near 100%. */
const SHARPNESS = 2;

export type Enneagram = {
  type: EnneaNum;
  wing: EnneaNum;
  label: string;
  p: Record<EnneaNum, number>;
  ranked: { type: EnneaNum; p: number; label: string }[];
  instincts: { order: Instinct[]; stack: string; scores: Record<Instinct, number> } | null;
};

const neighbours = (n: EnneaNum): [EnneaNum, EnneaNum] => [(((n + 7) % 9) + 1) as EnneaNum, ((n % 9) + 1) as EnneaNum];

export function enneagram(z: Vec, letters: Letter[], inst?: InstinctAnswers): Enneagram {
  const score = {} as Record<EnneaNum, number>;
  for (const n of ENNEA_NUMS) {
    const b = project(BIG5_LINKS[n], (t) => z[t as Trait] ?? 0);
    const m = project(LETTER_LINKS[n], (l) => letterZ(letters, l));
    const parts = [b, m].filter((v): v is number => v != null);
    score[n] = parts.reduce((s, v) => s + v, 0) / parts.length;
  }
  const mx = Math.max(...Object.values(score));
  const ex = Object.fromEntries(ENNEA_NUMS.map((n) => [n, Math.exp(SHARPNESS * (score[n] - mx))])) as Record<EnneaNum, number>;
  const sum = Object.values(ex).reduce((s, v) => s + v, 0);
  const p = Object.fromEntries(ENNEA_NUMS.map((n) => [n, ex[n] / sum])) as Record<EnneaNum, number>;
  const withWing = (n: EnneaNum) => {
    const [a, b] = neighbours(n);
    const w = score[a] >= score[b] ? a : b;
    return { wing: w, label: `${n}w${w}` };
  };
  const ranked = [...ENNEA_NUMS].sort((a, b) => p[b] - p[a]).map((n) => ({ type: n, p: p[n], label: withWing(n).label }));
  const top = ranked[0].type;
  return { type: top, ...withWing(top), p, ranked, instincts: instinctStack(inst) };
}

/** Instinct order from the six statements: needs at least one answer per instinct. Ties keep sp, so, sx order. */
export function instinctStack(inst?: InstinctAnswers): Enneagram["instincts"] {
  if (!inst) return null;
  const scores = {} as Record<Instinct, number>;
  for (const k of ["sp", "so", "sx"] as Instinct[]) {
    const v = INSTINCT_ITEMS.filter((it) => it.instinct === k).map((it) => inst[it.id]).filter((x): x is number => x >= 1);
    if (!v.length) return null;
    scores[k] = v.reduce((s, x) => s + x, 0) / v.length;
  }
  const order = (["sp", "so", "sx"] as Instinct[]).sort((a, b) => scores[b] - scores[a]);
  return { order, stack: order.join("/"), scores };
}
