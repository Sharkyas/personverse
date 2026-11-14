// Simulation tests: synthetic respondents with known true profiles take the 50-question test, and we check that the app
// recovers them, is calibrated, is as stable on retest as it should be, and catches careless answering.
// Answers come from an item model fitted to 59,492 real people (tests/sim/ipipItemModel.json). Fixed seeds, so the
// numbers are the same on every run. The long version with bigger samples is `npm run sim`.
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import itemModel from "./sim/ipipItemModel.json";
import { rng, drawPerson, drawTheta, answer, appType, NEO_W, type Rand } from "./sim/simulate";
import { answerQuality } from "@/lib/quality";
import { IPIP_ITEMS } from "@/lib/questions";
import { DIMS, MBTI_DIM_MODEL, MBTI_PREVALENCE_UK, modelFor } from "@/lib/mbti";
import { TRAITS, type Trait } from "@/lib/params";
import { IPIP_REL, type Vec } from "@/lib/model";

const corr = (x: number[], y: number[]) => {
  const mx = x.reduce((s, v) => s + v, 0) / x.length;
  const my = y.reduce((s, v) => s + v, 0) / y.length;
  let sxy = 0, sxx = 0, syy = 0;
  x.forEach((v, i) => {
    sxy += (v - mx) * (y[i] - my);
    sxx += (v - mx) ** 2;
    syy += (y[i] - my) ** 2;
  });
  return sxy / Math.sqrt(sxx * syy);
};

describe("the synthetic respondents are realistic", () => {
  it("simulated reliabilities match the real data's (alpha within .02 per trait)", () => {
    for (const t of TRAITS) expect(Math.abs(itemModel.simAlpha[t] - itemModel.alpha[t])).toBeLessThan(0.02);
  });
  it("simulated answers average out to the app's norms (z ≈ 0, SD ≈ 1)", () => {
    const r = rng(1);
    const zs = Array.from({ length: 4000 }, () => appType(answer(drawTheta(r), r)).z);
    for (const t of TRAITS) {
      const v = zs.map((z) => z[t]);
      const m = v.reduce((s, x) => s + x, 0) / v.length;
      const sd = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length);
      expect(Math.abs(m)).toBeLessThan(0.1);
      expect(sd).toBeGreaterThan(0.85);
      expect(sd).toBeLessThan(1.15);
    }
  });
});

describe("trait recovery", () => {
  it("scores track the true traits about as well as the test's reliability allows (r ≈ √alpha)", () => {
    const r = rng(2);
    const people = Array.from({ length: 4000 }, () => drawTheta(r));
    const z = people.map((p) => appType(answer(p, r)).z);
    for (const t of TRAITS) {
      const rr = corr(people.map((p) => p[t]), z.map((x) => x[t]));
      expect(rr).toBeGreaterThan(Math.sqrt(itemModel.alpha[t]) - 0.05);
    }
  });
  it("two sittings of the same person correlate about as much as alpha (test–retest)", () => {
    const r = rng(3);
    const people = Array.from({ length: 4000 }, () => drawTheta(r));
    const z1 = people.map((p) => appType(answer(p, r)).z);
    const z2 = people.map((p) => appType(answer(p, r)).z);
    for (const t of TRAITS) expect(corr(z1.map((x) => x[t]), z2.map((x) => x[t]))).toBeGreaterThan(itemModel.alpha[t] - 0.06);
  });
});

