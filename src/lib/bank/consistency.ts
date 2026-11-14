// Answer-quality checks for the 50-statement test, on top of the ones already in quality.ts (straight-lining, long runs,
// yes-saying, even-odd consistency). Added here: do near-identical statements get near-identical answers, does the whole pattern fit the way real
// people answer (person fit), and was it answered too fast to have been read. The cut-offs are set on open data so that
// about 1 real respondent in 20 is flagged (scripts/metrics/metrics_suite.py → qualityCutoffs.json).
import irt from "./ipip50Irt.json";
import cutoffs from "./qualityCutoffs.json";
import { IPIP_ITEMS } from "../questions";
import { TRAITS } from "../params";
import { answerQuality } from "../quality";
import { fitTerms } from "./irt";
import { keyed, scoreTrait, traitResponses } from "./bigfive";

const INDEX = new Map(IPIP_ITEMS.map((it, i) => [it.id, i]));
export const CONSISTENCY_PAIRS = irt.consistency_pairs as { a: string; b: string; r: number }[];
export const QUALITY_CUTOFFS = cutoffs;
const ITEM_MEANS = irt.item_means as Record<string, number>;

const valid = (x: number | undefined): x is number => typeof x === "number" && x >= 1 && x <= 5;

/** Mean gap (in answer points) between statements that mean nearly the same thing. Random answering gives about 1.6; careful people about 0.8. */
export function pairGap(ans: (number | undefined)[]): { gap: number; pairs: number } {
  let sum = 0;
  let n = 0;
  for (const p of CONSISTENCY_PAIRS) {
    const i = INDEX.get(p.a)!;
    const j = INDEX.get(p.b)!;
    const xi = ans[i];
    const xj = ans[j];
    if (!valid(xi) || !valid(xj)) continue;
    sum += Math.abs(keyed(i, xi) - keyed(j, xj));
    n++;
  }
  return { gap: n ? sum / n : 0, pairs: n };
}

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
}

/**
 * Coherence: do the answers hang together the way a real person's do? The sum of two within-person correlations: across
 * the near-synonym pairs (first statement against second), and between the person's keyed answers and the average
 * person's. About 1.0 for a typical person and about 0 for random answering, even random answering that avoids the
 * extremes, which the other checks miss. Meant for a complete test: with gaps it is computed on what is there.
 */
export function coherence(ans: (number | undefined)[]): number {
  const a: number[] = [];
  const b: number[] = [];
  for (const p of CONSISTENCY_PAIRS) {
    const i = INDEX.get(p.a)!;
    const j = INDEX.get(p.b)!;
    const xi = ans[i];
    const xj = ans[j];
    if (!valid(xi) || !valid(xj)) continue;
    a.push(keyed(i, xi));
    b.push(keyed(j, xj));
  }
  const mine: number[] = [];
  const usual: number[] = [];
  IPIP_ITEMS.forEach((it, i) => {
    const x = ans[i];
    if (!valid(x)) return;
    mine.push(keyed(i, x));
    usual.push(ITEM_MEANS[it.id]);
  });
  return (a.length >= 3 ? pearson(a, b) : 0) + (mine.length >= 3 ? pearson(mine, usual) : 0);
}

/** Person fit pooled over the five traits. Around 0 for a typical person; strongly negative when the answers contradict each other. */
export function personFit(ans: (number | undefined)[]): number {
  let l0 = 0;
  let e = 0;
  let v = 0;
  for (const t of TRAITS) {
    const f = fitTerms(traitResponses(ans, t), scoreTrait(ans, t).theta);
    l0 += f.l0;
    e += f.expected;
    v += f.variance;
  }
  return v > 0 ? (l0 - e) / Math.sqrt(v) : 0;
}

export type QualityFlag = { check: "same-answer" | "long-run" | "yes-saying" | "even-odd" | "pattern" | "inconsistent-pairs" | "person-fit" | "incoherent" | "too-fast"; reason: string };
export type Quality = {
  ok: boolean;
  flags: QualityFlag[];
  /** plain-English reasons, in the same voice as quality.ts */
  reasons: string[];
  stats: { pairGap: number; pairs: number; lz: number; coherence: number; longest?: number; sameShare?: number; medianSeconds?: number };
};

/**
 * All checks together. `seconds` is the time spent on each statement, in the same order as the answers, when the page
 * records it. Fewer than 20 answers are never flagged: there is not enough to go on.
 */
export function responseQuality(ans: (number | undefined)[], seconds?: (number | undefined)[]): Quality {
  const n = ans.filter(valid).length;
  const pg = pairGap(ans);
  const lz = n >= 20 ? personFit(ans) : 0;
  const coh = n >= 20 ? coherence(ans) : 0;
  const stats: Quality["stats"] = { pairGap: pg.gap, pairs: pg.pairs, lz, coherence: coh };
  const flags: QualityFlag[] = [];
  if (n < 20) return { ok: true, flags, reasons: [], stats };

  const basic = answerQuality(ans.map((x) => (valid(x) ? x : 0)));
  stats.longest = basic.longest;
  stats.sameShare = basic.sameShare;
  for (const r of basic.reasons) flags.push({ check: /opposites/.test(r) ? "yes-saying" : /in a row/.test(r) ? "long-run" : /different ways/.test(r) ? "even-odd" : /pattern/.test(r) ? "pattern" : "same-answer", reason: r });

  if (pg.pairs >= 8 && pg.gap > cutoffs.pair_gap_max) flags.push({ check: "inconsistent-pairs", reason: "gave very different answers to statements that mean nearly the same thing" });
  if (lz < cutoffs.lz_min) flags.push({ check: "person-fit", reason: "answers contradict each other more than nearly anyone's do" });

  // Coherence is only calibrated for a (nearly) complete test.
  if (n >= 45 && coh < cutoffs.coherence_min) flags.push({ check: "incoherent", reason: "answers do not hang together the way a person's usually do" });

  const times = (seconds ?? []).filter((s, i): s is number => typeof s === "number" && s > 0 && valid(ans[i]));
  if (times.length >= 20) {
    const sorted = [...times].sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)];
    stats.medianSeconds = med;
    if (med < cutoffs.median_seconds_min) flags.push({ check: "too-fast", reason: `answered in about ${med.toFixed(1)} seconds a statement, too fast to have read them` });
  }
  return { ok: flags.length === 0, flags, reasons: flags.map((f) => f.reason), stats };
}
