/*
 * Simulated respondents with KNOWN true personalities, for testing the scoring end to end.
 * Item behaviour (loadings, answer thresholds) and trait correlations are fitted on the real open dataset
 * (scripts/fit_item_params.py), so simulated answers look like real people's answers. This is test data only:
 * it is never shown as evidence about real people.
 */
import params from "./ipipItemParams.json";
import { IPIP_ITEMS, DEFAULT_ANSWERS, type Answers } from "./questions";
import { TRAITS, type Trait } from "./params";
import type { Vec } from "./model";

type ItemParam = { lambda: number; thresholds: number[] };
const P = params.items as Record<string, ItemParam>;
const R = params.traitCorr as Record<Trait, Record<Trait, number>>;

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());

/** Cholesky factor of the observed trait correlation matrix, so simulated people have realistic trait combinations. */
const L: number[][] = (() => {
  const n = TRAITS.length;
  const A = TRAITS.map((a) => TRAITS.map((b) => R[a][b]));
  const out = A.map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= out[i][k] * out[j][k];
      out[i][j] = i === j ? Math.sqrt(Math.max(s, 1e-9)) : s / out[j][j];
    }
  return out;
})();

export function truePerson(r: () => number): Vec {
  const e = TRAITS.map(() => gauss(r));
  return Object.fromEntries(TRAITS.map((t, i) => [t, L[i].reduce((s, l, k) => s + l * e[k], 0)])) as Vec;
}

/** One sitting of the 50-item test by someone whose true trait levels are z (graded normal-ogive model). */
export function answerIpip(z: Vec, r: () => number, loadingScale = 1): number[] {
  return IPIP_ITEMS.map((it) => {
    const p = P[it.id];
    const lam = Math.min(0.95, p.lambda * loadingScale);
    const y = lam * z[it.trait] + Math.sqrt(1 - lam * lam) * gauss(r);
    const keyed = 1 + p.thresholds.filter((th) => y > th).length;
    return it.reverse ? 6 - keyed : keyed;
  });
}

export const straightLiner = (r: () => number) => Array(IPIP_ITEMS.length).fill(1 + Math.floor(r() * 5));
export const randomResponder = (r: () => number) => IPIP_ITEMS.map(() => 1 + Math.floor(r() * 5));

export const asAnswers = (ipip: number[]): Answers => ({ ...DEFAULT_ANSWERS, inventory: "detailed", ipip });