describe("MBTI letters: calibration, recovery and stability", () => {
  const r = rng(4);
  const N = 12000;
  const sims = Array.from({ length: N }, () => {
    const p = drawPerson(r);
    return { p, a: appType(answer(p.theta, r)), b: appType(answer(p.theta, r)) };
  });

  it("letter leans are well ordered: the stronger the lean, the more often the letter is right", () => {
    // Since the type cut gives each letter its UK share, a lean is not a strict probability: around 50% it favours the
    // rarer letter (S/N most, by up to ~9 points). It must still rank people correctly and stay within 10 points.
    DIMS.forEach((d, i) => {
      const bins = Array.from({ length: 10 }, () => ({ n: 0, p: 0, hit: 0 }));
      for (const { p, a } of sims) {
        const l = a.letters[i];
        const b = bins[Math.min(9, Math.floor(l.pSecond * 10))];
        b.n++;
        b.p += l.pSecond;
        b.hit += p.type[i] === l.second ? 1 : 0;
      }
      const ece = bins.reduce((s, b) => s + (b.n ? Math.abs(b.p - b.hit) : 0), 0) / N;
      expect(ece, d).toBeLessThan(0.1);
      const rates = bins.filter((b) => b.n >= 100).map((b) => b.hit / b.n);
      rates.slice(1).forEach((x, k) => expect(x, d).toBeGreaterThan(rates[k] - 0.02));
    });
  });

  it("type recovery is close to the ceiling set by the part of MBTI the Big Five can't see", () => {
    // ceiling: classify from the true Big Five, with no measurement error at all
    let app = 0;
    let oracle = 0;
    for (const { p, a } of sims) {
      if (a.type === p.type) app++;
      const z = p.theta;
      const o = DIMS.map((d) => {
        const s = (Object.entries(NEO_W[d]) as [Trait, number][]).reduce((x, [t, w]) => x + w * z[t], 0);
        return s > MBTI_DIM_MODEL[d].cut ? MBTI_DIM_MODEL[d].second : MBTI_DIM_MODEL[d].first;
      }).join("");
      if (o === p.type) oracle++;
    }
    expect(app / N).toBeGreaterThan(0.24);
    expect(app / oracle).toBeGreaterThan(0.85);
  });

  it("retest stability is in line with the real MBTI (47% same four letters; each letter 77–84%)", () => {
    let same = 0;
    const per = [0, 0, 0, 0];
    for (const { a, b } of sims) {
      if (a.type === b.type) same++;
      [...a.type].forEach((c, i) => (per[i] += c === b.type[i] ? 1 : 0));
    }
    expect(same / N).toBeGreaterThan(0.45);
    per.forEach((x) => expect(x / N).toBeGreaterThan(0.78));
  });

  it("people far from every cut-off get the same type almost every time", () => {
    const rr = rng(5);
    const clear: Vec = { O: -1.5, C: 1.8, E: 1.8, A: 1.6, N: -1 }; // a textbook ESFJ
    const types = Array.from({ length: 400 }, () => appType(answer(clear, rr)).type);
    expect(types.filter((t) => t === "ESFJ").length / types.length).toBeGreaterThan(0.85);
  });

  it("a borderline person flips that letter about half the time and is never told 'High' confidence", () => {
    const rr = rng(6);
    // Clear on E, S and J; sitting exactly on the T/F cut of the detailed model (A solved so the TF score equals the cut).
    const base: Vec = { O: -1.2, C: 1.5, E: 1.8, A: 0, N: -0.5 };
    const m = modelFor(IPIP_REL).TF;
    const w = m.w as Record<Trait, number>;
    const border = { ...base, A: (m.typeCut - w.C * base.C - w.N * base.N) / w.A };
    const runs = Array.from({ length: 600 }, () => appType(answer(border, rr)));
    const f = runs.filter((x) => x.type[2] === "F").length / runs.length;
    expect(f).toBeGreaterThan(0.25);
    expect(f).toBeLessThan(0.75);
    const meanP = runs.reduce((s, x) => s + x.letters[2].p, 0) / runs.length;
    expect(meanP).toBeLessThan(0.7);
  });
});

