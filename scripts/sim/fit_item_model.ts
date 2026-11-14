// Fit a simple ordinal factor model for the 50 IPIP items on the open openpsychometrics.org data, so the simulation
// tests can generate realistic answers from a known "true" personality.
//
//   answer to item i = category of  y* = λ_i · θ_trait + √(1 − λ_i²) · ε,   cut at thresholds τ_i (probit)
//
// Thresholds reproduce each item's answer distribution; loadings are tuned until simulated item–rest correlations
// match the real ones; the latent trait correlations are the observed scale correlations disattenuated by alpha.
//
// Usage: node --experimental-strip-types scripts/sim/fit_item_model.ts <responses.tsv>
// <responses.tsv> is the 2012 BIG5 file (adults only; on the data-ipip branch: git show origin/data-ipip:data/ipip-big5.csv)
// or the 2018 IPIP-FFM release converted with scripts/metrics/to_big5_format.py (no age column, so used whole).
// Use the same file as scripts/fit_ipip.py, so simulated people sit on the norms the app scores with.
import { readFileSync, writeFileSync } from "node:fs";

const TR = ["O", "C", "E", "A", "N"] as const;
type T = (typeof TR)[number];
// reverse-keyed item numbers per trait, as in the dataset and the app
const REV: Record<T, number[]> = { E: [2, 4, 6, 8, 10], N: [2, 4], A: [1, 3, 5, 7], C: [2, 4, 6, 8], O: [2, 4, 6] };

const path = process.argv[2] ?? "data/ipip-big5.csv";
const lines = readFileSync(path, "utf8").trim().split(/\r?\n/);
const head = lines[0].split("\t");
const col = (k: string) => head.indexOf(k);
const hasAge = col("age") >= 0;
type Row = Record<T, number[]>; // keyed item answers, 1..5
const rows: Row[] = [];
for (const ln of lines.slice(1)) {
  const f = ln.split("\t");
  if (hasAge) {
    const age = +f[col("age")];
    if (!(age >= 18 && age <= 90)) continue;
  }
  const r = {} as Row;
  let ok = true;
  for (const t of TR) {
    r[t] = [];
    for (let i = 1; i <= 10; i++) {
      const x = +f[col(`${t}${i}`)];
      if (!(x >= 1 && x <= 5)) ok = false;
      r[t].push(REV[t].includes(i) ? 6 - x : x);
    }
  }
  if (ok) rows.push(r);
}

// ---- helpers
function invPhi(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  if (p < 0.02425) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - 0.02425) return -invPhi(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
function corr(x: number[], y: number[]) {
  const mx = mean(x), my = mean(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = rng(42);
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
function alpha(items: number[][]) {
  const k = items[0].length;
  const vari = (v: number[]) => { const m = mean(v); return mean(v.map((x) => (x - m) ** 2)); };
  const iv = Array.from({ length: k }, (_, i) => vari(items.map((r) => r[i]))).reduce((s, x) => s + x, 0);
  return (k / (k - 1)) * (1 - iv / vari(items.map((r) => r.reduce((s, x) => s + x, 0))));
}

const out: { n: number; source: string; items: Record<T, { tau: number[]; lambda: number }[]>; alpha: Record<T, number>; simAlpha: Record<T, number>; R: number[][] } = {
  n: rows.length,
  source: hasAge
    ? "openpsychometrics.org IPIP BIG5 (public domain), adults 18-90 with complete answers"
    : "openpsychometrics.org IPIP-FFM (2018, public domain), 100,000-row sample, one record per IP address, all ages, complete answers",
  items: {} as never,
  alpha: {} as never,
  simAlpha: {} as never,
  R: [],
};

const NS = 20000;
for (const t of TR) {
  const X = rows.map((r) => r[t]);
  const tau = Array.from({ length: 10 }, (_, i) => {
    const counts = [1, 2, 3, 4, 5].map((k) => X.filter((r) => r[i] === k).length / X.length);
    let cum = 0;
    return counts.slice(0, 4).map((p) => invPhi(Math.min(0.999, Math.max(0.001, (cum += p)))));
  });
  const target = Array.from({ length: 10 }, (_, i) => corr(X.map((r) => r[i]), X.map((r) => r.reduce((s, x) => s + x, 0) - r[i])));
  let lam = target.map((c) => Math.min(0.95, c * 1.15));
  for (let iter = 0; iter < 12; iter++) {
    const th = Array.from({ length: NS }, gauss);
    const S = th.map((z) => lam.map((l, i) => { const y = l * z + Math.sqrt(1 - l * l) * gauss(); return 1 + tau[i].filter((c) => y > c).length; }));
    const sim = Array.from({ length: 10 }, (_, i) => corr(S.map((r) => r[i]), S.map((r) => r.reduce((s, x) => s + x, 0) - r[i])));
    lam = lam.map((l, i) => Math.min(0.95, Math.max(0.1, l * (target[i] / sim[i]) ** 0.8)));
    if (iter === 11) out.simAlpha[t] = +alpha(S).toFixed(4);
  }
  out.items[t] = tau.map((tt, i) => ({ tau: tt.map((x) => +x.toFixed(4)), lambda: +lam[i].toFixed(4) }));
  out.alpha[t] = +alpha(X).toFixed(4);
}
const sc = (r: Row, t: T) => mean(r[t]);
out.R = TR.map((a) => TR.map((b) => (a === b ? 1 : +(corr(rows.map((r) => sc(r, a)), rows.map((r) => sc(r, b))) / Math.sqrt(out.alpha[a] * out.alpha[b])).toFixed(4))));
writeFileSync("tests/sim/ipipItemModel.json", JSON.stringify(out, null, 1));
console.log("n", out.n, "alpha", out.alpha, "simAlpha", out.simAlpha);
console.log("R", out.R.map((r) => r.join(" ")).join("\n"));
