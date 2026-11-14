// Property tests for the scoring and model maths: exact values where they exist, invariants everywhere else.
import { describe, it, expect } from "vitest";
import { erf, phi, invPhi, conditionNormal, stabilityOver, stabilityAt, maturation, forecast, ipipZ, currentZ, measurement, buildReport, IPIP_REL, TIPI_REL, type Vec } from "@/lib/model";
import { mbtiLetters, mbtiTypes, closestType, typeFor, typeConfidence, modelFor, MBTI_DIM_MODEL, MBTI_PREVALENCE_UK, DIMS } from "@/lib/mbti";
import { answerQuality } from "@/lib/quality";
import { IPIP_ITEMS, DEFAULT_ANSWERS, DEMO_ANSWERS, sanitizeAnswers, type Answers } from "@/lib/questions";
import { TRAITS, MEANINGFUL_CHANGE_SD } from "@/lib/params";
import norms from "@/lib/ipipNorms.json";
import { rng, gauss } from "./sim/simulate";

const zero: Vec = { O: 0, C: 0, E: 0, A: 0, N: 0 };
const detailed = (ipip: number[]): Answers => ({ ...DEFAULT_ANSWERS, inventory: "detailed", ipip });

describe("normal distribution helpers", () => {
  it("erf matches reference values to 1e-6", () => {
    // erf(0.5), erf(1), erf(2) from tables
    expect(erf(0)).toBeCloseTo(0, 7);
    expect(erf(0.5)).toBeCloseTo(0.5204998778, 6);
    expect(erf(1)).toBeCloseTo(0.8427007929, 6);
    expect(erf(2)).toBeCloseTo(0.995322265, 6);
    expect(erf(-1)).toBeCloseTo(-erf(1), 12);
  });
  it("Φ is monotone, symmetric and bounded", () => {
    let prev = -1;
    for (let z = -6; z <= 6; z += 0.01) {
      const p = phi(z);
      expect(p).toBeGreaterThanOrEqual(prev - 1e-12);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
      expect(p + phi(-z)).toBeCloseTo(1, 6);
      prev = p;
    }
  });
  it("Φ⁻¹ inverts Φ across the whole range, including both tails", () => {
    for (const p of [1e-6, 1e-4, 0.001, 0.0242, 0.0243, 0.2, 0.5, 0.77, 0.9757, 0.999, 1 - 1e-6]) expect(phi(invPhi(p))).toBeCloseTo(p, 5);
    expect(invPhi(0.975)).toBeCloseTo(1.959964, 4);
  });
});

describe("Gaussian conditioning", () => {
  it("one reading matches the textbook formula: mean = c·o, variance = 1 − c²", () => {
    const { mean, variance } = conditionNormal([0.6], [[1]], [1.5]);
    expect(mean).toBeCloseTo(0.9, 10);
    expect(variance).toBeCloseTo(0.64, 10);
  });
  it("two independent readings combine like precision weighting", () => {
    // o_i = c_i T + noise, unit variance, independent noise → cov(o1, o2) = c1 c2
    const c = [0.5, 0.4];
    const S = [
      [1, c[0] * c[1]],
      [c[0] * c[1], 1],
    ];
    const { variance } = conditionNormal(c, S, [0, 0]);
    // closed form: 1 / (1 + Σ c²/(1 − c²))
    const expected = 1 / (1 + c.reduce((s, x) => s + (x * x) / (1 - x * x), 0));
    expect(variance).toBeCloseTo(expected, 10);
  });
  it("no evidence returns the prior; more evidence never widens the range", () => {
    expect(conditionNormal([], [], [])).toEqual({ mean: 0, variance: 1 });
    const v1 = conditionNormal([0.3], [[1]], [1]).variance;
    const v2 = conditionNormal([0.3, 0.3], [[1, 0.09], [0.09, 1]], [1, 1]).variance;
    expect(v2).toBeLessThanOrEqual(v1);
  });
});

