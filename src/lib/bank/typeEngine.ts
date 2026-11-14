// The four type letters as posteriors, not verdicts. Each letter starts from what the Big Five say (the existing model in
// mbti.ts) and is then updated by any statements that measure the letter directly: our 48 open statements, the OEJTS
// items, or both. Every letter comes with its probability, a band (clear, likely, borderline) and the chance the same
// letter would come out if the person took the test again.
import bank from "./typeItems.json";
import { DIMS, modelFor } from "../mbti";
import { OEJTS_ITEMS, type Oejts } from "../oejts";
import { phi, TIPI_REL, type Vec } from "../model";
import { type Trait } from "../params";
import { type GrmItem, normalPrior, posteriorOver, massAbove } from "./irt";

export type Dim = (typeof DIMS)[number];
export type TypeItem = { id: string; dim: Dim; pole: string; context: string; text: string };
export const TYPE_ITEMS = bank.items as TypeItem[];
const BY_ID = new Map(TYPE_ITEMS.map((it) => [it.id, it]));

/**
 * Measurement model for a statement that has not been calibrated on response data yet: a moderate discrimination and
 * evenly spaced thresholds centred on the letter's cut point, so that "In between" means exactly on the line.
 * scripts/metrics/fit_irt.py replaces these with fitted values once enough people have answered.
 */
export const UNCALIBRATED = { a: 1.4, steps: [-1.6, -0.6, 0.6, 1.6] };
export const itemAtCut = (cut: number, a = UNCALIBRATED.a): GrmItem => ({ a, b: UNCALIBRATED.steps.map((s) => cut + s) });

/** One piece of direct evidence about a letter: a five-point answer where 5 points at the dimension's second letter (I, N, F, P). */
export type Evidence = { dim: Dim; x: number; a?: number };

/** Answers to our own statements, by id, as evidence. Unknown ids and skipped answers are ignored. */
export function evidenceFromBank(answers: Record<string, number | undefined>): Evidence[] {
  const out: Evidence[] = [];
  for (const [id, v] of Object.entries(answers)) {
    const it = BY_ID.get(id);
    if (!it || !(typeof v === "number" && v >= 1 && v <= 5)) continue;
    out.push({ dim: it.dim, x: it.pole === it.dim[1] ? v : 6 - v });
  }
  return out;
}

/**
 * A bipolar item (two opposite statements with five points between them, as in the OEJTS) as evidence.
 * `highIsSecond` says whether 5 is the I, N, F or P end. Bipolar items carry a little less information each.
 */
export const evidenceFromBipolar = (dim: Dim, value: number, highIsSecond: boolean, a = 1.2): Evidence => ({ dim, x: highIsSecond ? value : 6 - value, a });

/** Answers to the OEJTS follow-ups already in the app (item id → 1–5), using that scale's own key for direction. */
export function evidenceFromOejts(answers: Oejts | undefined): Evidence[] {
  const out: Evidence[] = [];
  for (const it of OEJTS_ITEMS) {
    const v = answers?.[it.id];
    if (typeof v === "number" && v >= 1 && v <= 5) out.push(evidenceFromBipolar(it.dim, v, it.sign === 1));
  }
  return out;
}

export type Band = "clear" | "likely" | "borderline";
export const BANDS = { clear: 0.85, likely: 0.65 };
export const bandOf = (p: number): Band => (p >= BANDS.clear ? "clear" : p >= BANDS.likely ? "likely" : "borderline");

export type LetterResult = {
  dim: Dim;
  first: string;
  second: string;
  letter: string;
  /** probability of the letter shown */
  p: number;
  pSecond: number;
  band: Band;
  /** chance the same letter comes out on a fresh sitting of the same test */
  pSameOnRetest: number;
  /** position on the dimension (population SD units) and its uncertainty; `cut` is the line between the two letters */
  mean: number;
  sd: number;
  cut: number;
  /** direct statements used for this letter */
  nItems: number;
};

/** A previous sitting's estimate, carried forward as extra prior information (see `carryForward`). */
export type Carried = Partial<Record<Dim, { mean: number; sd: number }>>;

