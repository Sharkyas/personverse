import { describe, it, expect } from "vitest";
import { enneagram, instinctStack, sanitizeInstincts, ENNEA_NUMS } from "@/lib/enneagram";
import { mbtiLetters } from "@/lib/mbti";
import { IPIP_REL, type Vec } from "@/lib/model";
import { sanitizeAnswers, DEFAULT_ANSWERS } from "@/lib/questions";

const run = (z: Vec) => enneagram(z, mbtiLetters(z, IPIP_REL));

describe("Enneagram estimate", () => {
  it("reads the review's clearest profiles back", () => {
    expect(run({ O: 1.5, C: -1, E: -1.4, A: -1, N: 0 }).label).toBe("5w4");
    expect(run({ O: 1.5, C: -1, E: 0, A: 0.3, N: 1.2 }).type).toBe(4);
    expect(run({ O: 0, C: 0.3, E: 1.2, A: -1.5, N: -1 }).type).toBe(8);
    expect(run({ O: -0.5, C: 0, E: -1, A: 0, N: 1.5 }).type).toBe(6);
  });
  it("gives probabilities that sum to 1 and wings that are neighbours", () => {
    const e = run({ O: 0.3, C: 0.2, E: -0.4, A: 0.1, N: 0.5 });
    expect(ENNEA_NUMS.reduce((s, n) => s + e.p[n], 0)).toBeCloseTo(1, 10);
    for (const x of e.ranked) {
      const [n, w] = x.label.split("w").map(Number);
      expect([((n + 7) % 9) + 1, (n % 9) + 1]).toContain(w);
    }
  });
  it("orders instincts from the statements, and needs all three", () => {
    expect(instinctStack({ sp1: 6, sp2: 7, so1: 2, so2: 3, sx1: 5, sx2: 4 })!.stack).toBe("sp/sx/so");
    expect(instinctStack({ sp1: 6, so1: 2 })).toBeNull();
  });
  it("cleans instinct answers and keeps them through sanitize", () => {
    expect(sanitizeInstincts({ sp1: 9, so1: 3, junk: 4 })).toEqual({ so1: 3 });
    expect(sanitizeAnswers({ ...DEFAULT_ANSWERS, instincts: { sx1: 7 } }).instincts).toEqual({ sx1: 7 });
  });
});