describe("stability and change", () => {
  it("stability is 1 at lag 0, falls with lag, and stays in (0, 1]", () => {
    for (const age of [16, 20, 30, 50, 70]) {
      expect(stabilityOver(age, 0)).toBeCloseTo(1, 10);
      let prev = 1;
      for (const y of [0.5, 1, 3, 6.7, 10, 20, 40]) {
        const r = stabilityOver(age, y);
        expect(r).toBeLessThanOrEqual(prev + 1e-12);
        expect(r).toBeGreaterThan(0);
        prev = r;
      }
    }
  });
  it("the age curve is non-decreasing (personality settles with age)", () => {
    let prev = -1;
    for (let age = 0; age <= 95; age++) {
      expect(stabilityAt(age)).toBeGreaterThanOrEqual(prev);
      prev = stabilityAt(age);
    }
  });
  it("maturation adds up over consecutive periods", () => {
    const a = maturation(18, 30);
    const b = maturation(30, 45);
    const ab = maturation(18, 45);
    for (const t of TRAITS) expect(a[t] + b[t]).toBeCloseTo(ab[t], 10);
    expect(maturation(30, 30)).toEqual(zero);
  });
  it("forecast probabilities are consistent: P(change) = P(up) + P(down), all in [0, 1]", () => {
    const r = rng(11);
    for (let k = 0; k < 200; k++) {
      const z = Object.fromEntries(TRAITS.map((t) => [t, 2 * gauss(r)])) as Vec;
      const age = 16 + Math.floor(r() * 50);
      const f = forecast(z, age, age + 1 + Math.floor(r() * 30), ["job", "therapy", "relationship"]);
      for (const x of f) {
        expect(x.pChange).toBeCloseTo(x.pUp + x.pDown, 9);
        for (const p of [x.pChange, x.pUp, x.pDown]) {
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(1);
        }
        expect(x.sd).toBeGreaterThan(0);
      }
    }
  });
  it("with no movement expected, P(change by half an SD) equals the two normal tails", () => {
    // age 90 → nearly no maturation, so mean change ≈ drift only; check the tail formula at z = 0
    const f = forecast(zero, 70, 71, []).find((x) => x.trait === "O")!;
    const mu = f.expected - f.now;
    const expected = 1 - phi((MEANINGFUL_CHANGE_SD - mu) / f.sd) + phi((-MEANINGFUL_CHANGE_SD - mu) / f.sd);
    expect(f.pChange).toBeCloseTo(expected, 10);
  });
});

describe("50-question scoring", () => {
  it("every item is keyed the right way round: agreeing raises its trait (or lowers it when reverse-keyed)", () => {
    IPIP_ITEMS.forEach((it, i) => {
      const lo = Array(50).fill(3);
      const hi = Array(50).fill(3);
      lo[i] = 1;
      hi[i] = 5;
      const d = ipipZ(detailed(hi))[it.trait]! - ipipZ(detailed(lo))[it.trait]!;
      expect(Math.sign(d)).toBe(it.reverse ? -1 : 1);
      // and it moves no other trait
      for (const t of TRAITS) if (t !== it.trait) expect(ipipZ(detailed(hi))[t]).toBe(ipipZ(detailed(lo))[t]);
    });
  });
  it("z = (keyed mean − norm mean) / norm SD, clamped to ±2.5", () => {
    const ans = IPIP_ITEMS.map((it) => (it.trait === "O" ? (it.reverse ? 2 : 4) : 3)); // keyed mean 4 for O
    expect(ipipZ(detailed(ans)).O).toBeCloseTo((4 - norms.traits.O.mean) / norms.traits.O.sd, 10);
    const max = IPIP_ITEMS.map((it) => (it.reverse ? 1 : 5));
    for (const t of TRAITS) expect(Math.abs(ipipZ(detailed(max))[t]!)).toBeLessThanOrEqual(2.5);
  });
  it("skipped answers are ignored, not scored as zero", () => {
    const full = IPIP_ITEMS.map((it) => (it.reverse ? 2 : 4));
    const some = full.map((v, i) => (i < 10 ? 0 : v)); // drop the first 10 answers (items interleave, so 2 per trait)
    for (const t of TRAITS) expect(ipipZ(detailed(some))[t]).toBeCloseTo(ipipZ(detailed(full))[t]!, 10);
  });
  it("the IPIP replaces the TIPI per trait and the report says so", () => {
    const m = measurement(detailed(IPIP_ITEMS.map(() => 3)));
    for (const t of TRAITS) {
      expect(m.detailed[t]).toBe(true);
      expect(m.rel[t]).toBe(IPIP_REL[t]);
    }
    expect(measurement(DEFAULT_ANSWERS).rel).toEqual(TIPI_REL);
  });
});

