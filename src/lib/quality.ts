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
  // Even-odd consistency (Jackson's individual reliability): score each trait from its odd and its even items;
  // a person answering by content gets matching profiles, a random responder doesn't.
  const traits = ["O", "C", "E", "A", "N"] as const;
  const halves = traits.map((t) => {
    const k = IPIP_ITEMS.map((it, i) => ({ it, v: ans[i] })).filter((x) => x.it.trait === t && x.v >= 1);
    const keyedV = k.map((x) => (x.it.reverse ? 6 - x.v : x.v));
    const odd = keyedV.filter((_, j) => j % 2 === 0);
    const even = keyedV.filter((_, j) => j % 2 === 1);
    const m = (xs: number[]) => xs.reduce((s2, x) => s2 + x, 0) / Math.max(1, xs.length);
    return [m(odd), m(even)];
  });
  const evenOdd = pearson(halves.map((h) => h[0]), halves.map((h) => h[1]));
  const reasons: string[] = [];
  if (sameShare >= 0.7) reasons.push(`gave the same answer to ${Math.round(sameShare * 100)}% of questions`);
  else if (longest >= 12) reasons.push(`gave the same answer ${longest} times in a row`);
  if (agreeFwd >= 4.2 && agreeRev >= 4.2) reasons.push("agreed with statements and their opposites");
  if (agreeFwd <= 1.8 && agreeRev <= 1.8) reasons.push("disagreed with statements and their opposites");
  if (sameShare < 0.7 && Number.isFinite(evenOdd) && evenOdd < EVEN_ODD_MIN) reasons.push("answered similar questions in very different ways");
  return { ok: reasons.length === 0, reasons, sameShare, longest, evenOdd };
}

/** Below this even-odd consistency the answers look random (threshold set on simulated respondents: see scripts/simulate_eval.ts). */
export const EVEN_ODD_MIN = 0;

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
