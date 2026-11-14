import { describe, it, expect } from "vitest";
import {
  buildReport,
  forecast,
  maturation,
  planTarget,
  stabilityAt,
  stabilityOver,
  temperamentZ,
  currentZ,
  predictedAdult,
  phi,
  invPhi,
  type Vec,
} from "@/lib/model";
import { DEFAULT_ANSWERS, DEMO_ANSWERS, TEMPERAMENT_ITEMS, type Answers } from "@/lib/questions";
import { TRAITS, MEASURE_RELIABILITY } from "@/lib/params";
import research from "@/lib/research.json";

const zero: Vec = { O: 0, C: 0, E: 0, A: 0, N: 0 };

describe("statistics helpers", () => {
  it("normal CDF and its inverse agree", () => {
    for (const p of [0.01, 0.1, 0.5, 0.8, 0.99]) expect(phi(invPhi(p))).toBeCloseTo(p, 4);
    expect(phi(0)).toBeCloseTo(0.5, 6);
    expect(phi(1.96)).toBeCloseTo(0.975, 3);
  });
});

describe("temperament layer", () => {
  it("typical answers give an average baby", () => {
    expect(temperamentZ(DEFAULT_ANSWERS)).toEqual(zero);
  });
  it("stays within ±2.2 for the most extreme answers", () => {
    for (const v of [1, 5]) {
      const a: Answers = { ...DEFAULT_ANSWERS, temperament: Object.fromEntries(TEMPERAMENT_ITEMS.map((i) => [i.id, v])) };
      for (const t of TRAITS) expect(Math.abs(temperamentZ(a)[t])).toBeLessThanOrEqual(2.2);
    }
  });
  it("a fearful, fussy baby scores higher on neuroticism", () => {
    const a = { ...DEFAULT_ANSWERS, temperament: { ...DEFAULT_ANSWERS.temperament, fussy: 5, fearful: 5 } };
    expect(temperamentZ(a).N).toBeGreaterThan(0.5);
  });
  it("shrinks the temperament link when the user is guessing", () => {
    const sure = predictedAdult({ ...DEMO_ANSWERS, confidence: 0.6 }, temperamentZ(DEMO_ANSWERS)).rEff;
    const guess = predictedAdult({ ...DEMO_ANSWERS, confidence: 1.4 }, temperamentZ(DEMO_ANSWERS)).rEff;
    expect(guess).toBeLessThan(sure);
    expect(sure).toBeLessThanOrEqual(0.25);
  });
});

describe("upbringing layer", () => {
  it("birth order has no effect (Rohrer et al., 2015)", () => {
    const T = temperamentZ(DEMO_ANSWERS);
    const a = predictedAdult({ ...DEMO_ANSWERS, upbringing: { ...DEMO_ANSWERS.upbringing, birthOrder: 1 } }, T).mu;
    const b = predictedAdult({ ...DEMO_ANSWERS, upbringing: { ...DEMO_ANSWERS.upbringing, birthOrder: 5 } }, T).mu;
    expect(a).toEqual(b);
  });
  it("caps the combined upbringing shift at 0.6 SD", () => {
    const tough: Answers = { ...DEFAULT_ANSWERS, upbringing: { warmth: 1, harshness: 5, adversity: 5, ses: 1, moves: 5, birthOrder: 1 } };
    const mu = predictedAdult(tough, zero).mu;
    for (const t of TRAITS) expect(Math.abs(mu[t])).toBeLessThanOrEqual(0.6 + 1e-9);
    expect(mu.N).toBeGreaterThan(0.3);
  });
  it("severe adversity alone is close to the meta-analytic g = .46 on neuroticism (Rosenek et al., 2026)", () => {
    const a: Answers = { ...DEFAULT_ANSWERS, upbringing: { ...DEFAULT_ANSWERS.upbringing, adversity: 5 } };
    const base: Answers = { ...DEFAULT_ANSWERS, upbringing: { ...DEFAULT_ANSWERS.upbringing, adversity: 1 } };
    const d = predictedAdult(a, zero).mu.N - predictedAdult(base, zero).mu.N;
    expect(d).toBeGreaterThan(0.38);
    expect(d).toBeLessThan(0.54);
  });
});

describe("current personality (TIPI)", () => {
  it("scores the published norm means as average", () => {
    // Means from Gosling et al. (2003), placed on the items so each scale hits its norm.
    const tipi = [4.44, 8 - 5.23, 5.4, 3.17, 5.38, 8 - 4.44, 5.23, 8 - 5.4, 8 - 3.17, 8 - 5.38];
    const z = currentZ({ ...DEFAULT_ANSWERS, tipi });
    for (const t of TRAITS) expect(z[t]).toBeCloseTo(0, 6);
  });
});

