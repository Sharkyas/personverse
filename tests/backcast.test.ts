import { describe, it, expect } from "vitest";
import { backcast, buildReport, conditionNormal, typeFromTraits, TYPE_BASE, currentZ } from "@/lib/model";
import { DEMO_ANSWERS, DEFAULT_ANSWERS, sanitizeAnswers, type Answers } from "@/lib/questions";
import { TRAITS } from "@/lib/params";

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());

describe("working backwards", () => {
  it("trait-space types reproduce Thomas & Chess base rates when nothing is known", () => {
    const r = rng(7);
    const n = 60000;
    const c: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const T = { O: gauss(r), C: gauss(r), E: gauss(r), A: gauss(r), N: gauss(r) };
      const k = typeFromTraits(T);
      c[k] = (c[k] ?? 0) + 1;
    }
    for (const [k, base] of Object.entries(TYPE_BASE)) expect(Math.abs(c[k] / n - base)).toBeLessThan(0.015);
  });

  it("is calibrated: 80% ranges hold the true baby temperament 80% of the time in simulation", () => {
    // T, adult now, two parent ratings and a retold story, with the covariances the model assumes (E: h² .45, sure parents, some stories)
    const pc = 0.225 * 0.6;
    const cT = [0.25, pc, pc, 0.4];
    const S = [
      [1, pc, pc, 0.1],
      [pc, 1, 0, 0.4 * pc],
      [pc, 0, 1, 0.4 * pc],
      [0.1, 0.4 * pc, 0.4 * pc, 1],
    ];
    // Joint covariance with T first, then Cholesky to simulate.
    const J = [[1, ...cT], ...S.map((row, i) => [cT[i], ...row])];
    const L = J.map(() => J.map(() => 0));
    for (let i = 0; i < J.length; i++)
      for (let j = 0; j <= i; j++) {
        const s = J[i][j] - L[i].slice(0, j).reduce((a, v, k) => a + v * L[j][k], 0);
        L[i][j] = i === j ? Math.sqrt(s) : s / L[j][j];
      }
    const r = rng(11);
    let inside = 0;
    let bias = 0;
    const n = 20000;
    for (let k = 0; k < n; k++) {
      const z = J.map(() => gauss(r));
      const x = L.map((row) => row.reduce((a, v, j) => a + v * z[j], 0));
      const { mean, variance } = conditionNormal(cT, S, x.slice(1));
      const sd = Math.sqrt(variance);
      if (x[0] > mean - 1.2816 * sd && x[0] < mean + 1.2816 * sd) inside++;
      bias += mean - x[0];
    }
    expect(Math.abs(inside / n - 0.8)).toBeLessThan(0.015);
    expect(Math.abs(bias / n)).toBeLessThan(0.03);
  });

  it("with only you now, shrinks hard towards average and stays honest about the range", () => {
    const a: Answers = { ...DEFAULT_ANSWERS, babyKnown: false, tipi: [7, 1, 7, 1, 7, 1, 7, 1, 7, 1] };
    const b = backcast(a);
    const now = currentZ(a);
    for (const t of TRAITS) {
      expect(b.traits[t].sd).toBeGreaterThan(0.95); // r = .25 can't tell you much
      expect(Math.abs(b.traits[t].mean)).toBeLessThan(Math.abs(now[t]) * 0.3 + 0.2);
    }
  });

  it("parents you know well narrow the range more than parents you're guessing about", () => {
    const base: Answers = { ...DEFAULT_ANSWERS, babyKnown: false };
    const rate = (sure: number) => backcast({ ...base, parents: [{ traits: { N: 5 }, sure }, { traits: { N: 5 }, sure }] }).traits.N;
    const sure = rate(1);
    const guess = rate(3);
    const none = backcast(base).traits.N;
    expect(sure.sd).toBeLessThan(guess.sd);
    expect(guess.sd).toBeLessThan(none.sd);
    expect(sure.mean).toBeGreaterThan(guess.mean); // anxious parents → likelier an easily upset baby
    expect(backcast({ ...base, parents: [{ traits: { N: 5 }, sure: 1 }, { traits: { N: 5 }, sure: 1 }] }).types.Spirited).toBeGreaterThan(backcast(base).types.Spirited);
  });

  it("reverse mode drives the report; answering the baby questions keeps the original forward numbers", () => {
    const fwd = buildReport(DEMO_ANSWERS);
    expect(fwd.reverse).toBe(false);
    expect(fwd.temperamentType.label).toMatch(/Spirited/);
    const rev = buildReport({ ...DEMO_ANSWERS, babyKnown: false });
    expect(rev.reverse).toBe(true);
    for (const t of TRAITS) expect(rev.temperament[t]).toBeCloseTo(rev.backcast.traits[t].mean, 6);
    const p = Object.values(rev.backcast.types).reduce((s, v) => s + v, 0);
    expect(p).toBeCloseTo(1, 6);
    expect(rev.future).toEqual(fwd.future); // the future only depends on you now
  });

  it("keeps parents and the reverse flag through input cleaning", () => {
    const a = sanitizeAnswers({ ...DEFAULT_ANSWERS, babyKnown: false, parents: [{ traits: { N: 9, E: "2", X: 3 }, sure: 7 }, {}, {}] });
    expect(a.babyKnown).toBe(false);
    expect(a.parents).toHaveLength(2);
    expect(a.parents![0].traits.N).toBe(5);
    expect(a.parents![0].traits.E).toBe(2);
    expect(a.parents![0].traits.O).toBeNull();
    expect(a.parents![0].sure).toBe(2);
    expect(sanitizeAnswers({}).babyKnown).toBeUndefined();
  });
});