describe("the type the app gives out", () => {
  it("hands out each letter about as often as it occurs in the UK, and rare types like INTP are reachable", () => {
    const r = rng(7);
    const n = 12000;
    const count: Record<string, number> = {};
    for (let k = 0; k < n; k++) {
      const t = appType(answer(drawTheta(r), r)).type;
      count[t] = (count[t] ?? 0) + 1;
    }
    const share = (f: (t: string) => boolean) => Object.keys(count).filter(f).reduce((s, t) => s + count[t] / n, 0);
    const uk = (f: (t: string) => boolean) => Object.entries(MBTI_PREVALENCE_UK).filter(([t]) => f(t)).reduce((s, [, v]) => s + v / 100, 0);
    for (const [i, c] of [[0, "I"], [1, "N"], [2, "F"], [3, "P"]] as const) {
      const f = (t: string) => t[i] === c;
      expect(Math.abs(share(f) - uk(f)), c).toBeLessThan(0.06);
    }
    // the likeliest-letter rule gave 0.3% INTP here (UK 2.4%)
    expect(share((t) => t === "INTP")).toBeGreaterThan(0.01);
    for (const t of Object.keys(MBTI_PREVALENCE_UK)) expect(count[t] ?? 0, t).toBeGreaterThan(0);
  });
});

describe("careless answering", () => {
  const r = rng(8);
  const rate = (f: (r: Rand) => number[], n = 2000) => Array.from({ length: n }, () => !answerQuality(f(r)).ok).filter(Boolean).length / n;

  it("catches every kind of straight-lining", () => {
    for (const v of [1, 2, 3, 4, 5]) expect(answerQuality(Array(50).fill(v)).ok).toBe(false);
    expect(rate((r) => IPIP_ITEMS.map(() => (r() < 0.9 ? 4 : 1 + Math.floor(r() * 5))))).toBe(1);
  });
  it("catches repeating patterns: alternating 1/5 and 2/4, zigzags, and alternating with some noise", () => {
    // Alternating 1/5 reads as a consistent, extreme person once reverse-keyed, so only the sequence gives it away.
    const pats = [
      IPIP_ITEMS.map((_, i) => (i % 2 ? 1 : 5)),
      IPIP_ITEMS.map((_, i) => (i % 2 ? 5 : 1)),
      IPIP_ITEMS.map((_, i) => (i % 2 ? 2 : 4)),
      IPIP_ITEMS.map((_, i) => [1, 2, 3, 4, 5, 5, 4, 3, 2, 1][i % 10]),
      IPIP_ITEMS.map((_, i) => [1, 1, 5][i % 3]),
    ];
    for (const p of pats) expect(answerQuality(p).reasons.join(" "), p.join("")).toMatch(/pattern|different ways/);
    expect(rate((r) => IPIP_ITEMS.map((_, i) => (r() < 0.15 ? 1 + Math.floor(r() * 5) : i % 2 ? 1 : 5)))).toBeGreaterThan(0.95);
  });
  it("almost never flags honest simulated respondents (<1%)", () => {
    expect(rate((r) => answer(drawTheta(r), r))).toBeLessThan(0.01);
  });
  it("catches most people answering at random (>55%)", () => {
    expect(rate((r) => IPIP_ITEMS.map(() => 1 + Math.floor(r() * 5)))).toBeGreaterThan(0.55);
  });
  it.skipIf(!existsSync("data/ipip-big5.csv"))("flags under 4% of real adults in the open dataset", () => {
    const L = readFileSync("data/ipip-big5.csv", "utf8").trim().split(/\r?\n/);
    const h = L[0].split("\t");
    const real = L.slice(1)
      .map((ln) => ln.split("\t"))
      .filter((f) => +f[h.indexOf("age")] >= 18)
      .map((f) => IPIP_ITEMS.map((it) => +f[h.indexOf(it.id)]))
      .filter((a) => a.every((x) => x >= 1 && x <= 5));
    expect(real.length).toBeGreaterThan(15000);
    expect(real.filter((a) => !answerQuality(a).ok).length / real.length).toBeLessThan(0.04);
  });
});