describe("stability reproduces the literature", () => {
  it("is 1 at lag 0 and falls with lag", () => {
    expect(stabilityOver(30, 0)).toBeCloseTo(1, 6);
    let prev = 1;
    for (const lag of [0.5, 1, 3, 6.7, 10, 20, 40]) {
      const r = stabilityOver(30, lag);
      expect(r).toBeLessThanOrEqual(prev + 1e-9);
      prev = r;
    }
  });
  it("is continuous at the typical 6.7-year lag", () => {
    expect(Math.abs(stabilityOver(25, 6.69) - stabilityOver(25, 6.71))).toBeLessThan(0.01);
  });
  it("matches Roberts & DelVecchio (2000) observed stabilities within .1", () => {
    // Observed (attenuated) r ≈ true r × reliability.
    const obs = (age: number) => stabilityOver(age, 6.7) * MEASURE_RELIABILITY;
    expect(obs(20)).toBeGreaterThan(0.54 - 0.1);
    expect(obs(20)).toBeLessThan(0.54 + 0.15);
    expect(Math.abs(obs(30) - 0.64)).toBeLessThan(0.12);
    expect(Math.abs(obs(60) - 0.74)).toBeLessThan(0.1);
  });
  it("rises through childhood (Bleidorn et al., 2022)", () => {
    expect(stabilityAt(5)).toBeLessThan(stabilityAt(15));
    expect(stabilityAt(15)).toBeLessThan(stabilityAt(25));
  });
});

describe("maturation reproduces Roberts, Walton & Viechtbauer (2006)", () => {
  const cum = research.mean_level_change.cumulative_d_age20_to_70 as Record<string, number>;
  const m = maturation(20, 70);
  it.each([
    ["C", "C"],
    ["A", "A"],
    ["N", "N"],
    ["O", "O"],
    ["E", "E_combined"],
  ] as const)("%s: cumulative change 20→70 matches the brief", (t, key) => {
    expect(m[t]).toBeCloseTo(cum[key], 1);
  });
  it("people get more conscientious and calmer with age", () => {
    expect(m.C).toBeGreaterThan(0.6);
    expect(m.N).toBeLessThan(-0.6);
  });
});

describe("forecast", () => {
  it("returns valid probabilities", () => {
    for (const age of [18, 25, 40, 60]) {
      for (const h of [age + 1, age + 10, 80]) {
        for (const f of forecast({ O: 1, C: -1, E: 2, A: 0, N: -2 }, age, h, ["therapy", "job"])) {
          expect(f.pChange).toBeGreaterThanOrEqual(0);
          expect(f.pChange).toBeLessThanOrEqual(1);
          expect(f.pUp + f.pDown).toBeCloseTo(f.pChange, 9);
        }
      }
    }
  });
  it("an average 20-year-old has a moderate chance of a big shift in a decade (Damian et al., 2019: 21–61% over 50 years)", () => {
    for (const f of forecast(zero, 20, 30, [])) {
      expect(f.pChange).toBeGreaterThan(0.15);
      expect(f.pChange).toBeLessThan(0.75);
    }
  });
  it("change is likelier over longer horizons", () => {
    const short = forecast(zero, 25, 27, []).reduce((s, f) => s + f.pChange, 0);
    const long = forecast(zero, 25, 50, []).reduce((s, f) => s + f.pChange, 0);
    expect(long).toBeGreaterThan(short);
  });
  it("therapy lowers expected neuroticism (Roberts et al., 2017)", () => {
    const none = forecast(zero, 25, 30, []).find((f) => f.trait === "N")!;
    const ther = forecast(zero, 25, 30, ["therapy"]).find((f) => f.trait === "N")!;
    expect(ther.expected).toBeLessThan(none.expected - 0.4);
  });
  it("parenthood changes nothing (van Scheppingen et al., 2016)", () => {
    expect(forecast(zero, 28, 35, ["parenthood"])).toEqual(forecast(zero, 28, 35, []));
  });
  it("phases life events in over a few years", () => {
    const oneYear = forecast(zero, 25, 26, ["therapy"]).find((f) => f.trait === "N")!;
    const fiveYears = forecast(zero, 25, 30, ["therapy"]).find((f) => f.trait === "N")!;
    const drift = (h: number) => forecast(zero, 25, h, []).find((f) => f.trait === "N")!.expected;
    expect(Math.abs(oneYear.expected - drift(26))).toBeLessThan(Math.abs(fiveYears.expected - drift(30)));
  });
});

describe("target planner", () => {
  const now: Vec = { O: 0, C: -0.5, E: 0.5, A: 0, N: 0.8 };
  const target: Vec = { O: 60, C: 80, E: 50, A: 50, N: 20 };
  it("effort beats life as usual, and coaching adds to it", () => {
    for (const row of planTarget(now, target, 20, 1)) {
      const [usual, practice, coach] = row.scenarios.map((s) => s.p);
      expect(practice).toBeGreaterThanOrEqual(usual);
      expect(coach).toBeGreaterThanOrEqual(practice);
    }
  });
  it("reports 'already there' odds for tiny gaps", () => {
    const row = planTarget(zero, { O: 50, C: 50, E: 50, A: 50, N: 50 }, 20, 1)[0];
    expect(row.scenarios[0].p).toBeCloseTo(0.95);
  });
});

describe("full report", () => {
  it("builds for the demo profile without NaNs", () => {
    const r = buildReport(DEMO_ANSWERS);
    const nums = JSON.stringify(r).match(/NaN|Infinity/);
    expect(nums).toBeNull();
    expect(r.future).toHaveLength(5);
    expect(r.carryover).toBeLessThan(0.07);
  });
});
