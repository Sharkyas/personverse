import { describe, it, expect } from "vitest";
import { currentZ, IPIP_REL } from "@/lib/model";
import { mbtiLetters } from "@/lib/mbti";
import { answerQuality } from "@/lib/quality";
import { rng, truePerson, answerIpip, randomResponder, straightLiner, asAnswers } from "@/lib/simulate";
import { TRAITS } from "@/lib/params";

// Small, fast version of scripts/simulate_eval.ts: simulated people with known true traits.
describe("simulated respondents (item behaviour fitted on the open dataset)", () => {
  const r = rng(42);
  const people = Array.from({ length: 600 }, () => {
    const z = truePerson(r);
    return { z, hat: currentZ(asAnswers(answerIpip(z, r, 1.05))) };
  });

  it("the 50-item scores recover each true trait (r > .8)", () => {
    for (const t of TRAITS) {
      const a = people.map((p) => p.z[t]);
      const b = people.map((p) => p.hat[t]);
      const m = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length;
      const ma = m(a), mb = m(b);
      const cov = m(a.map((x, i) => (x - ma) * (b[i] - mb)));
      const r2 = cov / Math.sqrt(m(a.map((x) => (x - ma) ** 2)) * m(b.map((x) => (x - mb) ** 2)));
      expect(r2).toBeGreaterThan(0.8);
    }
  });

  it("letter probabilities are sensible numbers", () => {
    for (const p of people.slice(0, 50)) for (const l of mbtiLetters(p.hat, IPIP_REL)) expect(l.p).toBeGreaterThanOrEqual(0.5);
  });

  it("catches straight-liners, most random responders, and rarely flags real people", () => {
    const sl = Array.from({ length: 200 }, () => answerQuality(straightLiner(r)).ok).filter((ok) => !ok).length;
    const rnd = Array.from({ length: 400 }, () => answerQuality(randomResponder(r)).ok).filter((ok) => !ok).length;
    const real = people.filter((p, i) => i < 400 && !answerQuality(answerIpip(p.z, r, 1.05)).ok).length;
    expect(sl).toBe(200);
    expect(rnd / 400).toBeGreaterThan(0.35);
    expect(real / 400).toBeLessThan(0.06);
  });
});
