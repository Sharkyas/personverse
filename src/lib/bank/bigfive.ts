// The 50-statement test scored with the graded response model fitted on open data (scripts/metrics/fit_irt.py), plus the
// adaptive order: ask next whatever narrows the least certain trait the most, and stop once every trait is pinned down.
import irt from "./ipip50Irt.json";
import { IPIP_ITEMS } from "../questions";
import { TRAITS, type Trait } from "../params";
import { type GrmItem, type Response, normalPrior, posteriorOver, interval, expectedInfo, type Posterior } from "./irt";

type FittedItem = GrmItem & { reverse: boolean };
const FITTED = irt.traits as Record<Trait, { marginal_reliability_test: number; items: Record<string, FittedItem> }>;
export const IPIP50_ITEM_MODEL: Record<string, FittedItem> = Object.assign({}, ...TRAITS.map((t) => FITTED[t].items));
export const IPIP50_MARGINAL_RELIABILITY = Object.fromEntries(TRAITS.map((t) => [t, FITTED[t].marginal_reliability_test])) as Record<Trait, number>;

const PRIOR = normalPrior();
const valid = (x: number | undefined): x is number => typeof x === "number" && x >= 1 && x <= 5;
/** Answer keyed so that 5 is the high end of the trait. */
export const keyed = (index: number, raw: number) => (IPIP_ITEMS[index].reverse ? 6 - raw : raw);

/** The answered statements of one trait as model responses. `ans` is in IPIP_ITEMS order; 0 or missing = not answered. */
export function traitResponses(ans: (number | undefined)[], trait: Trait): Response[] {
  const out: Response[] = [];
  IPIP_ITEMS.forEach((it, i) => {
    const raw = ans[i];
    if (it.trait === trait && valid(raw)) out.push({ item: IPIP50_ITEM_MODEL[it.id], x: keyed(i, raw) });
  });
  return out;
}

export type TraitScore = {
  /** best estimate on the population scale (mean 0, SD 1), pulled towards average when few statements are answered */
  theta: number;
  /** this person's own standard error, which depends on how many statements they answered and which ones */
  se: number;
  /** 1 − se²: the share of the estimate that is signal. Feed it to `modelFor` as this person's reliability. */
  reliability: number;
  /** theta on the same footing as the app's observed z-scores (not pulled in), for the existing forecast and type code */
  z: number;
  lo80: number;
  hi80: number;
  n: number;
};

export function scoreTrait(ans: (number | undefined)[], trait: Trait): TraitScore & { posterior: Posterior } {
  const responses = traitResponses(ans, trait);
  const posterior = posteriorOver(PRIOR, responses);
  const reliability = Math.min(0.99, Math.max(0, 1 - posterior.sd * posterior.sd));
  const [lo80, hi80] = interval(posterior.w, 0.8);
  // EAP estimates are shrunk by √reliability relative to a standardised observed score; undo that for `z`.
  const z = responses.length ? Math.max(-3.5, Math.min(3.5, posterior.mean / Math.sqrt(Math.max(reliability, 0.25)))) : 0;
  return { theta: posterior.mean, se: posterior.sd, reliability, z, lo80, hi80, n: responses.length, posterior };
}

/** IRT scores for all five traits from any subset of the 50 answers. */
export function scoreIpip50(ans: (number | undefined)[]): Record<Trait, TraitScore> {
  return Object.fromEntries(
    TRAITS.map((t) => {
      const { posterior: _p, ...score } = scoreTrait(ans, t);
      void _p;
      return [t, score];
    }),
  ) as Record<Trait, TraitScore>;
}

export type AdaptiveOptions = {
  /** stop asking about a trait once its standard error is at or below this (0.42 ≈ reliability .82) */
  targetSe?: number;
  /** always ask at least this many per trait, so every trait has both directions of statement */
  minPerTrait?: number;
  maxPerTrait?: number;
  /** trait of the statement just asked; another trait is preferred so the test does not feel repetitive */
  lastTrait?: Trait;
};
export const ADAPTIVE_DEFAULTS = { targetSe: 0.42, minPerTrait: 4, maxPerTrait: 10 };

export type NextItem = { index: number; id: string; trait: Trait; info: number; remainingAtMost: number };

/**
 * The next statement to ask, or null when the test can stop. Pure function of the answers so far, so it works the same on
 * the server and in the browser and needs no session state.
 */
export function nextIpipItem(ans: (number | undefined)[], opts: AdaptiveOptions = {}): NextItem | null {
  const o = { ...ADAPTIVE_DEFAULTS, ...opts };
  const state = TRAITS.map((t) => {
    const s = scoreTrait(ans, t);
    const open = IPIP_ITEMS.map((it, i) => ({ it, i })).filter(({ it, i }) => it.trait === t && !valid(ans[i]));
    const needs = open.length > 0 && s.n < o.maxPerTrait && (s.n < o.minPerTrait || s.se > o.targetSe);
    return { t, s, open, needs };
  });
  const need = state.filter((x) => x.needs);
  if (!need.length) return null;
  // Traits still under the minimum go first (fewest answers first), then the least certain trait.
  const rank = (x: (typeof need)[number]) => (x.s.n < o.minPerTrait ? 10 - x.s.n : x.s.se) - (x.t === o.lastTrait && need.length > 1 ? 100 : 0);
  const pick = need.reduce((best, x) => (rank(x) > rank(best) ? x : best));
  const scored = pick.open.map(({ it, i }) => ({ it, i, info: expectedInfo(IPIP50_ITEM_MODEL[it.id], pick.s.posterior.w) })).sort((a, b) => b.info - a.info);
  // Keep both directions of statement in play: if everything answered so far for this trait is keyed one way, take the best
  // statement keyed the other way when it is nearly as informative.
  const answeredKeys = IPIP_ITEMS.filter((it, i) => it.trait === pick.t && valid(ans[i])).map((it) => it.reverse);
  let choice = scored[0];
  if (answeredKeys.length >= 2 && answeredKeys.every((k) => k === answeredKeys[0])) {
    const other = scored.find((c) => c.it.reverse !== answeredKeys[0] && c.info >= 0.7 * scored[0].info);
    if (other) choice = other;
  }
  const remainingAtMost = need.reduce((s, x) => s + Math.min(x.open.length, o.maxPerTrait - x.s.n), 0);
  return { index: choice.i, id: choice.it.id, trait: pick.t, info: choice.info, remainingAtMost };
}

/** Run the adaptive test against a full set of answers (for simulation and tests): the order asked and the final scores. */
export function simulateAdaptive(full: number[], opts: AdaptiveOptions = {}) {
  const ans: number[] = Array(IPIP_ITEMS.length).fill(0);
  const asked: number[] = [];
  let last: Trait | undefined;
  for (;;) {
    const nx = nextIpipItem(ans, { ...opts, lastTrait: last });
    if (!nx) break;
    ans[nx.index] = full[nx.index];
    asked.push(nx.index);
    last = nx.trait;
  }
  return { asked, ans, scores: scoreIpip50(ans) };
}
