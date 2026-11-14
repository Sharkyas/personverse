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
  const reasons: string[] = [];
  if (sameShare >= 0.7) reasons.push(`gave the same answer to ${Math.round(sameShare * 100)}% of questions`);
  else if (longest >= 12) reasons.push(`gave the same answer ${longest} times in a row`);
  if (agreeFwd >= 4.2 && agreeRev >= 4.2) reasons.push("agreed with statements and their opposites");
  if (agreeFwd <= 1.8 && agreeRev <= 1.8) reasons.push("disagreed with statements and their opposites");
  return { ok: reasons.length === 0, reasons, sameShare, longest };
}
