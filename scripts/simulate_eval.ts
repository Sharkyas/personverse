/*
 * End-to-end test on simulated respondents with KNOWN true personalities (item behaviour fitted on the real open
 * dataset). Measures: how well the 50-item scores recover the true traits, how often each type letter is right,
 * whether the stated confidence is calibrated, how stable letters are on a retest, and whether careless answering
 * is caught. Run: node scripts/run-ts.cjs scripts/simulate_eval.ts [n]
 * Writes research/simulation.json and src/lib/simulationMetrics.json.
 */
import fs from "node:fs";
import { currentZ, IPIP_REL, TIPI_REL, type Vec } from "@/lib/model";
import { mbtiLetters, MBTI_DIM_MODEL, DIMS, neoWeights } from "@/lib/mbti";
import { answerQuality } from "@/lib/quality";
import { rng, gauss, truePerson, answerIpip, straightLiner, randomResponder, asAnswers } from "@/lib/simulate";
import norms from "@/lib/ipipNorms.json";
import params from "@/lib/ipipItemParams.json";
import { IPIP_ITEMS } from "@/lib/questions";
import { TRAITS, type Trait } from "@/lib/params";

const N = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? 4000);
const r = rng(20261114);
const R = params.traitCorr as Record<Trait, Record<Trait, number>>;

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);
const corr = (a: number[], b: number[]) => {
  const ma = mean(a), mb = mean(b);
  let num = 0, da = 0, db = 0;
  a.forEach((x, i) => ((num += (x - ma) * (b[i] - mb)), (da += (x - ma) ** 2), (db += (b[i] - mb) ** 2)));
  return num / Math.sqrt(da * db);
};
function alpha(mat: number[][]) {
  const k = mat[0].length;
  const v = (xs: number[]) => mean(xs.map((x) => (x - mean(xs)) ** 2));
  const iv = Array.from({ length: k }, (_, i) => v(mat.map((m) => m[i]))).reduce((s, x) => s + x, 0);
  return (k / (k - 1)) * (1 - iv / v(mat.map((m) => m.reduce((s, x) => s + x, 0))));
}
const keyedTrait = (ans: number[], t: Trait) => IPIP_ITEMS.map((it, i) => ({ it, v: it.reverse ? 6 - ans[i] : ans[i] })).filter((x) => x.it.trait === t).map((x) => x.v);

// 1. Calibrate the loading scale so simulated reliability matches the real data's alpha (Pearson item-rest
//    correlations understate latent loadings for 5-point items).
let scale = 1;
let best = Infinity;
for (const s of [1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3]) {
  const rr = rng(7);
  const sims = Array.from({ length: 1500 }, () => answerIpip(truePerson(rr), rr, s));
  const err = TRAITS.reduce((acc, t) => acc + (alpha(sims.map((a) => keyedTrait(a, t))) - (norms.traits as Record<Trait, { alpha: number }>)[t].alpha) ** 2, 0);
  if (err < best) ((best = err), (scale = s));
}
const simAlpha = (() => {
  const rr = rng(8);
  const sims = Array.from({ length: 2000 }, () => answerIpip(truePerson(rr), rr, scale));
  return Object.fromEntries(TRAITS.map((t) => [t, +alpha(sims.map((a) => keyedTrait(a, t))).toFixed(3)]));
})();

// True MBTI-dimension score: NEO weights on TRUE traits, plus the part the Big Five don't explain (traits are correlated).
const W = neoWeights();
function trueDims(z: Vec) {
  return DIMS.map((d) => {
    const w = W[d];
    let explained = 0;
    for (const a of TRAITS) for (const b of TRAITS) explained += (w[a] ?? 0) * (w[b] ?? 0) * R[a][b];
    const s = TRAITS.reduce((acc, t) => acc + (w[t] ?? 0) * z[t], 0) + Math.sqrt(Math.max(0.05, 1 - explained)) * gauss(r);
    return s > MBTI_DIM_MODEL[d].cut;
  });
}

type Row = { p: number; correct: boolean };
const letterRows: Record<string, Row[]> = { detailed: [], quick: [] };
const typeHits = { detailed: 0, quick: 0, detailedTop2: 0 };
const retestLetter = DIMS.map(() => 0);
let retestType = 0;
const traitTrue: Record<Trait, number[]> = { O: [], C: [], E: [], A: [], N: [] };
const traitHat: Record<Trait, number[]> = { O: [], C: [], E: [], A: [], N: [] };
let genuineFlagged = 0;

