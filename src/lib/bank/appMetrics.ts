// Metrics that can only come from the app's own traffic: completion, real retests, forecast outcomes, agreement between
// two different questionnaires, and latency. Pure functions over plain records, so the same code runs in an API route,
// a script over an export of the database, or a test. Nothing here stores or fetches anything.
import { TRAITS } from "../params";
import type { Vec } from "../model";

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);

/** Value at percentile p (0–100), linear interpolation. p95 latency = percentile(ms, 95). */
export function percentile(xs: number[], p: number): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const pos = ((s.length - 1) * p) / 100;
  const lo = Math.floor(pos);
  return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (pos - lo);
}

export const latencySummary = (ms: number[]) => ({ n: ms.length, p50: percentile(ms, 50), p95: percentile(ms, 95), p99: percentile(ms, 99) });

/** One test attempt: how many statements were shown in total, how many were answered, and whether results were reached. */
export type Attempt = { answered: number; total: number; finished: boolean };

/** Completion rate, and where people who gave up stopped (as a share of the test). */
export function completion(attempts: Attempt[]) {
  const started = attempts.filter((a) => a.answered > 0);
  const quit = started.filter((a) => !a.finished);
  return {
    started: started.length,
    finished: started.filter((a) => a.finished).length,
    rate: started.length ? started.filter((a) => a.finished).length / started.length : NaN,
    medianDropOff: quit.length ? percentile(quit.map((a) => a.answered / a.total), 50) : null,
  };
}

/** A probability the app stated and what then happened. */
export type Outcome = { p: number; happened: boolean };

/**
 * Brier score, skill over a baseline, calibration error and the points of a calibration plot. The baseline is the
 * forecast that says the same number for everyone: the observed base rate unless one is given. Skill 0 = no better than
 * that baseline, 1 = perfect.
 */
export function brierSkill(outcomes: Outcome[], baseline?: number, bins = 10) {
  const y = outcomes.map((o) => (o.happened ? 1 : 0));
  const base = baseline ?? mean(y);
  const brier = mean(outcomes.map((o, i) => (o.p - y[i]) ** 2));
  const ref = mean(y.map((v) => (base - v) ** 2));
  const curve: { bin: number; n: number; predicted: number; observed: number }[] = [];
  let ece = 0;
  for (let b = 0; b < bins; b++) {
    const idx = outcomes.map((o, i) => (Math.min(bins - 1, Math.floor(o.p * bins)) === b ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) continue;
    const predicted = mean(idx.map((i) => outcomes[i].p));
    const observed = mean(idx.map((i) => y[i]));
    ece += (idx.length / outcomes.length) * Math.abs(predicted - observed);
    curve.push({ bin: b / bins, n: idx.length, predicted, observed });
  }
  return { n: outcomes.length, brier, baseline: ref, skill: ref > 0 ? 1 - brier / ref : NaN, ece, curve };
}

/** A forecast (expected value and SD, as the tracker stores them) and the score later observed. */
export type IntervalRecord = { expected: number; sd: number; observed: number };
const Z: Record<string, number> = { "0.5": 0.6745, "0.8": 1.2816, "0.9": 1.6449, "0.95": 1.96 };

/** Share of observed scores that fell inside the forecast interval at each level. Calibrated = the share matches the level. */
export function intervalCoverage(records: IntervalRecord[], levels = [0.5, 0.8, 0.9, 0.95]) {
  return Object.fromEntries(levels.map((lv) => [String(lv), records.length ? mean(records.map((r) => (Math.abs(r.observed - r.expected) <= Z[String(lv)] * r.sd ? 1 : 0))) : NaN])) as Record<string, number>;
}

/** Two sittings by the same person: per-letter agreement, all four letters, and the spread of how many letters repeat. */
export function letterRetest(pairs: { first: string; second: string }[]) {
  const ok = pairs.filter((p) => p.first.length === 4 && p.second.length === 4);
  const same = ok.map((p) => [0, 1, 2, 3].map((i) => (p.first[i] === p.second[i] ? 1 : 0)));
  const count = (k: number) => (ok.length ? same.filter((s) => s.reduce((a: number, b) => a + b, 0) === k).length / ok.length : NaN);
  return {
    n: ok.length,
    perLetter: ["EI", "SN", "TF", "JP"].map((dim, i) => ({ dim, agreement: mean(same.map((s) => s[i])) })),
    allFour: count(4),
    sameCount: [0, 1, 2, 3, 4].map(count),
  };
}

function pearson(x: number[], y: number[]) {
  const mx = mean(x);
  const my = mean(y);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : NaN;
}

/**
 * Agreement between two different measures of the same people, per trait: the quick test against the long test, self
 * against a friend's rating, or one sitting against a later one (then it is test–retest reliability).
 */
export function traitAgreement(pairs: { a: Vec; b: Vec }[]) {
  return Object.fromEntries(TRAITS.map((t) => [t, pairs.length >= 3 ? pearson(pairs.map((p) => p.a[t]), pairs.map((p) => p.b[t])) : NaN])) as Vec;
}
