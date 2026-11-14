// The long simulation report: `npm run sim`. Writes research/simulation_report.json with the numbers quoted in
// research/simulation_report.md. Uses the open dataset too when it is present: by default data/ipip-big5.csv
// (git show origin/data-ipip:data/ipip-big5.csv > data/ipip-big5.csv), or the file named in SIM_REAL_DATA, which can be
// the 2018 IPIP-FFM release converted with scripts/metrics/to_big5_format.py (no age column, so everyone is kept).
import { it } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { rng, drawPerson, drawTheta, answer, appType, classify, type Scorer } from "./simulate";
import { answerQuality } from "@/lib/quality";
import { IPIP_ITEMS } from "@/lib/questions";
import { DIMS, MBTI_PREVALENCE_UK } from "@/lib/mbti";
import { TRAITS } from "@/lib/params";
import type { Vec } from "@/lib/model";

const N = 40000;
const pct = (x: number) => +(100 * x).toFixed(1);
const top = (d: Record<string, number>, n: number, k = 6) =>
  Object.entries(d)
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([t, v]) => `${t} ${pct(v / n)}%`);

it("simulation report", () => {
  const out: Record<string, unknown> = { generated: new Date().toISOString(), n: N };
  const r = rng(2026);
  const full: Vec = { O: 1, C: 1, E: 1, A: 1, N: 1 };
  const scorers: Scorer[] = ["app", "likeliest"];
  const acc = Object.fromEntries(scorers.map((s) => [s, { exact: 0, retest: 0, letter: [0, 0, 0, 0], letterRetest: [0, 0, 0, 0], dist: {} as Record<string, number> }]));
  let oracle = 0;
  const truth: Record<string, number> = {};
  const intp = Object.fromEntries(scorers.map((s) => [s, { n: 0, hit: 0, retest: 0, dist: {} as Record<string, number> }]));
  const p16 = Object.fromEntries(scorers.map((s) => [s, { n: 0, retest: 0, dist: {} as Record<string, number> }]));
  for (let k = 0; k < N; k++) {
    const p = drawPerson(r);
    truth[p.type] = (truth[p.type] ?? 0) + 1;
    if (classify(p.theta, full, "likeliest").type === p.type) oracle++;
    const a1 = answer(p.theta, r);
    const a2 = answer(p.theta, r);
    const is16 = p.theta.E < 0 && p.theta.O > 0 && p.theta.A < 0 && p.theta.C < 0;
    for (const s of scorers) {
      const t1 = appType(a1, s).type;
      const t2 = appType(a2, s).type;
      const A = acc[s];
      A.dist[t1] = (A.dist[t1] ?? 0) + 1;
      if (t1 === p.type) A.exact++;
      if (t1 === t2) A.retest++;
      for (let i = 0; i < 4; i++) {
        if (t1[i] === p.type[i]) A.letter[i]++;
        if (t1[i] === t2[i]) A.letterRetest[i]++;
      }
      if (p.type === "INTP") {
        const x = intp[s];
        x.n++;
        x.dist[t1] = (x.dist[t1] ?? 0) + 1;
        if (t1 === "INTP") x.hit++;
        if (t1 === t2) x.retest++;
      }
      if (is16) {
        const x = p16[s];
        x.n++;
        x.dist[t1] = (x.dist[t1] ?? 0) + 1;
        if (t1 === t2) x.retest++;
      }
    }
  }
  out.ceiling_exact_type_from_true_big_five = pct(oracle / N);
  out.scorers = Object.fromEntries(
    scorers.map((s) => {
      const A = acc[s];
      return [
        s,
        {
          exact_type: pct(A.exact / N),
          retest_same_type: pct(A.retest / N),
          letter_accuracy: Object.fromEntries(DIMS.map((d, i) => [d, pct(A.letter[i] / N)])),
          letter_retest: Object.fromEntries(DIMS.map((d, i) => [d, pct(A.letterRetest[i] / N)])),
          type_share: Object.fromEntries(Object.keys(MBTI_PREVALENCE_UK).sort().map((t) => [t, { uk: MBTI_PREVALENCE_UK[t], truth: pct((truth[t] ?? 0) / N), app: pct((A.dist[t] ?? 0) / N) }])),
          true_intp: { n: intp[s].n, called_intp: pct(intp[s].hit / intp[s].n), retest_same: pct(intp[s].retest / intp[s].n), called: top(intp[s].dist, intp[s].n) },
          online_test_style_intp: { rule: "E<0, O>0, A<0, C<0 on true Big Five (median splits, as most free online tests do)", n: p16[s].n, retest_same: pct(p16[s].retest / p16[s].n), called: top(p16[s].dist, p16[s].n) },
        },
      ];
    }),
  );

  // Your friend: one typical online-test INTP taking the test 3,000 times.
  const friend: Vec = { O: 0.68, C: -0.86, E: -0.82, A: -0.88, N: 0.42 };
  out.typical_online_intp = Object.fromEntries(
    scorers.map((s) => {
      const d: Record<string, number> = {};
      const lean = [0, 0, 0, 0];
      for (let k = 0; k < 3000; k++) {
        const a = appType(answer(friend, r), s);
        d[a.type] = (d[a.type] ?? 0) + 1;
        a.letters.forEach((l, i) => (lean[i] += l.p));
      }
      return [s, { theta: friend, called: top(d, 3000), mean_lean_app_letters: s === "app" ? Object.fromEntries(DIMS.map((dd, i) => [dd, pct(lean[i] / 3000)])) : undefined }];
    }),
  );

  // Careless answering
  const rate = (f: () => number[], n = 5000) => pct(Array.from({ length: n }, () => !answerQuality(f()).ok).filter(Boolean).length / n);
  out.careless_flag_rate = {
    honest_simulated: rate(() => answer(drawTheta(r), r)),
    uniform_random: rate(() => IPIP_ITEMS.map(() => 1 + Math.floor(r() * 5))),
    half_random_second_half: rate(() => answer(drawTheta(r), r).map((x, i) => (i >= 25 ? 1 + Math.floor(r() * 5) : x))),
    straight_line_any_answer: rate(() => Array(50).fill(1 + Math.floor(r() * 5)), 200),
    "90pct_straight_line": rate(() => IPIP_ITEMS.map(() => (r() < 0.9 ? 4 : 1 + Math.floor(r() * 5)))),
    alternating_1_5: rate(() => IPIP_ITEMS.map((_, i) => (i % 2 ? 1 : 5)), 1),
  };

  // Real people (open dataset)
  const realPath = process.env.SIM_REAL_DATA ?? "data/ipip-big5.csv";
  if (existsSync(realPath)) {
    const L = readFileSync(realPath, "utf8").trim().split(/\r?\n/);
    const h = L[0].split("\t");
    const real = L.slice(1)
      .map((ln) => ln.split("\t"))
      .filter((f) => h.indexOf("age") < 0 || +f[h.indexOf("age")] >= 18)
      .map((f) => IPIP_ITEMS.map((it) => +f[h.indexOf(it.id)]))
      .filter((a) => a.every((x) => x >= 1 && x <= 5));
    const res: Record<string, unknown> = { n: real.length, file: h.indexOf("age") < 0 ? "IPIP-FFM 2018 sample, one record per IP address, all ages" : "BIG5 2012, adults 18+", flagged_careless: pct(real.filter((a) => !answerQuality(a).ok).length / real.length) };
    for (const s of scorers) {
      const d: Record<string, number> = {};
      for (const a of real) {
        const t = appType(a, s).type;
        d[t] = (d[t] ?? 0) + 1;
      }
      res[s] = Object.fromEntries(Object.keys(MBTI_PREVALENCE_UK).sort().map((t) => [t, { uk: MBTI_PREVALENCE_UK[t], app: pct((d[t] ?? 0) / real.length) }]));
    }
    out.real_people = res;
  }
  void TRAITS;
  writeFileSync("research/simulation_report.json", JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
});