for (let i = 0; i < N; i++) {
  const z = truePerson(r);
  const truth = trueDims(z);
  const a1 = answerIpip(z, r, scale);
  const zHat = currentZ(asAnswers(a1));
  for (const t of TRAITS) (traitTrue[t].push(z[t]), traitHat[t].push(zHat[t]));
  if (!answerQuality(a1).ok) genuineFlagged++;

  const L = mbtiLetters(zHat, IPIP_REL);
  let allRight = true;
  L.forEach((l, k) => {
    const saysSecond = l.pSecond >= 0.5;
    const ok = saysSecond === truth[k];
    allRight &&= ok;
    letterRows.detailed.push({ p: l.p, correct: ok });
  });
  if (allRight) typeHits.detailed++;
  const wrong = L.map((l, k) => ((l.pSecond >= 0.5) === truth[k] ? 0 : 1));
  const weakest = L.map((l, k) => [l.p, k] as const).sort((x, y) => x[0] - y[0])[0][1];
  if (wrong.every((w, k) => w === 0 || k === weakest)) typeHits.detailedTop2++;

  // Quick 10-item test, simulated as a noisier reading of the same person (TIPI retest reliability per trait).
  const zQuick = Object.fromEntries(TRAITS.map((t) => [t, Math.sqrt(TIPI_REL[t]) * z[t] + Math.sqrt(1 - TIPI_REL[t]) * gauss(r)])) as Vec;
  const LQ = mbtiLetters(zQuick);
  let qRight = true;
  LQ.forEach((l, k) => {
    const ok = (l.pSecond >= 0.5) === truth[k];
    qRight &&= ok;
    letterRows.quick.push({ p: l.p, correct: ok });
  });
  if (qRight) typeHits.quick++;

  // Retest: same person, a second sitting.
  const L2 = mbtiLetters(currentZ(asAnswers(answerIpip(z, r, scale))), IPIP_REL);
  let same = true;
  L.forEach((l, k) => {
    if (l.letter === L2[k].letter) retestLetter[k]++;
    else same = false;
  });
  if (same) retestType++;
}

function calib(rows: Row[]) {
  const bins = Array.from({ length: 5 }, (_, b) => ({ lo: 0.5 + b * 0.1, n: 0, p: 0, hit: 0 }));
  for (const x of rows) {
    const b = bins[Math.min(4, Math.floor((x.p - 0.5) / 0.1))];
    b.n++;
    b.p += x.p;
    b.hit += x.correct ? 1 : 0;
  }
  const ece = bins.reduce((s, b) => s + (b.n ? (b.n / rows.length) * Math.abs(b.p / b.n - b.hit / b.n) : 0), 0);
  const conf = rows.filter((x) => x.p >= 0.8);
  return {
    accuracy: mean(rows.map((x) => (x.correct ? 1 : 0))),
    meanConfidence: mean(rows.map((x) => x.p)),
    ece,
    brier: mean(rows.map((x) => (x.correct ? 1 - x.p : x.p) ** 2)),
    shareConfident: conf.length / rows.length,
    accuracyWhenConfident: mean(conf.map((x) => (x.correct ? 1 : 0))),
    bins: bins.map((b) => ({ from: +b.lo.toFixed(1), n: b.n, said: b.n ? +(b.p / b.n).toFixed(3) : null, right: b.n ? +(b.hit / b.n).toFixed(3) : null })),
  };
}

// Careless responders
let slFlag = 0, rndFlag = 0;
const M = 1000;
for (let i = 0; i < M; i++) {
  if (!answerQuality(straightLiner(r)).ok) slFlag++;
  if (!answerQuality(randomResponder(r)).ok) rndFlag++;
}

const out = {
  when: new Date().toISOString(),
  n: N,
  note: "Simulated respondents with known true traits; item loadings, answer thresholds and trait correlations fitted on the open openpsychometrics BIG5 data. Test data only.",
  loadingScale: scale,
  simulatedAlpha: simAlpha,
  traitRecovery: Object.fromEntries(TRAITS.map((t) => [t, +corr(traitTrue[t], traitHat[t]).toFixed(3)])),
  letters: { detailed: calib(letterRows.detailed), quick: calib(letterRows.quick) },
  type: {
    detailedExact: typeHits.detailed / N,
    detailedTopTwo: typeHits.detailedTop2 / N,
    quickExact: typeHits.quick / N,
  },
  retest: { letter: Object.fromEntries(DIMS.map((d, k) => [d, retestLetter[k] / N])), fullType: retestType / N },
  careless: { straightLinersCaught: slFlag / M, randomCaught: rndFlag / M, genuineFlagged: genuineFlagged / N },
};
fs.mkdirSync("research", { recursive: true });
fs.writeFileSync("research/simulation.json", JSON.stringify(out, null, 1));
const { letters, ...rest } = out;
fs.writeFileSync(
  "src/lib/simulationMetrics.json",
  JSON.stringify({ ...rest, letters: { detailed: { ...letters.detailed }, quick: { ...letters.quick } } }, null, 1),
);
console.log(JSON.stringify(out, (k, v) => (typeof v === "number" ? +v.toFixed(3) : v), 1));