describe("MBTI maths", () => {
  it("each letter's lean is Φ((weighted traits − type cut) / residual SD), with type cut = population cut × √r²", () => {
    const z = { O: 0.7, C: -0.4, E: -1.1, A: 0.2, N: 0.5 };
    for (const rel of [undefined, IPIP_REL]) {
      const M = modelFor(rel);
      mbtiLetters(z, rel).forEach((l, i) => {
        const m = M[DIMS[i]];
        const s = Object.entries(m.w).reduce((a, [t, w]) => a + (w as number) * z[t as keyof typeof z], 0);
        expect(m.typeCut).toBeCloseTo(m.cut * Math.sqrt(m.r2), 12);
        expect(l.pSecond).toBeCloseTo(phi((s - m.typeCut) / m.sd), 12);
        expect(l.p).toBeGreaterThanOrEqual(0.5);
      });
    }
  });
  it("every scale keeps unit variance: weights² + residual² = 1", () => {
    for (const rel of [undefined, TIPI_REL, IPIP_REL]) for (const d of DIMS) expect(modelFor(rel)[d].r2 + modelFor(rel)[d].sd ** 2).toBeCloseTo(1, 2);
  });
  it("the cut points reproduce the UK share of each letter", () => {
    const share = (letters: string) => Object.entries(MBTI_PREVALENCE_UK).filter(([t]) => [...letters].some((c, i) => c !== "_" && t[i] === c)).reduce((s, [, v]) => s + v, 0) / 100;
    expect(1 - phi(MBTI_DIM_MODEL.EI.cut)).toBeCloseTo(share("I___"), 2);
    expect(1 - phi(MBTI_DIM_MODEL.SN.cut)).toBeCloseTo(share("_N__"), 2);
    expect(1 - phi(MBTI_DIM_MODEL.TF.cut)).toBeCloseTo(share("__F_"), 2);
    expect(1 - phi(MBTI_DIM_MODEL.JP.cut)).toBeCloseTo(share("___P"), 2);
  });
  it("type probabilities are the product of letter probabilities and the top type is the likeliest letters", () => {
    const r = rng(5);
    for (let k = 0; k < 100; k++) {
      const z = Object.fromEntries(TRAITS.map((t) => [t, 1.5 * gauss(r)])) as Vec;
      const L = mbtiLetters(z, IPIP_REL);
      const T = mbtiTypes(z, IPIP_REL);
      expect(T.reduce((s, x) => s + x.p, 0)).toBeCloseTo(1, 10);
      expect(T[0].type).toBe(L.map((l) => l.letter).join(""));
      expect(T[0].p).toBeCloseTo(L.reduce((s, l) => s * l.p, 1), 12);
      const c = typeConfidence(L);
      // the "core" chance equals the chance of one of the top two types
      const pair = [c.core.replace("_", c.open.first), c.core.replace("_", c.open.second)];
      expect(c.pCore).toBeCloseTo(T.filter((x) => pair.includes(x.type)).reduce((s, x) => s + x.p, 0), 10);
    }
  });
  it("every part of the results page uses the same letter model for a report", async () => {
    // The deep dive used to quote letter odds from the quick-test model even when the 50-question test was taken,
    // so its letters could disagree with the big type at the top of the page.
    const { readFileSync, readdirSync } = await import("node:fs");
    const files = [...readdirSync("src/components").map((f) => `src/components/${f}`), "src/lib/card.tsx"];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/(mbtiLetters|closestType|mbtiTypes)\(r\.now\)/);
      expect(src, f).not.toMatch(/MBTI_DIM_MODEL/);
    }
    const r = buildReport(detailed(IPIP_ITEMS.map((it) => (it.trait === "O" ? (it.reverse ? 1 : 5) : it.trait === "E" ? (it.reverse ? 4 : 2) : 3))));
    expect(r.detailed).toBe(true);
    expect(typeFor(r).letters).toEqual(closestType(r.now, r.rel).letters);
  });
});

describe("careless responding", () => {
  it("flags straight-lining at every answer and ignores mostly-honest patterns", () => {
    for (const v of [1, 2, 3, 4, 5]) expect(answerQuality(Array(50).fill(v)).ok).toBe(false);
    const honest = IPIP_ITEMS.map((it, i) => (it.reverse ? 2 : 4) + (i % 3 === 0 ? 1 : 0) - (i % 7 === 0 ? 1 : 0));
    expect(answerQuality(honest).ok).toBe(true);
  });
  it("does not judge a mostly-skipped test", () => {
    expect(answerQuality(Array(50).fill(0)).ok).toBe(true);
  });
});

describe("untrusted input", () => {
  it("sanitising random junk never throws and always yields a report with finite numbers", () => {
    const r = rng(99);
    const junk = () => {
      const pick = [null, undefined, NaN, Infinity, -1e9, 1e9, "7", "x", [], {}, true, 3.7, -2];
      return pick[Math.floor(r() * pick.length)];
    };
    for (let k = 0; k < 300; k++) {
      const raw = {
        temperament: Object.fromEntries(["activity", "fussy", "zzz"].map((id) => [id, junk()])),
        upbringing: { warmth: junk(), adversity: junk(), moves: junk() },
        tipi: Array.from({ length: Math.floor(r() * 14) }, junk),
        age: junk(),
        horizon: junk(),
        confidence: junk(),
        events: [junk(), "job", "__proto__"],
        babyKnown: r() < 0.5 ? false : junk(),
        parents: r() < 0.5 ? [{ traits: { E: junk(), O: junk() }, sure: junk() }, junk(), junk()] : junk(),
        inventory: r() < 0.7 ? "detailed" : junk(),
        ipip: Array.from({ length: Math.floor(r() * 60) }, junk),
      };
      const a = sanitizeAnswers(raw);
      const rep = buildReport(a);
      for (const t of TRAITS) {
        expect(Number.isFinite(rep.now[t])).toBe(true);
        expect(Number.isFinite(rep.backcast.traits[t].mean)).toBe(true);
      }
      expect(a.horizon).toBeGreaterThan(a.age);
      expect(closestType(rep.now, rep.rel).type).toMatch(/^[EI][SN][TF][JP]$/);
    }
  });
  it("the sample profile is unchanged by sanitising", () => {
    const { name: _n, ...rest } = sanitizeAnswers(DEMO_ANSWERS);
    void _n;
    expect(currentZ(rest as Answers)).toEqual(currentZ(DEMO_ANSWERS));
  });
});
