// The checks that run the app's own TypeScript on held-out people, so the numbers describe the code that ships:
// 1. parity with the Python scoring, 2. the adaptive test, 3. the forecast's ageing curve against real age groups,
// 4. latency of scoring. Usage: node scripts/run-ts.cjs scripts/metrics/ts_checks.ts <export from metrics_suite.py>
import fs from "node:fs";
import path from "node:path";
import { TRAITS, type Trait } from "@/lib/params";
import { maturation, buildReport } from "@/lib/model";
import { IPIP_ITEMS, DEMO_ANSWERS } from "@/lib/questions";
import { scoreIpip50, simulateAdaptive } from "@/lib/bank/bigfive";
import { responseQuality, pairGap, personFit, coherence } from "@/lib/bank/consistency";
import { typeResult, evidenceFromBank, TYPE_ITEMS } from "@/lib/bank/typeEngine";
import { percentile } from "@/lib/bank/appMetrics";

const root = path.join(__dirname, "..", "..");
const sample = JSON.parse(fs.readFileSync(process.argv[3], "utf8")) as { order: string[]; answers: number[][]; python: { theta: Record<Trait, number[]>; se: Record<Trait, number[]>; lz: number[]; gap: number[]; coherence: number[] } };
if (sample.order.join() !== IPIP_ITEMS.map((i) => i.id).join()) throw new Error("export is not in the app's asking order");
const metricsPath = path.join(root, "src/lib/bank/metrics.json");
const metrics = JSON.parse(fs.readFileSync(metricsPath, "utf8"));
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const corr = (x: number[], y: number[]) => {
  const mx = mean(x), my = mean(y);
  let a = 0, b = 0, c = 0;
  for (let i = 0; i < x.length; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; }
  return a / Math.sqrt(b * c);
};

// ---- 1. parity: the same people scored by Python and by the app
let worst = 0;
sample.python.lz.forEach((lz, i) => {
  const ans = sample.answers[i];
  const s = scoreIpip50(ans);
  for (const t of TRAITS) worst = Math.max(worst, Math.abs(s[t].theta - sample.python.theta[t][i]), Math.abs(s[t].se - sample.python.se[t][i]));
  worst = Math.max(worst, Math.abs(personFit(ans) - lz), Math.abs(pairGap(ans).gap - sample.python.gap[i]), Math.abs(coherence(ans) - sample.python.coherence[i]));
});
if (worst > 0.01) throw new Error(`TypeScript and Python scoring disagree by ${worst}`);
metrics.parity = { people: sample.python.lz.length, max_abs_difference: r3(worst), what: "Largest gap between the app's TypeScript and the Python used for these metrics, over trait scores, error bars, person fit, pair gap and coherence." };

// ---- 2. adaptive test on real answers
const people = sample.answers.slice(0, 2000);
const lens: number[] = [];
const thetaA: Record<Trait, number[]> = { O: [], C: [], E: [], A: [], N: [] };
const thetaF: Record<Trait, number[]> = { O: [], C: [], E: [], A: [], N: [] };
const thetaP: Record<Trait, number[]> = { O: [], C: [], E: [], A: [], N: [] };
const seA: number[] = [];
const seF: number[] = [];
let sameType = 0;
let sameLetters = 0;
for (const full of people) {
  const run = simulateAdaptive(full);
  const fs_ = scoreIpip50(full);
  lens.push(run.asked.length);
  // the same number of statements, but simply the first ones in the fixed order
  const prefix = full.map((v, i) => (i < run.asked.length ? v : 0));
  const ps = scoreIpip50(prefix);
  for (const t of TRAITS) {
    thetaA[t].push(run.scores[t].theta);
    thetaF[t].push(fs_[t].theta);
    thetaP[t].push(ps[t].theta);
    seA.push(run.scores[t].se);
    seF.push(fs_[t].se);
  }
  const zOf = (s: typeof fs_) => Object.fromEntries(TRAITS.map((t) => [t, s[t].z])) as Record<Trait, number>;
  const relOf = (s: typeof fs_) => Object.fromEntries(TRAITS.map((t) => [t, s[t].reliability])) as Record<Trait, number>;
  const a = typeResult(zOf(run.scores), relOf(run.scores));
  const f = typeResult(zOf(fs_), relOf(fs_));
  if (a.type === f.type) sameType++;
  sameLetters += [0, 1, 2, 3].filter((i) => a.type[i] === f.type[i]).length / 4;
}
metrics.adaptive = {
  what: "The adaptive order run on real held-out people's answers (default settings: stop a trait at standard error 0.42, at least 4 and at most 10 statements per trait), compared with the same people's full 50-statement scores.",
  people: people.length,
  mean_statements: r3(mean(lens)),
  median_statements: percentile(lens, 50),
  p90_statements: percentile(lens, 90),
  share_saved: r3(1 - mean(lens) / 50),
  correlation_with_full_test: Object.fromEntries(TRAITS.map((t) => [t, r3(corr(thetaA[t], thetaF[t]))])),
  mean_correlation_with_full_test: r3(mean(TRAITS.map((t) => corr(thetaA[t], thetaF[t])))),
  same_length_fixed_order_correlation: r3(mean(TRAITS.map((t) => corr(thetaP[t], thetaF[t])))),
  mean_standard_error: { adaptive: r3(mean(seA)), full: r3(mean(seF)) },
  same_letters_as_full_test: r3(sameLetters / people.length),
  same_type_as_full_test: r3(sameType / people.length),
};

