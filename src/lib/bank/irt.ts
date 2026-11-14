// Graded response model (Samejima): the maths behind the adaptive test, the per-person error bars and the person-fit check.
// Each statement has a discrimination `a` (how sharply it separates people) and four ordered thresholds `b` (where on the
// trait people move from one answer to the next). Scores live on a grid, so a posterior is just an array of weights.

export type GrmItem = { a: number; b: number[] };
export type Response = { item: GrmItem; /** keyed answer 1–5: 5 is always the high end of the scale */ x: number };
export type Posterior = { w: number[]; mean: number; sd: number };

export const GRID_STEP = 0.1;
export const GRID: number[] = Array.from({ length: 81 }, (_, i) => -4 + i * GRID_STEP);

const logistic = (x: number) => 1 / (1 + Math.exp(-x));

/** P(answer = 1..5 | theta). */
export function grmProbs(item: GrmItem, theta: number): number[] {
  const star = item.b.map((b) => logistic(item.a * (theta - b)));
  const cum = [1, ...star, 0];
  return [0, 1, 2, 3, 4].map((k) => Math.max(1e-9, cum[k] - cum[k + 1]));
}

/** Fisher information of a statement at theta: how much one answer narrows the estimate there. */
export function itemInfo(item: GrmItem, theta: number): number {
  const cum = [1, ...item.b.map((b) => logistic(item.a * (theta - b))), 0];
  let info = 0;
  for (let k = 0; k < 5; k++) {
    const d = item.a * (cum[k] * (1 - cum[k]) - cum[k + 1] * (1 - cum[k + 1]));
    info += (d * d) / Math.max(1e-9, cum[k] - cum[k + 1]);
  }
  return info;
}

export function normalPrior(mean = 0, sd = 1): number[] {
  const w = GRID.map((t) => Math.exp(-0.5 * ((t - mean) / sd) ** 2));
  const s = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / s);
}

function summarise(w: number[]): Posterior {
  let mean = 0;
  let m2 = 0;
  for (let i = 0; i < GRID.length; i++) {
    mean += w[i] * GRID[i];
    m2 += w[i] * GRID[i] * GRID[i];
  }
  return { w, mean, sd: Math.sqrt(Math.max(1e-9, m2 - mean * mean)) };
}

/** Bayes on the grid: prior × the likelihood of every answer given. Missing answers are simply left out. */
export function posteriorOver(prior: number[], responses: Response[]): Posterior {
  const logw = prior.map((p) => Math.log(Math.max(p, 1e-300)));
  for (const r of responses) {
    if (!(r.x >= 1 && r.x <= 5)) continue;
    for (let i = 0; i < GRID.length; i++) logw[i] += Math.log(grmProbs(r.item, GRID[i])[r.x - 1]);
  }
  const mx = Math.max(...logw);
  const w = logw.map((l) => Math.exp(l - mx));
  const s = w.reduce((a, b) => a + b, 0);
  return summarise(w.map((x) => x / s));
}

/** Posterior probability that the score is above `cut` (half of the cell the cut falls in counts on each side). */
export function massAbove(w: number[], cut: number): number {
  let p = 0;
  for (let i = 0; i < GRID.length; i++) {
    const lo = GRID[i] - GRID_STEP / 2;
    const hi = GRID[i] + GRID_STEP / 2;
    if (lo >= cut) p += w[i];
    else if (hi > cut) p += (w[i] * (hi - cut)) / GRID_STEP;
  }
  return Math.min(1, Math.max(0, p));
}

/** Central interval of a posterior, e.g. level 0.8 → the 10th and 90th percentiles. */
export function interval(w: number[], level = 0.8): [number, number] {
  const tail = (1 - level) / 2;
  const q = (p: number) => {
    let c = 0;
    for (let i = 0; i < GRID.length; i++) {
      if (c + w[i] >= p) return GRID[i] - GRID_STEP / 2 + (GRID_STEP * (p - c)) / Math.max(w[i], 1e-12);
      c += w[i];
    }
    return GRID[GRID.length - 1];
  };
  return [q(tail), q(1 - tail)];
}

/** Information a statement is expected to add, averaged over where the person might be (their current posterior). */
export function expectedInfo(item: GrmItem, w: number[]): number {
  let s = 0;
  for (let i = 0; i < GRID.length; i++) if (w[i] > 1e-6) s += w[i] * itemInfo(item, GRID[i]);
  return s;
}

/**
 * Person fit (lz): is this pattern of answers about as likely as the model expects for someone at this score?
 * Returns the three sums so several scales can be pooled: lz = (l0 − expected) / √variance. Strongly negative = answers
 * that contradict each other more than real people's do.
 */
export function fitTerms(responses: Response[], theta: number): { l0: number; expected: number; variance: number } {
  let l0 = 0;
  let expected = 0;
  let variance = 0;
  for (const r of responses) {
    if (!(r.x >= 1 && r.x <= 5)) continue;
    const p = grmProbs(r.item, theta);
    const lp = p.map(Math.log);
    const e = p.reduce((s, pk, k) => s + pk * lp[k], 0);
    l0 += lp[r.x - 1];
    expected += e;
    variance += p.reduce((s, pk, k) => s + pk * lp[k] * lp[k], 0) - e * e;
  }
  return { l0, expected, variance };
}
