import { IPIP_ITEMS } from "./questions";

/**
 * Careless-responding checks for the 50-item test (the standard ones from survey research):
 * - straight-lining: the same answer to most questions;
 * - long runs: the same answer many times in a row;
 * - yes-saying: agreeing with statements and with their opposites (raw mean far from the middle even though
 *   half the items are reverse-keyed).
 */
export function answerQuality(ans: number[]) {
  const v = ans.filter((x) => x >= 1 && x <= 5);
  if (v.length < 20) return { ok: true, reasons: [] as string[] };
  const counts = [1, 2, 3, 4, 5].map((k) => v.filter((x) => x === k).length);
  const sameShare = Math.max(...counts) / v.length;
  let run = 1;
  let longest = 1;
  for (let i = 1; i < ans.length; i++) {
    run = ans[i] >= 1 && ans[i] === ans[i - 1] ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  const keyed = IPIP_ITEMS.map((it, i) => ({ raw: ans[i], rev: it.reverse })).filter((x) => x.raw >= 1);
  const agreeFwd = keyed.filter((x) => !x.rev).reduce((s, x) => s + x.raw, 0) / Math.max(1, keyed.filter((x) => !x.rev).length);
  const agreeRev = keyed.filter((x) => x.rev).reduce((s, x) => s + x.raw, 0) / Math.max(1, keyed.filter((x) => x.rev).length);
  const cons = consistency(ans);
  const reasons: string[] = [];
  if (sameShare >= 0.7) reasons.push(`gave the same answer to ${Math.round(sameShare * 100)}% of questions`);
  else if (longest >= 12) reasons.push(`gave the same answer ${longest} times in a row`);
  if (agreeFwd >= 4.2 && agreeRev >= 4.2) reasons.push("agreed with statements and their opposites");
  if (agreeFwd <= 1.8 && agreeRev <= 1.8) reasons.push("disagreed with statements and their opposites");
  if (sameShare < 0.7 && cons && cons.spread > SPREAD_MAX && cons.evenOdd < EVEN_ODD_MIN) reasons.push("answered similar questions in very different ways");
  return { ok: reasons.length === 0, reasons, sameShare, longest, evenOdd: cons?.evenOdd ?? NaN, spread: cons?.spread ?? NaN };
}

/**
 * Random answering = the answers to one trait's statements scatter widely (within-trait spread above SPREAD_MAX; real
 * people ~0.8, random ~1.8) AND the odd and even halves of the scales don't agree (even–odd consistency, Jackson's
 * individual reliability, below EVEN_ODD_MIN). Both together flag 2.6% of 15,700 real adults (the open dataset has
 * careless responders of its own) and 0.1% of simulated honest respondents, and catch ~2 in 3 random responders.
 * Even–odd alone at 0 flagged 4.3% of real adults and 2.9% of honest simulated ones while catching half the random
 * ones (tests/simulation.test.ts).
 */
export const SPREAD_MAX = 1.5;
export const EVEN_ODD_MIN = 0.4;

/** Within-trait spread and even–odd consistency; null unless every statement is answered. */
export function consistency(ans: number[]): { spread: number; evenOdd: number } | null {
  if (ans.length < IPIP_ITEMS.length || ans.slice(0, IPIP_ITEMS.length).some((x) => !(x >= 1 && x <= 5))) return null;
  const byTrait = new Map<string, number[]>();
  IPIP_ITEMS.forEach((it, i) => byTrait.set(it.trait, [...(byTrait.get(it.trait) ?? []), it.reverse ? 6 - ans[i] : ans[i]]));
  const mean = (v: number[]) => v.reduce((t, x) => t + x, 0) / v.length;
  let spread = 0;
  const odd: number[] = [];
  const even: number[] = [];
  for (const v of byTrait.values()) {
    const m = mean(v);
    spread += mean(v.map((x) => (x - m) ** 2));
    odd.push(mean(v.filter((_, j) => j % 2 === 0)));
    even.push(mean(v.filter((_, j) => j % 2 === 1)));
  }
  const eo = pearson(odd, even);
  return { spread: spread / byTrait.size, evenOdd: Number.isFinite(eo) ? eo : 0 };
}


function pearson(a: number[], b: number[]) {
  const ma = a.reduce((s, x) => s + x, 0) / a.length;
  const mb = b.reduce((s, x) => s + x, 0) / b.length;
  let num = 0, da = 0, db = 0;
  a.forEach((x, i) => {
    num += (x - ma) * (b[i] - mb);
    da += (x - ma) ** 2;
    db += (b[i] - mb) ** 2;
  });
  return da && db ? num / Math.sqrt(da * db) : NaN;
}