// ---- 3. forecast cross-check: the model's ageing curve against the gaps between real age groups
if (metrics.age_bands) {
  const bands = Object.entries(metrics.age_bands as Record<string, Record<string, number>>);
  const rows: { from: string; to: string; trait: Trait; predicted: number; observed: number }[] = [];
  for (let i = 0; i + 1 < bands.length; i++) {
    const [fromLabel, from] = bands[i];
    const [toLabel, to] = bands[i + 1];
    const m = maturation(from.mid, to.mid);
    for (const t of TRAITS) rows.push({ from: fromLabel, to: toLabel, trait: t, predicted: r3(m[t]), observed: r3(to[t] - from[t]) });
  }
  metrics.forecast_check = {
    what: "The forecast's expected change with age, against the difference between age groups in the open data. It checks direction and size only: different age groups are different people, so this is not a test of anyone's individual forecast.",
    status: "cross-sectional",
    rows,
    same_direction: r3(mean(rows.filter((r) => Math.abs(r.predicted) >= 0.02).map((r) => (Math.sign(r.predicted) === Math.sign(r.observed) ? 1 : 0)))),
    mean_abs_error_sd: r3(mean(rows.map((r) => Math.abs(r.predicted - r.observed)))),
    correlation: r3(corr(rows.map((r) => r.predicted), rows.map((r) => r.observed))),
  };
}

// ---- 4. latency of scoring (this machine, one core)
const typeAns = (seed: number) => Object.fromEntries(TYPE_ITEMS.map((it, i) => [it.id, 1 + ((i * 7 + seed) % 5)]));
const time = (fn: () => void) => { const t0 = performance.now(); fn(); return performance.now() - t0; };
for (let i = 0; i < 50; i++) scoreIpip50(people[i]); // warm up
const scoring = people.slice(0, 1000).map((ans, i) =>
  time(() => {
    const s = scoreIpip50(ans);
    responseQuality(ans);
    typeResult(Object.fromEntries(TRAITS.map((t) => [t, s[t].z])) as Record<Trait, number>, Object.fromEntries(TRAITS.map((t) => [t, s[t].reliability])) as Record<Trait, number>, evidenceFromBank(typeAns(i)));
  }),
);
const report = people.slice(0, 200).map((ans) => time(() => buildReport({ ...DEMO_ANSWERS, inventory: "detailed", ipip: ans })));
metrics.latency = {
  what: "Time to compute, on one core of the build machine. It leaves out the network and page rendering; measure those in the browser.",
  new_scoring_ms: { p50: r3(percentile(scoring, 50)), p95: r3(percentile(scoring, 95)), includes: "IRT scores for five traits, all answer-quality checks, four letter posteriors with 48 direct statements" },
  full_report_ms: { p50: r3(percentile(report, 50)), p95: r3(percentile(report, 95)), includes: "the existing buildReport" },
};

for (const p of [metricsPath, path.join(root, "research/metrics_suite.json")]) fs.writeFileSync(p, JSON.stringify(metrics, null, 1));
console.log(JSON.stringify({ parity: metrics.parity.max_abs_difference, adaptive: metrics.adaptive, forecast: metrics.forecast_check && { same: metrics.forecast_check.same_direction, mae: metrics.forecast_check.mean_abs_error_sd, r: metrics.forecast_check.correlation }, latency: metrics.latency }, null, 1));