/**
 * Where the line between two letters is drawn for an estimate with posterior variance `s2`.
 * The scale has variance 1 in the population and splits at `cut`. An estimate is less spread out than the scale itself
 * (its variance across people is 1 − s2), so comparing it with the raw cut would hand the majority letter to almost
 * everyone near the middle. Scaling the cut by the estimate's spread gives each letter out about as often as it occurs.
 * From the Big Five alone this is the type cut of mbti.ts (cut × √r²); as direct statements sharpen the estimate the
 * line moves out to the population cut. A direct statement's "In between" sits on the population cut throughout.
 */
export const lineFor = (cut: number, s2: number) => cut * Math.sqrt(Math.min(1, Math.max(0, 1 - s2)));

export function letterPosteriors(z: Vec, rel: Vec | undefined, evidence: Evidence[] = [], carried?: Carried): LetterResult[] {
  const M = modelFor(rel);
  const r = rel ?? TIPI_REL;
  return DIMS.map((dim) => {
    const m = M[dim];
    const w = Object.entries(m.w) as [Trait, number][];
    let mu0 = w.reduce((s, [t, wt]) => s + wt * z[t], 0);
    let sd0 = m.sd;
    const prev = carried?.[dim];
    if (prev) {
      // Precision-weighted merge. The earlier estimate already contains the population prior (variance 1), so take it out once.
      const extra = Math.max(0, 1 / (prev.sd * prev.sd) - 1);
      const prec = 1 / (sd0 * sd0) + extra;
      mu0 = (mu0 / (sd0 * sd0) + extra * prev.mean) / prec;
      sd0 = Math.sqrt(1 / prec);
    }
    const mine = evidence.filter((e) => e.dim === dim && e.x >= 1 && e.x <= 5);
    const post = posteriorOver(
      normalPrior(mu0, sd0),
      mine.map((e) => ({ item: itemAtCut(m.cut, e.a), x: e.x })),
    );
    const s2 = mine.length ? post.sd * post.sd : sd0 * sd0;
    const line = mine.length || prev ? lineFor(m.cut, s2) : m.typeCut;
    const pSecond = mine.length ? massAbove(post.w, line) : phi((mu0 - line) / sd0);
    const isSecond = pSecond >= 0.5;
    const p = isSecond ? pSecond : 1 - pSecond;

    // Retest: the Big Five scores wobble (regression to the mean and fresh error) and the direct answers are drawn again.
    const mu0r = w.reduce((s, [t, wt]) => s + wt * r[t] * z[t], 0);
    const v0 = w.reduce((s, [t, wt]) => s + wt * wt * (1 - r[t] * r[t]), 0);
    const tau = Math.max(0, 1 / s2 - 1 / (sd0 * sd0));
    const callNow = mine.length ? post.mean : mu0;
    const eRetest = tau > 0 ? s2 * (mu0r / (sd0 * sd0) + tau * callNow) : mu0r;
    const vRetest = tau > 0 ? s2 * s2 * (v0 / sd0 ** 4 + tau * tau * (s2 + 1 / tau)) : v0;
    const pSecondRetest = 1 - phi((line - eRetest) / Math.sqrt(Math.max(vRetest, 1e-9)));
    const pSameOnRetest = isSecond ? pSecondRetest : 1 - pSecondRetest;

    return { dim, first: m.first, second: m.second, letter: isSecond ? m.second : m.first, p, pSecond, band: bandOf(p), pSameOnRetest, mean: callNow, sd: Math.sqrt(s2), cut: line, nItems: mine.length };
  });
}

export type TypeResult = {
  type: string;
  letters: LetterResult[];
  /** letters too close to call; the UI should say so rather than present them as settled */
  borderline: Dim[];
  /** the type with borderline letters left open, e.g. "IN_P" */
  mask: string;
  /** every type that fits the mask, most likely first, with probabilities over all 16 */
  candidates: { type: string; p: number }[];
  /** probability of the top type and of the top two together */
  pType: number;
  pTopTwo: number;
  /** chance all four letters repeat on a fresh sitting */
  pSameTypeOnRetest: number;
  level: "High" | "Good" | "Moderate" | "Low";
};

export function typeResult(z: Vec, rel: Vec | undefined, evidence: Evidence[] = [], carried?: Carried): TypeResult {
  const letters = letterPosteriors(z, rel, evidence, carried);
  const all: { type: string; p: number }[] = [];
  for (let i = 0; i < 16; i++) {
    let type = "";
    let p = 1;
    letters.forEach((l, k) => {
      const second = (i >> (3 - k)) & 1;
      type += second ? l.second : l.first;
      p *= second ? l.pSecond : 1 - l.pSecond;
    });
    all.push({ type, p });
  }
  all.sort((a, b) => b.p - a.p);
  const borderline = letters.filter((l) => l.band === "borderline").map((l) => l.dim);
  const mask = letters.map((l) => (l.band === "borderline" ? "_" : l.letter)).join("");
  const fits = (t: string) => [...mask].every((c, i) => c === "_" || c === t[i]);
  const avg = letters.reduce((s, l) => s + l.p, 0) / letters.length;
  return {
    type: all[0].type,
    letters,
    borderline,
    mask,
    candidates: all.filter((t) => fits(t.type)),
    pType: all[0].p,
    pTopTwo: all[0].p + all[1].p,
    pSameTypeOnRetest: letters.reduce((s, l) => s * l.pSameOnRetest, 1),
    level: avg >= 0.85 ? "High" : avg >= 0.75 ? "Good" : avg >= 0.65 ? "Moderate" : "Low",
  };
}

export type FollowUpOptions = { /** keep asking about a letter until it is at least this sure */ confident?: number; minPerDim?: number; maxPerDim?: number };
export const FOLLOW_UP_DEFAULTS = { confident: 0.85, minPerDim: 4, maxPerDim: 12 };

/**
 * The next type statement to ask, or null when every letter is either settled or out of statements. Letters still under
 * the minimum go first; after that the least certain letter gets the next statement, alternating which pole it points at
 * and moving through different life situations.
 */
export function nextTypeItem(z: Vec, rel: Vec | undefined, answers: Record<string, number | undefined>, opts: FollowUpOptions = {}, extra: Evidence[] = []): { item: TypeItem; dim: Dim; p: number; remainingAtMost: number } | null {
  const o = { ...FOLLOW_UP_DEFAULTS, ...opts };
  const letters = letterPosteriors(z, rel, [...evidenceFromBank(answers), ...extra]);
  const state = letters.map((l) => {
    const done = TYPE_ITEMS.filter((it) => it.dim === l.dim && answers[it.id] != null && answers[it.id]! >= 1);
    const open = TYPE_ITEMS.filter((it) => it.dim === l.dim && !(answers[it.id] != null && answers[it.id]! >= 1));
    return { l, done, open, needs: open.length > 0 && done.length < o.maxPerDim && (done.length < o.minPerDim || l.p < o.confident) };
  });
  const need = state.filter((s) => s.needs);
  if (!need.length) return null;
  const pick = need.reduce((best, s) => {
    const key = (x: typeof s) => (x.done.length < o.minPerDim ? 2 - x.done.length / 100 : 1 - x.l.p);
    return key(s) > key(best) ? s : best;
  });
  const towardSecond = pick.done.filter((it) => it.pole === pick.l.second).length;
  const wantPole = towardSecond * 2 > pick.done.length ? pick.l.first : pick.l.second;
  const seen = new Set(pick.done.map((it) => it.context));
  const item = pick.open.find((it) => it.pole === wantPole && !seen.has(it.context)) ?? pick.open.find((it) => it.pole === wantPole) ?? pick.open[0];
  const remainingAtMost = need.reduce((s, x) => s + Math.min(x.open.length, o.maxPerDim - x.done.length), 0);
  return { item, dim: pick.l.dim, p: pick.l.p, remainingAtMost };
}

/**
 * Carry a sitting forward to the next one, so a retest refines the last result instead of starting from nothing.
 * The old estimate is loosened for the time that has passed: real change at roughly the yearly rank-order stability of
 * adult traits (.97 a year here), plus a floor so that a retest on the same day still counts.
 */
export function carryForward(letters: LetterResult[], years: number, yearlyStability = 0.97): Carried {
  const r = Math.pow(yearlyStability, Math.max(0, years));
  return Object.fromEntries(letters.map((l) => [l.dim, { mean: r * l.mean, sd: Math.sqrt(r * r * l.sd * l.sd + (1 - r * r) + 0.02) }])) as Carried;
}
